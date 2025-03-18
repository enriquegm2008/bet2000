import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBT3yANkLvpNicR0GIxXsV6kWM62tMeQFQ",
  authDomain: "bet2000-e000a.firebaseapp.com",
  projectId: "bet2000-e000a",
  storageBucket: "bet2000-e000a.appspot.com",
  messagingSenderId: "547808109527",
  appId: "1:547808109527:web:8821956a2edc93a90b2192",
  measurementId: "G-MYWP8TMXH9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
  } else {
    alert("Debes iniciar sesión para crear un partido.");
    window.location.href = "../iniciar-sesion.html";
  }
});

// Evento para el formulario de crear un nuevo partido
document.getElementById("form-nuevo-partido").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (user) {
    await crearPartido();
  } else {
    alert("Debes iniciar sesión para crear un partido.");
    window.location.href = "../iniciar-sesion.html";
  }
});

document.getElementById("ambos-marcan").addEventListener("change", function() {
  const isChecked = this.checked;
  document.getElementById("cuotaSi").disabled = !isChecked;
  document.getElementById("cuotaNo").disabled = !isChecked;
});

async function crearPartido() {
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const equipo1 = document.getElementById("equipo1").value;
  const equipo2 = document.getElementById("equipo2").value;
  const cuota1 = parseFloat(document.getElementById("cuota1").value);
  const cuotaEmpate = parseFloat(document.getElementById("cuotaEmpate").value);
  const cuota2 = parseFloat(document.getElementById("cuota2").value);

  if (!fecha || !hora || !equipo1 || !equipo2 || isNaN(cuota1) || isNaN(cuotaEmpate) || isNaN(cuota2)) {
    alert("Por favor, completa todos los campos del formulario.");
    return;
  }

  const apuestasComunes = {};

  const ambosMarcanChecked = document.getElementById("ambos-marcan").checked;
  if (ambosMarcanChecked) {
    const cuotaSi = parseFloat(document.getElementById("cuotaSi").value);
    const cuotaNo = parseFloat(document.getElementById("cuotaNo").value);
    if (!isNaN(cuotaSi) && !isNaN(cuotaNo)) {
      apuestasComunes.ambosMarcan = { si: cuotaSi, no: cuotaNo };
    }
  }

  try {
    const nuevoPartidoRef = doc(collection(db, "partidos"));
    await setDoc(nuevoPartidoRef, {
      fecha,
      hora,
      equipo1,
      equipo2,
      cuotas: [cuota1, cuotaEmpate, cuota2],
      apuestasComunes,
      resultado: null
    });

    alert("Partido creado con éxito");
    document.getElementById("form-nuevo-partido").reset();
    document.getElementById("cuotaSi").disabled = true;
    document.getElementById("cuotaNo").disabled = true;
  } catch (error) {
    console.error("Error al crear el partido:", error);
    alert("Hubo un problema al crear el partido. Por favor, inténtalo de nuevo.");
  }
}

window.toggleSection = function (sectionId, element) {
  const sections = document.querySelectorAll('.collapsible');
  const headers = document.querySelectorAll('.form-group h3');
  sections.forEach(section => {
    if (section.id !== sectionId) {
      section.style.display = 'none';
    }
  });
  headers.forEach(header => {
    if (header !== element) {
      header.classList.remove('active');
    }
  });
  const section = document.getElementById(sectionId);
  section.style.display = section.style.display === 'block' ? 'none' : 'block';
  element.classList.toggle('active', section.style.display === 'block');
};