function renderMapDataAsGraph(cyElements, parentElement) {
  const cyBox = document.createElement('div');
  cyBox.id = 'cy-preview';
  cyBox.style.height = '300px';
  cyBox.style.width = '100%';
  cyBox.style.maxWidth = '600px';
  cyBox.style.border = '1px solid #ccc';
  cyBox.style.marginTop = '10px';
  
  if (parentElement) {
    parentElement.appendChild(cyBox);
  } else {
    studentAnswers.appendChild(cyBox);
  }

  requestAnimationFrame(() => {
    import('https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.esm.min.js').then(module => {
      const cytoscape = module.default;
      const cy = cytoscape({
        container: cyBox,
        elements: cyElements,
        style: [
          { selector: 'node', style: { 'label': 'data(label)', 'background-color': '#007bff', 'color': '#fff', 'text-valign': 'center', 'text-halign': 'center', 'width': 'label', 'height': 'label', 'padding': '8px' }},
          { selector: 'edge', style: { 'width': 2, 'line-color': '#999' }}
        ],
        layout: { name: 'breadthfirst', padding: 20 }
      });
      cy.fit();
    });
  });
}

import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

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
  scheda1_attivita_preferite: "1) Tra le attività che hai descritto nella mappa, scegli le due che ti piacciono di più e prova a dire perché",
  scheda1_preferenze_scolastiche: "2) E rispetto alla scuola, cosa ti piace? Ci sono materie o argomenti che ti piacciono e che ti piacerebbe approfondire",
  cos_e_lavoro: "Secondo te, cos’è il lavoro?",
  perche_lavoro: "Perché le persone lavorano?",
  senza_lavoro: "Cosa succederebbe se nessuno lavorasse?",
  emozioni_lavoro: "Se penso al lavoro, mi sento...",
  scheda3_riflessione: "Cosa hai capito di te? Quale potrebbe essere la modalità di lavorare migliore per te? (In pratica: come ti piacerebbe lavorare?)",
  'sum-gente': 'Numero di affermazioni → Lavorare con la Gente',
  'sum-idee': 'Numero di affermazioni → Lavorare con le Idee',
  'sum-dati': 'Numero di affermazioni → Lavorare con i Dati',
  'sum-cose': 'Numero di affermazioni → Lavorare con le Cose',
  lavori_preferiti: "Quali lavori ti piacerebbe fare da grande?",
  immaginazione_lavoro: "Come ti immagini mentre fai questo lavoro?",
  motivazioni_lavoro: "Perché pensi che questo lavoro faccia per te?",
  obiettivi: "Quali obiettivi o sogni vuoi realizzare con questo lavoro?",
  ispirazioni: "Chi ti ispira o ti ha influenzato?",
  modo_studiare: "Come ti prepari al futuro? Qual è il tuo modo di studiare?"
};

// Sezioni primo anno
const sezioni = {
  'Dati anagrafici': ['cognome', 'nome', 'classe', 'data'],
  'Scheda 1 – Mappa di descrizione di sé': [
    'agg',
    'scheda1_attivita_preferite',
    'scheda1_preferenze_scolastiche'
  ],
  'Scheda 2 – Un pensiero sul lavoro': [
    'cos_e_lavoro','perche_lavoro','senza_lavoro','emozioni_lavoro'
  ],
  'Scheda 3 – Modi di lavorare': [
    'sum-gente','sum-idee','sum-dati','sum-cose','scheda3_riflessione'
  ],
  'Scheda 4 – Tutte le possibili strade': [
    'lavori_preferiti','immaginazione_lavoro','motivazioni_lavoro',
    'obiettivi','ispirazioni','modo_studiare'
  ]
};

// Dimensioni da valutare
const schede = {
  'Scheda 1 – Mappa di descrizione di sé': ['autoconsapevolezza', 'processo decisionale', 'visione futura', 'organizzazione'],
  'Scheda 2 – Un pensiero sul lavoro': ['autoconsapevolezza', 'conoscenza del mondo del lavoro', 'visione futura', 'organizzazione'],
  'Scheda 3 – Modi di lavorare': ['autoconsapevolezza', 'processo decisionale', 'visione futura', 'organizzazione'],
  'Scheda 4 – Tutte le possibili strade': ['autoconsapevolezza', 'conoscenza del mondo del lavoro', 'processo decisionale', 'visione futura', 'organizzazione']
};

