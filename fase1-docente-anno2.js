import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { auth } from './firebase-init.js';

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login-docenti.html';
  }
});

// 🔁 Aggiunta migliorata per modale Fase 3

import { db } from './firebase-init.js';
import {
  getDoc,
  getDocs,
  setDoc,
  doc,
  collection
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
  const fase3Btn = document.getElementById('show-fase3-btn');
  if (fase3Btn) {
    fase3Btn.addEventListener('click', showFase3);
  }
initializeFase1Form();
});
// Recupera e riempi i campi della Fase 1 con i dati salvati
async function initializeFase1Form() {
  try {
    const docRef = doc(db, 'fase1-docente-anno2', 'griglia-classe');
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
  
async function showFase3() {
  console.log('✅ Bottone Fase 3 cliccato');
  try {
    const fase1Ref = doc(db, 'fase1-docente-anno2', 'griglia-classe');
    const fase1Doc = await getDoc(fase1Ref);
    const valutazioni = await fetchAllStudentEvaluations();
    const sintesi = calculateDimensionSummary(valutazioni);
    const fase3Ref = doc(db, 'fase3-docente-anno1', 'sintesi-classe');
    const savedData = await getDoc(fase3Ref);

    const testo = fase1Doc.exists() ? fase1Doc.data() : {};
    const datiSalvati = savedData.exists() ? savedData.data() : {};

    showPhase3Modal(testo, sintesi, datiSalvati);
  } catch (e) {
    console.error('❌ Errore nel caricamento Fase 3:', e);
  }
}

function showPhase3Modal(fase1Data, sintesi, datiSalvati) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';

  const sezioni = ['scheda1_', 'scheda2_', 'scheda3_', 'scheda4_'];
  const dimensioni = ['autoconsapevolezza','conoscenza_lavoro','processo_decisionale','visione_futura','organizzazione'];
  const extraKeys = ['scheda4_tipo_scuola', 'scheda5_autoconsapevolezza', 'scheda5_conoscenza_lavoro', 'scheda5_processo_decisionale', 'scheda5_visione_futura', 'scheda5_organizzazione'];

  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-button" onclick="document.body.removeChild(document.querySelector('.modal-overlay'))">&times;</button>
      <h2>FASE 3 - SCHEDA DI SINTESI GENERALE (per gruppo classe)</h2>
      <p>
        La FASE 3 prevede la compilazione di una scheda di sintesi per il gruppo classe. Partendo dall’analisi delle singole schede DI SINTESI INDIVIDUALE PER SINGOLA DIMENSIONE (per singolo studente) della FASE 2 e contestualmente dalle annotazioni riportate dal docente nella GRIGLIA DI OSSERVAZIONE DELLA CLASSE della FASE 1, per l’intero gruppo classe il conduttore effettua una sintesi dei risultati emersi e la riporta nei box relativi a ciascuna dimensione.<br>
        Es.: Relativamente alla dimensione Autoconsapevolezza, si valuterà rispetto a quanti studenti la dimensione risulta da potenziare. Se la dimensione risulta da potenziare per la maggior parte degli studenti della classe, la dimensione verrà indicata come “Da potenziare”. Quanto eventualmente annotato nella griglia di osservazione della classe servirà da supporto nell’avvalorare i risultati ottenuti.
      </p>
      <form id="fase3-form">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px;">Dimensione</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Osservazioni Fase 1</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Annotazioni sintetiche</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Sintesi</th>
            </tr>
          </thead>
          <tbody>
            ${dimensioni.map(dim => {
              const label = dim.replace(/_/g, ' ');
              const chiaveSintesi = `sintesi_${dim}`;
              const chiaveNote = `note_${dim}`;
              const osservazioni = sezioni.map(prefix => fase1Data[`${prefix}${dim}`]).filter(Boolean).join('<br>') + (fase1Data[`scheda5_${dim}`] ? `<br><strong>Scheda 5:</strong> ${fase1Data[`scheda5_${dim}`]}` : '');

              return `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">${label.charAt(0).toUpperCase() + label.slice(1)}</td>
                  <td style="border: 1px solid #ccc; padding: 8px; font-size: 13px;">${osservazioni || '(nessuna osservazione)'}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">
                    <textarea name="${chiaveNote}" rows="2" style="width: 100%;">${datiSalvati[chiaveNote] || ''}</textarea>
                  </td>
                  <td style="border: 1px solid #ccc; padding: 8px;">
                    <input type="text" name="${chiaveSintesi}" value="${datiSalvati[chiaveSintesi] || sintesi[dim] || ''}" style="width: 100%;">
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <br>
        <div style="text-align: right">
          <button type="submit">Salva Sintesi</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('fase3-form').addEventListener('submit', handlePhase3Submit);
}

async function handlePhase3Submit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    await setDoc(doc(db, 'fase3-docente-anno1', 'sintesi-classe'), data);
    alert('Sintesi salvata correttamente');
    document.body.removeChild(document.querySelector('.modal-overlay'));
  } catch (e) {
    console.error('Errore salvataggio Fase 3:', e);
    alert('Errore durante il salvataggio');
  }
}

async function fetchAllStudentEvaluations() {
  const snapshot = await getDocs(collection(db, 'fase2-docente-anno1'));
  return snapshot.docs.map(doc => doc.data());
}

function calculateDimensionSummary(records) {
  const dimensioni = ['autoconsapevolezza','conoscenza_lavoro','processo_decisionale','visione_futura','organizzazione'];
  const extraKeys = ['scheda4_tipo_scuola', 'scheda5_autoconsapevolezza', 'scheda5_conoscenza_lavoro', 'scheda5_processo_decisionale', 'scheda5_visione_futura', 'scheda5_organizzazione'];
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
