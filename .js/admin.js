
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTOS DEL HTML
    // ==========================================

    const formulario = document.getElementById("form-crear-turno");

    const listaTurnos = document.querySelector(
        ".turnos .lista-turnos-admin"
    );

    const listaReservados = document.querySelector(
        ".turnos-reservados .lista-turnos-admin"
    );

    if (!formulario || !listaTurnos || !listaReservados) return;

    const profesionalInput = document.getElementById("profesional");
    const especialidadInput = document.getElementById("especialidad");
    const fechaInput = document.getElementById("fecha");
    const horaInput = document.getElementById("hora");
    const sedeInput = document.getElementById("sede");
    const comentarioInput = document.getElementById("comentario");

    const botonPublicar = formulario.querySelector(
        "button[type='submit']"
    );

    // ==========================================
    // LOCALSTORAGE
    // ==========================================

    const KEY_TURNOS = "turnosPublicadosAdmin";
    const KEY_RESERVADOS = "turnosReservadosAdmin";

    const turnosIniciales = [
        {
            id: 1,
            profesional: "Dra. María González",
            especialidad: "clinica",
            fecha: "2026-11-23",
            hora: "09:30",
            sede: "sede1",
            comentario: "Consultorio 1"
        },
        {
            id: 2,
            profesional: "Dr. Carlos Ramírez",
            especialidad: "cardiologia",
            fecha: "2026-11-26",
            hora: "11:00",
            sede: "sede2",
            comentario: "Consultorio 3"
        },
        {
            id: 3,
            profesional: "Dra. Laura Medina",
            especialidad: "dermatologia",
            fecha: "2026-12-03",
            hora: "14:30",
            sede: "virtual",
            comentario: "Consulta virtual"
        }
    ];

    const reservadosIniciales = [
        {
            id: 1,
            profesional: "Dra. María González",
            especialidad: "clinica",
            fecha: "2026-11-18",
            hora: "10:00",
            sede: "sede1",
            comentario: "Consultorio 1",
            paciente: "Juan Pérez"
        },
        {
            id: 2,
            profesional: "Dr. Carlos Ramírez",
            especialidad: "cardiologia",
            fecha: "2026-11-20",
            hora: "11:30",
            sede: "sede2",
            comentario: "Consultorio 3",
            paciente: "Ana Rodríguez"
        }
    ];

    function obtenerDatos(clave, datosIniciales) {
        const datosGuardados = localStorage.getItem(clave);

        if (datosGuardados === null) {
            localStorage.setItem(clave, JSON.stringify(datosIniciales));
            return datosIniciales;
        }

        try {
            const datos = JSON.parse(datosGuardados);
            return Array.isArray(datos) ? datos : datosIniciales;
        } catch {
            return datosIniciales;
        }
    }

    let turnos = obtenerDatos(KEY_TURNOS, turnosIniciales);

    let turnosReservados = obtenerDatos(
        KEY_RESERVADOS,
        reservadosIniciales
    );

    let turnoEnEdicion = null;

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    function guardarTurnos() {
        localStorage.setItem(KEY_TURNOS, JSON.stringify(turnos));
    }

    function guardarReservados() {
        localStorage.setItem(
            KEY_RESERVADOS,
            JSON.stringify(turnosReservados)
        );
    }

    function obtenerEspecialidad(valor) {
        const especialidades = {
            clinica: "Clínica médica",
            cardiologia: "Cardiología",
            dermatologia: "Dermatología"
        };

        return especialidades[valor] || valor;
    }

    function obtenerSede(valor) {
        const sedes = {
            sede1: "Sede Lugano",
            sede2: "Sede Ramos Mejía",
            sede3: "Sede San Isidro",
            virtual: "Consulta virtual"
        };

        return sedes[valor] || valor;
    }

    function formatearFecha(fecha) {
        const [anio, mes, dia] = fecha.split("-");
        return `${dia}/${mes}/${anio}`;
    }

    function fechaValida(fecha, hora) {
        const ahora = new Date();
        const seleccionada = new Date(`${fecha}T${hora}:00`);

        return seleccionada > ahora;
    }

    function crearElemento(etiqueta, contenido) {
        const elemento = document.createElement(etiqueta);
        elemento.textContent = contenido;
        return elemento;
    }

    // ==========================================
    // MOSTRAR TURNOS PUBLICADOS
    // ==========================================

    function mostrarTurnos() {

        listaTurnos.innerHTML = "";

        if (turnos.length === 0) {
            listaTurnos.appendChild(
                crearElemento("p", "No hay turnos publicados.")
            );
            return;
        }

        turnos.forEach(turno => {

            const tarjeta = document.createElement("article");
            tarjeta.classList.add("card-turno-admin");

            tarjeta.appendChild(
                crearElemento("h3", obtenerEspecialidad(turno.especialidad))
            );

            tarjeta.appendChild(
                crearElemento("p", turno.profesional)
            );

            tarjeta.appendChild(
                crearElemento(
                    "p",
                    `${formatearFecha(turno.fecha)} · ${turno.hora} hs`
                )
            );

            tarjeta.appendChild(
                crearElemento(
                    "p",
                    `${obtenerSede(turno.sede)} · ${turno.comentario}`
                )
            );

            const botonEliminar = document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.classList.add("button-eliminar");
            botonEliminar.textContent = "Eliminar";
            botonEliminar.dataset.id = turno.id;

            tarjeta.appendChild(botonEliminar);

            listaTurnos.appendChild(tarjeta);
        });
    }

    // ==========================================
    // PUBLICAR NUEVO TURNO
    // ==========================================

    formulario.addEventListener("submit", (e) => {

        e.preventDefault();

        const profesional = profesionalInput.value.trim();
        const especialidad = especialidadInput.value;
        const fecha = fechaInput.value;
        const hora = horaInput.value;
        const sede = sedeInput.value;
        const comentario = comentarioInput.value.trim();

        if (
            !profesional ||
            !especialidad ||
            !fecha ||
            !hora ||
            !sede ||
            !comentario
        ) {
            alert("Completá todos los campos.");
            return;
        }

        if (!fechaValida(fecha, hora)) {
            alert("La fecha y el horario deben ser futuros.");
            return;
        }

        // SI ESTAMOS MODIFICANDO UNA RESERVA
        if (turnoEnEdicion !== null) {

            const turno = turnosReservados.find(
                t => t.id === turnoEnEdicion
            );

            if (!turno) return;

            turno.profesional = profesional;
            turno.especialidad = especialidad;
            turno.fecha = fecha;
            turno.hora = hora;
            turno.sede = sede;
            turno.comentario = comentario;

            guardarReservados();

            turnoEnEdicion = null;

            botonPublicar.textContent = "Publicar turno";

            formulario.reset();

            mostrarReservados();

            alert("¡Turno reservado modificado correctamente!");

            return;
        }

        // PUBLICAR UN NUEVO TURNO

        const nuevoTurno = {
            id: Date.now(),
            profesional,
            especialidad,
            fecha,
            hora,
            sede,
            comentario
        };

        turnos.push(nuevoTurno);

        guardarTurnos();

        mostrarTurnos();

        formulario.reset();

        alert("¡Turno publicado correctamente!");
    });

    // ==========================================
    // ELIMINAR TURNOS PUBLICADOS
    // ==========================================

    listaTurnos.addEventListener("click", (e) => {

        const boton = e.target.closest(".button-eliminar");

        if (!boton) return;

        const id = Number(boton.dataset.id);

        const confirmar = confirm(
            "¿Estás segura de que querés eliminar este turno?"
        );

        if (!confirmar) return;

        turnos = turnos.filter(turno => turno.id !== id);

        guardarTurnos();

        mostrarTurnos();

        alert("Turno eliminado correctamente.");
    });

    // ==========================================
    // MOSTRAR TURNOS RESERVADOS
    // ==========================================

    function mostrarReservados() {

        listaReservados.innerHTML = "";

        if (turnosReservados.length === 0) {
            listaReservados.appendChild(
                crearElemento("p", "No hay turnos reservados.")
            );
            return;
        }

        turnosReservados.forEach(turno => {

            const tarjeta = document.createElement("article");
            tarjeta.classList.add("card-turno-admin");

            tarjeta.appendChild(
                crearElemento("h3", obtenerEspecialidad(turno.especialidad))
            );

            tarjeta.appendChild(
                crearElemento("p", turno.profesional)
            );

            tarjeta.appendChild(
                crearElemento(
                    "p",
                    `${formatearFecha(turno.fecha)} · ${turno.hora} hs`
                )
            );

            tarjeta.appendChild(
                crearElemento(
                    "p",
                    `${obtenerSede(turno.sede)} · ${turno.comentario}`
                )
            );

            tarjeta.appendChild(
                crearElemento("p", `Paciente: ${turno.paciente}`)
            );

            const botonModificar = document.createElement("button");

            botonModificar.type = "button";
            botonModificar.classList.add("button-modificar");
            botonModificar.textContent = "Modificar";
            botonModificar.dataset.id = turno.id;

            tarjeta.appendChild(botonModificar);

            listaReservados.appendChild(tarjeta);
        });
    }

    // ==========================================
    // MODIFICAR TURNO RESERVADO
    // ==========================================

    listaReservados.addEventListener("click", (e) => {

        const boton = e.target.closest(".button-modificar");

        if (!boton) return;

        const id = Number(boton.dataset.id);

        const turno = turnosReservados.find(
            t => t.id === id
        );

        if (!turno) return;

        turnoEnEdicion = id;

        // CARGAR LOS DATOS EN EL FORMULARIO

        profesionalInput.value = turno.profesional;
        especialidadInput.value = turno.especialidad;
        fechaInput.value = turno.fecha;
        horaInput.value = turno.hora;
        sedeInput.value = turno.sede;
        comentarioInput.value = turno.comentario;

        botonPublicar.textContent = "Guardar cambios";

        formulario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    // ==========================================
    // CANCELAR EDICIÓN AL LIMPIAR EL FORMULARIO
    // ==========================================

    formulario.addEventListener("reset", () => {

        turnoEnEdicion = null;

        botonPublicar.textContent = "Publicar turno";
    });

    // ==========================================
    // FECHA MÍNIMA
    // ==========================================

    const hoy = new Date();

    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    fechaInput.min = `${anio}-${mes}-${dia}`;

    // ==========================================
    // CARGAR INFORMACIÓN AL INICIAR
    // ==========================================

    mostrarTurnos();

    mostrarReservados();

});
