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

// Función para alternar el acordeón
function toggleAccordion(buttonId, contentId) {
  const button = document.getElementById(buttonId);
  const content = document.getElementById(contentId);
  button.addEventListener('click', () => {
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}

// Verificar el estado de autenticación
onAuthStateChanged(auth, async (user) => {
  const navUser = document.getElementById('nav-user');
  const navGuest = document.getElementById('nav-guest');
  const balance = document.getElementById('balance');
  const adminLink = document.getElementById('admin-link');

  if (user) {
    console.log("Usuario autenticado:", user.uid);
    // Si el usuario está logueado
    navUser.style.display = 'flex';  // Mostrar el bloque de usuario
    navGuest.style.display = 'none'; // Ocultar el bloque de invitado

    // Obtener el saldo del usuario desde Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      console.log("Documento de usuario encontrado:", userDoc.data());
      // Si el documento del usuario existe, mostramos el saldo almacenado
      document.getElementById('balance').innerText = `${userDoc.data().saldo.toFixed(2)}€`;
    } else {
      console.log("Documento de usuario no encontrado, creando uno nuevo...");
      // Si no existe, creamos el documento con un saldo inicial de 1000
      await setDoc(userDocRef, { saldo: 1000 });
      document.getElementById('balance').innerText = `1000.00€`;
    }

    // Verificar el rol del usuario y mostrar el enlace de administración si es necesario
    const roleDocRef = doc(db, "roles", user.uid);
    const roleDoc = await getDoc(roleDocRef);
    if (roleDoc.exists() && roleDoc.data().role === "admin") {
      adminLink.style.display = 'inline-block';
    } else {
      adminLink.style.display = 'none';
    }
  } else {
    console.log("Usuario no autenticado");
    // Si el usuario no está logueado
    navUser.style.display = 'none';  // Ocultar el bloque de usuario
    navGuest.style.display = 'flex'; // Mostrar el bloque de invitado (con botones de login y registro)
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
    
    // Asignar nombres y cuotas
    document.getElementById("equipo1-nombre").innerText = partido.equipo1;
    document.getElementById("cuota-equipo1").innerText = parseFloat(partido.cuotas[0]).toFixed(2);
    document.getElementById("cuota-empate").innerText = parseFloat(partido.cuotas[1]).toFixed(2);
    document.getElementById("equipo2-nombre").innerText = partido.equipo2;
    document.getElementById("cuota-equipo2").innerText = parseFloat(partido.cuotas[2]).toFixed(2);

    let hayApuestas = false;

    // Asignar cuotas de apuestas comunes
    if (partido.apuestasComunes && partido.apuestasComunes.ambosMarcan) {
      document.getElementById("ambos-marcan-button").style.display = "block";
      document.getElementById("ambos-marcan-content").style.display = "block";
      document.getElementById("cuota-si").innerText = parseFloat(partido.apuestasComunes.ambosMarcan.si).toFixed(2);
      document.getElementById("cuota-no").innerText = parseFloat(partido.apuestasComunes.ambosMarcan.no).toFixed(2);
      hayApuestas = true;

      // Mostrar las cuotas de "Ambos Marcan" en la consola
      console.log("Cuotas de Ambos Marcan:");
      console.log("Sí:", partido.apuestasComunes.ambosMarcan.si);
      console.log("No:", partido.apuestasComunes.ambosMarcan.no);
    } else {
      document.getElementById("ambos-marcan-button").style.display = "none";
      document.getElementById("ambos-marcan-content").style.display = "none";
    }
    
    // Ocultar la sección de apuestas si no hay ninguna apuesta para desplegar
    if (!hayApuestas) {
      document.getElementById("apuestas-button").style.display = "none";
      document.getElementById("apuestas-content").style.display = "none";
    }
    
    // Actualizar imágenes de escudos
    document.querySelector(".equipo:first-child .escudo").src = `../images/${partido.equipo1.replace(/\s+/g, '')}.png`;
    document.querySelector(".equipo:first-child .escudo").alt = partido.equipo1;
    document.querySelector(".equipo:first-child .nombre-equipo").innerText = partido.equipo1;
    
    document.querySelector(".equipo.second-team .escudo").src = `../images/${partido.equipo2.replace(/\s+/g, '')}.png`;
    document.querySelector(".equipo.second-team .escudo").alt = partido.equipo2;
    document.querySelector(".equipo.second-team .nombre-equipo").innerText = partido.equipo2;
  } else {
    console.error("No se encontró el partido con ID:", partidoId);
  }
}

cargarDatosPartido();

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
  toggleAccordion('resultado-final-button', 'resultado-final-content');
  toggleAccordion('apuestas-button', 'apuestas-content');
  toggleAccordion('ambos-marcan-button', 'ambos-marcan-content');
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
  loadHeader();
  loadFooter();
});

function loadHeader() {
  fetch("../hyf/header/header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header-placeholder").innerHTML = data;
      initHeader(); // Inicializar el header una vez que esté cargado
    })
    .catch(error => console.error("Error al cargar el header:", error));
}

function loadFooter() {
  fetch("../hyf/footer/footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error al cargar el footer:", error));
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