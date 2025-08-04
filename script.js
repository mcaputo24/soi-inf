// Inizializzazione della mappa con Cytoscape
import cytoscape from 'https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.esm.min.js';
import { db } from './firebase-init.js';
import { jsPDF } from 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.es.min.js';
window.jsPDF = jsPDF;

const cyContainer = document.getElementById('cy');
if (cyContainer) {
  const cy = cytoscape({
    container: cyContainer,
    elements: [],
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': '#007bff',
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#999'
        }
      }
    ],
    layout: { name: 'grid' }
  });

  cy.on('tap', function(event) {
    if (event.target === cy) {
      const id = 'n' + cy.elements().length;
      const label = prompt('Etichetta del nodo?');
      if (label) {
        cy.add({ group: 'nodes', data: { id: id, label: label }, position: event.position });
      }
    } else if (event.target.isNode()) {
      const selected = cy.$(':selected');
      if (selected.length === 1 && selected[0] !== event.target) {
        cy.add({ group: 'edges', data: { source: selected[0].id(), target: event.target.id() } });
      }
      event.target.select();
    }
  });
}

// Conteggio dinamico checkbox Scheda 3
const categorie = {
  gente: [
    'Ti piace lavorare in gruppo',
    'Aiuti spesso i compagni in difficoltà',
    'Ti esprimi con disinvoltura con gli altri'
  ],
  idee: [
    'Ti piace leggere',
    'Ti piacciono le discussioni su temi importanti',
    'Hai il gusto della ricerca'
  ],
  dati: [
    'Ti piacciono i calcoli',
    'Ti piace costruire grafici',
    'Sei molto ordinato'
  ],
  cose: [
    'Ti piacciono i lavori manuali',
    'Ti piace costruire oggetti',
    'Ami la natura e il lavoro all\'aperto'
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
  Object.entries(categorie).forEach(([cat, frasi]) => {
    frasi.forEach((testo, index) => {
      const id = `${cat}-${index}`;
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.dataset.cat = cat;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + testo));
      checkboxArea.appendChild(label);
      checkboxArea.appendChild(document.createElement('br'));
    });
  });

  checkboxArea.addEventListener('change', () => {
    const counts = { gente: 0, idee: 0, dati: 0, cose: 0 };
    checkboxArea.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.checked) counts[cb.dataset.cat]++;
    });
    Object.entries(counts).forEach(([cat, val]) => sumFields[cat].textContent = val);
  });
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

    // Salva su Firebase
    try {
      const docRef = await db.collection('fase1-studente-anno1').add({
        ...data,
        checkboxCounts,
        timestamp: new Date()
      });
      console.log('Dati salvati con ID:', docRef.id);
    } catch (e) {
      console.error('Errore salvataggio Firebase:', e);
    }

    // Genera PDF
    const pdf = new window.jsPDF();
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
