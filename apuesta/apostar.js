import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
  cargarDatosPartido();
  cargarPartidos();
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
    window.location.href = '../index.html';
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
      window.location.href = "../iniciar-sesion.html";
    }
  });
}

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
    
    // Asignar eventos para mostrar el menú emergente
    document.querySelectorAll('.cuota-boton').forEach(button => {
      button.addEventListener('click', () => {
        mostrarMenuEmergente(button);
      });
    });
  } else {
    console.error("No se encontró el partido con ID:", partidoId);
  }
}

// Función para manejar el envío del formulario de crear apuesta
document.getElementById("form-nueva-apuesta").addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (user) {
    await crearApuesta(user);
  } else {
    alert("Debes iniciar sesión para crear una apuesta.");
    window.location.href = "../iniciar-sesion.html";
  }
});

async function crearApuesta(user) {
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

  const importe = parseFloat(document.getElementById('importe-apuesta').value);
  if (isNaN(importe) || importe <= 0) {
    alert("Por favor, introduce un importe válido.");
    return;
  }

  if (isNaN(equipo1Encuentro) || isNaN(empateEncuentro) || isNaN(equipo2Encuentro) ||
      isNaN(equipo1PrimeraMitad) || isNaN(empatePrimeraMitad) || isNaN(equipo2PrimeraMitad) ||
      isNaN(equipo1SegundaMitad) || isNaN(empateSegundaMitad) || isNaN(equipo2SegundaMitad) ||
      isNaN(equipo1DiezMinutos) || isNaN(empateDiezMinutos) || isNaN(equipo2DiezMinutos)) {
    alert("Por favor, completa todos los campos del formulario.");
    return;
  }

  const partidosSelect = document.getElementById("seleccionar-partido");
  const partidoSeleccionado = partidosSelect.options[partidosSelect.selectedIndex].text;

  const detalleApuesta = document.querySelector('#detalle-apuesta p[style*="font-weight: bold"]').innerText.trim();
  const tituloApuesta = document.querySelector('#detalle-apuesta p[style*="font-size: 0.9em"]').innerText.trim();

  console.log("Titulo de la Apuesta:", tituloApuesta);
  console.log("Detalle de la Apuesta:", detalleApuesta);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().saldo >= importe) {
      const nuevoSaldo = userDoc.data().saldo - importe;
      await updateDoc(userDocRef, { saldo: nuevoSaldo });

      const apuestaId = `${user.uid}_${Math.floor(Math.random() * 10000)}`;
      const apuestaRef = doc(db, "apuestas", apuestaId);
      await setDoc(apuestaRef, {
        userId: user.uid,
        partidoId: partidoId,
        titulo: tituloApuesta,
        detalle: detalleApuesta,
        importe: importe,
        timestamp: new Date()
      });

      alert("Apuesta creada con éxito");
      document.getElementById("form-nueva-apuesta").reset();
      document.getElementById('ganancias-potenciales').innerText = '';
    } else {
      alert("Saldo insuficiente para realizar la apuesta.");
    }
  } catch (error) {
    console.error("Error al crear la apuesta:", error);
    alert("Hubo un problema al crear la apuesta. Por favor, inténtalo de nuevo.");
  }
}

