import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;

// Verificar el estado de autenticación
onAuthStateChanged(auth, async (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("Usuario autenticado:", user.uid);
    cargarDatosPartido();
    cargarPartidos();
  } else {
    console.log("Usuario no autenticado");
    window.location.href = '../index.html';
  }
});

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const partidoId = params.get("partido");
console.log("ID del partido:", partidoId);

// Obtener datos del partido desde Firestore
async function cargarDatosPartido() {
  const partidoRef = doc(db, "partidos", partidoId);
  const partidoDoc = await getDoc(partidoRef);

  if (partidoDoc.exists()) {
    const partido = partidoDoc.data();
    console.log("Datos del partido:", partido);
    document.getElementById("titulo-partido").innerText = `${partido.equipo1} vs ${partido.equipo2} - ${partido.fecha}`;
    
    // Asignar nombres y cuotas de "Resultado Final"
    document.getElementById("nombre-equipo1").innerText = partido.equipo1;
    document.getElementById("cuota-equipo1-nombre").innerText = partido.equipo1;
    document.getElementById("cuota-equipo1").innerText = parseFloat(partido.cuotas[0]).toFixed(2);
    document.getElementById("cuota-empate").innerText = parseFloat(partido.cuotas[1]).toFixed(2);
    document.getElementById("nombre-equipo2").innerText = partido.equipo2;
    document.getElementById("cuota-equipo2-nombre").innerText = partido.equipo2;
    document.getElementById("cuota-equipo2").innerText = parseFloat(partido.cuotas[2]).toFixed(2);

    // Asignar cuotas de apuestas comunes
    if (partido.apuestasComunes && partido.apuestasComunes.ambosMarcan) {
      document.getElementById("ambos-marcan-button").style.display = "block";
      document.getElementById("ambos-marcan-content").style.display = "block";
      document.getElementById("cuota-si").innerText = parseFloat(partido.apuestasComunes.ambosMarcan.si).toFixed(2);
      document.getElementById("cuota-no").innerText = parseFloat(partido.apuestasComunes.ambosMarcan.no).toFixed(2);
    } else {
      document.getElementById("ambos-marcan-button").style.display = "none";
      document.getElementById("ambos-marcan-content").style.display = "none";
    }

    // Asignar cuotas de "Se clasificará"
    if (partido.apuestasComunes && partido.apuestasComunes.seClasificara) {
      document.getElementById("se-clasificara-button").style.display = "block";
      document.getElementById("se-clasificara-content").style.display = "block";
      document.getElementById("cuota-equipo1-clasificara").innerText = parseFloat(partido.apuestasComunes.seClasificara.equipo1).toFixed(2);
      document.getElementById("cuota-equipo2-clasificara").innerText = parseFloat(partido.apuestasComunes.seClasificara.equipo2).toFixed(2);

      // Asignar los nombres de los equipos a los botones de "Se clasificará"
      document.getElementById("se-clasificara-equipo1-nombre").innerText = partido.equipo1;
      document.getElementById("se-clasificara-equipo2-nombre").innerText = partido.equipo2;
    } else {
      document.getElementById("se-clasificara-button").style.display = "none";
      document.getElementById("se-clasificara-content").style.display = "none";
    }

    // Asignar cuotas de "Más de 2.5 goles"
    if (partido.apuestasComunes && partido.apuestasComunes.mas2_5goles) {
      document.getElementById("mas-2-5-goles-button").style.display = "block";
      document.getElementById("mas-2-5-goles-content").style.display = "block";
      document.getElementById("cuota-mas").innerText = parseFloat(partido.apuestasComunes.mas2_5goles.mas).toFixed(2);
      document.getElementById("cuota-menos").innerText = parseFloat(partido.apuestasComunes.mas2_5goles.menos).toFixed(2);
    } else {
      document.getElementById("mas-2-5-goles-button").style.display = "none";
      document.getElementById("mas-2-5-goles-content").style.display = "none";
    }

    // Asignar cuotas de "Córners"
    if (partido.apuestasComunes && partido.apuestasComunes.corners) {
      document.getElementById("corners-button").style.display = "block";
      document.getElementById("corners-content").style.display = "block";
      document.getElementById("cuota-menos10").innerText = parseFloat(partido.apuestasComunes.corners.menos10).toFixed(2);
      document.getElementById("cuota-exactamente10").innerText = parseFloat(partido.apuestasComunes.corners.exactamente10).toFixed(2);
      document.getElementById("cuota-mas10").innerText = parseFloat(partido.apuestasComunes.corners.mas10).toFixed(2);
    } else {
      document.getElementById("corners-button").style.display = "none";
      document.getElementById("corners-content").style.display = "none";
    }

    // Actualizar imágenes de escudos
    document.getElementById("escudo-equipo1").src = `../images/${partido.equipo1.replace(/\s+/g, '')}.png`;
    document.getElementById("escudo-equipo1").alt = partido.equipo1;
    document.getElementById("escudo-equipo2").src = `../images/${partido.equipo2.replace(/\s+/g, '')}.png`;
    document.getElementById("escudo-equipo2").alt = partido.equipo2;
  } else {
    console.error("No se encontró el partido con ID:", partidoId);
  }
}

