import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// KONFIGURACJA SECRET MANAGER W FIREBASE
// ============================================================================
// Aby klucz API był bezpieczny, przechowujemy go w Google Cloud Secret Manager.
// 1. Zainstaluj Firebase CLI: npm install -g firebase-tools
// 2. Zaloguj się: firebase login
// 3. Ustaw klucz API jako secret: firebase functions:secrets:set GEMINI_API_KEY
// 4. W kodzie funkcji (poniżej) używamy defineSecret, aby powiązać secret z funkcją.
// ============================================================================

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const getGeminiClient = () => {
  const apiKey = geminiApiKey.value();
  if (!apiKey) {
    throw new HttpsError('internal', 'Brak klucza API Gemini w konfiguracji serwera.');
  }
  return new GoogleGenAI({ apiKey });
};

const rateLimitCheck = async (userId: string): Promise<boolean> => {
  const windowMs = 3600000; // 1 godzina
  const now = Date.now();

  // Pobierz plan użytkownika
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const plan = userData?.plan || 'free';
  const limit = plan === 'pro' ? 150 : 20;

  const rateLimitRef = db.collection('rateLimits').doc(userId);
  
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateLimitRef);
    
    if (!doc.exists) {
      transaction.set(rateLimitRef, {
        userId,
        windowStart: now,
        requestCount: 1
      });
      return true;
    }

    const data = doc.data()!;
    const windowStart = data.windowStart || 0;
    let requestCount = data.requestCount || 0;

    if (now - windowStart > windowMs) {
      // Reset okna czasowego
      transaction.set(rateLimitRef, {
        userId,
        windowStart: now,
        requestCount: 1
      });
      return true;
    }

    if (requestCount >= limit) {
      return false;
    }

    transaction.update(rateLimitRef, {
      requestCount: requestCount + 1
    });
    return true;
  });
};

export const generateAdvisorResponse = onCall({ secrets: [geminiApiKey], cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Wymagane logowanie.');
  }

  const isAllowed = await rateLimitCheck(request.auth.uid);
  if (!isAllowed) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Spróbuj za godzinę.');
  }

  const { 
    prompt, 
    question, 
    context: ragContext, 
    systemInstruction, 
    temperature = 0.7, 
    enableSearch = false,
    responseMimeType,
    responseSchema
  } = request.data;

  let finalPrompt = prompt;
  if (!finalPrompt && question) {
    finalPrompt = `Pytanie/Decyzja użytkownika:\n${question}\n\n${ragContext ? `Dodatkowy kontekst:\n${ragContext}` : ''}`;
  }

  if (!finalPrompt) {
    throw new HttpsError('invalid-argument', 'Brak promptu lub pytania.');
  }

  try {
    const ai = getGeminiClient();
    const config: any = {
      temperature,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    // Używamy modelu pro-preview jako domyślnego dla zaawansowanych zadań
    const model = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';

    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config
    });

    return { text: response.text || "Brak odpowiedzi." };
  } catch (error: any) {
    console.error('Błąd Gemini API:', error);
    throw new HttpsError('internal', 'Błąd podczas generowania odpowiedzi.', error.message);
  }
});

export const embedContent = onCall({ secrets: [geminiApiKey], cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Wymagane logowanie.');
  }

  const isAllowed = await rateLimitCheck(request.auth.uid);
  if (!isAllowed) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Spróbuj za godzinę.');
  }

  const { text } = request.data;
  if (!text) {
    throw new HttpsError('invalid-argument', 'Brak tekstu do wektoryzacji.');
  }

  try {
    const ai = getGeminiClient();
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text,
    });

    return { embeddings: result.embeddings };
  } catch (error: any) {
    console.error('Błąd Gemini API (embed):', error);
    throw new HttpsError('internal', 'Błąd podczas wektoryzacji.', error.message);
  }
});
