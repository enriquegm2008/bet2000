// Esperar a que el header y footer se hayan cargado
document.addEventListener("DOMContentLoaded", function() {
    loadHeader();
    loadFooter();
  });
  
  function loadHeader() {
    fetch("hyf/header/header.html")
      .then(response => response.text())
      .then(data => {
        document.getElementById("header-placeholder").innerHTML = data;
        initHeader(); // Inicializar el header una vez que esté cargado
      })
      .catch(error => console.error("Error al cargar el header:", error));
  }
  
  function loadFooter() {
    fetch("hyf/footer/footer.html")
      .then(response => response.text())
      .then(data => {
        document.getElementById("footer-placeholder").innerHTML = data;
      })
      .catch(error => console.error("Error al cargar el footer:", error));
  }
  
  function initHeader() {
    // Marcar el enlace activo en el header
    const currentPath = window.location.pathname;
    const centerNavLinks = document.querySelectorAll(".center-nav a");
  
    centerNavLinks.forEach(link => {
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
      }
    });
  }