import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Función para alternar el menú desplegable
window.toggleDropdown = function() {
    const dropdownMenu = document.getElementById("dropdown-menu");
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
};

// Función para alternar opciones
window.toggleOptions = function(optionsId) {
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
window.toggleGuestMenu = function() {
    const guestMenu = document.getElementById("guest-menu");
    guestMenu.style.display = guestMenu.style.display === "block" ? "none" : "block";
};

// Función para cerrar sesión
window.logout = async function() {
    try {
        await signOut(auth);
        alert("Has cerrado sesión.");
        window.location.href = '/claves/iniciosesion/iniciar-sesion.html';
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("Error al cerrar sesión: " + error.message);
    }
};

// Inicializar el header
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
    window.onclick = function(event) {
        if (!event.target.matches('.logo') && !event.target.matches('.menu-icon')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.style.display === "block") {
                    openDropdown.style.display = "none";
                }
            }
        }
    };
}