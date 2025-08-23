import { db } from './firebase-init.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const tableBody = document.querySelector('#resumeTable tbody');

async function loadResumeLinks() {
  // Recupera tutti i resumeLinks
  const resumeSnapshot = await getDocs(collection(db, 'resumeLinks'));

  for (const docSnap of resumeSnapshot.docs) {
    const data = docSnap.data();
    const studId = docSnap.id;

    // Recupera anagrafica dalla fase1 o fase3
    let nomeCompleto = studId;
    const fase1Doc = await getDoc(doc(db, 'fase1-studente-anno1', studId));
    const fase3Doc = await getDoc(doc(db, 'fase3-studente-anno1', studId));

    if (fase1Doc.exists()) {
      const d = fase1Doc.data();
      if (d.cognome && d.nome) nomeCompleto = `${d.cognome} ${d.nome}`;
    } else if (fase3Doc.exists()) {
      const d = fase3Doc.data();
      if (d.cognome && d.nome) nomeCompleto = `${d.cognome} ${d.nome}`;
    }

    // Crea riga tabella
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nomeCompleto}</td>
      <td>${data.link ? `<a href="${data.link}" target="_blank">Apri</a>` : '-'}</td>
      <td>${data.linkFase3 ? `<a href="${data.linkFase3}" target="_blank">Apri</a>` : '-'}</td>
      <td>${data.linkFase4 ? `<a href="${data.linkFase4}" target="_blank">Apri</a>` : '-'}</td>
    `;
    tableBody.appendChild(tr);
  }
}

loadResumeLinks();
