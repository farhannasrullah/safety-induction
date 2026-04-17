// src/config/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './constants';

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(FIREBASE_CONFIG);

export const auth = getAuth(firebaseApp);
export const db   = getFirestore(firebaseApp);