// Función para cargar los partidos y llenar el desplegable
async function cargarPartidos() {
  const partidosSelect = document.getElementById("seleccionar-partido");
  try {
    const querySnapshot = await getDocs(collection(db, "partidos"));
    querySnapshot.forEach((doc) => {
      const partido = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${partido.equipo1} vs ${partido.equipo2} - ${partido.fecha}`;
      partidosSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar los partidos:", error);
    alert("Hubo un problema al cargar los partidos. Por favor, inténtalo de nuevo.");
  }
}

// Función para manejar el envío del formulario de crear apuesta
document.getElementById("form-nueva-apuesta").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (user) {
    await crearApuesta();
  } else {
    alert("Debes iniciar sesión para crear una apuesta.");
    window.location.href = "../iniciar-sesion.html";
  }
});

async function crearApuesta() {
  const partidoId = document.getElementById("seleccionar-partido").value;
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
    alert("Por favor, completa todos los campos del formulario.");
    return;
  }

  try {
    const apuestaRef = doc(db, "partidos", partidoId);
    await setDoc(apuestaRef, {
      resultado: {
        encuentro: [equipo1Encuentro, empateEncuentro, equipo2Encuentro],
        primeraMitad: [equipo1PrimeraMitad, empatePrimeraMitad, equipo2PrimeraMitad],
        segundaMitad: [equipo1SegundaMitad, empateSegundaMitad, equipo2SegundaMitad],
        diezMinutos: [equipo1DiezMinutos, empateDiezMinutos, equipo2DiezMinutos]
      }
    }, { merge: true });

    alert("Apuesta creada con éxito");
    document.getElementById("form-nueva-apuesta").reset();
  } catch (error) {
    console.error("Error al crear la apuesta:", error);
    alert("Hubo un problema al crear la apuesta. Por favor, inténtalo de nuevo.");
  }
}

// Función para cerrar sesión
function logout() {
  signOut(auth).then(() => {
    alert("Has cerrado sesión.");
    window.location.href = "../index.html";
  }).catch((error) => {
    console.error("Error al cerrar sesión:", error);
  });
}

// Inicializar el acordeón después de cargar el documento
document.addEventListener('DOMContentLoaded', () => {
  const accordionButtons = document.querySelectorAll('.accordion-button');
  accordionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const content = button.nextElementSibling;
      const flecha = button.querySelector('.flecha');
      if (content.style.display === "block") {
        content.style.display = "none";
        flecha.innerHTML = "&#9664;";
      } else {
        content.style.display = "block";
        flecha.innerHTML = "&#9660;";
      }
    });
  });
});

// Exponer la función logout y toggleDropdown globalmente para que sean accesibles desde el HTML
window.logout = logout;

// Función para alternar la visibilidad del menú desplegable del usuario autenticado
window.toggleDropdown = function() {
  const dropdownMenu = document.getElementById("dropdown-menu");
  dropdownMenu.classList.toggle("show");
};

// Función para alternar la visibilidad del menú desplegable del invitado
window.toggleGuestMenu = function() {
  const guestMenu = document.getElementById("guest-menu");
  const menuIcon = document.querySelector(".menu-icon");
  
  if (guestMenu.classList.contains("show")) {
    guestMenu.classList.remove("show");
    menuIcon.innerHTML = "&#9776;"; // Tres barritas
  } else {
    guestMenu.classList.add("show");
    menuIcon.innerHTML = "&#9660;"; // Flecha hacia abajo
  }
};

// Función para cargar el header y el footer
document.addEventListener("DOMContentLoaded", function() {
  console.log("El DOM se ha cargado completamente");
  loadHeader();
  loadFooter();
});

function loadHeader() {
  fetch("../hyf/header/header.html")
    .then(response => response.text())
    .then(data => {
      console.log("Header cargado con éxito");
      document.getElementById("header-placeholder").innerHTML = data;
      initHeader(); // Inicializar el header una vez que esté cargado
    })
    .catch(error => {
      console.error("Error al cargar el header:", error);
    });
}

function loadFooter() {
  fetch("../hyf/footer/footer.html")
    .then(response => response.text())
    .then(data => {
      console.log("Footer cargado con éxito");
      document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch(error => {
      console.error("Error al cargar el footer:", error);
    });
}

function initHeader() {
  // Marcar el enlace activo en el header
  const currentPath = window.location.pathname;
  const centerNavLinks = document.querySelectorAll(".center-nav a");

  centerNavLinks.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  // Exponer las funciones globalmente
  window.toggleDropdown = function() {
    const dropdownMenu = document.getElementById("dropdown-menu");
    dropdownMenu.classList.toggle("show");
  };

  window.toggleGuestMenu = function() {
    const guestMenu = document.getElementById("guest-menu");
    const menuIcon = document.querySelector(".menu-icon");
    
    if (guestMenu.classList.contains("show")) {
      guestMenu.classList.remove("show");
      menuIcon.innerHTML = "&#9776;"; // Tres barritas
    } else {
      guestMenu.classList.add("show");
      menuIcon.innerHTML = "&#9660;"; // Flecha hacia abajo
    }
  };
}