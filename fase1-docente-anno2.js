// fase1-docente-anno2.js
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { auth, db } from './firebase-init.js';
import {
  getDoc,
  setDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

window.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = 'index.html';
    });
  }

  const fase3Btn = document.getElementById('show-fase3-btn');
  if (fase3Btn) {
    fase3Btn.addEventListener('click', () => {
      // Placeholder per eventuale Fase 3
    });
  }

  initializeFase1Form();
});

async function initializeFase1Form() {
  try {
    const docRef = doc(db, 'fase1-docente-anno2', 'griglia-classe');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const dati = docSnap.data();
      Object.entries(dati).forEach(([key, value]) => {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) {
          field.value = value;
        }
      });
      console.log('✅ Dati fase 1 anno 2 caricati');
    } else {
      console.log('ℹ️ Nessun dato salvato per la fase 1 anno 2');
    }
  } catch (error) {
    console.error('❌ Errore nel caricamento dati fase 1 anno 2:', error);
  }
}

// Salvataggio dati
const form = document.getElementById('fase1-docente-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    try {
      await setDoc(doc(db, 'fase1-docente-anno2', 'griglia-classe'), data);
      alert('Dati salvati con successo');
    } catch (error) {
      console.error('❌ Errore salvataggio dati fase 1 anno 2:', error);
      alert('Errore durante il salvataggio');
    }
  });
}
