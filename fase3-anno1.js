import { db } from './firebase-init.js';
import {
  doc, setDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('fase3-form');
  const linkBox = document.getElementById('link-recupero');

  // Funzione per creare un nuovo blocco esperienza (usa la logica del tuo HTML)
  function addExperienceBlock() {
      const firstEntry = form.querySelector('.experience-entry');
      if (firstEntry) {
          const clone = firstEntry.cloneNode(true);
          clone.querySelectorAll('input, textarea').forEach(el => el.value = '');
          // Inserisce il nuovo blocco prima del gruppo di pulsanti
          form.querySelector('.button-group').before(clone);
      }
  }
  
  // Collega la funzione al pulsante "Aggiungi"
  document.getElementById('aggiungi-esperienza-btn').addEventListener('click', addExperienceBlock);

  // --- Caricamento Dati Esistenti ---
  const urlParams = new URLSearchParams(window.location.search);
  let studentId = urlParams.get('id');

  if (studentId) {
    const docRef = doc(db, 'fase3-studente-anno1', studentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      form.querySelector('[name="sintesi_nome"]').value = data.nome || '';
      form.querySelector('[name="sintesi_cognome"]').value = data.cognome || '';
      form.querySelector('[name="sintesi_classe"]').value = data.classe || '';

      // Rimuove il blocco di default e carica quelli salvati
      const allEntries = form.querySelectorAll('.experience-entry');
      allEntries.forEach((entry, index) => {
        if (index > 0) entry.remove(); // Rimuove tutti tranne il primo
      });

      (data.esperienze || []).forEach((exp, index) => {
        let entryToFill;
        if (index === 0) {
          entryToFill = form.querySelector('.experience-entry'); // Usa il primo blocco esistente
        } else {
          addExperienceBlock(); // Crea nuovi blocchi per le esperienze successive
          entryToFill = form.querySelectorAll('.experience-entry')[index];
        }
        fillEntry(entryToFill, exp);
      });
    }
    linkBox.innerHTML = `🔗 Link di recupero: <a href="?id=${studentId}" target="_blank">${window.location.origin}${window.location.pathname}?id=${studentId}</a>`;
  }

  // --- Logica di Salvataggio ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!studentId) {
      studentId = crypto.randomUUID();
    }
    
    // CORREZIONE QUI: Cerca i blocchi .experience-entry direttamente dentro al form
    const esperienze = Array.from(form.querySelectorAll('.experience-entry')).map(entry => ({
      data: entry.querySelector('[name="data_attivita[]"]').value,
      anno: entry.querySelector('[name="anno_scolastico[]"]').value,
      nome_progetto: entry.querySelector('[name="nome_progetto[]"]').value,
      tipo_attivita: entry.querySelector('[name="tipo_attivita[]"]').value,
      obiettivo: entry.querySelector('[name="obiettivo[]"]').value,
      ore: entry.querySelector('[name="ore[]"]').value,
      modalita: entry.querySelector('[name="modalita[]"]').value,
      descrizione: entry.querySelector('[name="attivita_descrizione[]"]').value,
      colpito: entry.querySelector('[name="colpito[]"]').value,
      insegnamenti: entry.querySelector('[name="insegnamenti[]"]').value,
      documenti: entry.querySelector('[name="documenti[]"]').value
    }));

    const baseData = {
      nome: form.querySelector('[name="sintesi_nome"]').value.trim(),
      cognome: form.querySelector('[name="sintesi_cognome"]').value.trim(),
      classe: form.querySelector('[name="sintesi_classe"]').value.trim(),
      esperienze
    };

    try {
      await setDoc(doc(db, 'fase3-studente-anno1', studentId), baseData, { merge: true });
      alert('Dati salvati correttamente!');
      linkBox.innerHTML = `🔗 Link di recupero: <a href="?id=${studentId}" target="_blank">${window.location.origin}${window.location.pathname}?id=${studentId}</a>`;
    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Errore durante il salvataggio, riprova.");
    }
  });

  // Funzione helper per riempire un blocco con i dati
  function fillEntry(entry, exp) {
    entry.querySelector('[name="data_attivita[]"]').value = exp.data || '';
    entry.querySelector('[name="anno_scolastico[]"]').value = exp.anno || '';
    entry.querySelector('[name="nome_progetto[]"]').value = exp.nome_progetto || '';
    entry.querySelector('[name="tipo_attivita[]"]').value = exp.tipo_attivita || '';
    entry.querySelector('[name="obiettivo[]"]').value = exp.obiettivo || '';
    entry.querySelector('[name="ore[]"]').value = exp.ore || '';
    entry.querySelector('[name="modalita[]"]').value = exp.modalita || '';
    entry.querySelector('[name="attivita_descrizione[]"]').value = exp.descrizione || '';
    entry.querySelector('[name="colpito[]"]').value = exp.colpito || '';
    entry.querySelector('[name="insegnamenti[]"]').value = exp.insegnamenti || '';
    entry.querySelector('[name="documenti[]"]').value = exp.documenti || '';
  }
});