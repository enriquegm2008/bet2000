let saldo = 1000;

function apostar() {
    let apuesta = prompt("¿Cuántos puntos quieres apostar?");
    
    if (apuesta === null || apuesta === "") {
        alert("Apuesta cancelada.");
        return;
    }

    apuesta = parseInt(apuesta);

    if (isNaN(apuesta) || apuesta <= 0) {
        alert("Ingresa un número válido.");
        return;
    }

    if (apuesta > saldo) {
        alert("No tienes suficiente saldo.");
        return;
    }

    // Simulación de apuesta (50% de ganar o perder)
    let resultado = Math.random() < 0.5 ? "ganaste" : "perdiste";

    if (resultado === "ganaste") {
        saldo += apuesta;
        alert(`¡Felicidades! Ganaste ${apuesta} puntos.`);
    } else {
        saldo -= apuesta;
        alert(`Lo siento, perdiste ${apuesta} puntos.`);
    }

    document.getElementById("saldo").textContent = saldo;
}
