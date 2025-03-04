import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBT3yANkLvpNicR0GIxXsV6kWM62tMeQFQ",
  authDomain: "bet2000-e000a.firebaseapp.com",
  projectId: "bet2000-e000a",
  storageBucket: "bet2000-e000a.appspot.com",
  messagingSenderId: "547808109527",
  appId: "1:547808109527:web:8821956a2edc93a90b2192",
  measurementId: "G-MYWP8TMXH9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function definirResultado(partidoId) {
  const resultado = document.querySelector(`input[name="resultado-partido-${partidoId}"]:checked`).value;
  
  if (!resultado) {
    alert("Por favor, seleccione un resultado");
    return;
  }

  const partidoRef = doc(db, "partidos", partidoId);
  await updateDoc(partidoRef, { resultado });

  alert(`Resultado definido: ${resultado}`);
  validarApuestas(partidoId, resultado);
}

async function validarApuestas(partidoId, resultado) {
  const apuestasRef = collection(db, "apuestas");
  const apuestasSnapshot = await getDocs(apuestasRef);
  
  apuestasSnapshot.forEach(async (doc) => {
    const apuesta = doc.data();
    if (apuesta.partidoId === partidoId && apuesta.equipo === resultado) {
      const usuarioRef = doc(db, "usuarios", apuesta.usuarioId);
      const usuarioDoc = await getDoc(usuarioRef);
      if (usuarioDoc.exists()) {
        const saldoActual = usuarioDoc.data().saldo;
        const nuevoSaldo = saldoActual + (apuesta.monto * apuesta.cuota);
        await updateDoc(usuarioRef, { saldo: nuevoSaldo });
      }
    }
  });
}