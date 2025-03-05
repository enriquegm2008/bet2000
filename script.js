import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Función para cargar los partidos desde Firestore
async function cargarPartidos() {
    const listaPartidos = document.querySelector(".partidos");
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
}

// Función para cerrar sesión
function logout() {
    signOut(auth).then(() => {
        alert("Has cerrado sesión.");
        showLoginSection();
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
        alert("Error al cerrar sesión: " + error.message);
    });
}

// Función para verificar el estado de autenticación del usuario y mostrar el botón de administración si es necesario
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
                balance.innerText = `$${userDoc.data().saldo}`;
            } else {
                await setDoc(userDocRef, { saldo: 1000 });
                balance.innerText = `$1000`;
            }

            const roleDocRef = doc(db, "roles", user.uid);
            const roleDoc = await getDoc(roleDocRef);
            if (roleDoc.exists() && roleDoc.data().role === "admin") {
                adminLink.style.display = 'inline-block';
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

    // Cargar los partidos al iniciar sesión
    cargarPartidos();
});

// Recargar los partidos cuando se crea uno nuevo desde admin.html
window.addEventListener('storage', (event) => {
    if (event.key === 'reloadPartidos') {
        cargarPartidos();
        window.localStorage.removeItem('reloadPartidos');
    }
});

// Exponer la función logout globalmente para que sea accesible desde el HTML
window.logout = logout;