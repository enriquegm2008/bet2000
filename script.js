let dinero = 1000;

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

function recargarCuenta() {
    dinero = 1000; // Recargamos la cuenta con 1000 puntos
    document.getElementById("dinero").textContent = dinero;
    alert("Tu cuenta ha sido recargada.");
}
