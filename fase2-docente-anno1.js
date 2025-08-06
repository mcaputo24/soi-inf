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

const schede = {
  'Scheda 1 – Mappa di descrizione di sé': ['autoconsapevolezza', 'processo decisionale', 'visione futura', 'organizzazione'],
  'Scheda 2 – Un pensiero sul lavoro': ['autoconsapevolezza', 'conoscenza del mondo del lavoro', 'visione futura', 'organizzazione'],
  'Scheda 3 – Modi di lavorare': ['autoconsapevolezza', 'processo decisionale', 'visione futura', 'organizzazione'],
  'Scheda 4 – Tutte le possibili strade': ['autoconsapevolezza', 'conoscenza del mondo del lavoro', 'processo decisionale', 'visione futura', 'organizzazione']
};

const checkboxCounts = {
    cose: 5,
    dati: 1,
    gente: 3,
    idee: 8
};

const etichette = {
  cognome: "Cognome",
  nome: "Nome",
  classe: "Classe",
  data: "Data compilazione",
  agg1: "Aggettivo 1", agg2: "Aggettivo 2", agg3: "Aggettivo 3", agg4: "Aggettivo 4", agg5: "Aggettivo 5",
  agg6: "Aggettivo 6", agg7: "Aggettivo 7", agg8: "Aggettivo 8", agg9: "Aggettivo 9", agg10: "Aggettivo 10",
  pensiero_lavoro: "Un pensiero sul lavoro",
  cos_e_lavoro: "1) Secondo te, cosa è il lavoro?",
  perche_lavoro: "2) Perché le persone lavorano?",
  senza_lavoro: "3) Se nessuno lavorasse, cosa succederebbe?",
  emozioni_lavoro: "4) Se penso al lavoro, mi sento...",
  scheda3: "Questionario di autovalutazione",
  'gente': "Scheda 3 – Lavorare con la Gente",
  'idee': "Scheda 3 – Lavorare con le Idee",
  'dati': "Scheda 3 – Lavorare con i Dati",
  'cose': "Scheda 3 – Lavorare con le Cose"
  scheda4: "Scheda 4 – Percorsi possibili dopo la scuola",
  
};

const sezioni = {
  'Dati anagrafici': ['cognome', 'nome', 'classe', 'data'],
  'Scheda 1 – Mappa di descrizione di sé': ['agg1','agg2','agg3','agg4','agg5','agg6','agg7','agg8','agg9','agg10'],
  'Scheda 2 – Un pensiero sul lavoro': ['pensiero_lavoro','cos_e_lavoro','perche_lavoro','senza_lavoro','emozioni_lavoro'],
  'Scheda 3 – Modi di lavorare': ['scheda3','gente','idee','dati','cose'],
  'Scheda 4 – Tutte le possibili strade': ['scheda4']
};

const chiaviScheda3 = sezioni['Scheda 3 – Modi di lavorare'];

chiaviScheda3.forEach(chiave => {
    if (checkboxCounts[chiave]) {
        const etichetta = etichette[chiave];
        const numero = checkboxCounts[chiave];
        console.log(`Etichetta: ${etichetta} - Numero: ${numero}`);
    }
});

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

  // Titolo evidenziato
  studentNameTitle.innerHTML = `<span class="student-name">${studentFullName}</span>`;

  const studenteDoc = await getDoc(doc(db, 'fase1-studente-anno1', studentId));

  if (studenteDoc.exists()) {
    const data = studenteDoc.data();

    Object.entries(sezioni).forEach(([titolo, chiavi]) => {
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
    });

    if (data.cyElements) {
      const cyBox = document.createElement('div');
      cyBox.id = 'cy-preview';
      studentAnswers.appendChild(cyBox);

      import('https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.esm.min.js').then(module => {
        const cytoscape = module.default;
        cytoscape({
          container: cyBox,
          elements: data.cyElements,
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
      });
    }
  }

  // Valutazione
  const valutazioneDocRef = doc(db, 'fase2-docente-anno1', studentId);
  const valutazioneSnap = await getDoc(valutazioneDocRef);
  const valutazioni = valutazioneSnap.exists() ? valutazioneSnap.data() : {};

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
