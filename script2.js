// ==========================
// script.js (versione pulita)
// ==========================

// Inizializzazione Firestore
import { db } from './firebase-init.js';
import {
  collection, doc, setDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

// -------------------------------------------
// Conteggio dinamico checkbox (Scheda 3)
// -------------------------------------------
const categorie = {
  gente: [
    'Nelle interrogazioni orali ti esprimi con disinvoltura',
    'A scuola, ti piace lavorare in gruppo',
    'Non resisti a lungo in un posto in cui non puoi parlare',
    'Tutti ti dicono che sei garbato e cordiale',
    "Vai d'accordo con tutti, anche con le persone che hai appena conosciuto",
    'Ti capita spesso di persuadere gli altri a fare ciò che vuoi tu',
    'Ammiri molto le persone che aiutano la gente che ha bisogno',
    'Ti capita spesso di aiutare qualche compagno in difficoltà',
    'Sei disponibile ad ascoltare le persone che ti parlano dei loro problemi',
    'Ti piacerebbe svolgere un servizio volontario per aiutare delle persone in difficoltà'
  ],
  dati: [
    'Ti piace fare i calcoli di matematica',
    'Sei capace di seguire con precisione delle istruzioni, anche lunghe e complesse',
    'Non sopporti il disordine e la confusione',
    'Ti piace organizzare bene le tue attività',
    'Ti piace costruire grafici e diagrammi',
    'Quando devi ricordare delle informazioni, le organizzi con degli schemi, degli elenchi...',
    'A scuola i professori ti affidano volentieri degli incarichi che richiedono attenzione e precisione',
    'Per presentare un compito ordinato sei disposto a rifarlo più volte',
    'Hai buone doti di osservazione e ricordi facilmente ciò che hai osservato',
    'Sei costante nel dedicarti agli impegni che ti assumi'
  ],
  idee: [
    "Ti piace studiare e non ti spaventa l'idea di studiare ancora per parecchi anni",
    'Ti piace leggere',
    'Ti piace discutere di problemi sociali o religiosi o politici o scientifici',
    "C'è un argomento culturale che ti interessa in modo particolare e che approfondisci in modo autonomo",
    'Non ti capita quasi mai di pensare che certe materie che si studiano a scuola non servono a niente',
    'Ti piacciono gli esercizi che mettono alla prova la tua logica',
    'Hai buona memoria',
    'Qualche volta segui alla televisione un programma culturale (un documentario, un dibattito...)',
    'Hai il gusto della ricerca; consulti per conto tuo libri e/o Wikipedia, Google, ChatGPT',
    'Per capire idee e concetti astratti non hai sempre bisogno che ti facciano degli esempi concreti'
  ],
  cose: [
    'Riesci bene nei piccoli lavori manuali',
    'Ti piace costruire degli oggetti col legno o con altro materiale',
    "Segui con precisione i consigli dell'insegnante di Educazione Tecnica quando ti aiuta a costruire qualcosa",
    'Ti piace osservare gli artigiani mentre lavorano',
    'Ti piace scoprire come funzionano i meccanismi di certi oggetti',
    'Se stai a lungo seduto o fermo diventi nervoso',
    'Sei affascinato da ogni tipo di macchina',
    'Sai inventare delle soluzioni per certi problemi pratici che si presentano a casa o a scuola',
    'Alla televisione segui i programmi che illustrano i progressi tecnologici',
    'Ami la natura e ti piacerebbe lavorare con le piante o gli animali'
  ]
};

window.categorie = categorie;

// -------------------------------------
// Utility: recupero/creazione studentId
// -------------------------------------
function getResumeStudentId() {
  const hash = window.location.hash || '';
  const parts = hash.split('/');
  const idx = parts.findIndex(p => p === 'continua'); // URL tipo #/studente/continua/<id>
  if (idx !== -1 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
  return null;
}

const studentId =
  getResumeStudentId() ||
  localStorage.getItem('studentId') ||
  (window.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()));

localStorage.setItem('studentId', studentId);

// Genera link di ripresa
const resumeLink = `${window.location.origin}${window.location.pathname}#/continua/${encodeURIComponent(studentId)}`;

// Mostra il link di ripresa nella card
const recoveryEl = document.getElementById("recovery-url");
if (recoveryEl) {
  recoveryEl.textContent = resumeLink;
  recoveryEl.href = resumeLink;
}

// Salvataggio asincrono, non blocca il resto
(async () => {
  try {
    await setDoc(doc(db, 'resumeLinks', studentId), {
      studentId,
      link: resumeLink,
      createdAt: new Date()
    }, { merge: true });
    console.log("Link di ripresa salvato:", resumeLink);
  } catch (err) {
    console.error("Errore salvataggio link di ripresa:", err);
  }
})();

const checkboxArea = document.getElementById('checkbox-area');
const sumFields = {
  gente: document.getElementById('sum-gente'),
  idee: document.getElementById('sum-idee'),
  dati: document.getElementById('sum-dati'),
  cose: document.getElementById('sum-cose')
};

if (checkboxArea) {
  const container = document.createElement('div');
  container.className = 'checkbox-columns';

  Object.entries(categorie).forEach(([cat, frasi]) => {
    const column = document.createElement('div');
    column.className = 'checkbox-column';
    const heading = document.createElement('h3');
    heading.textContent = cat.toUpperCase();
    heading.style.marginTop = '0';
    column.appendChild(heading);

    frasi.forEach((testo, index) => {
      const id = `${cat}-${index}`;
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.dataset.cat = cat;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + testo));
      column.appendChild(label);
    });
    container.appendChild(column);
  });

  checkboxArea.appendChild(container);

  checkboxArea.addEventListener('change', () => {
    const counts = { gente: 0, idee: 0, dati: 0, cose: 0 };
    checkboxArea.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.checked) counts[cb.dataset.cat]++;
    });
    Object.entries(counts).forEach(([cat, val]) => (sumFields[cat].textContent = val));
  });
}

