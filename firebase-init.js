// Importa le librerie necessarie da Firebase
import { db } from './firebase-init.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Configurazione del progetto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAK0pbWokBkCbX1VTFYHdU3xA0HEZH1sq0",
  authDomain: "soi-inf.firebaseapp.com",
  projectId: "soi-inf",
  storageBucket: "soi-inf.firebasestorage.app",
  messagingSenderId: "879059374436",
  appId: "1:879059374436:web:c0cbfbdbe4ce1b1a01ea71"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta i moduli utili in altri script
export const auth = getAuth(app);
export const db = getFirestore(app);
