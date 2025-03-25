import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
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

document.addEventListener('DOMContentLoaded', function () {
    const quinielaBody = document.getElementById('quinielaBody');
    const jornadaSelect = document.getElementById('jornadaSelect');
    const fechaLimiteElement = document.querySelector('.quiniela-deadline');
    const countdownElement = document.querySelector('.countdown');
    const mensajeElement = document.getElementById('mensaje');
    const prevColumnBtn = document.getElementById('prevColumnBtn');
    const nextColumnBtn = document.getElementById('nextColumnBtn');
    const navigationButtons = document.getElementById('navigationButtons');
    let currentColumn = 1;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Obtener el nombre de usuario desde la colección users
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                const username = userDoc.exists() ? userDoc.data().username : "null";

                // Obtener las jornadas en las que el usuario ha apostado
                const apuestasRef = collection(db, "apuestaQuiniela");
                const apuestasSnapshot = await getDocs(apuestasRef);
                const userJornadas = apuestasSnapshot.docs
                    .filter(doc => doc.id.startsWith(`${username}_`))
                    .map(doc => doc.id.split('_')[1]); // Extraer el número de la jornada del nombre del documento

                if (userJornadas.length === 0) {
                    console.error("No hay apuestas del usuario disponibles.");
                    return;
                }

                userJornadas.forEach((jornada) => {
                    const option = document.createElement('option');
                    option.value = jornada;
                    option.textContent = `Jornada ${jornada}`;
                    jornadaSelect.appendChild(option);
                });

                // Manejar el cambio de jornada seleccionada
                jornadaSelect.addEventListener('change', async function () {
                    const jornada = jornadaSelect.value;
                    if (!jornada) {
                        fechaLimiteElement.style.display = 'none';
                        countdownElement.style.display = 'none';
                        navigationButtons.style.display = 'none'; // Ocultar botones de navegación
                        return;  // Si no se ha seleccionado ninguna jornada, no hacer nada
                    }

                    const quinielaDocRef = doc(db, "quiniela", `jornada_${jornada}`);
                    const quinielaDoc = await getDoc(quinielaDocRef);

                    if (!quinielaDoc.exists()) {
                        console.error(`No hay datos disponibles para la jornada ${jornada}.`);
                        return;
                    }

                    const { partidos, deadline } = quinielaDoc.data();

                    // Obtener los resultados del usuario para la jornada seleccionada
                    const userApuestaDocRef = doc(db, "apuestaQuiniela", `${username}_${jornada}`);
                    const userApuestaDoc = await getDoc(userApuestaDocRef);
                    const columnasSeleccionadas = userApuestaDoc.exists() ? userApuestaDoc.data().columnasSeleccionadas : [];

                    if (deadline) {
                        document.getElementById('deadline').innerText = new Date(deadline).toLocaleString();
                        fechaLimiteElement.style.display = 'block';
                        countdownElement.style.display = 'block';
                        // Mostrar la fecha límite
                        const isPastDeadline = new Date() > new Date(deadline);
                        mostrarCuentaAtras(deadline, isPastDeadline);
                    } else {
                        fechaLimiteElement.style.display = 'none';
                        countdownElement.style.display = 'none';
                    }

                    // Limpiar el cuerpo de la tabla
                    quinielaBody.innerHTML = '';

                    // Crear las cabeceras de las columnas seleccionadas
                    const headerRow = document.createElement('tr');
                    headerRow.innerHTML = `<th class="bloques"></th>`;
                    columnasSeleccionadas.forEach(col => {
                        headerRow.innerHTML += `<th class="double-border" data-column="${col}">${col}</th>`;
                    });
                    quinielaBody.appendChild(headerRow);

                    partidos.forEach((partido, i) => {
                        const row = document.createElement('tr');
                        const { equipo1, equipo2 } = partido;

                        // Crear la celda de equipos con puntos hasta el número del partido
                        const equiposCell = document.createElement('td');
                        equiposCell.className = 'equipo';
                        equiposCell.innerHTML = `<div class="label-container">${equipo1} - ${equipo2}<span class="dots"></span><span class="partido-num">${i + 1}</span></div>`;
                        row.appendChild(equiposCell);

                        columnasSeleccionadas.forEach(col => {
                            const cell = document.createElement('td');
                            cell.setAttribute('data-column', col);

                            const resultados = userApuestaDoc.data().resultados || {};
                            const resultado = resultados[`partido${i + 1}_columna${col}`] || '';
                            const checked1 = resultado === '1' ? 'checked' : '';
                            const checkedX = resultado === 'X' ? 'checked' : '';
                            const checked2 = resultado === '2' ? 'checked' : '';

                            cell.innerHTML = `
                                <input type="radio" id="partido${i + 1}_columna${col}_1" name="partido${i + 1}_columna${col}" value="1" ${checked1} disabled>
                                <label for="partido${i + 1}_columna${col}_1">1</label>
                                <input type="radio" id="partido${i + 1}_columna${col}_X" name="partido${i + 1}_columna${col}" value="X" ${checkedX} disabled>
                                <label for="partido${i + 1}_columna${col}_X">X</label>
                                <input type="radio" id="partido${i + 1}_columna${col}_2" name="partido${i + 1}_columna${col}" value="2" ${checked2} disabled>
                                <label for="partido${i + 1}_columna${col}_2">2</label>`;

                            row.appendChild(cell);
                        });

                        if (i === 3 || i === 7 || i === 10) {
                            row.classList.add('border-strong');
                        }

                        quinielaBody.appendChild(row);
                    });

                    // Add a strong border after the last row
                    const afterLastRow = document.createElement('tr');
                    afterLastRow.classList.add('border-strong');
                    quinielaBody.appendChild(afterLastRow);

                    // Ajustar las líneas fuertes para que terminen en la última columna apostada
                    const strongBorders = document.querySelectorAll('.border-strong td');
                    strongBorders.forEach(cell => {
                        if (parseInt(cell.getAttribute('data-column')) > Math.max(...columnasSeleccionadas)) {
                            cell.classList.remove('border-strong');
                        }
                    });

                    updateColumnVisibility();
                    navigationButtons.style.display = 'flex'; // Mostrar botones de navegación
                });

                // Disparar el evento de cambio para cargar la primera jornada al inicio
                jornadaSelect.dispatchEvent(new Event('change'));
            } catch (error) {
                console.error("Error al cargar las jornadas:", error);
            }
        } else {
            console.error("Usuario no autenticado.");
        }
    });

    prevColumnBtn.addEventListener('click', () => {
        currentColumn--;
        updateColumnVisibility();
    });

    nextColumnBtn.addEventListener('click', () => {
        currentColumn++;
        updateColumnVisibility();
    });

    function updateColumnVisibility() {
        const columns = document.querySelectorAll('[data-column]');
        const maxColumn = Math.max(...Array.from(columns).map(col => parseInt(col.getAttribute('data-column'))));
        columns.forEach(column => {
            const columnIndex = parseInt(column.getAttribute('data-column'));
            if (columnIndex === currentColumn) {
                column.style.display = 'table-cell';
            } else {
                column.style.display = 'none';
            }
        });

        prevColumnBtn.disabled = currentColumn === 1;
        nextColumnBtn.disabled = currentColumn === maxColumn;
    }

    // Función para mostrar la cuenta atrás
    function mostrarCuentaAtras(deadline, isPastDeadline) {
        const countdownElement = document.getElementById('countdown');
        const deadlineDate = new Date(deadline);

        function actualizarCuentaAtras() {
            const now = new Date();
            const tiempoRestante = deadlineDate - now;

            if (tiempoRestante <= 0) {
                clearInterval(intervalo);
                countdownElement.innerText = "Quiniela terminada. Se agotó el tiempo de apuesta.";
                return;
            }

            const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
            const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));

            countdownElement.innerText = `${horas}h ${minutos}m`;
        }

        if (isPastDeadline) {
            countdownElement.innerText = "Quiniela terminada. Se agotó el tiempo de apuesta.";
            return;
        }

        actualizarCuentaAtras(); // Actualizar inmediatamente
        const intervalo = setInterval(actualizarCuentaAtras, 60000); // Actualizar cada minuto
    }

    // Función para mostrar mensajes
    function mostrarMensaje(mensaje, tipo) {
        mensajeElement.innerText = mensaje;
        mensajeElement.className = tipo;
        mensajeElement.style.display = 'block';
        setTimeout(() => {
            mensajeElement.style.display = 'none';
        }, 5000);
    }
});