// -------------------------------------------
// Mappa concettuale (Cytoscape)
// -------------------------------------------
function initializeConceptMap() {
  if (window.conceptMapInitialized || !document.getElementById('cy')) return;
  window.conceptMapInitialized = true;

  const cy = window.cytoscape({
    container: document.getElementById('cy'),
    elements: [
      {
        data: { id: 'io_sono', label: 'IO SONO' },
        position: { x: 300, y: 200 },
        locked: true,
        classes: 'io-sono'
      }
    ],
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'center',
          'color': '#fff',
          'text-outline-width': 2,
          'background-color': '#888',
          'width': 'label',
          'height': 'label',
          'padding': '10px',
          'shape': 'round-rectangle',
          'text-wrap': 'wrap',
          'text-max-width': '140px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      },
      { selector: '.io-sono', style: { 'background-color': '#005a87', 'text-outline-color': '#005a87' } },
      { selector: '.aggettivo', style: { 'background-color': '#c15c2d', 'text-outline-color': '#c15c2d' } },
      { selector: '.attivita', style: { 'background-color': '#3a7d44', 'text-outline-color': '#3a7d44' } },
      { selector: '.contesto', style: { 'background-color': '#5bc0de', 'text-outline-color': '#5bc0de', 'color': '#000' } },
      { selector: ':selected', style: { 'border-width': 3, 'border-color': '#DAA520' } }
    ],
    layout: { name: 'preset' }
  });

  const controlsContent = document.getElementById('controls-content');
  let selectedNode = null;

  function renderBaseControls() {
    selectedNode = null;
    cy.elements().unselect();
    controlsContent.innerHTML = `
      <div class="form-group">
        <label for="new-aggettivo">Aggiungi un aggettivo:</label>
        <input type="text" id="new-aggettivo" placeholder="Es. Creativo">
      </div>
      <button type="button" id="add-aggettivo-btn">+ Aggiungi Aggettivo</button>
    `;
    document.getElementById('add-aggettivo-btn').addEventListener('click', addAggettivoNode);
  }

  function renderDetailControls(node) {
    selectedNode = node;
    const deleteButtonText = '❌ Elimina questo nodo';
    controlsContent.innerHTML = `
      <h4>Dettagli per: "${node.data('label')}"</h4>
      <div id="detail-actions">
        <p>Cosa vuoi collegare a questo aggettivo?</p>
        <button type="button" id="show-attivita-input">+ Aggiungi Attività</button>
        <button type="button" id="show-contesto-input">+ Aggiungi Contesto</button>
      </div>
      <hr>
      <button type="button" id="delete-node-btn" class="delete-btn">${deleteButtonText}</button>
      <button type="button" id="back-to-base-btn">Annulla</button>
    `;

    document.getElementById('show-attivita-input')?.addEventListener('click', () => showDetailInput('attivita'));
    document.getElementById('show-contesto-input')?.addEventListener('click', () => showDetailInput('contesto'));
    document.getElementById('delete-node-btn').addEventListener('click', deleteSelectedNode);
    document.getElementById('back-to-base-btn').addEventListener('click', renderBaseControls);
  }

  function showDetailInput(type) {
    const typeText = type === 'attivita' ? "un'attività" : 'un contesto';
    controlsContent.innerHTML = `
      <h4>Aggiungi ${typeText}</h4>
      <div class="form-group">
        <label for="new-detail-text">Testo:</label>
        <input type="text" id="new-detail-text" placeholder="Es. Suono la chitarra">
      </div>
      <button type="button" id="confirm-detail-btn">Conferma</button>
      <button type="button" id="cancel-detail-btn">Annulla</button>
    `;
    document.getElementById('confirm-detail-btn').addEventListener('click', () => addDetailNode(type));
    document.getElementById('cancel-detail-btn').addEventListener('click', () => renderDetailControls(selectedNode));
  }

  function deleteSelectedNode() {
    if (selectedNode) {
      const children = selectedNode.outgoers('node');
      selectedNode.union(children).remove();
      renderBaseControls();
    }
  }

  function addAggettivoNode() {
    const input = document.getElementById('new-aggettivo');
    const label = input.value.trim();
    if (label) {
      const newNodeId = `aggettivo_${Date.now()}`;
      cy.add([
        { group: 'nodes', data: { id: newNodeId, label: label }, classes: 'aggettivo' },
        { group: 'edges', data: { source: 'io_sono', target: newNodeId } }
      ]);
      cy.layout({ name: 'cose', animate: true, padding: 30 }).run();
      input.value = '';
    }
  }

  function addDetailNode(type) {
    const input = document.getElementById('new-detail-text');
    const label = input.value.trim();
    if (label && selectedNode) {
      const newNodeId = `${type}_${Date.now()}`;
      cy.add([
        { group: 'nodes', data: { id: newNodeId, label: label }, classes: type },
        { group: 'edges', data: { source: selectedNode.id(), target: newNodeId } }
      ]);
      cy.layout({ name: 'cose', animate: true, padding: 30 }).run();
      renderDetailControls(selectedNode);
    }
  }

  cy.on('tap', 'node', function (evt) {
    const node = evt.target;
    if (node.id() !== 'io_sono') {
      renderDetailControls(node);
    }
  });

  renderBaseControls();
  window.cyInstance = cy;
}

