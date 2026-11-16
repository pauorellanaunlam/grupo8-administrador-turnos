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

//pagina mis turnos

document.addEventListener("DOMContentLoaded", () => {
    const agendaListado = document.querySelector(".agenda-listado");
    const historialTurnos = document.querySelector(".historial-turnos");
    const contadorAgenda = document.querySelector(".agenda-total");
    const contadorHistorial = document.querySelector(".historial-total");

    function actualizarContadores() {
        if (agendaListado && contadorAgenda) {
            const totalAgenda = agendaListado.querySelectorAll(".agenda-item").length;
            const texto = totalAgenda === 1 ? "próximo turno" : "próximos turnos";
            contadorAgenda.textContent = `${String(totalAgenda).padStart(2, "0")} ${texto}`;
        }

        if (historialTurnos && contadorHistorial) {
            const totalHistorial = historialTurnos.querySelectorAll(".historial-registro").length;
            const texto = totalHistorial === 1 ? "registro" : "registros";
            contadorHistorial.textContent = `${String(totalHistorial).padStart(2, "0")} ${texto}`;
        }
    }

    function agregarAHistorial(turno) {
        if (!historialTurnos) return;

        const registro = document.createElement("div");
        registro.className = "historial-registro";
        registro.style.marginTop = "12px";

        registro.innerHTML = `
            <div class="historial-fecha">
                <strong>${turno.diaNumero}</strong>
                <span>${turno.mesCorto}</span>
            </div>

            <div class="historial-detalle">
                <strong>${turno.profesional}</strong>
                <span>${turno.especialidad} · ${turno.descripcion}</span>
            </div>

            <span class="estado-cancelado">Cancelado</span>

            <a href="solicitarturnos.html">
                Volver a solicitar →
            </a>
        `;

        historialTurnos.appendChild(registro);
    }
    const botonesCancelar = document.querySelectorAll(".button-cancelar-turno");

    botonesCancelar.forEach(boton => {
        boton.addEventListener("click", () => {
            const tarjeta = boton.closest(".agenda-item");
            if (!confirm("¿Querés cancelar este turno?")) return;

            const turnoCancelado = {
                diaNumero: tarjeta.querySelector(".agenda-calendario strong").textContent.trim(),
                mesCorto: tarjeta.querySelector(".agenda-calendario small").textContent.trim(),
                especialidad: tarjeta.querySelector(".agenda-categoria").textContent.trim(),
                profesional: tarjeta.querySelector(".agenda-descripcion h3").textContent.trim(),
                descripcion: tarjeta.querySelector(".agenda-descripcion p").textContent.trim()
            };

            tarjeta.remove();
            agregarAHistorial(turnoCancelado);
            actualizarContadores();
        });
    });
});