// Sostituisci l'intera funzione loadStudentList con questa

async function loadStudentList() {
  const querySnapshot = await getDocs(collection(db, 'fase1-studente-anno1'));
  const resumeSnapshot = await getDocs(collection(db, 'resumeLinks'));

  // La mappa ora conterrà un oggetto con entrambi i link
  const resumeMap = {};
  resumeSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.studentId) {
      resumeMap[data.studentId] = {
        linkFase1: data.link || null, // Link Fase 1
        linkFase3: data.linkFase3 || null // NUOVO: Link Fase 3
      };
    }
  });

  const students = [];
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.cognome && data.nome) {
      students.push({
        id: docSnap.id,
        nome: data.nome,
        cognome: data.cognome,
        label: data.cognome + ' ' + data.nome,
        // Assegna l'intero oggetto dei link allo studente
        resumeLinks: resumeMap[docSnap.id] || {}
      });
    }
  });

  students.sort((a, b) => a.label.localeCompare(b.label));
  
  studentList.innerHTML = ''; // Pulisce la lista prima di riempirla

  students.forEach(s => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '10px';
    container.style.marginBottom = '10px';

    const btnStud = document.createElement('button');
    btnStud.textContent = s.label;
    btnStud.className = 'button button-primary';
    btnStud.style.flex = '1';
    btnStud.addEventListener('click', () => loadStudentDetail(s.id, s.label));
    container.appendChild(btnStud);

    // Crea il pulsante per il link della Fase 1, se esiste
    if (s.resumeLinks.linkFase1) {
      const linkBtn1 = document.createElement('a');
      linkBtn1.href = s.resumeLinks.linkFase1;
      linkBtn1.textContent = "Link Fase 1";
      linkBtn1.target = "_blank";
      linkBtn1.className = 'button button-success';
      linkBtn1.style.minWidth = "140px";
      container.appendChild(linkBtn1);
    }

    // Crea il pulsante per il link della Fase 3, se esiste
    if (s.resumeLinks.linkFase3) {
      const linkBtn3 = document.createElement('a');
      linkBtn3.href = s.resumeLinks.linkFase3;
      linkBtn3.textContent = "Link Fase 3";
      linkBtn3.target = "_blank";
      linkBtn3.className = 'button button-success';
      linkBtn3.style.minWidth = "140px";
      container.appendChild(linkBtn3);
    }

    studentList.appendChild(container);
  });
}


