import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AudioRecorder } from "../audio/AudioRecorder";
import { AudioPlayer } from "../audio/AudioPlayer";

export interface VoiceChatCallbacks {
  onTranscript: (text: string, isUser: boolean) => void;
  onStateChange: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
  onError: (error: string) => void;
  onFunctionCall: (name: string, args: any) => Promise<any>;
}

const createDecisionDeclaration: FunctionDeclaration = {
  name: "createDecision",
  description: "Creates a new decision in the Decision Tracker for the current session.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the decision" },
      description: { type: Type.STRING, description: "Detailed description of the decision" },
      expectedOutcome: { type: Type.STRING, description: "Expected outcome of the decision" }
    },
    required: ["title", "description", "expectedOutcome"]
  }
};

const updateDecisionStatusDeclaration: FunctionDeclaration = {
  name: "updateDecisionStatus",
  description: "Updates the status of an existing decision.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      decisionId: { type: Type.STRING, description: "The ID of the decision to update" },
      status: {
        type: Type.STRING,
        description: "The new status. Must be one of: planned, in_progress, completed, abandoned"
      }
    },
    required: ["decisionId", "status"]
  }
};

const createFollowUpSessionDeclaration: FunctionDeclaration = {
  name: "createFollowUpSession",
  description: "Creates a new follow-up session based on a selected decision.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      decisionId: { type: Type.STRING, description: "The ID of the decision to base the follow-up session on" }
    },
    required: ["decisionId"]
  }
};

/**
 * LiveVoiceService - Główny serwis integrujący Gemini Live API z komponentami audio.
 * Architektura:
 * - Zarządza cyklem życia połączenia WebSocket z Gemini (ai.live.connect).
 * - Koordynuje działanie AudioRecorder (wejście) i AudioPlayer (wyjście).
 * - Obsługuje zdarzenia z serwera (onmessage), w tym odbieranie audio, transkrypcji oraz przerwań (interrupted).
 * - Przekazuje stan połączenia i błędy do warstwy UI poprzez callbacki.
 * - Obsługuje Function Calling (narzędzia) do interakcji z aplikacją.
 */
export class LiveVoiceService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private recorder: AudioRecorder;
  private player: AudioPlayer;
  private callbacks: VoiceChatCallbacks;
  private currentSession: any = null;

  constructor(callbacks: VoiceChatCallbacks) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Brak klucza API Gemini (VITE_GEMINI_API_KEY).");
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.recorder = new AudioRecorder();
    this.player = new AudioPlayer();
    this.callbacks = callbacks;
  }

  async connect(voiceName: string = "Zephyr", systemInstruction: string = "Jesteś pomocnym asystentem głosowym (doradcą biznesowym). Odpowiadaj zwięźle i naturalnie po polsku. Możesz tworzyć decyzje, aktualizować ich statusy oraz tworzyć sesje follow-up na podstawie decyzji, używając dostępnych narzędzi.") {
    this.callbacks.onStateChange('connecting');
    try {
      this.player.init();
      
      this.sessionPromise = this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: async () => {
            this.callbacks.onStateChange('connected');
            try {
              await this.recorder.start((base64Data) => {
                if (this.sessionPromise) {
                  this.sessionPromise.then((session) => {
                    session.sendRealtimeInput({
                      audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                    });
                  }).catch(err => console.error("Error sending audio:", err));
                }
              });
            } catch (err: any) {
              this.callbacks.onError(err.message || "Błąd mikrofonu");
              this.disconnect();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.player.playBase64(base64Audio);
            }
            
            // Handle interruption (user started speaking)
            if (message.serverContent?.interrupted) {
              this.player.stop();
              this.player.init(); // Reinitialize for next playback
            }

            // Handle transcription (if enabled)
            const textPart = message.serverContent?.modelTurn?.parts?.find(p => p.text);
            if (textPart && textPart.text) {
              this.callbacks.onTranscript(textPart.text, false);
            }

            // Handle function calls
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                const functionResponses = await Promise.all(
                  functionCalls.map(async (call: any) => {
                    try {
                      const result = await this.callbacks.onFunctionCall(call.name, call.args);
                      return {
                        id: call.id,
                        name: call.name,
                        response: result
                      };
                    } catch (err: any) {
                      return {
                        id: call.id,
                        name: call.name,
                        response: { error: err.message }
                      };
                    }
                  })
                );
                
                if (this.currentSession) {
                  this.currentSession.sendToolResponse({ functionResponses });
                }
              }
            }
          },
          onerror: (error: any) => {
            console.error("Live API Error:", error);
            this.callbacks.onError("Błąd połączenia z serwerem AI.");
            this.callbacks.onStateChange('error');
          },
          onclose: () => {
            this.callbacks.onStateChange('idle');
            this.disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
          tools: [{
            functionDeclarations: [
              createDecisionDeclaration,
              updateDecisionStatusDeclaration,
              createFollowUpSessionDeclaration
            ]
          }]
        },
      });

      this.currentSession = await this.sessionPromise;
    } catch (error: any) {
      console.error("Connection failed:", error);
      this.callbacks.onError(error.message || "Nie udało się nawiązać połączenia.");
      this.callbacks.onStateChange('error');
    }
  }

  disconnect() {
    this.recorder.stop();
    this.player.stop();
    if (this.currentSession) {
      try {
        this.currentSession.close();
      } catch (e) {
        // ignore
      }
      this.currentSession = null;
    }
    this.sessionPromise = null;
    this.callbacks.onStateChange('idle');
  }
}
