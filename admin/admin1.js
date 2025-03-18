import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

  if (user) {
    // Si el usuario está logueado
    navUser.style.display = 'flex';  // Mostrar el bloque de usuario
    navGuest.style.display = 'none'; // Ocultar el bloque de invitado

    // Obtener el saldo del usuario desde Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Si el documento del usuario existe, mostramos el saldo almacenado
      document.getElementById('balance').innerText = `$${userDoc.data().saldo}`;
    } else {
      // Si no existe, creamos el documento con un saldo inicial de 1000
      await setDoc(userDocRef, { saldo: 1000 });
      document.getElementById('balance').innerText = `$1000`;
    }
  } else {
    // Si el usuario no está logueado
    navUser.style.display = 'none';  // Ocultar el bloque de usuario
    navGuest.style.display = 'flex'; // Mostrar el bloque de invitado (con botones de login y registro)
  }
});

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const partidoId = params.get("partido");

// Obtener datos del partido desde Firestore
async function cargarDatosPartido() {
  const partidoRef = doc(db, "partidos", partidoId);
  const partidoDoc = await getDoc(partidoRef);

  if (partidoDoc.exists()) {
    const partido = partidoDoc.data();
    document.getElementById("titulo-partido").innerText = `${partido.equipo1} vs ${partido.equipo2} - ${partido.fecha}`;
    
    // Asignar nombres y cuotas
    document.getElementById("equipo1-nombre").innerText = partido.equipo1;
    document.getElementById("cuota-equipo1").innerText = partido.cuotas[0];
    document.getElementById("cuota-empate").innerText = partido.cuotas[1];
    document.getElementById("equipo2-nombre").innerText = partido.equipo2;
    document.getElementById("cuota-equipo2").innerText = partido.cuotas[2];
    
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

function mostrarFormularioResultado(botonSeleccionado) {
  // Quitar la clase 'seleccionada' de cualquier botón previamente seleccionado
  const botones = document.querySelectorAll(".cuota-boton");
  botones.forEach(boton => boton.classList.remove("seleccionada"));

  // Añadir la clase 'seleccionada' al botón actualmente seleccionado
  botonSeleccionado.classList.add("seleccionada");

  const form = document.getElementById("resultado-form");
  form.style.display = "block";
  document.getElementById("definir-resultado").onclick = () => definirResultado();
}

async function definirResultado() {
  const resultado = document.querySelector(".cuota-boton.seleccionada .nombre-equipo").innerText;

  if (!resultado) {
    alert("Seleccione un resultado.");
    return;
  }

  try {
    const partidoRef = doc(db, "partidos", partidoId);
    await updateDoc(partidoRef, { resultado });

    alert(`Resultado definido: ${resultado}`);
    window.location.href = "admin.html";
  } catch (error) {
    console.error("Error al definir el resultado:", error);
    alert("Hubo un problema al definir el resultado.");
  }
}

// Función para cerrar sesión
function logout() {
  signOut(auth).then(() => {
    // Redirigir al usuario a la página de inicio después de cerrar sesión
    window.location.href = "../index.html";
  }).catch((error) => {
    console.error("Error al cerrar sesión:", error);
  });
}

// Inicializar el acordeón después de cargar el documento
document.addEventListener('DOMContentLoaded', () => {
  toggleAccordion('resultado-final-button', 'resultado-final-content');

  // Añadir event listeners a los botones de cuotas
  document.getElementById('cuota-equipo1-boton').addEventListener('click', () => mostrarFormularioResultado(
    document.getElementById('cuota-equipo1-boton')
  ));
  document.getElementById('cuota-empate-boton').addEventListener('click', () => mostrarFormularioResultado(
    document.getElementById('cuota-empate-boton')
  ));
  document.getElementById('cuota-equipo2-boton').addEventListener('click', () => mostrarFormularioResultado(
    document.getElementById('cuota-equipo2-boton')
  ));
});