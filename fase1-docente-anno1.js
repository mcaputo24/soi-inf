import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { auth } from './firebase-init.js';

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login-docenti.html';
  }
});

import { db } from './firebase-init.js';
import {
  getDoc,
  setDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

window.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      console.log('🔁 Logout richiesto manualmente');
      await signOut(auth);
      window.location.href = 'index.html';
    });
  }

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', salvaFase1);
  }

  initializeFase1Form();
});

// Recupera e riempi i campi della Fase 1 con i dati salvati
async function initializeFase1Form() {
  try {
    const docRef = doc(db, 'fase1-docente-anno1', 'griglia-classe');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const dati = docSnap.data();
      Object.entries(dati).forEach(([key, value]) => {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) {
          field.value = value;
        }
      });
      console.log('✅ Dati fase 1 caricati');
    } else {
      console.log('ℹ️ Nessun dato salvato per la fase 1');
    }
  } catch (error) {
    console.error('❌ Errore nel caricamento dati fase 1:', error);
  }
}

// Funzione per salvare i dati del form principale
async function salvaFase1(event) {
  event.preventDefault(); // Impedisce qualsiasi comportamento predefinito
  console.log('✅ Tentativo di salvataggio Fase 1...');

  const form = document.getElementById('fase1-docente-form');
  if (!form) {
    console.error('❌ Form non trovato!');
    alert('Errore: Impossibile trovare il form da salvare.');
    return;
  }

  // Raccoglie tutti i dati dai campi del form
  const dati = Object.fromEntries(new FormData(form).entries());

  try {
    // Specifica dove salvare i dati in Firestore
    const docRef = doc(db, 'fase1-docente-anno1', 'griglia-classe');
    
    // Salva i dati
    await setDoc(docRef, dati);
    
    // Mostra un messaggio di successo
    alert('✅ Osservazioni salvate con successo!');
    console.log('✅ Dati Fase 1 salvati correttamente.');

  } catch (error) {
    // Mostra un messaggio in caso di errore
    console.error('❌ Errore durante il salvataggio dei dati Fase 1:', error);
    alert('❌ Si è verificato un errore durante il salvataggio.');
  }
}
