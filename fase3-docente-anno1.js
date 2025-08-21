// fase3-docente-anno1.js

import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { db, auth } from './firebase-init.js';
import {
  getDoc,
  getDocs,
  setDoc,
  doc,
  collection
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

// 🔒 Protezione accesso: se non loggato → redirect login
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login-docenti.html';
  }
});

// Al caricamento pagina
window.addEventListener('DOMContentLoaded', async () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = 'index.html';
    });
  }

  // Carica dati fase 3
  await initializeFase3();
});

async function initializeFase3() {
  try {
    // Recupero osservazioni Fase 1
    const fase1Ref = doc(db, 'fase1-docente-anno1', 'griglia-classe');
    const fase1Doc = await getDoc(fase1Ref);

    // Recupero valutazioni studenti Fase 2
    const valutazioni = await fetchAllStudentEvaluations();
    const sintesi = calculateDimensionSummary(valutazioni);

    // Recupero eventuali dati già salvati Fase 3
    const fase3Ref = doc(db, 'fase3-docente-anno1', 'sintesi-classe');
    const savedData = await getDoc(fase3Ref);

    const testo = fase1Doc.exists() ? fase1Doc.data() : {};
    const datiSalvati = savedData.exists() ? savedData.data() : {};

    renderFase3Page(testo, sintesi, datiSalvati);
  } catch (e) {
    console.error('❌ Errore nel caricamento Fase 3:', e);
    alert('Errore durante il caricamento dei dati Fase 3');
  }
}

function renderFase3Page(fase1Data, sintesi, datiSalvati) {
  const container = document.getElementById('fase3-container');
  if (!container) return;

  const sezioni = ['scheda1_', 'scheda2_', 'scheda3_', 'scheda4_'];
  const dimensioni = ['autoconsapevolezza','conoscenza_lavoro','processo_decisionale','visione_futura','organizzazione'];

  container.innerHTML = `
    <p>
      La FASE 3 prevede la compilazione di una scheda di sintesi per il gruppo classe. 
      Partendo dall’analisi delle singole schede di sintesi individuali della FASE 2 
      e contestualmente dalle annotazioni riportate nella griglia di osservazione della classe della FASE 1, 
      il docente effettua una sintesi dei risultati emersi e la riporta nei box relativi a ciascuna dimensione.
    </p>
    <form id="fase3-form">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">Dimensioni</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Fase 1 - Osservazioni del docente</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Fase 2 - Sintesi schede studenti</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Fase 3 - Considerazioni finali dimensioni/classe</th>
          </tr>
        </thead>
        <tbody>
          ${dimensioni.map(dim => {
            const label = dim.replace(/_/g, ' ');
            const chiaveSintesi = `sintesi_${dim}`;   // sintesi fase 2
            const chiaveNote = `note_${dim}`;         // note fase 3
            const osservazioni = sezioni.map(prefix => fase1Data[`${prefix}${dim}`]).filter(Boolean).join('<br>');

            return `
              <tr>
                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">
                  ${label.charAt(0).toUpperCase() + label.slice(1)}
                </td>
                <td style="border: 1px solid #ccc; padding: 8px; font-size: 13px;">
                  ${osservazioni || '(nessuna osservazione)'}
                </td>
                <td style="border: 1px solid #ccc; padding: 8px;">
                  <input type="text" name="${chiaveSintesi}" 
                    value="${datiSalvati[chiaveSintesi] || sintesi[dim] || ''}" 
                    style="width: 100%;">
                </td>
                <td style="border: 1px solid #ccc; padding: 8px;">
                  <textarea name="${chiaveNote}" rows="2" style="width: 100%;">${datiSalvati[chiaveNote] || ''}</textarea>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <br>
      <div style="text-align: center; margin-top: 20px;">
  <button type="submit" class="button-save">Salva considerazioni finali</button>
</div>
    </form>
  `;

  document.getElementById('fase3-form').addEventListener('submit', handlePhase3Submit);
}


async function handlePhase3Submit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    await setDoc(doc(db, 'fase3-docente-anno1', 'sintesi-classe'), data);
    alert('✅ Sintesi salvata correttamente');
  } catch (e) {
    console.error('Errore salvataggio Fase 3:', e);
    alert('❌ Errore durante il salvataggio');
  }
}

async function fetchAllStudentEvaluations() {
  const snapshot = await getDocs(collection(db, 'fase2-docente-anno1'));
  return snapshot.docs.map(doc => doc.data());
}

function calculateDimensionSummary(records) {
  const dimensioni = ['autoconsapevolezza','conoscenza_lavoro','processo_decisionale','visione_futura','organizzazione'];
  const conteggi = Object.fromEntries(dimensioni.map(d => [d, { presente: 0, potenziare: 0 }]));

  records.forEach(risposte => {
    Object.entries(risposte).forEach(([k, v]) => {
      const match = k.match(/__([^_]+(?: [^_]+)*)$/);
      if (!match) return;
      const dim = match[1].toLowerCase().replace(/ /g, '_');
      if (!(dim in conteggi)) return;
      if (v === 'presente') conteggi[dim].presente++;
      if (v === 'da potenziare') conteggi[dim].potenziare++;
    });
  });

  const risultati = {};
  dimensioni.forEach(dim => {
    const { presente, potenziare } = conteggi[dim];
    risultati[dim] = (potenziare >= presente) ? 'DA POTENZIARE' : 'PRESENTE';
  });

  return risultati;
}
