"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedContent = exports.generateAdvisorResponse = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
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
const geminiApiKey = (0, params_1.defineSecret)('GEMINI_API_KEY');
const getGeminiClient = () => {
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Brak klucza API Gemini w konfiguracji serwera.');
    }
    return new genai_1.GoogleGenAI({ apiKey });
};
const rateLimitCheck = async (userId) => {
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
        const data = doc.data();
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
exports.generateAdvisorResponse = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Wymagane logowanie.');
    }
    const isAllowed = await rateLimitCheck(request.auth.uid);
    if (!isAllowed) {
        throw new https_1.HttpsError('resource-exhausted', 'Rate limit exceeded. Spróbuj za godzinę.');
    }
    const { prompt, question, context: ragContext, systemInstruction, temperature = 0.7, enableSearch = false, responseMimeType, responseSchema } = request.data;
    let finalPrompt = prompt;
    if (!finalPrompt && question) {
        finalPrompt = `Pytanie/Decyzja użytkownika:\n${question}\n\n${ragContext ? `Dodatkowy kontekst:\n${ragContext}` : ''}`;
    }
    if (!finalPrompt) {
        throw new https_1.HttpsError('invalid-argument', 'Brak promptu lub pytania.');
    }
    try {
        const ai = getGeminiClient();
        const config = {
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
    }
    catch (error) {
        console.error('Błąd Gemini API:', error);
        throw new https_1.HttpsError('internal', 'Błąd podczas generowania odpowiedzi.', error.message);
    }
});
exports.embedContent = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Wymagane logowanie.');
    }
    const isAllowed = await rateLimitCheck(request.auth.uid);
    if (!isAllowed) {
        throw new https_1.HttpsError('resource-exhausted', 'Rate limit exceeded. Spróbuj za godzinę.');
    }
    const { text } = request.data;
    if (!text) {
        throw new https_1.HttpsError('invalid-argument', 'Brak tekstu do wektoryzacji.');
    }
    try {
        const ai = getGeminiClient();
        const result = await ai.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: text,
        });
        return { embeddings: result.embeddings };
    }
    catch (error) {
        console.error('Błąd Gemini API (embed):', error);
        throw new https_1.HttpsError('internal', 'Błąd podczas wektoryzacji.', error.message);
    }
});
//# sourceMappingURL=index.js.map