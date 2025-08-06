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
  'Scheda 1 – Mappa di descrizione di sé': [
    'autoconsapevolezza',
    'processo decisionale',
    'visione futura',
    'organizzazione'
  ],
  'Scheda 2 – Un pensiero sul lavoro': [
    'autoconsapevolezza',
    'conoscenza del mondo del lavoro',
    'visione futura',
    'organizzazione'
  ],
  'Scheda 3 – Modi di lavorare': [
    'autoconsapevolezza',
    'processo decisionale',
    'visione futura',
    'organizzazione'
  ],
  'Scheda 4 – Tutte le possibili strade': [
    'autoconsapevolezza',
    'conoscenza del mondo del lavoro',
    'processo decisionale',
    'visione futura',
    'organizzazione'
  ]
};

// Mostra elenco studenti
async function loadStudentList() {
  const querySnapshot = await getDocs(collection(db, 'fase1-studente-anno1'));
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement('li');
    li.textContent = data.nome || 'Studente senza nome';
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      loadStudentDetail(docSnap.id, data.nome || 'Studente');
    });
    studentList.appendChild(li);
  });
}

// Mostra risposte e form valutazione
async function loadStudentDetail(studentId, studentName) {
  studentSelection.style.display = 'none';
  studentEvaluation.style.display = 'block';
  studentNameTitle.textContent = studentName;

  // Risposte studente in ordine leggibile
  const studenteDoc = await getDoc(doc(db, 'fase1-studente-anno1', studentId));
  studentAnswers.innerHTML = '';
  if (studenteDoc.exists()) {
    const data = studenteDoc.data();
    const orderedKeys = Object.keys(data).filter(k => typeof data[k] === 'string').sort();
    orderedKeys.forEach(key => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${key}:</strong> ${data[key]}`;
      studentAnswers.appendChild(p);
    });
  }

  // Carica valutazioni esistenti
  const valutazioneDocRef = doc(db, 'fase2-docente-anno1', studentId);
  const valutazioneSnap = await getDoc(valutazioneDocRef);
  const valutazioni = valutazioneSnap.exists() ? valutazioneSnap.data() : {};

  // Crea form di valutazione diviso per schede
  evaluationForm.innerHTML = '';
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

      const presente = document.createElement('input');
      presente.type = 'radio';
      presente.name = `${schedaTitolo}__${dim}`;
      presente.value = 'presente';
      if (valutazioni[`${schedaTitolo}__${dim}`] === 'presente') presente.checked = true;

      const potenziare = document.createElement('input');
      potenziare.type = 'radio';
      potenziare.name = `${schedaTitolo}__${dim}`;
      potenziare.value = 'da potenziare';
      if (valutazioni[`${schedaTitolo}__${dim}`] === 'da potenziare') potenziare.checked = true;

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
