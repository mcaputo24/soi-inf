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

// Elenco dimensioni da valutare
const dimensions = [
  'autoconsapevolezza',
  'processo decisionale',
  'visione futura',
  'organizzazione',
  'conoscenza del mondo del lavoro'
];

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

  // Risposte studente
  const studenteDoc = await getDoc(doc(db, 'fase1-studente-anno1', studentId));
  studentAnswers.innerHTML = '';
  if (studenteDoc.exists()) {
    const data = studenteDoc.data();
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${key}:</strong> ${value}`;
        studentAnswers.appendChild(p);
      }
    }
  }

  // Carica valutazioni esistenti
  const valutazioneDocRef = doc(db, 'fase2-docente-anno1', studentId);
  const valutazioneSnap = await getDoc(valutazioneDocRef);
  const valutazioni = valutazioneSnap.exists() ? valutazioneSnap.data() : {};

  // Crea form di valutazione
  evaluationForm.innerHTML = '';
  dimensions.forEach(dim => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '12px';

    const label = document.createElement('label');
    label.textContent = dim.charAt(0).toUpperCase() + dim.slice(1);
    label.style.display = 'block';

    const presente = document.createElement('input');
    presente.type = 'radio';
    presente.name = dim;
    presente.value = 'presente';
    if (valutazioni[dim] === 'presente') presente.checked = true;

    const potenziare = document.createElement('input');
    potenziare.type = 'radio';
    potenziare.name = dim;
    potenziare.value = 'da potenziare';
    if (valutazioni[dim] === 'da potenziare') potenziare.checked = true;

    wrapper.appendChild(label);
    wrapper.appendChild(presente);
    wrapper.appendChild(document.createTextNode(' Presente '));
    wrapper.appendChild(potenziare);
    wrapper.appendChild(document.createTextNode(' Da potenziare '));
    evaluationForm.appendChild(wrapper);
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
