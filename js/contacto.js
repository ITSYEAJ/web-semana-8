(function () {
  'use strict';

  const formulario = document.getElementById('formulario');
  if (!formulario) return;

  const CORREO_TIENDA = 'hola@novatech.example';
  const campos = ['nombre', 'correo', 'telefono', 'motivo', 'mensaje', 'acepto'];

  const resumen = document.getElementById('resumen-errores');
  const listaResumen = document.getElementById('resumen-lista');
  const botonEnviar = document.getElementById('enviar');
  const textoBoton = botonEnviar.querySelector('[data-texto]');
  const confirmacion = document.getElementById('confirmacion');
  const telefono = document.getElementById('telefono');
  const mensaje = document.getElementById('mensaje');
  const contador = document.getElementById('contador');

  const esperar = (milisegundos) => new Promise((resolver) => setTimeout(resolver, milisegundos));

  function mensajeDe(campo) {
    const v = campo.validity;
    const valor = campo.type === 'checkbox' ? '' : campo.value.trim();

    switch (campo.id) {
      case 'nombre':
        if (!valor) return 'Escribe tu nombre.';
        return valor.length < campo.minLength ? `Debe tener al menos ${campo.minLength} letras.` : '';
      case 'correo':
        if (!valor) return 'Escribe tu correo.';
        return v.typeMismatch ? 'Usa un correo como nombre@correo.com' : '';
      case 'telefono':
        return v.patternMismatch ? 'Usa el formato 8888-8888 (8 números).' : '';
      case 'motivo':
        return v.valueMissing ? 'Elige el motivo de tu mensaje.' : '';
      case 'mensaje':
        if (!valor) return 'Escribe tu mensaje.';
        if (valor.length < campo.minLength) {
          return `Escribe al menos ${campo.minLength} caracteres (llevas ${valor.length}).`;
        }
        return v.tooLong ? `El mensaje no puede pasar de ${campo.maxLength} caracteres.` : '';
      case 'acepto':
        return v.valueMissing ? 'Marca la casilla para que podamos responderte.' : '';
      default:
        return v.valid ? '' : 'Revisa este campo.';
    }
  }

  function tieneValor(campo) {
    return campo.type === 'checkbox' ? campo.checked : campo.value.trim() !== '';
  }

  function validarCampo(id) {
    const campo = document.getElementById(id);
    const texto = mensajeDe(campo);
    const caja = campo.closest('.campo');

    document.getElementById('error-' + id).textContent = texto;
    campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
    caja.classList.toggle('campo--invalido', Boolean(texto));
    caja.classList.toggle('campo--valido', !texto && tieneValor(campo));
    return texto;
  }

  function limpiarEstado() {
    campos.forEach((id) => {
      const campo = document.getElementById(id);
      document.getElementById('error-' + id).textContent = '';
      campo.removeAttribute('aria-invalid');
      campo.closest('.campo').classList.remove('campo--invalido', 'campo--valido');
    });
    resumen.hidden = true;
    listaResumen.replaceChildren();
  }

  function mostrarResumen(errores) {
    listaResumen.replaceChildren(...errores.map(({ id, texto }) => {
      const etiqueta = document.querySelector(`label[for="${id}"]`).dataset.nombre;
      const enlace = document.createElement('a');
      enlace.href = '#' + id;
      enlace.textContent = `${etiqueta}: ${texto}`;

      const elemento = document.createElement('li');
      elemento.append(enlace);
      return elemento;
    }));

    document.getElementById('resumen-titulo').textContent = errores.length === 1
      ? 'Revisa 1 campo antes de enviar:'
      : `Revisa ${errores.length} campos antes de enviar:`;
    resumen.hidden = errores.length === 0;
  }

  function actualizarContador() {
    const largo = mensaje.value.length;
    contador.textContent = `${largo} de ${mensaje.maxLength}`;
    contador.classList.toggle('contador--limite', largo >= mensaje.maxLength * 0.9);
  }

  function formatearTelefono() {
    const digitos = telefono.value.replace(/\D/g, '').slice(0, 8);
    const formateado = digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos;
    if (telefono.value !== formateado) telefono.value = formateado;
  }

  function crearMailto(datos, motivo) {
    const asunto = `[${motivo}] Mensaje de ${datos.nombre}`;
    const cuerpo = [datos.mensaje, '', `Nombre: ${datos.nombre}`, `Correo: ${datos.correo}`];
    if (datos.telefono) cuerpo.push(`Teléfono: ${datos.telefono}`);

    return `mailto:${CORREO_TIENDA}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo.join('\n'))}`;
  }

  function mostrarConfirmacion(datos, recibido) {
    const motivo = formulario.elements.motivo.selectedOptions[0].textContent.trim();

    document.getElementById('conf-nombre').textContent = datos.nombre.split(/\s+/)[0];
    document.getElementById('conf-estado').textContent = recibido
      ? 'Hemos recibido tu mensaje y te responderemos en menos de 24 horas laborables.'
      : 'Tu mensaje está listo. Pulsa «Abrir en mi correo» para enviárnoslo: el asunto y el texto ya están escritos.';
    document.getElementById('conf-correo').textContent = datos.correo;
    document.getElementById('conf-motivo').textContent = motivo;
    document.getElementById('conf-mailto').href = crearMailto(datos, motivo);

    formulario.hidden = true;
    confirmacion.hidden = false;
    confirmacion.focus();
  }

  function restaurarBoton() {
    botonEnviar.disabled = false;
    botonEnviar.removeAttribute('aria-busy');
    textoBoton.textContent = 'Enviar mensaje';
  }

  telefono.addEventListener('input', formatearTelefono);
  mensaje.addEventListener('input', actualizarContador);

  campos.forEach((id) => {
    const campo = document.getElementById(id);
    const esSeleccion = campo.type === 'checkbox' || campo.tagName === 'SELECT';

    campo.addEventListener('blur', () => {
      if (tieneValor(campo) || campo.hasAttribute('aria-invalid')) validarCampo(id);
    });

    campo.addEventListener(esSeleccion ? 'change' : 'input', () => {
      if (esSeleccion || campo.hasAttribute('aria-invalid')) validarCampo(id);
    });
  });

  listaResumen.addEventListener('click', (e) => {
    const enlace = e.target.closest('a');
    if (!enlace) return;
    e.preventDefault();
    document.getElementById(enlace.hash.slice(1)).focus();
  });

  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (botonEnviar.disabled) return;

    const errores = campos
      .map((id) => ({ id, texto: validarCampo(id) }))
      .filter((x) => x.texto);

    mostrarResumen(errores);
    if (errores.length > 0) {
      document.getElementById(errores[0].id).focus();
      return;
    }

    const datos = Object.fromEntries(
      Array.from(new FormData(formulario), ([clave, valor]) => [clave, String(valor).trim()])
    );

    botonEnviar.disabled = true;
    botonEnviar.setAttribute('aria-busy', 'true');
    textoBoton.textContent = 'Enviando…';

    const [, respuesta] = await Promise.all([
      esperar(900),
      window.Tienda ? window.Tienda.enviarAlServidor('api/contacto', datos) : null
    ]);

    restaurarBoton();

    if (respuesta && respuesta.ok === false) {
      resumen.hidden = false;
      document.getElementById('resumen-titulo').textContent = respuesta.mensaje;
      listaResumen.replaceChildren();
      resumen.focus();
      return;
    }

    mostrarConfirmacion(datos, Boolean(respuesta && respuesta.ok));
  });

  formulario.addEventListener('reset', () => {
    limpiarEstado();
    setTimeout(actualizarContador);
  });

  document.getElementById('otro-mensaje').addEventListener('click', () => {
    formulario.reset();
    confirmacion.hidden = true;
    formulario.hidden = false;
    document.getElementById('nombre').focus();
  });

  actualizarContador();
})();
