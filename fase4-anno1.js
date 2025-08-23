// fase4-anno1.js
import { db } from './firebase-init.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('fase4-form');
  const linkBox = document.getElementById('link-recupero');

  // --- Recupero studentId da URL o localStorage ---
  const urlParams = new URLSearchParams(window.location.search);
  let studentId = urlParams.get('id') || localStorage.getItem('fase4-studentId');

  if (studentId) {
    localStorage.setItem('fase4-studentId', studentId);

    const docRef = doc(db, 'fase4-studente-anno1', studentId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();

      // Riempie i campi del form con i dati salvati
      for (const [key, value] of Object.entries(data)) {
        const input = form.querySelector(`[name="${key}"]`);
        if (!input) continue;

        if (input.type === "radio") {
          // Se è un radio, spunta quello corrispondente
          const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
          if (radio) radio.checked = true;
        } else {
          input.value = value;
        }
      }
    }

    // Mostra il link di recupero
    const recoveryLink = `${window.location.origin}${window.location.pathname}?id=${studentId}`;
    linkBox.innerHTML = `🔗 Link di recupero: <a href="${recoveryLink}" target="_blank">${recoveryLink}</a>`;
  }

  // --- Salvataggio dati ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!studentId) {
      studentId = crypto.randomUUID();
      localStorage.setItem('fase4-studentId', studentId);
    }

    // Costruisce un oggetto dati includendo anche i radio button
    const formData = new FormData(form);
    const dataToSave = {};

    formData.forEach((value, key) => {
      dataToSave[key] = value;
    });

    try {
      // 1. Salva in Firestore
      await setDoc(doc(db, 'fase4-studente-anno1', studentId), dataToSave, { merge: true });

      // 2. Aggiorna resumeLinks
      const recoveryLink = `${window.location.origin}${window.location.pathname}?id=${studentId}`;
      await setDoc(doc(db, 'resumeLinks', studentId), { linkFase4: recoveryLink }, { merge: true });

      alert('Dati salvati correttamente!');
      linkBox.innerHTML = `🔗 Link di recupero: <a href="${recoveryLink}" target="_blank">${recoveryLink}</a>`;
    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Errore durante il salvataggio, riprova.");
    }
  });

  // --- Download PDF ---
  const pdfButton = document.getElementById('download-pdf-btn');
  if (pdfButton) {
    pdfButton.addEventListener('click', async () => {
      try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        const mainContent = document.querySelector('main');

        pdfButton.textContent = 'Creazione PDF...';
        pdfButton.disabled = true;

        const canvas = await window.html2canvas(mainContent, {
          scale: 2,
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

        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save("fase4-studente.pdf");

      } catch (err) {
        console.error("Errore generazione PDF:", err);
        alert("Errore nella generazione del PDF.");
      } finally {
        pdfButton.textContent = 'Scarica PDF';
        pdfButton.disabled = false;
      }
    });
  }
});
