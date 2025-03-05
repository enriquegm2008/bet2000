import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
    const cuotasContainer = document.getElementById("cuotas");
    cuotasContainer.innerHTML = ''; // Limpiar cuotas antes de agregar nuevas
    partido.cuotas.forEach((cuota, index) => {
      const cuotaBtn = document.createElement("button");
      cuotaBtn.classList.add("cuota-boton");
      cuotaBtn.innerText = cuota;
      cuotaBtn.onclick = () => mostrarFormularioApuesta(cuota, cuotaBtn);
      cuotasContainer.appendChild(cuotaBtn);
    });
    
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

function mostrarFormularioApuesta(cuotaSeleccionada, botonSeleccionado) {
  // Quitar la clase 'seleccionada' de cualquier botón previamente seleccionado
  const botones = document.querySelectorAll(".cuota-boton");
  botones.forEach(boton => boton.classList.remove("seleccionada"));

  // Añadir la clase 'seleccionada' al botón actualmente seleccionado
  botonSeleccionado.classList.add("seleccionada");

  const form = document.getElementById("apuesta-form");
  form.style.display = "block";
  document.getElementById("realizar-apuesta").onclick = () => realizarApuesta(cuotaSeleccionada);
}

async function realizarApuesta(cuota) {
  const monto = parseFloat(document.getElementById("monto-apuesta").value);
  if (isNaN(monto) || monto <= 0) {
    alert("Ingrese un monto válido.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Debes iniciar sesión para apostar.");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const saldoActual = userSnap.data().saldo;
  if (saldoActual < monto) {
    alert("Saldo insuficiente.");
    return;
  }

  try {
    await updateDoc(userRef, { saldo: saldoActual - monto });
    await realizarApuestaFirestore(user.uid, partidoId, monto, cuota);
    alert(`Apuesta realizada: $${monto} a cuota ${cuota}`);
    window.location.href = "../index.html";
  } catch (error) {
    console.error("Error al realizar la apuesta:", error);
    alert("Hubo un problema al realizar la apuesta. Verifique las reglas de seguridad de Firestore.");
  }
}

async function realizarApuestaFirestore(userId, partidoId, monto, cuota) {
  try {
    const apuestaRef = doc(collection(db, "apuestas"));
    await setDoc(apuestaRef, {
      userId: userId,
      partidoId: partidoId,
      monto: monto,
      cuota: cuota,
      equipo: document.querySelector(".cuota-boton.seleccionada").innerText
    });
    console.log("Apuesta realizada con éxito");
  } catch (error) {
    console.error("Error al realizar la apuesta: ", error);
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