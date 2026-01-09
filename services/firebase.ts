
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC67cYqknT8GbQ-4zUg5hZXBQ209kDs1vI",
  authDomain: "digitalsight-7d498.firebaseapp.com",
  projectId: "digitalsight-7d498",
  storageBucket: "digitalsight-7d498.firebasestorage.app",
  messagingSenderId: "220340840910",
  appId: "1:220340840910:web:4db9a30eec3f3916cde39f",
  measurementId: "G-43564EVJ55"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
