// 🔁 Aggiungi questo blocco IN FONDO al file fase1-docente-anno1.js

// --- Bottone Fase 3 ---
document.getElementById('show-fase3-btn')?.addEventListener('click', async () => {
  try {
    const fase1Doc = await getDoc(doc(db, 'fase1-docente-anno1', 'griglia-classe'));
    const valutazioni = await fetchAllStudentEvaluations();
    const sintesi = calculateDimensionSummary(valutazioni);
    const savedData = await getDoc(doc(db, 'fase3-docente-anno1', 'sintesi-classe'));
    const testo = fase1Doc.exists() ? fase1Doc.data() : {};
    const datiSalvati = savedData.exists() ? savedData.data() : {};

    showPhase3Modal(testo, sintesi, datiSalvati);
  } catch (e) {
    console.error('Errore nel caricamento Fase 3:', e);
  }
});

// --- Mostra modale ---
function showPhase3Modal(fase1Data, sintesi, datiSalvati) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
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
              <th style="border: 1px solid #ccc; padding: 8px;">Osservazioni docente</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Sintesi</th>
            </tr>
          </thead>
          <tbody>
            ${['autoconsapevolezza','conoscenza del mondo del lavoro','processo decisionale','visione futura','organizzazione'].map(dim => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">${dim.charAt(0).toUpperCase() + dim.slice(1)}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">
                  ${fase1Data[dim] || '(nessuna osservazione)'}
                </td>
                <td style="border: 1px solid #ccc; padding: 8px;">
                  <strong>${sintesi[dim] || '(calcolo non disponibile)'}</strong>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <br>
        <div style="text-align: right">
          <button type="submit">Salva Sintesi</button>
          <button type="button" onclick="document.body.removeChild(this.closest('.modal'))">Torna alla dashboard</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('fase3-form').addEventListener('submit', handlePhase3Submit);
}

// --- Salvataggio dati Fase 3 ---
async function handlePhase3Submit(e) {
  e.preventDefault();
  try {
    await setDoc(doc(db, 'fase3-docente-anno1', 'sintesi-classe'), {
      savedAt: new Date()
    });
    alert('Sintesi salvata correttamente');
    document.body.removeChild(document.querySelector('.modal'));
  } catch (e) {
    console.error('Errore salvataggio Fase 3:', e);
    alert('Errore durante il salvataggio');
  }
}

// --- Recupera tutte le valutazioni fase 2 ---
async function fetchAllStudentEvaluations() {
  const snapshot = await getDocs(collection(db, 'fase2-docente-anno1'));
  return snapshot.docs.map(doc => doc.data());
}

// --- Calcola sintesi per ogni dimensione ---
function calculateDimensionSummary(records) {
  const dimensioni = ['autoconsapevolezza','conoscenza del mondo del lavoro','processo decisionale','visione futura','organizzazione'];
  const conteggi = Object.fromEntries(dimensioni.map(d => [d, { presente: 0, potenziare: 0 }]));

  records.forEach(risposte => {
    Object.entries(risposte).forEach(([k, v]) => {
      const match = k.match(/__([^_]+(?: [^_]+)*)$/);
      if (!match) return;
      const dim = match[1].toLowerCase();
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
