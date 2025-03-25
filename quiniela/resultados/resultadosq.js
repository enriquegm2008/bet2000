import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
        generarApuesta();
    } else {
        alert("Debes iniciar sesión para acceder a esta página.");
        window.location.href = "/claves/iniciosesion/iniciar-sesion.html";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    loadHeader();
    loadFooter();

    const quinielaIframe = document.getElementById('quiniela-iframe');
    const apuestaIframe = document.getElementById('apuesta-iframe');

    quinielaIframe.onload = function() {
        adjustIframeHeight(quinielaIframe);
    };

    apuestaIframe.onload = function() {
        adjustIframeHeight(apuestaIframe);
    };
});

function generarApuesta() {
    const apuestaContainer = document.getElementById('apuesta-container');
    apuestaContainer.innerHTML = ''; // Limpiar el contenido

    getDocs(collection(db, "quiniela"))
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const { partidos } = doc.data();

                partidos.forEach((partido, i) => {
                    const partidoDiv = document.createElement('div');
                    partidoDiv.className = 'partido';

                    const equipoDiv = document.createElement('div');
                    equipoDiv.className = 'equipo';
                    equipoDiv.innerHTML = `<span>${partido.equipo1} - ${partido.equipo2}</span>`;

                    const opcionesDiv = document.createElement('div');
                    opcionesDiv.className = 'opciones';

                    opcionesDiv.innerHTML = `
                        <input type="radio" id="partido${i}_1" name="partido${i}" value="1">
                        <label for="partido${i}_1">1</label>
                        <input type="radio" id="partido${i}_X" name="partido${i}" value="X">
                        <label for="partido${i}_X">X</label>
                        <input type="radio" id="partido${i}_2" name="partido${i}" value="2">
                        <label for="partido${i}_2">2</label>
                    `;

                    equipoDiv.appendChild(opcionesDiv);
                    partidoDiv.appendChild(equipoDiv);
                    apuestaContainer.appendChild(partidoDiv);
                });
            });
        })
        .catch((error) => {
            console.error("Error al obtener los datos de la quiniela:", error);
        });
}

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

// Función para inicializar el header
function initHeader() {
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
                } else {
                    await setDoc(userDocRef, { saldo: 1000 });
                    balance.innerText = `1000.00€`;
                }

                const roleDocRef = doc(db, "roles", user.uid);
                const roleDoc = await getDoc(roleDocRef);
                if (roleDoc.exists() && roleDoc.data().role === "admin") {
                    adminLink.style.display = 'block';
                } else {
                    adminLink.style.display = 'none';
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

// Ajustar la altura del iframe según su contenido
function adjustIframeHeight(iframe) {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframe.style.height = iframeDocument.documentElement.scrollHeight + 'px';
}