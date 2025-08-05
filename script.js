// Inizializzazione della mappa con Cytoscape
import { db } from './firebase-init.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';



// Conteggio dinamico checkbox Scheda 3
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
    Object.entries(counts).forEach(([cat, val]) => sumFields[cat].textContent = val);
  });
}
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

  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    if (node.id() !== 'io_sono') {
      renderDetailControls(node);
    }
  });

  renderBaseControls();
}

// SALVATAGGIO e PDF
const saveBtn = document.getElementById('save-submit-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    const form = document.querySelector('form');
    const data = Object.fromEntries(new FormData(form).entries());

    const checkboxCounts = {
      gente: parseInt(sumFields.gente.textContent),
      idee: parseInt(sumFields.idee.textContent),
      dati: parseInt(sumFields.dati.textContent),
      cose: parseInt(sumFields.cose.textContent)
    };

    // Salva su Firebase con API moderna
    try {
      const docRef = await addDoc(collection(db, 'fase1-studente-anno1'), {
        ...data,
        checkboxCounts,
        timestamp: new Date()
      });
      console.log('Dati salvati con ID:', docRef.id);
    } catch (e) {
      console.error('Errore salvataggio Firebase:', e);
    }

    // Genera PDF usando UMD
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
    pdf.save('questionario_fase1_anno1.pdf');
  });
}
initializeConceptMap();
