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
    const tableContainer = document.getElementById('tableContainer');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Cargar jornadas desde Firestore y llenar el select
                const resultadosSnapshot = await getDocs(collection(db, "resultadosQuiniela"));
                const resultadosData = resultadosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    jornada: doc.id.split('_')[1]  // Extraer el número de la jornada del nombre del documento
                }));

                if (resultadosData.length === 0) {
                    console.error("No hay datos de resultados disponibles.");
                    return;
                }

                resultadosData.forEach((resultado) => {
                    const option = document.createElement('option');
                    option.value = resultado.jornada;
                    option.textContent = `Jornada ${resultado.jornada}`;
                    jornadaSelect.appendChild(option);
                });

                // Manejar el cambio de jornada seleccionada
                jornadaSelect.addEventListener('change', async function () {
                    const jornada = jornadaSelect.value;
                    if (!jornada) {
                        tableContainer.style.display = 'none';
                        return;  // Si no se ha seleccionado ninguna jornada, no hacer nada
                    }

                    tableContainer.style.display = 'block';

                    const resultadosDocRef = doc(db, "resultadosQuiniela", `jornada_${jornada}`);
                    const resultadosDoc = await getDoc(resultadosDocRef);

                    if (!resultadosDoc.exists()) {
                        console.error(`No hay datos disponibles para la jornada ${jornada}.`);
                        return;
                    }

                    const quinielaDocRef = doc(db, "quiniela", `jornada_${jornada}`);
                    const quinielaDoc = await getDoc(quinielaDocRef);

                    if (!quinielaDoc.exists()) {
                        console.error(`No hay datos de equipos disponibles para la jornada ${jornada}.`);
                        return;
                    }

                    const { partidos } = quinielaDoc.data();
                    const { resultados } = resultadosDoc.data();

                    // Limpiar el cuerpo de la tabla
                    quinielaBody.innerHTML = '';

                    partidos.forEach((partido, i) => {
                        const row = document.createElement('tr');
                        const { equipo1, equipo2 } = partido;

                        // Crear la celda de equipos con puntos hasta el número del partido
                        const equiposCell = document.createElement('td');
                        equiposCell.className = 'equipo';
                        equiposCell.innerHTML = `<div class="label-container">${equipo1} - ${equipo2}<span class="dots"></span><span class="partido-num">${i + 1}</span></div>`;
                        row.appendChild(equiposCell);

                        const cell = document.createElement('td');
                        cell.setAttribute('data-column', 1);

                        const result = resultados.find(r => r.partido === i + 1);
                        const selectedValue = result ? result.resultado : null;

                        cell.innerHTML = `
                            <input type="radio" id="partido${i + 1}_columna1_1" name="partido${i + 1}_columna1" value="1" disabled ${selectedValue === '1' ? 'checked' : ''}>
                            <label for="partido${i + 1}_columna1_1">1</label>
                            <input type="radio" id="partido${i + 1}_columna1_X" name="partido${i + 1}_columna1" value="X" disabled ${selectedValue === 'X' ? 'checked' : ''}>
                            <label for="partido${i + 1}_columna1_X">X</label>
                            <input type="radio" id="partido${i + 1}_columna1_2" name="partido${i + 1}_columna1" value="2" disabled ${selectedValue === '2' ? 'checked' : ''}>
                            <label for="partido${i + 1}_columna1_2">2</label>`;
                        row.appendChild(cell);

                        quinielaBody.appendChild(row);
                    });
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
});