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

// Esperar a que el header y footer se hayan cargado
document.addEventListener("DOMContentLoaded", function() {
  loadHeader();
  loadFooter();
});

function loadHeader() {
  fetch("hyf/header/header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header-placeholder").innerHTML = data;
      initHeader(); // Inicializar el header una vez que esté cargado
    })
    .catch(error => console.error("Error al cargar el header:", error));
}

function loadFooter() {
  fetch("hyf/footer/footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error al cargar el footer:", error));
}

function initHeader() {
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

  // Función para cerrar sesión
  window.logout = async function() {
      try {
          await signOut(auth);
          alert("Has cerrado sesión.");
          window.location.href = 'claves/iniciosesion/iniciar-sesion.html';
      } catch (error) {
          console.error("Error al cerrar sesión:", error);
          alert("Error al cerrar sesión: " + error.message);
      }
  };

  // Función para verificar el estado de autenticación del usuario y mostrar el botón de administración si es necesario
  onAuthStateChanged(auth, async (user) => {
      const navUser = document.getElementById('nav-user');
      const navGuest = document.getElementById('nav-guest');
      const balance = document.getElementById('balance');
      const adminLink = document.getElementById('admin-link');

      if (user) {
          if (navUser) navUser.style.display = 'flex';
          if (navGuest) navGuest.style.display = 'none';

          try {
              const userDocRef = doc(db, "users", user.uid);
              const userDoc = await getDoc(userDocRef);

              if (userDoc.exists()) {
                  if (balance) balance.innerText = `${userDoc.data().saldo.toFixed(2)}€`;
              } else {
                  await setDoc(userDocRef, { saldo: 1000 });
                  if (balance) balance.innerText = `1000.00€`;
              }

              const roleDocRef = doc(db, "roles", user.uid);
              const roleDoc = await getDoc(roleDocRef);
              if (roleDoc.exists() && roleDoc.data().role === "admin") {
                  if (adminLink) adminLink.style.display = 'block';
              } else {
                  if (adminLink) adminLink.style.display = 'none';
              }
          } catch (error) {
              console.error("Error al obtener los documentos de Firestore:", error);
              alert("Hubo un problema al obtener los datos. Verifique las reglas de seguridad de Firestore.");
          }
      } else {
          if (navUser) navUser.style.display = 'none';
          if (navGuest) navGuest.style.display = 'flex';
      }

      // Cargar los partidos al iniciar sesión
      cargarPartidos();
  });

  // Función para cargar los partidos desde Firestore
  async function cargarPartidos() {
      const listaPartidos = document.querySelector(".partidos");
      
      if (listaPartidos) {
          listaPartidos.innerHTML = "";  // Limpiar la lista antes de cargar los partidos

          const partidosSnapshot = await getDocs(collection(db, "partidos"));
          const partidos = partidosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const partidosAgrupados = agruparPartidosPorFecha(partidos);

          for (const fecha in partidosAgrupados) {
              const grupoDiv = document.createElement("div");
              grupoDiv.classList.add("grupo-partidos");
              const fechaHeader = document.createElement("h3");
              fechaHeader.classList.add("fecha-grupo");
              fechaHeader.textContent = fecha;
              grupoDiv.appendChild(fechaHeader);

              partidosAgrupados[fecha].forEach(partido => {
                  const partidoDiv = document.createElement("div");
                  partidoDiv.classList.add("partido");
                  partidoDiv.onclick = () => window.location.href = `apuesta/apuesta.html?partido=${partido.id}`;
                  partidoDiv.innerHTML = `
                      <div class="equipos">
                          <div class="equipo">
                              <img src="images/${partido.equipo1.replace(/\s+/g, '')}.png" alt="${partido.equipo1}" class="escudo">
                              <span class="nombre-equipo">${partido.equipo1}</span>
                          </div>
                          <div class="equipo second-team">
                              <span class="nombre-equipo">${partido.equipo2}</span>
                              <img src="images/${partido.equipo2.replace(/\s+/g, '')}.png" alt="${partido.equipo2}" class="escudo">
                          </div>
                      </div>
                      <div class="cuotas">
                          <span class="cuota">${partido.cuotas[0]}</span>
                          <span class="cuota">${partido.cuotas[1]}</span>
                          <span class="cuota">${partido.cuotas[2]}</span>
                      </div>
                  `;
                  grupoDiv.appendChild(partidoDiv);
              });

              listaPartidos.appendChild(grupoDiv);
          }
      } else {
          console.error("Elemento .partidos no encontrado");
      }
  }

  // Función para formatear la fecha
  function formatearFecha(fecha) {
      const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const date = new Date(fecha);
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      return `${dia} ${mes}`;
  }

  // Función para agrupar los partidos por fecha
  function agruparPartidosPorFecha(partidos) {
      const grupos = {};
      partidos.forEach(partido => {
          const fechaFormateada = formatearFecha(partido.fecha);
          if (!grupos[fechaFormateada]) {
              grupos[fechaFormateada] = [];
          }
          grupos[fechaFormateada].push(partido);
      });
      return grupos;
  }

  // Recargar los partidos cuando se crea uno nuevo desde admin.html
  window.addEventListener('storage', (event) => {
      if (event.key === 'reloadPartidos') {
          cargarPartidos();
          window.localStorage.removeItem('reloadPartidos');
      }
  });

  // Cerrar el menú desplegable al hacer clic fuera de él
  window.onclick = function(event) {
      if (!event.target.matches('.logo') && !event.target.matches('.menu-icon')) {
          const dropdowns = document.getElementsByClassName("dropdown-content");
          for (let i = 0; i < dropdowns.length; i++) {
              const openDropdown = dropdowns[i];
              if (openDropdown.classList.contains("show")) {
                  openDropdown.classList.remove("show");
              }
          }

          // Restaurar icono de tres barritas si el menú de invitados está abierto
          const menuIcon = document.querySelector(".menu-icon");
          if (menuIcon.innerHTML === "&#9660;") {
              menuIcon.innerHTML = "&#9776;";
          }
      }
  };
}