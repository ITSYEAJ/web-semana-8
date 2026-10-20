/**
 * js/carrito.js — La página del carrito y la de confirmación.
 *
 * Se carga solo en carrito.html y gracias.html. Usa las funciones que
 * js/principal.js deja en `window.Tienda`.
 */

(function () {
  'use strict';

  const { CONFIG, precio, Carrito, enviarAlServidor } = window.Tienda;

  /** Escapa el texto antes de meterlo en el HTML. */
  const limpiar = (texto) => String(texto).replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[caracter]));

  /* ===================== Página del carrito ============================= */
  const contenedorLineas = document.querySelector('[data-lineas]');

  if (contenedorLineas) {
    const bloqueVacio = document.querySelector('[data-carrito-vacio]');
    const bloqueLleno = document.querySelector('[data-carrito-lleno]');
    const formularioPedido = document.querySelector('[data-pedido]');

    /** Dibuja una tarjeta por producto y actualiza el resumen. */
    function pintar() {
      const lineas = Carrito.leer();
      const resumen = Carrito.resumen(lineas);

      bloqueVacio.hidden = lineas.length > 0;
      bloqueLleno.hidden = lineas.length === 0;
      if (lineas.length === 0) return;

      contenedorLineas.innerHTML = lineas.map((linea) => {
        const tope = Math.min(linea.stock, CONFIG.maximoPorProducto);
        const opciones = Array.from({ length: tope }, (_, i) =>
          `<option value="${i + 1}"${i + 1 === linea.cantidad ? ' selected' : ''}>${i + 1}</option>`).join('');

        return `
        <article class="linea">
          <img class="linea__imagen" src="${limpiar(linea.imagen)}" alt=""
               width="120" height="90" loading="lazy" aria-hidden="true">

          <div class="linea__datos">
            <h3 class="linea__nombre">
              <a href="productos/${limpiar(linea.slug)}.html">${limpiar(linea.nombre)}</a>
            </h3>
            <p class="linea__marca">${precio(linea.precio)} por unidad</p>
          </div>

          <div class="linea__cantidad">
            <label class="solo-lectores" for="cantidad-${limpiar(linea.slug)}">
              Cantidad de ${limpiar(linea.nombre)}
            </label>
            <select class="campo__control" id="cantidad-${limpiar(linea.slug)}"
                    data-cambiar="${limpiar(linea.slug)}">${opciones}</select>
          </div>

          <p class="linea__subtotal">${precio(linea.precio * linea.cantidad)}</p>

          <button class="boton-texto" type="button" data-quitar="${limpiar(linea.slug)}">
            Quitar<span class="solo-lectores"> ${limpiar(linea.nombre)} del carrito</span>
          </button>
        </article>`;
      }).join('');

      // Resumen
      document.querySelector('[data-texto-subtotal]').textContent =
        `Subtotal (${resumen.unidades} ${resumen.unidades === 1 ? 'producto' : 'productos'})`;
      document.querySelector('[data-subtotal]').textContent = precio(resumen.subtotal);
      document.querySelector('[data-envio]').textContent =
        resumen.envio === 0 ? 'Gratis' : precio(resumen.envio);
      document.querySelectorAll('[data-total]').forEach((el) => {
        el.textContent = precio(resumen.total);
      });

      const avisoEnvio = document.querySelector('[data-aviso-envio]');
      avisoEnvio.hidden = resumen.faltaParaEnvioGratis === 0;
      avisoEnvio.textContent =
        `Te faltan ${precio(resumen.faltaParaEnvioGratis)} para el envío gratis.`;
    }

    // Cambiar cantidad y quitar productos.
    contenedorLineas.addEventListener('change', (evento) => {
      const select = evento.target.closest('[data-cambiar]');
      if (!select) return;
      Carrito.actualizar(select.dataset.cambiar, parseInt(select.value, 10));
      pintar();
    });

    contenedorLineas.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-quitar]');
      if (!boton) return;
      Carrito.eliminar(boton.dataset.quitar);
      pintar();
    });

    /* ----- Finalizar la compra ----- */
    const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    /** Comprueba los datos y devuelve { campo: motivo } con los errores. */
    function validar(datos) {
      const errores = {};
      if (datos.nombre.length < 2) errores.nombre = 'Escribe tu nombre y apellidos.';
      if (!FORMATO_EMAIL.test(datos.email)) errores.email = 'Escribe un correo electrónico válido.';
      if (datos.direccion.length < 5) errores.direccion = 'Escribe la dirección de entrega.';
      if (datos.ciudad.length < 2) errores.ciudad = 'Escribe la ciudad.';
      if (!/^\d{4,10}$/.test(datos.codigoPostal)) errores.codigoPostal = 'El código postal solo puede tener números.';
      return errores;
    }

    function limpiarErrores() {
      formularioPedido.querySelectorAll('[data-error]').forEach((aviso) => {
        aviso.textContent = '';
        aviso.closest('.campo').classList.remove('campo--invalido');
      });
      formularioPedido.querySelectorAll('.campo__control').forEach((campo) => {
        campo.removeAttribute('aria-invalid');
      });
    }

    function mostrarErrores(errores) {
      Object.entries(errores).forEach(([campo, texto]) => {
        const aviso = formularioPedido.querySelector(`[data-error="${campo}"]`);
        if (aviso) {
          aviso.textContent = texto;
          aviso.closest('.campo').classList.add('campo--invalido');
        }
        if (formularioPedido.elements[campo]) {
          formularioPedido.elements[campo].setAttribute('aria-invalid', 'true');
        }
      });

      const primero = Object.keys(errores)[0];
      if (formularioPedido.elements[primero]) formularioPedido.elements[primero].focus();
    }

    /** Genera una referencia legible del tipo NT-2209-4821. */
    function generarReferencia() {
      const fecha = new Date();
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      return `NT-${dia}${mes}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    formularioPedido.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      limpiarErrores();

      const cliente = Object.fromEntries(
        Array.from(new FormData(formularioPedido).entries()).map(([k, v]) => [k, String(v).trim()])
      );

      const errores = validar(cliente);
      if (Object.keys(errores).length > 0) return mostrarErrores(errores);

      const lineas = Carrito.leer();
      if (lineas.length === 0) return;

      const resumen = Carrito.resumen(lineas);
      const pedido = {
        referencia: generarReferencia(),
        fecha: new Date().toISOString(),
        cliente,
        lineas: lineas.map((l) => ({
          slug: l.slug,
          nombre: l.nombre,
          precio: l.precio,
          cantidad: l.cantidad,
          subtotal: Number((l.precio * l.cantidad).toFixed(2))
        })),
        subtotal: resumen.subtotal,
        envio: resumen.envio,
        total: resumen.total
      };

      // Si hay servidor, se guarda ahí; si no, se sigue igualmente.
      await enviarAlServidor('api/pedido', pedido);

      // La página de gracias lee el pedido de aquí.
      try {
        sessionStorage.setItem('novatech-pedido', JSON.stringify(pedido));
      } catch (error) { /* la página de gracias mostrará el texto genérico */ }

      Carrito.vaciar();
      location.href = 'gracias.html';
    });

    pintar();
  }

  /* ===================== Página de confirmación ========================= */
  const tablaResumen = document.querySelector('[data-resumen]');

  if (tablaResumen) {
    let pedido = null;
    try {
      pedido = JSON.parse(sessionStorage.getItem('novatech-pedido'));
    } catch (error) { /* sin pedido guardado */ }

    if (pedido) {
      document.querySelector('[data-referencia]').textContent = pedido.referencia;
      document.querySelector('[data-mensaje]').innerHTML =
        `Gracias, ${limpiar(pedido.cliente.nombre)}. Hemos enviado la confirmación a ` +
        `<strong>${limpiar(pedido.cliente.email)}</strong>.`;

      tablaResumen.querySelector('tbody').innerHTML = pedido.lineas.map((linea) => `
        <tr>
          <th scope="row">${limpiar(linea.nombre)}</th>
          <td>${linea.cantidad}</td>
          <td>${precio(linea.subtotal)}</td>
        </tr>`).join('');

      tablaResumen.querySelector('tfoot').innerHTML = `
        <tr>
          <th scope="row" colspan="2">Envío</th>
          <td>${pedido.envio === 0 ? 'Gratis' : precio(pedido.envio)}</td>
        </tr>
        <tr>
          <th scope="row" colspan="2">Total</th>
          <td><strong>${precio(pedido.total)}</strong></td>
        </tr>`;

      tablaResumen.hidden = false;
    }
  }
})();
