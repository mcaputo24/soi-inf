// fase2-docente-anno1.js

function renderMapDataAsGraph(cyElements) {
  const cyBox = document.createElement('div');
  cyBox.id = 'cy-preview';
  cyBox.style.height = '300px';
  cyBox.style.width = '100%';
  cyBox.style.maxWidth = '600px';
  cyBox.style.border = '1px solid #ccc';
  cyBox.style.marginTop = '10px';
  cyBox.style.overflow = 'auto';
  studentAnswers.appendChild(cyBox);

  // ATTENDI che il browser abbia renderizzato la pagina, POI crea la mappa
  requestAnimationFrame(() => {
    import('https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.esm.min.js').then(module => {
      const cytoscape = module.default;
      const cy = cytoscape({
        container: cyBox,
        elements: cyElements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'background-color': '#007bff',
              'color': '#fff',
              'text-valign': 'center',
              'text-halign': 'center',
              'width': 'label',
              'height': 'label',
              'padding': '8px'
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
        // NOTA: 'grid' è un layout molto semplice.
        // Potresti provare 'breadthfirst' o 'circle' per un risultato più leggibile.
        layout: { name: 'breadthfirst', padding: 20 }
      });

      // Adatta lo zoom per vedere tutti gli elementi
      cy.fit();
    });
  });
}

import { db } from './firebase-init.js';
import {
  collection, getDocs, getDoc, doc, setDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const studentList = document.getElementById('student-list');
const studentSelection = document.getElementById('student-selection');
const studentEvaluation = document.getElementById('student-evaluation');
const studentAnswers = document.getElementById('student-answers');
const evaluationForm = document.getElementById('evaluation-form');
const backButton = document.getElementById('back-button');
const studentNameTitle = document.getElementById('student-name-title');

// Etichette leggibili
const etichette = {
  cognome: "Cognome",
  nome: "Nome",
  classe: "Classe",
  data: "Data compilazione",
  agg: "Aggettivi scelti dallo studente",
  cos_e_lavoro: "Secondo te, cos’è il lavoro?",
  perche_lavoro: "Perché le persone lavorano?",
  senza_lavoro: "Cosa succederebbe se nessuno lavorasse?",
  emozioni_lavoro: "Se penso al lavoro, mi sento...",
  scheda3_riflessione: "Riflessione: quale modo di lavorare senti più tuo?",
  'sum-gente': 'Preferenza: Lavorare con la Gente',
  'sum-idee': 'Preferenza: Lavorare con le Idee',
  'sum-dati': 'Preferenza: Lavorare con i Dati',
  'sum-cose': 'Preferenza: Lavorare con le Cose',
  lavori_preferiti: "Quali lavori ti piacerebbe fare da grande?",
  immaginazione_lavoro: "Come ti immagini mentre fai questo lavoro?",
  motivazioni_lavoro: "Perché pensi che questo lavoro faccia per te?",
  obiettivi: "Quali obiettivi o sogni vuoi realizzare con questo lavoro?",
  ispirazioni: "Chi ti ispira o ti ha influenzato?",
  modo_studiare: "Come ti prepari al futuro? Qual è il tuo modo di studiare?"
};

// Sezioni primo anno (solo 4 schede)
const sezioni = {
  'Dati anagrafici': ['cognome', 'nome', 'classe', 'data'],
  'Scheda 1 – Mappa di descrizione di sé': ['agg'],
  'Scheda 2 – Un pensiero sul lavoro': ['cos_e_lavoro','perche_lavoro','senza_lavoro','emozioni_lavoro'],
  'Scheda 3 – Modi di lavorare': ['scheda3_riflessione','sum-gente','sum-idee','sum-dati','sum-cose'],
  'Scheda 4 – Tutte le possibili strade': ['lavori_preferiti','immaginazione_lavoro','motivazioni_lavoro','obiettivi','ispirazioni','modo_studiare']
};

// Dimensioni da valutare (solo Schede 1-4)
const schede = {
  'Scheda 1 – Mappa di descrizione di sé': ['autoconsapevolezza', 'processo decisionale', 'visione futura', 'organizzazione'],
  'Scheda 2 – Un pensiero sul lavoro': ['autoconsapevolezza', 'conoscenza del mondo del lavoro', 'visione futura', 'organizzazione'],
  'Scheda 3 – Modi di lavorare': ['autoconsapevolezza', 'processo decisionale', 'visione futura', 'organizzazione'],
  'Scheda 4 – Tutte le possibili strade': ['autoconsapevolezza', 'conoscenza del mondo del lavoro', 'processo decisionale', 'visione futura', 'organizzazione']
};

async function loadStudentList() {
  const querySnapshot = await getDocs(collection(db, 'fase1-studente-anno1'));
  const students = [];

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.cognome && data.nome) {
      students.push({
        id: docSnap.id,
        nome: data.nome,
        cognome: data.cognome,
        label: data.cognome + ' ' + data.nome
      });
    }
  });

  students.sort((a, b) => a.label.localeCompare(b.label));
  students.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s.label;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      loadStudentDetail(s.id, s.label);
    });
    studentList.appendChild(li);
  });
}

