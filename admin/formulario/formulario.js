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
    alert("Debes iniciar sesión para crear un partido o una apuesta.");
    window.location.href = "../iniciar-sesion.html";
  }
});

document.getElementById("submit-button").addEventListener("click", async (event) => {
  event.preventDefault();
  if (user) {
    await guardarDatos();
  } else {
    alert("Debes iniciar sesión para guardar.");
    window.location.href = "../iniciar-sesion.html";
  }
});

document.getElementById("ambos-marcan").addEventListener("change", function() {
  const isChecked = this.checked;
  document.getElementById("cuotaSi").disabled = !isChecked;
  document.getElementById("cuotaNo").disabled = !isChecked;
});

document.getElementById("se-clasificara").addEventListener("change", function() {
  const isChecked = this.checked;
  document.getElementById("cuotaEquipo1").disabled = !isChecked;
  document.getElementById("cuotaEquipo2").disabled = !isChecked;
});

document.getElementById("mas-2-5-goles").addEventListener("change", function() {
  const isChecked = this.checked;
  document.getElementById("cuotaMas").disabled = !isChecked;
  document.getElementById("cuotaMenos").disabled = !isChecked;
});

document.getElementById("corners").addEventListener("change", function() {
  const isChecked = this.checked;
  document.getElementById("cuotaMenos10").disabled = !isChecked;
  document.getElementById("cuotaExactamente10").disabled = !isChecked;
  document.getElementById("cuotaMas10").disabled = !isChecked;
});

async function guardarDatos() {
  const partidoDatos = obtenerDatosPartido();
  const apuestaDatos = obtenerDatosApuesta();

  if (!partidoDatos || !apuestaDatos) {
    alert("Por favor, completa todos los campos del formulario.");
    return;
  }

  try {
    const nuevoPartidoRef = doc(collection(db, "partidos"));
    await setDoc(nuevoPartidoRef, {
      ...partidoDatos,
      resultado: apuestaDatos
    });

    alert("Datos guardados con éxito");
    document.getElementById("form-nuevo-partido").reset();
    document.getElementById("form-nueva-apuesta").reset();
    document.getElementById("cuotaSi").disabled = true;
    document.getElementById("cuotaNo").disabled = true;
    document.getElementById("cuotaEquipo1").disabled = true;
    document.getElementById("cuotaEquipo2").disabled = true;
    document.getElementById("cuotaMas").disabled = true;
    document.getElementById("cuotaMenos").disabled = true;
    document.getElementById("cuotaMenos10").disabled = true;
    document.getElementById("cuotaExactamente10").disabled = true;
    document.getElementById("cuotaMas10").disabled = true;
  } catch (error) {
    console.error("Error al guardar los datos:", error);
    alert("Hubo un problema al guardar los datos. Por favor, inténtalo de nuevo.");
  }
}

