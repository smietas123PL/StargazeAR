/**
 * AudioRecorder - Odpowiada za przechwytywanie dźwięku z mikrofonu użytkownika.
 * Architektura:
 * - Używa Web Audio API (AudioContext) do przetwarzania strumienia z mikrofonu.
 * - Wykorzystuje ScriptProcessorNode (dla szerokiej kompatybilności) do pobierania surowych próbek audio.
 * - Konwertuje próbki Float32 na Int16 (wymagane przez Gemini Live API).
 * - Pakuje dane do formatu base64 i wysyła przez callback do serwisu AI.
 */
export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async start(onData: (base64: string) => void) {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Using ScriptProcessorNode for broad compatibility, though deprecated
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true); // true for little-endian
        }
        
        // Convert ArrayBuffer to base64
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        onData(base64);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw new Error("Brak dostępu do mikrofonu. Sprawdź uprawnienia.");
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
