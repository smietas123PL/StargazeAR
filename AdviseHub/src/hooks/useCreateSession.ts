import { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../providers/AuthProvider';
import { Session, SessionMessage } from '../types';
import { useNavigate } from 'react-router-dom';
import { AttachedFile } from '../components/features/DocumentUpload';

export const LAST_SELECTED_ADVISORS_KEY = 'advisehub_last_selected_advisors';

export function useCreateSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = async (question: string, attachedFiles: AttachedFile[], selectedAdvisors: string[]) => {
    if (!user) {
      setError('Musisz być zalogowany, aby utworzyć sesję.');
      return;
    }

    if (!question.trim()) {
      setError('Pytanie nie może być puste.');
      return;
    }

    // Check if any file is still extracting or has error
    if (attachedFiles.some(f => f.isExtracting)) {
      setError('Poczekaj na zakończenie analizy dokumentów.');
      return;
    }
    if (attachedFiles.some(f => f.error)) {
      setError('Usuń pliki z błędami przed kontynuacją.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Zapisz wybór doradców w localStorage
      localStorage.setItem(LAST_SELECTED_ADVISORS_KEY, JSON.stringify(selectedAdvisors));

      // 1. Create a new document reference for the session to get an ID
      const sessionRef = doc(collection(db, 'sessions'));
      const sessionId = sessionRef.id;

      // 2. Upload files to Firebase Storage
      const fileUrls: string[] = [];
      const attachedFilesMeta: { name: string, url: string }[] = [];
      for (const attachedFile of attachedFiles) {
        const file = attachedFile.file;
        const fileRef = ref(storage, `uploads/${user.uid}/${sessionId}/${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        fileUrls.push(url);
        attachedFilesMeta.push({ name: file.name, url });
      }

      // 3. Combine document texts
      let documentTexts = '';
      if (attachedFiles.length > 0) {
        documentTexts = attachedFiles.map(f => `--- Dokument: ${f.file.name} ---\n${f.extractedText}\n-------------------`).join('\n\n');
      }

      const fullContext = documentTexts ? `Pytanie użytkownika:\n${question}\n\nZałączone dokumenty:\n${documentTexts}` : question;

      // 4. Create the session document
      const newSession: Session = {
        id: sessionId,
        userId: user.uid,
        title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
        question,
        status: 'running',
        createdAt: Date.now(),
        fileUrls,
        attachedFiles: attachedFilesMeta,
        selectedAdvisors,
        documentTexts,
        fullContext,
        participants: [user.uid]
      };

      await setDoc(sessionRef, newSession);

      // 5. Create the initial user message
      const messageRef = doc(collection(db, `sessions/${sessionId}/messages`));
      const initialMessage: SessionMessage = {
        id: messageRef.id,
        sessionId,
        userId: user.uid,
        role: 'user',
        content: fullContext, // Use fullContext for the initial message so advisors see it
        order: 0,
        timestamp: Date.now(),
      };

      await setDoc(messageRef, initialMessage);

      // 6. Redirect to the session page
      navigate(`/session/${sessionId}`);
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message || 'Wystąpił błąd podczas tworzenia sesji.');
    } finally {
      setIsCreating(false);
    }
  };

  return { createSession, isCreating, error };
}
