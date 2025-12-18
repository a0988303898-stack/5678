
// Use separate type imports for Firebase types to avoid value-level export errors
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfigStr = process.env.FIREBASE_CONFIG;
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isDemoMode = false;

if (firebaseConfigStr) {
  try {
    const config = JSON.parse(firebaseConfigStr);
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed, entering demo mode", error);
    isDemoMode = true;
  }
} else {
  console.warn("No Firebase config found, entering demo mode");
  isDemoMode = true;
}

export { auth, db, isDemoMode };
