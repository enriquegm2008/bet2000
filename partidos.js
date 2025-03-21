import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// Función para formatear solo la fecha (sin la hora)
function formatearFechaSoloFecha(fecha) {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const date = new Date(fecha);
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  return `${dia} ${mes}`;
}

// Función para formatear solo la hora
function formatearFechaSoloHora(fecha) {
  const date = new Date(fecha);
  const hora = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
  return `${hora}`;
}

// Función para agrupar los partidos por fecha
function agruparPartidosPorFecha(partidos) {
  const grupos = {};
  partidos.forEach(partido => {
    const fechaFormateada = formatearFechaSoloFecha(partido.fecha + 'T' + partido.hora);
    if (!grupos[fechaFormateada]) {
      grupos[fechaFormateada] = [];
    }
    grupos[fechaFormateada].push(partido);
  });
  return grupos;
}

// Función para cargar los partidos desde Firestore
async function cargarPartidos() {
  try {
    const listaPartidos = document.querySelector(".partidos-list, .matches-container");
    if (!listaPartidos) {
      throw new Error("Elemento con clase 'partidos-list' o 'matches-container' no encontrado en el DOM.");
    }
    listaPartidos.innerHTML = "";  // Limpiar la lista antes de cargar los partidos

    const partidosSnapshot = await getDocs(collection(db, "partidos"));
    const partidos = partidosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("Datos de los partidos obtenidos correctamente:", partidos);

    // Ordenar los partidos por fecha y hora
    partidos.sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));

    const partidosAgrupados = agruparPartidosPorFecha(partidos);

    // Obtener la ruta base para las imágenes
    const basePath = window.location.pathname.includes('admin') ? '../images/' : 'images/';
    const redirectPath = window.location.pathname.includes('admin') ? 'resultados/resultados.html' : 'apuesta/apostar.html';

    for (const fecha in partidosAgrupados) {
      const grupoDiv = document.createElement("div");
      grupoDiv.classList.add("grupo-partidos");

      // Crear el título de la fecha
      const fechaDiv = document.createElement("div");
      fechaDiv.classList.add("fecha-titulo");
      fechaDiv.innerHTML = `<h3>${fecha}</h3>`;  // Mostrar solo la fecha sin la hora
      grupoDiv.appendChild(fechaDiv);

      partidosAgrupados[fecha].forEach(partido => {
        const partidoDiv = document.createElement("div");
        partidoDiv.classList.add("partido");
        partidoDiv.onclick = () => window.location.href = `${redirectPath}?partido=${partido.id}`;
        partidoDiv.innerHTML = `
          <div class="equipos">
            <div class="equipo">
              <div class="escudo">
                <img src="${basePath}${partido.equipo1.replace(/\s+/g, '')}.png" alt="${partido.equipo1}">
              </div>
              <div class="nombre">
                <span>${partido.equipo1}</span>
              </div>
            </div>
            <div class="equipo">
              <div class="escudo">
                <img src="${basePath}${partido.equipo2.replace(/\s+/g, '')}.png" alt="${partido.equipo2}">
              </div>
              <div class="nombre">
                <span>${partido.equipo2}</span>
              </div>
            </div>
            <div class="hora">
              <span>${formatearFechaSoloHora(partido.fecha + 'T' + partido.hora)}</span>
            </div>
          </div>
          <div class="cuotas">
            <div class="cuota">
              <span>1</span>
              <span>${partido.cuotas[0].toFixed(2)}</span>
            </div>
            <div class="cuota">
              <span>X</span>
              <span>${partido.cuotas[1].toFixed(2)}</span>
            </div>
            <div class="cuota">
              <span>2</span>
              <span>${partido.cuotas[2].toFixed(2)}</span>
            </div>
          </div>
        `;
        grupoDiv.appendChild(partidoDiv);
      });

      listaPartidos.appendChild(grupoDiv);
    }
  } catch (error) {
    console.error("Error al cargar los partidos: ", error);
  }
}

// Autenticación anónima y cargar partidos
onAuthStateChanged(auth, (user) => {
  if (user) {
    cargarPartidos();
  } else {
    signInAnonymously(auth)
      .then(() => {
        console.log("Autenticado anónimamente");
        cargarPartidos(); // Cargar los partidos después de autenticarse anónimamente
      })
      .catch((error) => {
        console.error("Error en la autenticación anónima: ", error);
      });
  }
});