// --------------------------
// SALVATAGGIO e PDF separati
// --------------------------
const saveBtn = document.getElementById('save-btn');
const pdfBtn = document.getElementById('pdf-btn');

// Funzione per SALVARE SOLO su Firebase
async function salvaSoloFirebase() {
  const form = document.querySelector('form');
  const data = Object.fromEntries(new FormData(form).entries());

// --- Raccolta Scheda 5 ---
const statiSelezionati = Array.from(
  form.querySelectorAll('input[name="s5_stato[]"]:checked')
).map(cb => cb.value);

const scheda5 = {
  stati: statiSelezionati,
  spiegazioni: {
    disinteressato: form.querySelector('[name="s5_disinteressato_spieg"]')?.value || '',
    curioso: form.querySelector('[name="s5_curioso_spieg"]')?.value || '',
    sicuro: form.querySelector('[name="s5_sicuro_spieg"]')?.value || '',
    confuso: form.querySelector('[name="s5_confuso_spieg"]')?.value || '',
    tranquillo: form.querySelector('[name="s5_tranquillo_spieg"]')?.value || '',
    supportato: form.querySelector('[name="s5_supportato_spieg"]')?.value || ''
  },
  racconto_finale: form.querySelector('[name="s5_racconto_finale"]')?.value || ''
};

  const checkboxCounts = {
    gente: parseInt(sumFields.gente.textContent) || 0,
    idee: parseInt(sumFields.idee.textContent) || 0,
    dati: parseInt(sumFields.dati.textContent) || 0,
    cose: parseInt(sumFields.cose.textContent) || 0
  };

  const edgesForDB = [];
  let cyElements = [];

  if (window.conceptMapInitialized && window.cyInstance) {
    const cy = window.cyInstance;
    cy.edges().forEach(edge => {
      const src = cy.getElementById(edge.data('source')).data('label');
      const dst = cy.getElementById(edge.data('target')).data('label');
      edgesForDB.push({ from: src, to: dst });
    });
    cyElements = cy.elements().jsons();
  }

  try {
    const payload = {
      ...data,
      scheda5,
      checkboxCounts,
      conceptMap: edgesForDB,
      cyElements,
      timestamp: new Date()
    };

    await setDoc(doc(db, 'fase1-studente-anno2', studentId), payload, { merge: true });
    console.log('Dati salvati per studentId:', studentId);
    showSaveMessage();
  } catch (e) {
    console.error('Errore salvataggio Firebase:', e);
    alert("❌ Errore durante il salvataggio!");
  }
}

