import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Ensure persistence is set to local
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