async function loadStudentDetail(studentId, studentFullName) {
  studentSelection.style.display = 'none';
  studentEvaluation.style.display = 'block';
  evaluationForm.innerHTML = '';
  studentAnswers.innerHTML = '';

  // Titolo con nome studente
  studentNameTitle.innerHTML = `<span class="student-name">${studentFullName}</span>`;

  const studenteDoc = await getDoc(doc(db, 'fase1-studente-anno1', studentId));

  if (studenteDoc.exists()) {
    const data = studenteDoc.data();

    Object.entries(sezioni).forEach(([titolo, chiavi]) => {
      const risposte = chiavi.map(k => data[k]).filter(Boolean);
      if (risposte.length === 0 && !(titolo === 'Scheda 1 – Mappa di descrizione di sé' && data.cyElements)) return;

      const section = document.createElement('div');
      section.className = 'card';
      const h4 = document.createElement('h4');
      h4.textContent = titolo;
      section.appendChild(h4);

      chiavi.forEach(k => {
        if (data[k]) {
          const p = document.createElement('p');
          p.innerHTML = `<strong>${etichette[k] || k}:</strong> ${data[k]}`;
          section.appendChild(p);
        }
      });

      studentAnswers.appendChild(section);

      // Mostra mappa concettuale se disponibile
      if (titolo === 'Scheda 1 – Mappa di descrizione di sé' && data.cyElements) {
        renderMapDataAsGraph(data.cyElements);
      }
    });
  }

  // Recupera valutazioni già salvate
  const valutazioneDocRef = doc(db, 'fase2-docente-anno1', studentId);
  const valutazioneSnap = await getDoc(valutazioneDocRef);
  const valutazioni = valutazioneSnap.exists() ? valutazioneSnap.data() : {};

  // Form valutazione docente
  Object.entries(schede).forEach(([schedaTitolo, dimensioni]) => {
    const card = document.createElement('div');
    card.className = 'card';
    const h3 = document.createElement('h3');
    h3.textContent = schedaTitolo;
    card.appendChild(h3);

    dimensioni.forEach(dim => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '12px';

      const label = document.createElement('label');
      label.textContent = dim.charAt(0).toUpperCase() + dim.slice(1);
      label.style.display = 'block';

      const nameKey = `${schedaTitolo}__${dim}`;

      const presente = document.createElement('input');
      presente.type = 'radio';
      presente.name = nameKey;
      presente.value = 'presente';
      if (valutazioni[nameKey] === 'presente') presente.checked = true;

      const potenziare = document.createElement('input');
      potenziare.type = 'radio';
      potenziare.name = nameKey;
      potenziare.value = 'da potenziare';
      if (valutazioni[nameKey] === 'da potenziare') potenziare.checked = true;

      wrapper.appendChild(label);
      wrapper.appendChild(presente);
      wrapper.appendChild(document.createTextNode(' Presente '));
      wrapper.appendChild(potenziare);
      wrapper.appendChild(document.createTextNode(' Da potenziare '));
      card.appendChild(wrapper);
    });

    evaluationForm.appendChild(card);
  });

  // Tabella riepilogo dimensioni
  const dimensioniTotali = { autoconsapevolezza:0,'conoscenza del mondo del lavoro':0,'processo decisionale':0,'visione futura':0,organizzazione:0 };
  const dimensioniPresenti = { autoconsapevolezza:0,'conoscenza del mondo del lavoro':0,'processo decisionale':0,'visione futura':0,organizzazione:0 };

  Object.entries(valutazioni).forEach(([chiave, valore]) => {
    const match = chiave.match(/__([^_]+(?: [^_]+)*)$/);
    if (!match) return;
    const dimensione = match[1].toLowerCase();
    if (!(dimensione in dimensioniTotali)) return;
    dimensioniTotali[dimensione]++;
    if (valore === 'presente') dimensioniPresenti[dimensione]++;
  });

  const summaryCard = document.createElement('div');
  summaryCard.className = 'card';
  summaryCard.innerHTML = `<h3>Riepilogo per dimensione</h3>
    <table class="summary-table" style="width:100%; border-collapse:collapse; margin-top:10px;">
      <thead>
        <tr>
          <th>Dimensione</th><th>Presente</th><th>Da potenziare</th><th>Risultato</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(dimensioniTotali).map(dim => {
          const presenti = dimensioniPresenti[dim];
          const totali = dimensioniTotali[dim];
          const potenziare = totali - presenti;
          const risultato = (presenti > potenziare) ? 'PRESENTE' : 'DA POTENZIARE';
          return `
            <tr>
              <td>${dim.charAt(0).toUpperCase() + dim.slice(1)}</td>
              <td>${presenti} / ${totali}</td>
              <td>${potenziare} / ${totali}</td>
              <td><strong>${risultato}</strong></td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  evaluationForm.appendChild(summaryCard);

  // Pulsante salva
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Salva valutazione';
  saveBtn.type = 'submit';
  evaluationForm.appendChild(saveBtn);

  evaluationForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(evaluationForm).entries());
    await setDoc(valutazioneDocRef, data);
    alert('Valutazione salvata');
  };
}

backButton.addEventListener('click', (e) => {
  e.preventDefault();
  studentSelection.style.display = 'block';
  studentEvaluation.style.display = 'none';
  evaluationForm.innerHTML = '';
  studentAnswers.innerHTML = '';
});

loadStudentList();