// Funzione per GENERARE SOLO il PDF
function generaSoloPDF() {
  const form = document.querySelector('form');
  const data = Object.fromEntries(new FormData(form).entries());

  const checkboxCounts = {
    gente: parseInt(sumFields.gente.textContent) || 0,
    idee: parseInt(sumFields.idee.textContent) || 0,
    dati: parseInt(sumFields.dati.textContent) || 0,
    cose: parseInt(sumFields.cose.textContent) || 0
  };

  const edgesForPDF = [];
  if (window.conceptMapInitialized && window.cyInstance) {
    const cy = window.cyInstance;
    cy.edges().forEach(edge => {
      const src = cy.getElementById(edge.data('source')).data('label');
      const dst = cy.getElementById(edge.data('target')).data('label');
      edgesForPDF.push(`${src} → ${dst}`);
    });
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let y = 10;
  pdf.setFontSize(12);

  for (const [key, value] of Object.entries(data)) {
    pdf.text(`${key}: ${value}`, 10, y);
    y += 8;
  }
  pdf.text('Risposte checkbox:', 10, y); y += 8;
  for (const [cat, val] of Object.entries(checkboxCounts)) {
    pdf.text(`${cat}: ${val}`, 10, y);
    y += 8;
  }
  if (edgesForPDF.length > 0) {
    pdf.text('Mappa Concettuale:', 10, y); y += 8;
    edgesForPDF.forEach(riga => { pdf.text('- ' + riga, 10, y); y += 8; });
  }

  pdf.save('questionario_fase1_anno1.pdf');
}

// --- Listener pulsanti ---
if (saveBtn) saveBtn.addEventListener('click', salvaSoloFirebase);
// Pulsante PDF (versione con paginazione CORRETTA)
if (pdfBtn) {
  pdfBtn.addEventListener('click', (event) => {
    event.preventDefault();

    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      alert("⚠️ Errore: Le librerie per creare il PDF non sono state caricate correttamente.");
      return;
    }

    // 1. Mostra un indicatore di caricamento
    document.body.style.cursor = 'wait';
    pdfBtn.textContent = 'Creazione PDF in corso...';
    pdfBtn.disabled = true;

    // 2. Opzioni per html2canvas
    const options = {
      scale: 1,
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    };

    window.scrollTo(0, 0);

    html2canvas(document.body, options).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let position = 0;
      let heightLeft = pdfHeight;

      // 3. Aggiungi la prima pagina
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // 4. Aggiungi le pagine successive (LOGICA CORRETTA)
      while (heightLeft > 0) {
        position -= pageHeight; // Sposta la "visuale" dell'immagine in alto di una pagina
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('questionario_completo.pdf');

    }).catch(error => {
      alert("❌ Si è verificato un errore durante la creazione del PDF.");
      console.error("Errore durante la generazione del PDF:", error);
    }).finally(() => {
      // 5. Ripristina il pulsante e il cursore
      document.body.style.cursor = 'default';
      pdfBtn.textContent = 'Scarica PDF';
      pdfBtn.disabled = false;
    });
  });
}
// AGGIUNGI QUI: Il listener per il pulsante del menu
const menuBtn = document.getElementById('menu-btn');
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    window.location.href = "./index.html";
  });
}