// Función para cerrar sesión
function logout() {
  signOut(auth).then(() => {
    alert("Has cerrado sesión.");
    window.location.href = '../index.html';
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
      const flecha = button.querySelector('.flecha-abajo');
      if (content.style.display === "block") {
        content.style.display = "none";
        flecha.innerHTML = "&#9660;";
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

  if (guestMenu.style.display === "block") {
    guestMenu.classList.remove("show");
    menuIcon.innerHTML = "&#9776;"; // Tres barritas
  } else {
    guestMenu.classList.add("show");
    menuIcon.innerHTML = "&#9660;"; // Flecha hacia abajo
  }
};

// Función para mostrar el menú emergente
function mostrarMenuEmergente(button) {
  const detalleApuesta = button.querySelector('.nombre-equipo').innerText;
  const cuota = parseFloat(button.querySelector('.cuota').innerText);
  const tituloApuesta = button.closest('.accordion').querySelector('.accordion-button').innerText;

  document.getElementById('detalle-apuesta').innerHTML = `
    <p style="font-weight: bold; font-size: 1.2em;">${detalleApuesta}</p>
    <br>
    <p style="font-size: 0.9em;">${tituloApuesta}: ${detalleApuesta}</p>
  `;
  document.getElementById('menu-emergente').style.display = 'block';

  const inputImporte = document.getElementById('importe-apuesta');
  inputImporte.value = '';
  document.getElementById('ganancias-potenciales').innerText = '';

  inputImporte.addEventListener('input', () => {
    const importe = parseFloat(inputImporte.value);
    const ganancias = importe * cuota;
    if (!isNaN(ganancias)) {
      document.getElementById('ganancias-potenciales').innerText = `Ganancias potenciales: ${ganancias.toFixed(2)} €`;
    } else {
      document.getElementById('ganancias-potenciales').innerText = '';
    }
  });
}

// Función para realizar la apuesta
function realizarApuesta() {
  const importe = parseFloat(document.getElementById('importe-apuesta').value);
  if (isNaN(importe) || importe <= 0) {
    alert("Por favor, introduce un importe válido.");
    return;
  }

  const user = auth.currentUser;
  if (user) {
    const partidosSelect = document.getElementById("seleccionar-partido");
    const partidoSeleccionado = partidosSelect.options[partidosSelect.selectedIndex].text;
  
    const detalleApuesta = document.querySelector('#detalle-apuesta p[style*="font-weight: bold"]').innerText.trim();
    const tituloApuesta = document.querySelector('#detalle-apuesta p[style*="font-size: 0.9em"]').innerText.trim();

    console.log("Titulo de la Apuesta:", tituloApuesta);
    console.log("Detalle de la Apuesta:", detalleApuesta);

    const userDocRef = doc(db, "users", user.uid);
    getDoc(userDocRef).then((userDoc) => {
      if (userDoc.exists() && userDoc.data().saldo >= importe) {
        const nuevoSaldo = userDoc.data().saldo - importe;
        updateDoc(userDocRef, { saldo: nuevoSaldo }).then(() => {
          const apuestaId = `${user.uid}_${Math.floor(Math.random() * 10000)}`;
          const apuestaRef = doc(db, "apuestas", apuestaId);
          setDoc(apuestaRef, {
            userId: user.uid,
            partidoId: partidoId,
            titulo: tituloApuesta,
            detalle: detalleApuesta,
            importe: importe,
            timestamp: new Date()
          }).then(() => {
            alert("Apuesta creada con éxito");
            document.getElementById("form-nueva-apuesta").reset();
            document.getElementById('ganancias-potenciales').innerText = '';
            cerrarMenuEmergente();
          }).catch((error) => {
            console.error("Error al crear la apuesta:", error);
            alert("Hubo un problema al crear la apuesta. Por favor, inténtalo de nuevo.");
          });
        }).catch((error) => {
          console.error("Error al actualizar el saldo:", error);
          alert("Hubo un problema al actualizar el saldo. Por favor, inténtalo de nuevo.");
        });
      } else {
        alert("Saldo insuficiente para realizar la apuesta.");
      }
    }).catch((error) => {
      console.error("Error al obtener los datos del usuario:", error);
      alert("Hubo un problema al obtener los datos del usuario. Por favor, inténtalo de nuevo.");
    });
  } else {
    alert("Debes iniciar sesión para realizar una apuesta.");
    window.location.href = "../iniciar-sesion.html";
  }
}

// Función para cerrar el menú emergente
function cerrarMenuEmergente() {
  document.getElementById('menu-emergente').style.display = 'none';
}

window.mostrarMenuEmergente = mostrarMenuEmergente;
window.cerrarMenuEmergente = cerrarMenuEmergente;
window.realizarApuesta = realizarApuesta;