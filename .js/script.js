const botonTema = document.getElementById("boton-tema");

botonTema.addEventListener("click", function() {

    document.body.classList.toggle("modo-oscuro");

    if (document.body.classList.contains("modo-oscuro")) {
        botonTema.textContent = "Modo claro";
    } else {
        botonTema.textContent = "Modo oscuro";
    }

});


/* pagina usuario */

const contenedorProfesionales = document.getElementById('lista-profesionales');
const botonesVista = document.querySelectorAll('.selector-vista [data-vista]');

if (contenedorProfesionales && botonesVista.length) {
    function aplicarVista(vista) {
        contenedorProfesionales.classList.toggle('vista-lista', vista === 'lista');
        botonesVista.forEach(boton => {
            boton.classList.toggle('activo', boton.dataset.vista === vista);
        });
        try {
            localStorage.setItem('vistaProfesionales', vista);
        } catch (e) { /* almacenamiento no disponible */ }
    }

    botonesVista.forEach(boton => {
        boton.addEventListener('click', () => aplicarVista(boton.dataset.vista));
    });

    let guardada = 'tarjetas';
    try {
        guardada = localStorage.getItem('vistaProfesionales') || 'tarjetas';
    } catch (e) {}
    aplicarVista(guardada);
}