// --------------------------
// Preload dati studente (con DOMContentLoaded)
// --------------------------
function avviaPreloadQuandoDOMPronto(id) {
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const snap = await getDoc(doc(db, 'fase1-studente-anno2', id));
      if (!snap.exists()) return;
      const saved = snap.data();

// --- Ripristino Scheda 5 ---
if (saved.scheda5) {
  // checkbox
  if (Array.isArray(saved.scheda5.stati)) {
    saved.scheda5.stati.forEach(val => {
      const cb = form.querySelector(`input[name="s5_stato[]"][value="${val}"]`);
      if (cb) cb.checked = true;
    });
  }
  // textarea spiegazioni
  if (saved.scheda5.spiegazioni) {
    form.querySelector('[name="s5_disinteressato_spieg"]').value = saved.scheda5.spiegazioni.disinteressato || '';
    form.querySelector('[name="s5_curioso_spieg"]').value = saved.scheda5.spiegazioni.curioso || '';
    form.querySelector('[name="s5_sicuro_spieg"]').value = saved.scheda5.spiegazioni.sicuro || '';
    form.querySelector('[name="s5_confuso_spieg"]').value = saved.scheda5.spiegazioni.confuso || '';
    form.querySelector('[name="s5_tranquillo_spieg"]').value = saved.scheda5.spiegazioni.tranquillo || '';
    form.querySelector('[name="s5_supportato_spieg"]').value = saved.scheda5.spiegazioni.supportato || '';
  }
  // racconto finale
  form.querySelector('[name="s5_racconto_finale"]').value = saved.scheda5.racconto_finale || '';
}

      console.log('Dati recuperati da Firebase:', saved);

      // Prefill form (input, textarea, select) — compatibile con tutti i tipi di input
      const form = document.querySelector('form');
      if (form) {

        const fillFields = () => {
          Object.entries(saved).forEach(([k, v]) => {
            const el = form.querySelector(`[name="${k}"]`);
            if (el) {
              if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = Boolean(v);
              } else {
                el.value = v ?? '';
              }
              console.log(`✅ Campo "${k}" valorizzato con:`, v);
            } else {
              console.warn(`⚠️ Campo "${k}" NON trovato nel DOM (retry)`);
            }
          });
        };

        // Primo tentativo dopo 0,3 secondi
        setTimeout(fillFields, 300);

        // Secondo tentativo dopo 1 secondo per eventuali campi renderizzati in ritardo
        setTimeout(fillFields, 1000);
      }

      // ✅ Ripristina conteggi checkbox
      if (saved.checkboxCounts) {
        sumFields.gente.textContent = saved.checkboxCounts.gente ?? 0;
        sumFields.idee.textContent  = saved.checkboxCounts.idee  ?? 0;
        sumFields.dati.textContent  = saved.checkboxCounts.dati  ?? 0;
        sumFields.cose.textContent  = saved.checkboxCounts.cose  ?? 0;

        // Spunta le checkbox in base ai valori salvati
        if (checkboxArea) {
          checkboxArea.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
          });
          Object.keys(saved.checkboxCounts).forEach(cat => {
            const count = saved.checkboxCounts[cat];
            if (count > 0 && categorie[cat]) {
              const boxes = checkboxArea.querySelectorAll(`input[data-cat="${cat}"]`);
              boxes.forEach((box, idx) => {
                if (idx < count) box.checked = true;
              });
            }
          });
        }
      }

      // ✅ Ricostruzione mappa
      if (window.conceptMapInitialized && window.cyInstance) {
        const cy = window.cyInstance;
        cy.elements().not('#io_sono').remove();

        if (Array.isArray(saved.cyElements) && saved.cyElements.length) {
          cy.add(saved.cyElements);
          cy.layout({ name: 'preset' }).run(); // posizioni salvate
        } else if (Array.isArray(saved.conceptMap) && saved.conceptMap.length) {
          const idFromLabel = (label) => 'n_' + label.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w\-]/g, '')
            .slice(0, 40);

          const ensureNode = (label) => {
            if (label.trim().toUpperCase() === 'IO SONO') return cy.$('#io_sono');
            const id = idFromLabel(label);
            let node = cy.$(`#${id}`);
            if (node.empty()) {
              node = cy.add({ group: 'nodes', data: { id, label } });
            }
            return node;
          };

          saved.conceptMap.forEach(({ from, to }) => {
            const src = ensureNode(from);
            const dst = ensureNode(to);
            if (cy.$(`edge[source = "${src.id()}"][target = "${dst.id()}"]`).empty()) {
              cy.add({ group: 'edges', data: { source: src.id(), target: dst.id() } });
            }
          });

          cy.layout({ name: 'cose', animate: true, padding: 30 }).run();
        }
      }

    } catch (err) {
      console.error('Errore caricamento dati studente:', err);
    }
  });
}