// =================================================================
// Funzione principale
// =================================================================
async function loadStudentDetail(studentId, studentFullName) {
  studentSelection.style.display = 'none';
  studentEvaluation.style.display = 'block';
  evaluationForm.innerHTML = '';
  studentAnswers.innerHTML = '';

  studentNameTitle.innerHTML = `<span class="student-name">${studentFullName}</span>`;

  const studenteDoc = await getDoc(doc(db, 'fase1-studente-anno1', studentId));

  if (studenteDoc.exists()) {
    const data = studenteDoc.data();

    Object.entries(sezioni).forEach(([titolo, chiavi]) => {
      const hasContent = chiavi.some(k => data[k]) || (titolo === 'Scheda 1 – Mappa di descrizione di sé' && data.cyElements);
      if (!hasContent) return;

      const section = document.createElement('div');
      section.className = 'card';
      const h4 = document.createElement('h4');
      h4.textContent = titolo;
      section.appendChild(h4);

      // Scheda 1 → aggettivi + mappa + domande
      if (titolo === 'Scheda 1 – Mappa di descrizione di sé') {
        const aggettiviTrovati = [];
        for (let i = 1; i <= 10; i++) {
          const key = `agg${i}`;
          if (data[key]) aggettiviTrovati.push(data[key]);
        }
        if (aggettiviTrovati.length > 0) {
          const p = document.createElement('p');
          p.innerHTML = `<strong>${etichette['agg']}:</strong>`;
          section.appendChild(p);
          const ul = document.createElement('ul');
          aggettiviTrovati.forEach(agg => {
            const li = document.createElement('li');
            li.textContent = agg;
            ul.appendChild(li);
          });
          section.appendChild(ul);
        }
        if (data.cyElements) renderMapDataAsGraph(data.cyElements, section);
        chiavi.forEach(k => {
          if (k === 'data' && data[k]) {
  const d = new Date(data[k]);
  const giorno = String(d.getDate()).padStart(2, '0');
  const mese = String(d.getMonth() + 1).padStart(2, '0');
  const anno = d.getFullYear();
  const dataFormattata = `${giorno}/${mese}/${anno}`;
  const p = document.createElement('p');
  p.innerHTML = `<strong>${etichette[k]}:</strong> ${dataFormattata}`;
  section.appendChild(p);
} else {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${etichette[k] || k}:</strong> ${data[k]}`;
  section.appendChild(p);
}
        });

      // Scheda 3 → solo numeri + riflessione
      } else if (titolo === 'Scheda 3 – Modi di lavorare') {
  const aree = [
    { key: 'gente', label: 'Numero di affermazioni → Lavorare con la Gente' },
    { key: 'idee',  label: 'Numero di affermazioni → Lavorare con le Idee' },
    { key: 'dati',  label: 'Numero di affermazioni → Lavorare con i Dati' },
    { key: 'cose',  label: 'Numero di affermazioni → Lavorare con le Cose' }
  ];

  const ul = document.createElement('ul');
  ul.style.listStyleType = 'disc';
  ul.style.paddingLeft = '20px';

  aree.forEach(area => {
    let valore = 0;
    if (data.checkboxCounts && data.checkboxCounts[area.key] !== undefined) {
      valore = data.checkboxCounts[area.key];
    }
    const li = document.createElement('li');
    li.textContent = `${area.label}: ${valore}`;
    ul.appendChild(li);
  });

  section.appendChild(ul);

const viewBtn = document.createElement('button');
  viewBtn.textContent = "Visualizza questionario completo";
  viewBtn.style.marginTop = "10px";
  viewBtn.onclick = () => {
    const url = `fase1-studente-anno1.html?studentId=${studentId}&readonly=true`;
    window.open(url, '_blank');
  };
  section.appendChild(viewBtn);

  if (data.scheda3_riflessione) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${etichette['scheda3_riflessione']}:</strong> ${data.scheda3_riflessione}`;
    section.appendChild(p);
  }


      // Generico
      } else {
        chiavi.forEach(k => {
          if (data[k]) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${etichette[k] || k}:</strong> ${data[k]}`;
            section.appendChild(p);
          }
        });
      }

      studentAnswers.appendChild(section);
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

// Contenitore pulsanti in basso
const actionsDiv = document.createElement('div');
actionsDiv.className = 'form-actions';

// Pulsante Salva
const saveBtn = document.createElement('button');
saveBtn.textContent = 'Salva valutazione';
saveBtn.type = 'button'; // non submit
saveBtn.className = 'button button-success';
saveBtn.addEventListener('click', async () => {
  const data = Object.fromEntries(new FormData(evaluationForm).entries());
  await setDoc(valutazioneDocRef, data);
  alert('Valutazione salvata');
});
actionsDiv.appendChild(saveBtn);

// Pulsante Torna alla Fase 1
const backToFase1Btn = document.createElement('a');
backToFase1Btn.textContent = 'Torna alla Fase 1';
backToFase1Btn.href = 'fase1-docente-anno1.html';
backToFase1Btn.className = 'button button-secondary';
actionsDiv.appendChild(backToFase1Btn);

// Pulsante Menu principale
const menuBtn = document.createElement('a');
menuBtn.textContent = 'Menu principale';
menuBtn.href = 'index.html';
menuBtn.className = 'button button-secondary';
actionsDiv.appendChild(menuBtn);

// Aggiungiamo il contenitore al form
evaluationForm.appendChild(actionsDiv);



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
