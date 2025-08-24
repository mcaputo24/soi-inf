// =================================================================
// INIZIO DEL FILE fase3-anno1.js (VERSIONE CORRETTA E COMPLETA)
// =================================================================

// TUTTI GLI IMPORT DEVONO STARE QUI, ALL'INIZIO DEL FILE
import { db } from './firebase-init.js';
import {
  doc, setDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

// Tutta la logica viene eseguita solo dopo che la pagina è stata caricata
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('fase3-form');
  const linkBox = document.getElementById('link-recupero');

  // Funzione per creare un nuovo blocco esperienza
  function addExperienceBlock() {
    const firstEntry = form.querySelector('.experience-entry');
    if (firstEntry) {
      const clone = firstEntry.cloneNode(true);
      clone.querySelectorAll('input, textarea').forEach(el => el.value = '');
      form.querySelector('.form-actions').before(clone);
    }
  }
  
  document.getElementById('aggiungi-esperienza-btn').addEventListener('click', addExperienceBlock);

  // --- Caricamento Dati Esistenti ---
  const urlParams = new URLSearchParams(window.location.search);
  let studentId = urlParams.get('id') || localStorage.getItem('fase3-studentId');

  if (studentId) {
    localStorage.setItem('fase3-studentId', studentId);
    const docRef = doc(db, 'fase3-studente-anno1', studentId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      form.querySelector('[name="sintesi_nome"]').value = data.nome || '';
      form.querySelector('[name="sintesi_cognome"]').value = data.cognome || '';
      form.querySelector('[name="sintesi_classe"]').value = data.classe || '';


      // LOGICA DI CARICAMENTO CORRETTA
      const allEntries = form.querySelectorAll('.experience-entry');
      // Rimuove tutti i blocchi tranne il primo, che useremo come template
      allEntries.forEach((entry, index) => {
        if (index > 0) entry.remove();
      });

      const experiencesData = data.esperienze || [];
      const firstBlock = form.querySelector('.experience-entry');

      if (experiencesData.length === 0) {
          // Se non ci sono esperienze salvate, puliamo il primo blocco
          firstBlock.querySelectorAll('input, textarea').forEach(el => el.value = '');
      } else {
          // Altrimenti, riempiamo i blocchi con i dati salvati
          experiencesData.forEach((exp, index) => {
              let entryToFill;
              if (index === 0) {
                  entryToFill = firstBlock; // Usa il primo blocco per la prima esperienza
              } else {
                  addExperienceBlock(); // Crea un nuovo blocco per le esperienze successive
                  const currentEntries = form.querySelectorAll('.experience-entry');
                  entryToFill = currentEntries[currentEntries.length - 1]; // Seleziona l'ultimo blocco creato
              }
              fillEntry(entryToFill, exp);
          });
      }
    }
  
  }

const recoveryLink = `${window.location.origin}${window.location.pathname}?id=${studentId}`;
  linkBox.innerHTML = `
    <strong>Riprendi il questionario</strong>
    <p>Puoi continuare da un altro dispositivo usando questo link:</p>
    <a href="${recoveryLink}" target="_blank">${recoveryLink}</a>
  `;
}

  // --- Logica di Salvataggio ---
  // --- Logica di Salvataggio ---
  // --- Logica di Salvataggio ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!studentId) {
      studentId = crypto.randomUUID();
      localStorage.setItem('fase3-studentId', studentId);
    }
    
    // La raccolta dei dati (esperienze, baseData) resta invariata
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
      // 1. Salva i dati del form dello studente
      await setDoc(doc(db, 'fase3-studente-anno1', studentId), baseData, { merge: true });

      // 2. CREA E SALVA IL LINK UFFICIALE NELLA COLLEZIONE 'resumeLinks'
      const recoveryLink = `${window.location.origin}${window.location.pathname}?id=${studentId}`;
      const linkData = {
        studentId: studentId,
        linkFase3: recoveryLink, // Aggiunge/aggiorna il campo specifico per la Fase 3
        updatedAt: new Date()
      };
      // Usa { merge: true } per non cancellare il link della Fase 1
      await setDoc(doc(db, 'resumeLinks', studentId), linkData, { merge: true });

      alert('Dati salvati correttamente!');
      
      // 3. MOSTRA SULLA PAGINA IL LINK UFFICIALE APPENA SALVATO
      linkBox.innerHTML = `
  <strong>Riprendi il questionario</strong>
  <p>Puoi continuare da un altro dispositivo usando questo link:</p>
  <a href="${recoveryLink}" target="_blank">${recoveryLink}</a>
`;

    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Errore durante il salvataggio, riprova.");
    }
  });

  // Codice corretto da incollare al posto di quello vecchio

// --- Logica scarica PDF ---
const pdfButton = document.getElementById('download-pdf-btn');
if (pdfButton) {
  pdfButton.addEventListener('click', async () => {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const mainContent = document.querySelector('main');

      // Mostra un indicatore di caricamento
      pdfButton.textContent = 'Creazione PDF...';
      pdfButton.disabled = true;

      const canvas = await window.html2canvas(mainContent, {
        scale: 2,
        // Assicura che venga catturato tutto anche se la pagina ha uno scroll
        windowWidth: mainContent.scrollWidth,
        windowHeight: mainContent.scrollHeight
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.7);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      // Aggiunge la prima pagina
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Aggiunge le pagine successive se necessario
      while (heightLeft > 0) {
        position -= pageHeight; // Sposta la "visuale" dell'immagine in alto
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("fase3-studente.pdf");

    } catch (err) {
      console.error("Errore generazione PDF:", err);
      alert("Errore nella generazione del PDF.");
    } finally {
      // Ripristina il pulsante in ogni caso
      pdfButton.textContent = 'Scarica PDF';
      pdfButton.disabled = false;
    }
  });
}

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