function showSaveMessage() {
  const msg = document.createElement('div');
  msg.textContent = "✅ Dati salvati correttamente!";
  msg.style.position = "fixed";
  msg.style.bottom = "20px";
  msg.style.right = "20px";
  msg.style.background = "#4CAF50";
  msg.style.color = "#fff";
  msg.style.padding = "10px 15px";
  msg.style.borderRadius = "5px";
  msg.style.fontSize = "14px";
  msg.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  msg.style.zIndex = "9999";

  // Bottone di chiusura
  const closeBtn = document.createElement("span");
  closeBtn.textContent = " ✖";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.marginLeft = "10px";
  closeBtn.style.fontWeight = "bold";
  closeBtn.onclick = () => msg.remove();

  msg.appendChild(closeBtn);
  document.body.appendChild(msg);
}



// --------------------------
// Avvio
// --------------------------
window.addEventListener('DOMContentLoaded', () => {
  initializeConceptMap();
});

// Aspetta che il DOM sia pronto e poi pre-carica dati
const resumeId = studentId; // abbiamo già deciso l'id in alto
avviaPreloadQuandoDOMPronto(resumeId);


// --- Link di recupero ---
function setRecoveryLink(studentId) {
  const recoveryUrl = `${window.location.origin}${window.location.pathname}?id=${studentId}`;
  const recoveryLinkEl = document.getElementById("recovery-url");
  if (recoveryLinkEl) {
    recoveryLinkEl.textContent = recoveryUrl;
    recoveryLinkEl.href = recoveryUrl;
  }
}

// ESEMPIO: dopo aver creato o recuperato lo studentId al login/avvio
// chiama setRecoveryLink(studentId);
// =================================================================
// Modalità sola lettura (readonly=true nell'URL)
// =================================================================
function attivaSolaLettura() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('readonly') === 'true') {
    // Disabilita tutti gli input, select e textarea
    document.querySelectorAll('input, select, textarea, button').forEach(el => {
      // Non bloccare i pulsanti di navigazione interna se servono (next/prev)
      if (el.type === 'button' || el.type === 'submit') {
        el.style.display = 'none'; // li nascondiamo
      } else {
        el.disabled = true; // disabilitiamo campi compilabili
      }
    });

    // Aggiungi un banner informativo
    const banner = document.createElement('div');
    banner.textContent = "Modalità sola lettura – non è possibile modificare le risposte";
    banner.style.background = "#ffc107";
    banner.style.color = "#000";
    banner.style.padding = "10px";
    banner.style.marginBottom = "15px";
    banner.style.textAlign = "center";
    banner.style.fontWeight = "bold";
    document.body.prepend(banner);
  }
}

// Esegui subito
attivaSolaLettura();
