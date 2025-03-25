import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
        cargarJornadas();
    } else {
        alert("Debes iniciar sesión para acceder a esta página.");
        window.location.href = "/claves/iniciosesion/iniciar-sesion.html";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    loadHeader();
    loadFooter();

    document.getElementById('crear-quiniela').addEventListener('click', function () {
        const formularioContainer = document.getElementById('formulario-container');
        formularioContainer.classList.toggle('hidden');
    });

    document.getElementById('dar-resultados').addEventListener('click', function () {
        const resultadosContainer = document.getElementById('resultados-container');
        resultadosContainer.classList.toggle('hidden');
    });

    document.getElementById("quiniela-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        if (user) {
            await guardarQuiniela();
        } else {
            alert("Debes iniciar sesión para guardar.");
            window.location.href = "/claves/iniciosesion/iniciar-sesion.html";
        }
    });

    document.getElementById("resultados-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        if (user) {
            await guardarResultados();
        } else {
            alert("Debes iniciar sesión para guardar.");
            window.location.href = "/claves/iniciosesion/iniciar-sesion.html";
        }
    });
});

async function cargarJornadas() {
    const jornadaSelect = document.getElementById('jornada-resultados');
    try {
        const jornadasSnapshot = await getDocs(collection(db, "quiniela"));
        jornadasSnapshot.forEach((doc) => {
            const jornadaOption = document.createElement("option");
            jornadaOption.value = doc.id.split('_')[1]; // Extraer el número de la jornada del nombre del documento
            jornadaOption.textContent = `Jornada ${doc.id.split('_')[1]}`;
            jornadaSelect.appendChild(jornadaOption);
        });
    } catch (error) {
        console.error("Error al cargar las jornadas:", error);
    }
}

async function guardarQuiniela() {
    const quinielaDatos = obtenerDatosQuiniela();

    if (!quinielaDatos) {
        alert("Por favor, completa todos los campos del formulario.");
        return;
    }

    try {
        const quinielaDocRef = doc(db, "quiniela", `jornada_${quinielaDatos.jornada}`);
        await setDoc(quinielaDocRef, quinielaDatos);

        alert("Quiniela guardada con éxito");
        document.getElementById("quiniela-form").reset();
    } catch (error) {
        console.error("Error al guardar los datos:", error);
        alert("Hubo un problema al guardar los datos. Por favor, inténtalo de nuevo.");
    }
}

async function guardarResultados() {
    const resultadosDatos = obtenerDatosResultados();

    if (!resultadosDatos) {
        alert("Por favor, completa todos los campos del formulario.");
        return;
    }

    try {
        const resultadosDocRef = doc(db, "resultadosQuiniela", `jornada_${resultadosDatos.jornada}`);
        await setDoc(resultadosDocRef, resultadosDatos);

        alert("Resultados guardados con éxito");
        document.getElementById("resultados-form").reset();
    } catch (error) {
        console.error("Error al guardar los datos:", error);
        alert("Hubo un problema al guardar los datos. Por favor, inténtalo de nuevo.");
    }
}

function obtenerDatosQuiniela() {
    const jornada = document.getElementById("jornada").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;

    const partidos = [];
    for (let i = 1; i <= 14; i++) {
        const equipo1 = document.getElementById(`equipo${i}-1`).value;
        const equipo2 = document.getElementById(`equipo${i}-2`).value;

        if (!equipo1 || !equipo2) {
            return null;
        }

        partidos.push({
            partido: i,
            equipo1,
            equipo2
        });
    }

    return {
        jornada,
        deadline: new Date(`${fecha}T${hora}:00Z`).toISOString(),
        partidos
    };
}

function obtenerDatosResultados() {
    const jornada = document.getElementById("jornada-resultados").value;

    const resultados = [];
    for (let i = 1; i <= 14; i++) {
        const resultado = document.querySelector(`input[name="resultado${i}"]:checked`).value;

        if (!resultado) {
            return null;
        }

        resultados.push({
            partido: i,
            resultado
        });
    }

    return {
        jornada,
        resultados
    };
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