function obtenerDatosPartido() {
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const equipo1 = document.getElementById("equipo1").value;
  const equipo2 = document.getElementById("equipo2").value;
  const cuota1 = parseFloat(document.getElementById("cuota1").value);
  const cuotaEmpate = parseFloat(document.getElementById("cuotaEmpate").value);
  const cuota2 = parseFloat(document.getElementById("cuota2").value);

  if (!fecha || !hora || !equipo1 || !equipo2 || isNaN(cuota1) || isNaN(cuotaEmpate) || isNaN(cuota2)) {
    return null;
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

  const seClasificaraChecked = document.getElementById("se-clasificara").checked;
  if (seClasificaraChecked) {
    const cuotaEquipo1 = parseFloat(document.getElementById("cuotaEquipo1").value);
    const cuotaEquipo2 = parseFloat(document.getElementById("cuotaEquipo2").value);
    if (!isNaN(cuotaEquipo1) && !isNaN(cuotaEquipo2)) {
      apuestasComunes.seClasificara = { equipo1: cuotaEquipo1, equipo2: cuotaEquipo2 };
    }
  }

  const mas2_5golesChecked = document.getElementById("mas-2-5-goles").checked;
  if (mas2_5golesChecked) {
    const cuotaMas = parseFloat(document.getElementById("cuotaMas").value);
    const cuotaMenos = parseFloat(document.getElementById("cuotaMenos").value);
    if (!isNaN(cuotaMas) && !isNaN(cuotaMenos)) {
      apuestasComunes.mas2_5goles = { mas: cuotaMas, menos: cuotaMenos };
    }
  }

  const cornersChecked = document.getElementById("corners").checked;
  if (cornersChecked) {
    const cuotaMenos10 = parseFloat(document.getElementById("cuotaMenos10").value);
    const cuotaExactamente10 = parseFloat(document.getElementById("cuotaExactamente10").value);
    const cuotaMas10 = parseFloat(document.getElementById("cuotaMas10").value);
    if (!isNaN(cuotaMenos10) && !isNaN(cuotaExactamente10) && !isNaN(cuotaMas10)) {
      apuestasComunes.corners = { menos10: cuotaMenos10, exactamente10: cuotaExactamente10, mas10: cuotaMas10 };
    }
  }

  return {
    fecha,
    hora,
    equipo1,
    equipo2,
    cuotas: [cuota1, cuotaEmpate, cuota2],
    apuestasComunes
  };
}

function obtenerDatosApuesta() {
  const equipo1Encuentro = parseFloat(document.getElementById("equipo1-encuentro").value);
  const empateEncuentro = parseFloat(document.getElementById("empate-encuentro").value);
  const equipo2Encuentro = parseFloat(document.getElementById("equipo2-encuentro").value);

  const equipo1PrimeraMitad = parseFloat(document.getElementById("equipo1-primera-mitad").value);
  const empatePrimeraMitad = parseFloat(document.getElementById("empate-primera-mitad").value);
  const equipo2PrimeraMitad = parseFloat(document.getElementById("equipo2-primera-mitad").value);

  const equipo1SegundaMitad = parseFloat(document.getElementById("equipo1-segunda-mitad").value);
  const empateSegundaMitad = parseFloat(document.getElementById("empate-segunda-mitad").value);
  const equipo2SegundaMitad = parseFloat(document.getElementById("equipo2-segunda-mitad").value);

  const equipo1DiezMinutos = parseFloat(document.getElementById("equipo1-diez-minutos").value);
  const empateDiezMinutos = parseFloat(document.getElementById("empate-diez-minutos").value);
  const equipo2DiezMinutos = parseFloat(document.getElementById("equipo2-diez-minutos").value);

  if (isNaN(equipo1Encuentro) || isNaN(empateEncuentro) || isNaN(equipo2Encuentro) ||
      isNaN(equipo1PrimeraMitad) || isNaN(empatePrimeraMitad) || isNaN(equipo2PrimeraMitad) ||
      isNaN(equipo1SegundaMitad) || isNaN(empateSegundaMitad) || isNaN(equipo2SegundaMitad) ||
      isNaN(equipo1DiezMinutos) || isNaN(empateDiezMinutos) || isNaN(equipo2DiezMinutos)) {
    return null;
  }

  return {
    encuentro: [equipo1Encuentro, empateEncuentro, equipo2Encuentro],
    primeraMitad: [equipo1PrimeraMitad, empatePrimeraMitad, equipo2PrimeraMitad],
    segundaMitad: [equipo1SegundaMitad, empateSegundaMitad, equipo2SegundaMitad],
    diezMinutos: [equipo1DiezMinutos, empateDiezMinutos, equipo2DiezMinutos]
  };
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

// Cargar el header y el footer
document.addEventListener("DOMContentLoaded", function() {
  loadHeader();
  loadFooter();
});

function loadHeader() {
  fetch("/hyf/header/header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header-placeholder").innerHTML = data;
      initHeader(); // Inicializar el header una vez que esté cargado
    })
    .catch(error => console.error("Error al cargar el header:", error));
}

function loadFooter() {
  fetch("/hyf/footer/footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error al cargar el footer:", error));
}