import * as admin from 'firebase-admin';

// Inicjalizacja bez klucza - używamy domyślnego mechanizmu Firebase CLI (jeśli zalogowany)
// lub Application Default Credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gen-lang-client-0301617658'
  });
}

const db = admin.firestore();
const uid = 'PvB1jMyXEXhjf04Oo6F5Brk0nUc2';

async function setPro() {
  console.log(`Zmieniam plan na PRO dla użytkownika: ${uid}`);
  try {
    await db.collection('users').doc(uid).update({
      plan: 'pro'
    });
    console.log('✅ Plan pomyślnie zmieniony na PRO!');
  } catch (error) {
    console.error('❌ Błąd podczas aktualizacji planu:', error);
  }
  process.exit(0);
}

setPro();
