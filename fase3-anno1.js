// fase3-anno1.js
import { db } from './firebase-init.js';
import {
  collection, addDoc, getDocs, query, where
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('fase3-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // Gestione multiple esperienze (array)
    const entries = Array.from(document.querySelectorAll('.experience-entry'));
    const esperienze = entries.map(entry => {
      const getValue = name => entry.querySelector(`[name^="${name}"]`)?.value || '';
      return {
        data: getValue('data_attivita'),
        anno: getValue('anno_scolastico'),
        nome_progetto: getValue('nome_progetto'),
        tipo_attivita: getValue('tipo_attivita'),
        obiettivo: getValue('obiettivo'),
        ore: getValue('ore'),
        modalita: getValue('modalita'),
        descrizione: getValue('attivita_descrizione'),
        colpito: getValue('colpito'),
        insegnamenti: getValue('insegnamenti'),
        documenti: getValue('documenti')
      };
    });

    const baseData = {
      nome: data.sintesi_nome,
      cognome: data.sintesi_cognome,
      classe: data.sintesi_classe,
      data: data.sintesi_data,
      timestamp: new Date()
    };

    // Salva ogni esperienza singolarmente
    for (const esperienza of esperienze) {
      await addDoc(collection(db, 'fase3-studente-anno1'), {
        ...baseData,
        esperienza
      });
    }

    alert('Esperienza salvata correttamente.');
    form.reset();
  });

  // PDF
  const pdfBtn = document.createElement('button');
  pdfBtn.textContent = '📄 Scarica PDF con tutte le esperienze';
  pdfBtn.type = 'button';
  form.appendChild(pdfBtn);

  pdfBtn.addEventListener('click', async () => {
    const nome = form.querySelector('[name="sintesi_nome"]').value.trim();
    const cognome = form.querySelector('[name="sintesi_cognome"]').value.trim();
    const classe = form.querySelector('[name="sintesi_classe"]').value.trim();

    if (!nome || !cognome || !classe) {
      alert('Compila nome, cognome e classe prima di scaricare il PDF.');
      return;
    }

    const q = query(collection(db, 'fase3-studente-anno1'),
      where('nome', '==', nome),
      where('cognome', '==', cognome),
      where('classe', '==', classe)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      alert('Nessuna esperienza trovata per questo studente.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(14);
    doc.text(`Sintesi dell'esperienza – ${cognome} ${nome} (${classe})`, 10, y);
    y += 10;

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const e = d.esperienza;

      doc.setFontSize(12);
      doc.text(`📅 Data esperienza: ${e.data || '—'}`, 10, y); y += 8;
      doc.text(`📘 Nome progetto/ente: ${e.nome_progetto || '—'}`, 10, y); y += 8;
      doc.text(`🎯 Obiettivo: ${e.obiettivo || '—'}`, 10, y); y += 8;
      doc.text(`🕓 Ore: ${e.ore || '—'} | Modalità: ${e.modalita || '—'}`, 10, y); y += 8;
      doc.text(`✏️ Attività: ${e.descrizione || '—'}`, 10, y); y += 8;
      doc.text(`✨ Colpito da: ${e.colpito || '—'}`, 10, y); y += 8;
      doc.text(`📚 Insegnamenti: ${e.insegnamenti || '—'}`, 10, y); y += 8;
      doc.text(`📎 Documenti: ${e.documenti || '—'}`, 10, y); y += 12;

      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save(`esperienze_${cognome}_${nome}.pdf`);
  });
});
