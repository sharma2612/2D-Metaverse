import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: "real-estate-38246.firebaseapp.com",
  projectId: "real-estate-38246",
  storageBucket: "real-estate-38246.firebasestorage.app",
  messagingSenderId: "97436081659",
  appId: "1:97436081659:web:4bc6fe7781e2320dc2bf5e",
  measurementId: "G-NSJN0JSXBL"
};

// initializeApp throws on a missing apiKey, and because src/socket.js connects at
// module scope that single failure blanks the whole page with no way to recover.
// Google sign-in is the only feature that needs Firebase, so a missing key is
// reported as an explicit setup error instead of an unhandled crash.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

if (!isFirebaseConfigured) {
  console.error(
    "[firebase] VITE_FIREBASE_KEY is not set, so Google sign-in is disabled. " +
      "Set it in deploy.env and rebuild. Email/password sign-in still works."
  );
}

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

