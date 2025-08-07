// script-anno2.js
// Versione aggiornata per la Fase 1 Studente Anno II

import { db } from './firebase-init.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

window.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('form');

  // Caricamento dati salvati, se presenti
  const userId = sessionStorage.getItem('userId');
  if (userId) {
    const docRef = doc(db, 'fase1-studente-anno2', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const dati = docSnap.data();
      Object.entries(dati).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field) field.value = value;
        const checkbox = form.querySelector(`#${key}`);
        if (checkbox && checkbox.type === 'checkbox') checkbox.checked = value === true;
      });
    }
  }

  // Salvataggio dati
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    // salva anche gli stati dei checkbox
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      data[cb.id] = cb.checked;
    });

    const userId = sessionStorage.getItem('userId') || Date.now().toString();
    sessionStorage.setItem('userId', userId);
    await setDoc(doc(db, 'fase1-studente-anno2', userId), data);
    alert('Risposte salvate con successo');
  });
});
