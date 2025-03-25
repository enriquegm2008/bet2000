import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", function() {
    loadHeader();
    loadFooter();
    checkUserAuthentication();
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
  // Marcar el enlace activo en el header
  const currentPath = window.location.pathname;
  const centerNavLinks = document.querySelectorAll(".center-nav a");

  centerNavLinks.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  // Verificar estado de autenticación
  onAuthStateChanged(auth, async (user) => {
    const navUser = document.getElementById('nav-user');
    const navGuest = document.getElementById('nav-guest');
    const balance = document.getElementById('balance');
    const adminLink = document.getElementById('admin-link');

    if (user) {
      navUser.style.display = 'flex';
      navGuest.style.display = 'none';

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          balance.innerText = `${userDoc.data().saldo.toFixed(2)}€`;

          const roleDocRef = doc(db, "roles", user.uid);
          const roleDoc = await getDoc(roleDocRef);
          if (roleDoc.exists() && roleDoc.data().role === "admin") {
            adminLink.style.display = 'block';
          } else {
            adminLink.style.display = 'none';
          }

          loadApuestas(); // Cargar las apuestas de quiniela
        } else {
          await setDoc(userDocRef, { saldo: 1000 });
          balance.innerText = `1000.00€`;
        }
      } catch (error) {
        console.error("Error al obtener los documentos de Firestore:", error);
        alert("Hubo un problema al obtener los datos. Verifique las reglas de seguridad de Firestore.");
      }
    } else {
      navUser.style.display = 'none';
      navGuest.style.display = 'flex';
    }
  });

  // Cerrar menús desplegables al hacer clic fuera
  window.onclick = function (event) {
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

// Función para alternar el menú desplegable
window.toggleDropdown = function () {
  const dropdownMenu = document.getElementById("dropdown-menu");
  dropdownMenu.classList.toggle('show');
};

// Función para alternar opciones
window.toggleOptions = function (optionsId) {
  const options = document.getElementById(optionsId);
  const container = options.parentElement;

  if (options.style.display === "none" || options.style.display === "") {
    options.style.display = "flex";
    container.classList.add("expanded");
  } else {
    options.style.display = "none";
    container.classList.remove("expanded");
  }
};

// Función para alternar el menú de invitados
window.toggleGuestMenu = function () {
  const guestMenu = document.getElementById("guest-menu");
  const menuIcon = document.querySelector(".menu-icon");

  if (guestMenu.style.display === "block") {
    guestMenu.classList.remove("show");
    menuIcon.innerHTML = "&#9776;"; // Tres barritas
  } else {
    guestMenu.classList.add("show");
    menuIcon.innerHTML = "&#9660;"; // Flecha hacia abajo
  }
};

// Función para cerrar sesión
window.logout = async function () {
  try {
    await signOut(auth);
    alert("Has cerrado sesión.");
    window.location.href = '/claves/iniciosesion/iniciar-sesion.html';
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    alert("Error al cerrar sesión: " + error.message);
  }
}

function checkUserAuthentication() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario autenticado
      console.log("Usuario autenticado:", user.email);
      // Aquí puedes agregar lógica adicional si el usuario está autenticado
    } else {
      // Usuario no autenticado
      console.log("Usuario no autenticado.");
      // Redirigir al usuario a la página de inicio de sesión
      window.location.href = "/claves/iniciosesion/iniciar-sesion.html";
    }
  });
}

// Función para cargar y mostrar apuestas de quiniela
async function loadApuestas() {
  try {
    const mainContainer = document.querySelector("main");
    mainContainer.innerHTML = ""; // Limpiar contenido previo

    // Obtener todas las apuestas de quiniela
    const apuestasQuery = collection(db, "apuestaQuiniela");
    const apuestasSnapshot = await getDocs(apuestasQuery);

    apuestasSnapshot.forEach(docSnapshot => {
      const apuesta = docSnapshot.data();

      const apuestaDiv = document.createElement("div");
      apuestaDiv.classList.add("apuesta");

      // Añadir contenedor con fondo
      const contenidoConFondo = document.createElement("div");
      contenidoConFondo.classList.add("contenido-con-fondo");

      // Añadir imagen arriba
      const imagen = document.createElement("img");
      imagen.src = "/images/Quiniela.jpg";
      imagen.alt = "Quiniela";
      imagen.classList.add("quiniela-img");
      imagen.addEventListener('click', () => toggleTableVisibility(imagen)); // Añadir evento de clic
      contenidoConFondo.appendChild(imagen);

      // Añadir fecha y precio pagado
      const fechaPrecioDiv = document.createElement("div");
      fechaPrecioDiv.classList.add("fecha-precio");
      const fecha = new Date(apuesta.timestamp.seconds * 1000).toLocaleDateString("es-ES");
      fechaPrecioDiv.innerText = `Fecha: ${fecha} | Precio: ${apuesta.precio}€`;
      contenidoConFondo.appendChild(fechaPrecioDiv);

      // Añadir número de columnas seguido de "Apuestas"
      const columnasTexto = document.createElement("div");
      columnasTexto.classList.add("columnas-texto");
      columnasTexto.innerText = `${apuesta.columnasSeleccionadas.length} Apuestas`;
      contenidoConFondo.appendChild(columnasTexto);

      // Añadir el contenedor con fondo al div de apuesta
      apuestaDiv.appendChild(contenidoConFondo);

      // Crear contenedor para la tabla
      const resultadosTableContainer = document.createElement("div");
      resultadosTableContainer.classList.add("resultados-table-container", "hidden"); // Añadir clase hidden

      // Crear tabla para mostrar los resultados
      const resultadosTable = document.createElement("table");
      resultadosTable.classList.add("resultados-table");

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th class="partido-column"></th> <!-- Columna vacía para los números de partidos -->
          ${apuesta.columnasSeleccionadas.map(columna => `<th>${columna}</th>`).join('')}
        </tr>
      `;
      resultadosTable.appendChild(thead);

      const tbody = document.createElement("tbody");

      for (let i = 0; i < 14; i++) { // Limitar a 14 partidos
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="partido-column">${i + 1}.</td>
          ${apuesta.columnasSeleccionadas.map(columna => `<td>${apuesta.resultados[`partido${i + 1}_columna${columna}`] || ''}</td>`).join('')}
        `;
        tbody.appendChild(row);
      }

      resultadosTable.appendChild(tbody);

      // Añadir tabla al contenedor de la tabla
      resultadosTableContainer.appendChild(resultadosTable);

      // Añadir contenedor de la tabla al div de apuesta
      apuestaDiv.appendChild(resultadosTableContainer);

      mainContainer.appendChild(apuestaDiv);
    });
  } catch (error) {
    console.error("Error al cargar las apuestas:", error);
    alert("Hubo un problema al cargar las apuestas.");
  }
}

// Función para alternar la visibilidad de la tabla
function toggleTableVisibility(imagen) {
  const apuestaDiv = imagen.parentElement.parentElement; // Ajuste para obtener el div de la apuesta
  const todasTablas = document.querySelectorAll('.resultados-table-container');
  todasTablas.forEach(tabla => {
    if (tabla.parentElement !== apuestaDiv) {
      tabla.classList.add('hidden');
    }
  });
  const resultadosTableContainer = apuestaDiv.querySelector('.resultados-table-container');
  resultadosTableContainer.classList.toggle('hidden');
}