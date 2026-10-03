import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBr7cbh5qUZcRs9RBR0FD4ySHL5bVdD98U",
  authDomain: "shivaji-milk-center.firebaseapp.com",
  projectId: "shivaji-milk-center",
  storageBucket: "shivaji-milk-center.firebasestorage.app",
  messagingSenderId: "417490554810",
  appId: "1:417490554810:web:31093a1bb20bdcd8a61783",
  measurementId: "G-5C48HGHJY7"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default db;
