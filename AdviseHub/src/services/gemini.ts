import { GoogleGenAI } from '@google/genai';
import { MessageRole } from '../types';

const GEMINI_API_KEY_LS = 'advisehub_gemini_api_key';
const GEMINI_MODEL_LS = 'advisehub_gemini_model';

export function getGeminiClient() {
  let envApiKey = '';
  try {
    envApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
  } catch (e) {}
  
  if (!envApiKey) {
    try {
      envApiKey = process.env.GEMINI_API_KEY || '';
    } catch (e) {}
  }

  const apiKey = localStorage.getItem(GEMINI_API_KEY_LS) || envApiKey;
  if (!apiKey) {
    throw new Error("Brak klucza API Gemini. Skonfiguruj go w Ustawieniach Systemu.");
  }
  return new GoogleGenAI({ apiKey });
}

export function getGeminiModel() {
  let envModel = '';
  try {
    envModel = (import.meta as any).env.VITE_GEMINI_MODEL;
  } catch (e) {}
  
  if (!envModel) {
    try {
      envModel = process.env.GEMINI_MODEL || '';
    } catch (e) {}
  }

  return localStorage.getItem(GEMINI_MODEL_LS) || envModel || 'gemini-3.1-pro-preview';
}

export async function searchWeb(query: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  return response.text || "Brak wyników wyszukiwania.";
}

export async function generateAdvisorResponse(systemInstruction: string, question: string, context?: string, enableSearch: boolean = false): Promise<string> {
  if (!systemInstruction) {
    throw new Error(`Brak instrukcji systemowej dla doradcy.`);
  }

  const prompt = `Pytanie/Decyzja użytkownika:\n${question}\n\n${context ? `Dodatkowy kontekst:\n${context}` : ''}`;

  const ai = getGeminiClient();
  const config: any = {
    systemInstruction,
    temperature: 0.7,
  };

  if (enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: prompt,
    config
  });

  return response.text || "Brak odpowiedzi.";
}
