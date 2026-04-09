import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChatMessage } from '../../hooks/useVoiceChat';

/**
 * VoiceChatDb - Serwis do komunikacji z Firebase Firestore dla czatu głosowego.
 * Architektura:
 * - Izoluje logikę bazodanową od komponentów UI i logiki AI.
 * - Zapisuje transkrypcje rozmów do kolekcji 'voice_chats'.
 * - Pobiera historię rozmów dla danego użytkownika.
 */
export const voiceChatDb = {
  async saveMessage(userId: string, message: Omit<ChatMessage, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'voice_chats'), {
        userId,
        text: message.text,
        isUser: message.isUser,
        timestamp: message.timestamp,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Błąd podczas zapisywania wiadomości w Firebase:", error);
      throw error;
    }
  },

  async getHistory(userId: string): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, 'voice_chats'),
        where('userId', '==', userId),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        isUser: doc.data().isUser,
        timestamp: doc.data().timestamp
      }));
    } catch (error) {
      console.error("Błąd podczas pobierania historii z Firebase:", error);
      return [];
    }
  }
};
