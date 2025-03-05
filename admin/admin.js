import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, getDocs, collection, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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
const auth = getAuth(app);

// Función para formatear la fecha y la hora
function formatearFechaHora(fecha, hora) {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const date = new Date(`${fecha}T${hora}`);
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const horas = date.getHours().toString().padStart(2, '0');
  const minutos = date.getMinutes().toString().padStart(2, '0');
  return `${dia} ${mes} <span style="float: right;">${horas}:${minutos}</span>`;
}

document.getElementById("toggle-form").addEventListener("click", () => {
  const formContainer = document.getElementById("form-container");
  const closeFormButton = document.getElementById("close-form");
  const toggleFormButton = document.getElementById("toggle-form");
  if (formContainer.style.display === "none") {
    formContainer.style.display = "block";
    closeFormButton.style.display = "inline-block";
    toggleFormButton.style.display = "none";
  } else {
    formContainer.style.display = "none";
    closeFormButton.style.display = "none";
    toggleFormButton.style.display = "inline-block";
  }
});

document.getElementById("close-form").addEventListener("click", () => {
  const formContainer = document.getElementById("form-container");
  const closeFormButton = document.getElementById("close-form");
  const toggleFormButton = document.getElementById("toggle-form");
  formContainer.style.display = "none";
  closeFormButton.style.display = "none";
  toggleFormButton.style.display = "inline-block";
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "roles", user.uid));
    if (userDoc.exists() && userDoc.data().role === "admin") {
      document.getElementById("form-nuevo-partido").addEventListener("submit", async (event) => {
        event.preventDefault();
        await crearPartido();
      });
      cargarPartidos();
    } else {
      alert("No tienes permisos para acceder a esta página.");
      window.location.href = "../index.html";
    }
  } else {
    alert("Debes iniciar sesión para acceder a esta página.");
    window.location.href = "../iniciar-sesion.html";
  }
});

async function crearPartido() {
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const equipo1 = document.getElementById("equipo1").value;
  const equipo2 = document.getElementById("equipo2").value;
  const cuota1 = parseFloat(document.getElementById("cuota1").value);
  const cuotaEmpate = parseFloat(document.getElementById("cuotaEmpate").value);
  const cuota2 = parseFloat(document.getElementById("cuota2").value);

  const nuevoPartidoRef = doc(collection(db, "partidos"));
  await setDoc(nuevoPartidoRef, {
    fecha,
    hora,
    equipo1,
    equipo2,
    cuotas: [cuota1, cuotaEmpate, cuota2],
    resultado: null
  });

  alert("Partido creado con éxito");
  cargarPartidos();

  // Recargar la lista de partidos en index.html
  window.localStorage.setItem('reloadPartidos', 'true');
}

async function cargarPartidos() {
  const listaPartidos = document.getElementById("lista-partidos");
  listaPartidos.innerHTML = "";  // Limpiar la lista antes de cargar los partidos

  const querySnapshot = await getDocs(collection(db, "partidos"));
  querySnapshot.forEach((doc) => {
    const partido = doc.data();
    const partidoDiv = document.createElement("div");
    partidoDiv.classList.add("partido");
    partidoDiv.innerHTML = `
      <span class="fecha">${formatearFechaHora(partido.fecha, partido.hora)}</span>
      <div class="equipos">
        <div class="equipo">
          <span class="nombre-equipo">${partido.equipo1}</span>
          <input type="radio" name="resultado-partido-${doc.id}" value="${partido.equipo1}">
        </div>
        <div class="equipo">
          <span class="nombre-equipo">Empate</span>
          <input type="radio" name="resultado-partido-${doc.id}" value="Empate">
        </div>
        <div class="equipo second-team">
          <input type="radio" name="resultado-partido-${doc.id}" value="${partido.equipo2}">
          <span class="nombre-equipo">${partido.equipo2}</span>
        </div>
      </div>
      <button class="definir-resultado" data-partido-id="${doc.id}">Definir Resultado</button>
    `;
    listaPartidos.appendChild(partidoDiv);
  });

  document.querySelectorAll(".definir-resultado").forEach(button => {
    button.onclick = async (event) => {
      const partidoId = event.target.dataset.partidoId;
      await definirResultado(partidoId);
    };
  });
}

async function definirResultado(partidoId) {
  try {
    const resultado = document.querySelector(`input[name="resultado-partido-${partidoId}"]:checked`)?.value;
    
    if (!resultado) {
      alert("Por favor, seleccione un resultado");
      return;
    }

    const partidoRef = doc(db, "partidos", partidoId);
    await updateDoc(partidoRef, { resultado });

    alert(`Resultado definido: ${resultado}`);
    await validarApuestas(partidoId, resultado);
  } catch (error) {
    console.error("Error al definir el resultado:", error);
    alert("Hubo un problema al definir el resultado.");
  }
}

async function validarApuestas(partidoId, resultado) {
  try {
    const apuestasRef = collection(db, "apuestas");
    const apuestasSnapshot = await getDocs(apuestasRef);
    
    apuestasSnapshot.forEach(async (apuestaDoc) => {
      const apuesta = apuestaDoc.data();
      if (apuesta.partidoId === partidoId && apuesta.equipo === resultado) {
        const usuarioRef = doc(db, "users", apuesta.userId);
        const usuarioDoc = await getDoc(usuarioRef);
        if (usuarioDoc.exists()) {
          const saldoActual = usuarioDoc.data().saldo;
          const nuevoSaldo = saldoActual + (apuesta.monto * apuesta.cuota);
          await updateDoc(usuarioRef, { saldo: nuevoSaldo });
        }
      }
    });
  } catch (error) {
    console.error("Error al validar las apuestas:", error);
    alert("Hubo un problema al validar las apuestas.");
  }
}