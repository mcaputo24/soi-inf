import { db } from './firebase-init.js';
import {
  doc, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const form = document.getElementById('fase1-docente-form');
const docRef = doc(db, 'fase1-docente-anno1', 'griglia-classe');

// Carica i dati se esistono
async function loadFormData() {
  try {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      Object.entries(data).forEach(([key, value]) => {
        const field = form.elements[key];
        if (field) field.value = value;
      });
    }
  } catch (e) {
    console.error('Errore nel caricamento dati:', e);
  }
}

// Salva i dati
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    await setDoc(docRef, data);
    alert('Dati salvati correttamente.');
  } catch (e) {
    console.error('Errore nel salvataggio:', e);
    alert('Errore nel salvataggio.');
  }
});

loadFormData(); // Avvia caricamento iniziale
