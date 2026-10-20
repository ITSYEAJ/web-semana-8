const formulario = document.getElementById("formulario");
const campos = ["nombre", "correo", "telefono", "motivo", "mensaje", "acepto"];
const resumen = document.getElementById("resumen");
const confirmacion = document.getElementById("confirmacion");
const botonEnviar = document.getElementById("enviar");
const mensaje = document.getElementById("mensaje");
const contador = document.getElementById("contador");

function mensajeDe(campo) {
  const v = campo.validity;
  if (v.valid) return "";

  switch (campo.id) {
    case "nombre":
      return v.valueMissing ? "Escriba su nombre." : "Debe tener al menos 3 letras.";
    case "correo":
      return v.valueMissing ? "Escriba su correo." : "Use un correo como nombre@correo.com";
    case "telefono":
      return "Use el formato 8888-8888.";
    case "motivo":
      return "Seleccione el motivo del mensaje.";
    case "mensaje":
      return v.valueMissing ? "Escriba su mensaje." : "Debe tener al menos 10 caracteres.";
    case "acepto":
      return "Debe aceptar que lo contactemos.";
    default:
      return "Revise este campo.";
  }
}

function validarCampo(id) {
  const campo = document.getElementById(id);
  const texto = mensajeDe(campo);
  document.getElementById("error-" + id).textContent = texto;
  campo.setAttribute("aria-invalid", texto ? "true" : "false");
  return texto;
}

function mostrarResumen(errores) {
  const lista = resumen.querySelector("ul");
  lista.innerHTML = "";

  errores.forEach((error) => {
    const enlace = document.createElement("a");
    enlace.href = "#" + error.id;
    enlace.textContent = error.texto;
    const item = document.createElement("li");
    item.append(enlace);
    lista.append(item);
  });

  resumen.hidden = errores.length === 0;
}

function mostrarConfirmacion(datos) {
  const asunto = encodeURIComponent(datos.motivo + " - " + datos.nombre);
  const cuerpo = encodeURIComponent(datos.mensaje);

  document.getElementById("conf-nombre").textContent = datos.nombre.trim().split(" ")[0];
  document.getElementById("conf-correo").textContent = datos.correo;
  document.getElementById("conf-mailto").href =
    `mailto:hola@novatech.example?subject=${asunto}&body=${cuerpo}`;

  formulario.hidden = true;
  confirmacion.hidden = false;
  confirmacion.focus();
}

function limpiarFormulario() {
  campos.forEach((id) => {
    document.getElementById(id).removeAttribute("aria-invalid");
    document.getElementById("error-" + id).textContent = "";
  });
  resumen.hidden = true;
  contador.textContent = "0 de 300";
  botonEnviar.disabled = false;
  botonEnviar.textContent = "Enviar mensaje";
}

campos.forEach((id) => {
  const campo = document.getElementById(id);
  campo.addEventListener("change", () => validarCampo(id));
  campo.addEventListener("input", () => {
    if (campo.getAttribute("aria-invalid") === "true") validarCampo(id);
  });
});

mensaje.addEventListener("input", () => {
  contador.textContent = mensaje.value.length + " de 300";
});

resumen.addEventListener("click", (e) => {
  if (e.target.tagName !== "A") return;
  e.preventDefault();
  document.getElementById(e.target.hash.slice(1)).focus();
});

formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const errores = campos
    .map((id) => ({ id, texto: validarCampo(id) }))
    .filter((error) => error.texto);

  mostrarResumen(errores);
  if (errores.length > 0) {
    document.getElementById(errores[0].id).focus();
    return;
  }

  const datos = Object.fromEntries(new FormData(formulario));
  botonEnviar.disabled = true;
  botonEnviar.textContent = "Enviando…";
  setTimeout(() => mostrarConfirmacion(datos), 1000);
});

formulario.addEventListener("reset", limpiarFormulario);

document.getElementById("otro-mensaje").addEventListener("click", () => {
  formulario.reset();
  confirmacion.hidden = true;
  formulario.hidden = false;
  document.getElementById("nombre").focus();
});
