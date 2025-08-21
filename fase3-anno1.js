// fase3-anno1.js
import { db } from './firebase-init.js';
import {
  doc, setDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('fase3-form');
  const container = document.getElementById('esperienze-container');
  const linkBox = document.getElementById('link-recupero');

  // recupero studentId da URL
  const urlParams = new URLSearchParams(window.location.search);
  let studentId = urlParams.get('id');

  if (studentId) {
    // carica dati salvati
    const docRef = doc(db, 'fase3-studente-anno1', studentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      form.querySelector('[name="sintesi_nome"]').value = data.nome || '';
      form.querySelector('[name="sintesi_cognome"]').value = data.cognome || '';
      form.querySelector('[name="sintesi_classe"]').value = data.classe || '';

      // rimuovi l’esperienza vuota di default
      container.innerHTML = '';
      (data.esperienze || []).forEach(exp => {
        const entry = createExperienceEntry();
        fillEntry(entry, exp);
        container.appendChild(entry);
      });
    }
    linkBox.innerHTML = `🔗 Link di recupero: <a href="?id=${studentId}">${window.location.origin}${window.location.pathname}?id=${studentId}</a>`;
  }

  // aggiungi nuova esperienza
  document.getElementById('aggiungi-esperienza-btn').addEventListener('click', () => {
    container.appendChild(createExperienceEntry());
  });

  // salvataggio
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!studentId) {
      studentId = crypto.randomUUID(); // nuovo id
    }

    const esperienze = Array.from(container.querySelectorAll('.experience-entry')).map(entry => ({
      data: entry.querySelector('[name^="data_attivita"]').value,
      anno: entry.querySelector('[name^="anno_scolastico"]').value,
      nome_progetto: entry.querySelector('[name^="nome_progetto"]').value,
      tipo_attivita: entry.querySelector('[name^="tipo_attivita"]').value,
      obiettivo: entry.querySelector('[name^="obiettivo"]').value,
      ore: entry.querySelector('[name^="ore"]').value,
      modalita: entry.querySelector('[name^="modalita"]').value,
      descrizione: entry.querySelector('[name^="attivita_descrizione"]').value,
      colpito: entry.querySelector('[name^="colpito"]').value,
      insegnamenti: entry.querySelector('[name^="insegnamenti"]').value,
      documenti: entry.querySelector('[name^="documenti"]').value
    }));

    const baseData = {
      nome: form.querySelector('[name="sintesi_nome"]').value.trim(),
      cognome: form.querySelector('[name="sintesi_cognome"]').value.trim(),
      classe: form.querySelector('[name="sintesi_classe"]').value.trim(),
      esperienze
    };

    await setDoc(doc(db, 'fase3-studente-anno1', studentId), baseData, { merge: true });

    alert('Dati salvati correttamente!');
    linkBox.innerHTML = `🔗 Link di recupero: <a href="?id=${studentId}">${window.location.origin}${window.location.pathname}?id=${studentId}</a>`;
  });

  // funzioni helper
  function createExperienceEntry() {
    const div = document.createElement('div');
    div.classList.add('experience-entry');
    div.innerHTML = container.querySelector('.experience-entry')?.innerHTML || '';
    div.querySelectorAll('input, textarea').forEach(el => el.value = '');
    return div;
  }

  function fillEntry(entry, exp) {
    entry.querySelector('[name^="data_attivita"]').value = exp.data || '';
    entry.querySelector('[name^="anno_scolastico"]').value = exp.anno || '';
    entry.querySelector('[name^="nome_progetto"]').value = exp.nome_progetto || '';
    entry.querySelector('[name^="tipo_attivita"]').value = exp.tipo_attivita || '';
    entry.querySelector('[name^="obiettivo"]').value = exp.obiettivo || '';
    entry.querySelector('[name^="ore"]').value = exp.ore || '';
    entry.querySelector('[name^="modalita"]').value = exp.modalita || '';
    entry.querySelector('[name^="attivita_descrizione"]').value = exp.descrizione || '';
    entry.querySelector('[name^="colpito"]').value = exp.colpito || '';
    entry.querySelector('[name^="insegnamenti"]').value = exp.insegnamenti || '';
    entry.querySelector('[name^="documenti"]').value = exp.documenti || '';
  }
});
