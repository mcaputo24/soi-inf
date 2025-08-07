// fase4-anno2.js
import { db } from './firebase-init.js';
import { collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('fase4-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    const docData = {
      ...data,
      timestamp: new Date()
    };

    await addDoc(collection(db, 'fase4-studente-anno2'), docData);
    alert('Scheda salvata correttamente.');
    form.reset();
  });

  document.getElementById('download-pdf-btn').addEventListener('click', async () => {
    const nome = form.querySelector('[name="nome"]').value.trim();
    const cognome = form.querySelector('[name="cognome"]').value.trim();
    const classe = form.querySelector('[name="classe"]').value.trim();

    if (!nome || !cognome || !classe) {
      alert('Inserisci prima nome, cognome e classe.');
      return;
    }

    const q = query(collection(db, 'fase4-studente-anno2'),
      where('nome', '==', nome),
      where('cognome', '==', cognome),
      where('classe', '==', classe)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      alert('Nessuna scheda trovata per questo studente.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(14);
    doc.text(`Fase 4 – ${cognome} ${nome} (${classe})`, 10, y);
    y += 10;

    snapshot.forEach((docSnap, index) => {
      const d = docSnap.data();
      doc.setFontSize(12);
      doc.text(`📅 Data: ${d.data || '—'}`, 10, y); y += 8;
      doc.text(`🔍 Autovalutazione`, 10, y); y += 6;
      doc.text(`- Capito come sei fatto: ${d.capito_chi_sei_si_no} (${d.capito_chi_sei_val})`, 10, y); y += 6;
      doc.text(`- Cosa ti piace: ${d.cosa_ti_piace_si_no} (${d.cosa_ti_piace_val})`, 10, y); y += 6;
      doc.text(`- Studio o lavoro: ${d.studiare_o_lavorare_si_no} (${d.studiare_o_lavorare_val})`, 10, y); y += 6;
      doc.text(`- Decisioni: ${d.decisioni_si_no} (${d.decisioni_val})`, 10, y); y += 8;
      doc.text(`🧠 Riflessività`, 10, y); y += 6;
      doc.text(`- Cosa hai imparato: ${d.cosa_imparato_te}`, 10, y); y += 6;
      doc.text(`- Cosa è emerso: ${d.emerso_rilevante}`, 10, y); y += 6;
      doc.text(`- Qualità e miglioramenti: ${d.qualita_e_migliorare}`, 10, y); y += 6;
      doc.text(`- Utilità futura: ${d.utilita_futura}`, 10, y); y += 6;
      doc.text(`📎 Documenti allegati: ${d.documenti_allegati}`, 10, y); y += 10;

      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save(`fase4_${cognome}_${nome}.pdf`);
  });
});
