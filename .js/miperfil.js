


document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // EDITAR PERFIL
    // ==========================================

    const botonEditar = document.getElementById("editar-perfil");

    const campos = {
        nombre: document.getElementById("nombre-perfil"),
        dni: document.getElementById("dni-perfil"),
        correo: document.getElementById("correo-perfil"),
        telefono: document.getElementById("telefono-perfil"),
        nacimiento: document.getElementById("nacimiento-perfil"),
        domicilio: document.getElementById("domicilio-perfil")
    };

    const nombrePresentacion = document.getElementById("nombre-presentacion");

    if (botonEditar && Object.values(campos).every(campo => campo)) {

        const datosGuardados = localStorage.getItem("datosPerfil");

        if (datosGuardados) {
            try {
                const datos = JSON.parse(datosGuardados);

                Object.keys(campos).forEach(clave => {
                    if (datos[clave] !== undefined) {
                        campos[clave].textContent = datos[clave];
                    }
                });

                if (nombrePresentacion && datos.nombre) {
                    nombrePresentacion.textContent = datos.nombre;
                }

            } catch (error) {
                console.error("Error al recuperar los datos:", error);
            }
        }

        let editando = false;

        botonEditar.addEventListener("click", () => {

            if (!editando) {

                Object.keys(campos).forEach(clave => {

                    const valor = campos[clave].textContent;

                    const input = document.createElement("input");
                    input.type = "text";
                    input.value = valor;
                    input.classList.add("input-editar-perfil");

                    campos[clave].textContent = "";
                    campos[clave].appendChild(input);

                });

                botonEditar.textContent = "Guardar cambios";
                editando = true;

            } else {

                const nuevosDatos = {};
                let camposValidos = true;

                Object.keys(campos).forEach(clave => {

                    const input = campos[clave].querySelector("input");
                    const valor = input.value.trim();

                    if (valor === "") {
                        camposValidos = false;
                    }

                    nuevosDatos[clave] = valor;

                });

                if (!camposValidos) {
                    alert("Completá todos los campos antes de guardar.");
                    return;
                }

                Object.keys(campos).forEach(clave => {
                    campos[clave].textContent = nuevosDatos[clave];
                });

                localStorage.setItem(
                    "datosPerfil",
                    JSON.stringify(nuevosDatos)
                );

                if (nombrePresentacion) {
                    nombrePresentacion.textContent = nuevosDatos.nombre;
                }

                botonEditar.textContent = "✎ Editar perfil";
                editando = false;

                alert("¡Tus datos se actualizaron correctamente!");

            }

        });

    }


    // ==========================================
    // MENÚ LATERAL
    // ==========================================

    const enlacesMenu = document.querySelectorAll(".menu-lateral-perfil a");

    enlacesMenu.forEach(enlace => {

        const href = enlace.getAttribute("href");

        if (href) {

            const paginaActual = window.location.pathname.split("/").pop();
            const paginaEnlace = href.split("/").pop();

            if (paginaActual === paginaEnlace) {
                enlace.classList.add("activo");
            }

        }

    });


    // ==========================================
    // PROFESIONALES
    // ==========================================

    const profesionales = [
        {
            id: 1,
            nombre: "Dra. María González",
            especialidad: "Clínica médica"
        },
        {
            id: 2,
            nombre: "Dr. Carlos Ramírez",
            especialidad: "Cardiología"
        },
        {
            id: 3,
            nombre: "Dra. Laura Medina",
            especialidad: "Dermatología"
        },
        {
            id: 4,
            nombre: "Dr. Pablo Giménez",
            especialidad: "Clínica médica"
        },
        {
            id: 5,
            nombre: "Dra. Laura Martínez",
            especialidad: "Cardiología"
        },
        {
            id: 6,
            nombre: "Dr. Andrés Vega",
            especialidad: "Dermatología"
        }
    ];


    // ==========================================
    // MOSTRAR MÉDICOS FAVORITOS
    // ==========================================

    function mostrarFavoritosPerfil() {

        const contenedor = document.getElementById("lista-favoritos-perfil");

        if (!contenedor) return;

        let favoritos = [];

        try {
            favoritos = JSON.parse(
                localStorage.getItem("profesionalesFavoritos")
            ) || [];
        } catch (error) {
            console.error("Error al recuperar favoritos:", error);
        }

        const medicosFavoritos = profesionales.filter(medico =>
            favoritos.includes(medico.id)
        );

        if (medicosFavoritos.length === 0) {
            contenedor.innerHTML = "<p>No tenés médicos favoritos todavía.</p>";
            return;
        }

        contenedor.innerHTML = medicosFavoritos.map(medico => {

            const iniciales = medico.nombre
                .replace("Dra. ", "")
                .replace("Dr. ", "")
                .split(" ")
                .map(palabra => palabra[0])
                .slice(0, 2)
                .join("");

            return `
                <article class="medico-favorito-perfil">

                    <div class="avatar-medico-perfil">
                        ${iniciales}
                    </div>

                    <div class="datos-medico-perfil">
                        <h4>${medico.nombre}</h4>
                        <p>${medico.especialidad}</p>
                    </div>

                    <span class="corazon-favorito">♥</span>

                    <a href="solicitarturnos.html?profesional=${medico.id}"
                       class="button-solicitar-perfil">
                        Solicitar turno
                    </a>

                </article>
            `;

        }).join("");

    }


    // ==========================================
    // OBTENER PRÓXIMOS TURNOS
    // ==========================================

    function obtenerProximosTurnos() {

        let turnos = [];

        try {
            turnos = JSON.parse(
                localStorage.getItem("turnos")
            ) || [];
        } catch (error) {
            console.error("Error al recuperar turnos:", error);
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        return turnos.filter(turno => {

            if (!turno.fecha) return false;

            const fecha = new Date(turno.fecha + "T00:00:00");

            if (isNaN(fecha.getTime()) || fecha < hoy) {
                return false;
            }

            const estado = (turno.estado || "").toLowerCase();

            if (
                estado.includes("cancelado") ||
                estado.includes("rechazado")
            ) {
                return false;
            }

            return true;

        }).sort((a, b) => {

            return new Date(a.fecha) - new Date(b.fecha);

        });

    }


    // ==========================================
    // MOSTRAR PRÓXIMA CONSULTA
    // ==========================================

    function mostrarProximaConsulta() {

        const contenedor = document.getElementById("proxima-consulta-perfil");

        if (!contenedor) return;

        const proximos = obtenerProximosTurnos();

        if (proximos.length === 0) {

            contenedor.innerHTML = `
                <p>No tenés próximos turnos reservados.</p>
            `;

            return;
        }

        const turno = proximos[0];

        const fecha = new Date(turno.fecha + "T00:00:00");

        const dia = fecha.getDate();

        const mes = fecha.toLocaleDateString("es-AR", {
            month: "short"
        }).replace(".", "").toUpperCase();

        contenedor.innerHTML = `
            <article class="consulta-perfil">

                <div class="fecha-consulta">
                    <strong>${dia}</strong>
                    <span>${mes}</span>
                </div>

                <div class="datos-consulta">

                    <h4>${turno.especialidad || "Consulta médica"}</h4>

                    <p>
                        ${turno.medico || turno.profesional || "Profesional médico"}
                    </p>

                    <span>${turno.hora || ""}</span>

                </div>

                <span class="estado-consulta">
                    ${turno.estado || "Reservado"}
                </span>

            </article>
        `;

    }


    // ==========================================
    // ACTUALIZAR ESTADÍSTICAS
    // ==========================================

    function actualizarEstadisticas() {

        const contadorProximos = document.getElementById("contador-proximos");
        const contadorFavoritos = document.getElementById("contador-favoritos");

        // CONTADOR DE FAVORITOS

        let favoritos = [];

        try {
            favoritos = JSON.parse(
                localStorage.getItem("profesionalesFavoritos")
            ) || [];
        } catch (error) {
            console.error(error);
        }

        if (contadorFavoritos) {
            contadorFavoritos.textContent = favoritos.length;
        }

        // CONTADOR DE PRÓXIMOS TURNOS

        const proximos = obtenerProximosTurnos();

        if (contadorProximos) {
            contadorProximos.textContent = proximos.length;
        }

    }


    // ==========================================
    // EJECUTAR FUNCIONES
    // ==========================================

    function actualizarPerfilCompleto() {

        actualizarEstadisticas();
        mostrarFavoritosPerfil();
        mostrarProximaConsulta();

    }

    actualizarPerfilCompleto();

    // Actualizar si cambian los datos desde otra pestaña
    window.addEventListener("storage", actualizarPerfilCompleto);

});
