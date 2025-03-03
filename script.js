// Firebase SDK importado desde el HTML
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Inicializar Firebase (ya configurado en el HTML)
const firebaseConfig = {
    apiKey: "AIzaSyBT3yANkLvpNicR0GIxXsV6kWM62tMeQFQ",
    authDomain: "bet2000-e000a.firebaseapp.com",
    projectId: "bet2000-e000a",
    storageBucket: "bet2000-e000a.firebasestorage.app",
    messagingSenderId: "547808109527",
    appId: "1:547808109527:web:8821956a2edc93a90b2192",
    measurementId: "G-MYWP8TMXH9"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variables Globales
let dinero = 1000; // Valor inicial del dinero en la cuenta

// Función para registrar un nuevo usuario
async function register() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Al registrarse, crear un documento en Firestore para el usuario con un saldo inicial
        await setDoc(doc(db, "users", user.uid), {
            saldo: 1000 // El saldo inicial es 1000 puntos
        });

        alert("Usuario registrado con éxito.");
        showUserSection(user.uid); // Mostrar la sección del usuario
    } catch (error) {
        console.error(error);
        alert("Error al registrarse: " + error.message);
    }
}

// Función para iniciar sesión
async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        alert("Usuario autenticado con éxito.");
        showUserSection(user.uid); // Mostrar la sección del usuario
    } catch (error) {
        console.error(error);
        alert("Error al iniciar sesión: " + error.message);
    }
}

// Función para cerrar sesión
function logout() {
    signOut(auth).then(() => {
        alert("Has cerrado sesión.");
        showLoginSection(); // Mostrar la sección de login/registro
    }).catch((error) => {
        console.error(error);
        alert("Error al cerrar sesión: " + error.message);
    });
}

// Función para mostrar la sección del usuario (con saldo)
function showUserSection(userId) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("register-section").style.display = "none";
    document.getElementById("user-section").style.display = "block";

    // Cargar el saldo del usuario desde Firestore
    cargarSaldo(userId);
}

// Función para mostrar las secciones de Login y Registro
function showLoginSection() {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("register-section").style.display = "block";
    document.getElementById("user-section").style.display = "none";
}

// Función para cargar el saldo desde Firestore
async function cargarSaldo(userId) {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        dinero = docSnap.data().saldo; // Obtener el saldo guardado en Firestore
        document.getElementById("dinero").textContent = dinero;
    } else {
        console.log("No se encontró el documento del usuario.");
    }
}

// Función para realizar una apuesta
function apostarPartido(partido) {
    const cantidadApuesta = parseInt(document.getElementById("cantidad-apuesta").value);
    
    if (cantidadApuesta <= 0) {
        alert("Por favor, ingresa una cantidad válida.");
        return;
    }
    
    if (cantidadApuesta > dinero) {
        alert("No tienes suficiente dinero para hacer esta apuesta.");
        return;
    }

    // Actualizar el dinero disponible
    dinero -= cantidadApuesta;
    document.getElementById("dinero").textContent = dinero;

    // Mostrar el resultado de la apuesta
    const resultado = (Math.random() < 0.5) ? "¡Ganaste!" : "Perdiste...";
    alert(`Apuesta en ${partido} - Apostaste ${cantidadApuesta} puntos. ${resultado}`);
}

// Función para recargar la cuenta con 1000 puntos
function recargarCuenta() {
    dinero = 1000; // Recargamos la cuenta con 1000 puntos
    document.getElementById("dinero").textContent = dinero;
    alert("Tu cuenta ha sido recargada.");
}

// Monitorear el estado de autenticación del usuario
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si hay un usuario autenticado, obtener su ID y mostrar la sección del usuario
        showUserSection(user.uid);
    } else {
        // Si no hay usuario autenticado, mostrar la sección de login/registro
        showLoginSection();
    }
});
