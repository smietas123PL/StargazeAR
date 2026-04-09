import { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../providers/AuthProvider';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';

const GEMINI_API_KEY_LS = 'advisehub_gemini_api_key';
const GEMINI_MODEL_LS = 'advisehub_gemini_model';

export function useSettings() {
  const { profile } = useAuth();
  
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.1-pro-preview');
  const [displayName, setDisplayName] = useState('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Inicjalizacja z localStorage i Firebase
  useEffect(() => {
    const savedKey = localStorage.getItem(GEMINI_API_KEY_LS);
    if (savedKey) setGeminiKey(savedKey);

    const savedModel = localStorage.getItem(GEMINI_MODEL_LS);
    if (savedModel) setGeminiModel(savedModel);

    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  // Zapisywanie klucza
  const saveGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem(GEMINI_API_KEY_LS, key);
  };

  // Zapisywanie modelu
  const saveGeminiModel = (model: string) => {
    setGeminiModel(model);
    localStorage.setItem(GEMINI_MODEL_LS, model);
    toast.success('Zmieniono model AI', { description: `Wybrano model: ${model}` });
  };

  // Testowanie połączenia z Gemini
  const testConnection = async () => {
    if (!geminiKey) {
      toast.error('Wprowadź klucz API przed testowaniem.');
      return;
    }

    setIsTesting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: 'Odpowiedz dokładnie jednym słowem: "Sukces".',
      });

      if (response.text?.toLowerCase().includes('sukces')) {
        toast.success('Połączenie nawiązane pomyślnie!');
      } else {
        toast.warning(`Otrzymano nieoczekiwaną odpowiedź: ${response.text}`);
      }
    } catch (error: any) {
      console.error('Gemini test error:', error);
      toast.error(error.message || 'Błąd połączenia z API Gemini. Sprawdź klucz.');
    } finally {
      setIsTesting(false);
    }
  };

  // Aktualizacja profilu
  const updateDisplayName = async () => {
    if (!auth.currentUser || !profile) return;
    
    setIsSavingProfile(true);

    try {
      // Aktualizacja w Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });

      // Aktualizacja w Firestore
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        displayName: displayName
      });

      toast.success('Profil został zaktualizowany.');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Wystąpił błąd podczas aktualizacji profilu.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    geminiKey,
    saveGeminiKey,
    geminiModel,
    saveGeminiModel,
    testConnection,
    isTesting,
    displayName,
    setDisplayName,
    updateDisplayName,
    isSavingProfile
  };
}
