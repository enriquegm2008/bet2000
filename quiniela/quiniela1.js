import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
    const tableContainer = document.getElementById('tableContainer');
    const submitContainer = document.getElementById('submitContainer');
    const submitButton = document.querySelector('button[type="submit"]');
    const mensajeElement = document.getElementById('mensaje');
    const columnas = 8;
    let currentColumn = 1;
    let userSaldo = 0;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Obtener el nombre de usuario y saldo desde la colección users
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                const username = userDoc.exists() ? userDoc.data().username : "null";
                userSaldo = userDoc.data().saldo || 0;

                // Cargar jornadas desde Firestore y llenar el select
                const quinielaSnapshot = await getDocs(collection(db, "quiniela"));
                const quinielaData = quinielaSnapshot.docs.map(doc => ({
                    id: doc.id,
                    jornada: doc.id.split('_')[1]  // Extraer el número de la jornada del nombre del documento
                }));

                if (quinielaData.length === 0) {
                    console.error("No hay datos de quiniela disponibles.");
                    return;
                }

                quinielaData.forEach((quiniela) => {
                    const option = document.createElement('option');
                    option.value = quiniela.jornada;
                    option.textContent = `Jornada ${quiniela.jornada}`;
                    jornadaSelect.appendChild(option);
                });

                // Manejar el cambio de jornada seleccionada
                jornadaSelect.addEventListener('change', async function () {
                    const jornada = jornadaSelect.value;
                    if (!jornada) {
                        fechaLimiteElement.style.display = 'none';
                        countdownElement.style.display = 'none';
                        tableContainer.style.display = 'none';
                        submitContainer.style.display = 'none';
                        return;  // Si no se ha seleccionado ninguna jornada, no hacer nada
                    }

                    const quinielaDocRef = doc(db, "quiniela", `jornada_${jornada}`);
                    const quinielaDoc = await getDoc(quinielaDocRef);

                    if (!quinielaDoc.exists()) {
                        console.error(`No hay datos disponibles para la jornada ${jornada}.`);
                        return;
                    }

                    const { partidos, deadline } = quinielaDoc.data();

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

                    // Add a strong border before the first row
                    const beforeFirstRow = document.createElement('tr');
                    beforeFirstRow.classList.add('border-strong');
                    quinielaBody.appendChild(beforeFirstRow);

                    partidos.forEach((partido, i) => {
                        const row = document.createElement('tr');
                        const { equipo1, equipo2 } = partido;

                        // Crear la celda de equipos con puntos hasta el número del partido
                        const equiposCell = document.createElement('td');
                        equiposCell.className = 'equipo';
                        equiposCell.innerHTML = `<div class="label-container">${equipo1} - ${equipo2}<span class="dots"></span><span class="partido-num">${i + 1}</span></div>`;
                        row.appendChild(equiposCell);

                        for (let j = 1; j <= columnas; j++) {
                            const cell = document.createElement('td');
                            cell.setAttribute('data-column', j);
                            cell.innerHTML = `
                                <input type="radio" id="partido${i + 1}_columna${j}_1" name="partido${i + 1}_columna${j}" value="1">
                                <label for="partido${i + 1}_columna${j}_1">1</label>
                                <input type="radio" id="partido${i + 1}_columna${j}_X" name="partido${i + 1}_columna${j}" value="X">
                                <label for="partido${i + 1}_columna${j}_X">X</label>
                                <input type="radio" id="partido${i + 1}_columna${j}_2" name="partido${i + 1}_columna${j}" value="2">
                                <label for="partido${i + 1}_columna${j}_2">2</label>`;
                            if (new Date() > new Date(deadline)) {
                                cell.querySelectorAll('input').forEach(input => input.disabled = true);
                            }
                            row.appendChild(cell);
                        }

                        if (i === 3 || i === 7 || i === 10) {
                            row.classList.add('border-strong');
                        }

                        quinielaBody.appendChild(row);
                    });

                    // Add a strong border after the last row
                    const afterLastRow = document.createElement('tr');
                    afterLastRow.classList.add('border-strong');
                    quinielaBody.appendChild(afterLastRow);

                    if (new Date() > new Date(deadline)) {
                        submitContainer.style.display = 'none'; // Ocultar el botón de enviar
                    } else {
                        submitContainer.style.display = 'block'; // Mostrar el botón de enviar si el tiempo no ha pasado
                    }

                    tableContainer.style.display = 'block'; // Mostrar el contenedor de la tabla
                    showColumn(currentColumn);
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

    document.getElementById('quinielaForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const results = {};
        const selectedColumns = [];

        formData.forEach((value, key) => {
            if (key === 'columnas') {
                selectedColumns.push(value);
            } else {
                results[key] = value;
            }
        });

        // Validar que se seleccionaron al menos 2 columnas completas
        const completeColumns = selectedColumns.filter(column => isColumnComplete(column));

        if (completeColumns.length < 2) {
            mostrarMensaje('Por favor, selecciona al menos 2 columnas completas para realizar la apuesta.', 'error');
            return;
        }

        console.log('Resultados de la quiniela:', results);
        console.log('Columnas seleccionadas:', selectedColumns);

        // Guardar los resultados y las columnas seleccionadas en Firestore
        try {
            const jornada = jornadaSelect.value;
            const user = auth.currentUser;

            if (!user) {
                console.error("Usuario no autenticado.");
                return;
            }

            // Obtener el nombre de usuario desde la colección users
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            const username = userDoc.exists() ? userDoc.data().username : "null";

            const userApuestaRef = doc(db, "apuestaQuiniela", `${username}_${jornada}`);
            await setDoc(userApuestaRef, {
                jornada: jornada,
                resultados: results,
                columnasSeleccionadas: selectedColumns,
                timestamp: new Date()
            }, { merge: true });

            // Actualizar el saldo del usuario
            const totalValue = completeColumns.length * 0.75;
            const newSaldo = userSaldo - totalValue;

            if (newSaldo < 0) {
                mostrarMensaje('No tienes suficiente saldo para completar la apuesta.', 'error');
                return;
            }

            await updateDoc(userDocRef, { saldo: newSaldo });
            mostrarMensaje(`Apuesta guardada exitosamente. Saldo restante: ${newSaldo.toFixed(2)}€`, 'success');
        } catch (error) {
            console.error("Error al guardar la apuesta:", error);
            mostrarMensaje('Error al guardar la apuesta. Por favor, inténtalo de nuevo.', 'error');
        }
    });

    document.getElementById('prevColumn').addEventListener('click', function () {
        if (currentColumn > 1) {
            currentColumn--;
            showColumn(currentColumn);
        }
    });

    document.getElementById('nextColumn').addEventListener('click', function () {
        if (currentColumn < columnas) {
            currentColumn++;
            showColumn(currentColumn);
        }
    });

    document.querySelectorAll('input[name="columnas"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSubmitButtonText);
    });

    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', checkColumnCompletion);
    });

    function showColumn(columnNumber) {
        const allColumns = document.querySelectorAll('[data-column]');
        allColumns.forEach(col => {
            if (col.getAttribute('data-column') == columnNumber) {
                col.style.display = 'table-cell';
            } else {
                col.style.display = 'none';
            }
        });
    }

    function updateSubmitButtonText() {
        const selectedColumns = Array.from(document.querySelectorAll('input[name="columnas"]:checked'));
        const completeColumns = selectedColumns.filter(column => isColumnComplete(column.value));
        const totalValue = completeColumns.length * 0.75;
        submitButton.textContent = `Enviar Quiniela +${totalValue.toFixed(2)}€`;
    }

    function checkColumnCompletion() {
        const columns = Array.from(document.querySelectorAll('th[data-column]'));
        columns.forEach(column => {
            const columnNumber = column.getAttribute('data-column');
            const checkbox = document.querySelector(`input[name="columnas"][value="${columnNumber}"]`);
            if (isColumnComplete(columnNumber)) {
                checkbox.disabled = false; // Habilitar la casilla si la columna está completa
            } else {
                checkbox.disabled = true; // Deshabilitar la casilla si la columna no está completa
            }
        });
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

// Función para verificar si una columna está completamente seleccionada
function isColumnComplete(columnNumber) {
    const radioGroups = document.querySelectorAll(`input[name^="partido"][name$="_columna${columnNumber}"]`);
    for (const group of radioGroups) {
        if (!document.querySelector(`input[name="${group.name}"]:checked`)) {
            return false;
        }
    }
    return true;
}