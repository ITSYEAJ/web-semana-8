/**
 * js/principal.js — Lo que necesitan todas las páginas.
 *
 * Se carga en todos los HTML y se encarga de:
 *   1. La configuración de la tienda (moneda, envío…).
 *   2. El carrito, que se guarda en el navegador (localStorage).
 *   3. El menú móvil, el acordeón de preguntas y el carrusel de opiniones.
 *   4. El botón "Añadir al carrito" de cualquier página.
 *   5. El formulario del boletín.
 *
 * Deja preparado `window.Tienda` para que js/catalogo.js y js/carrito.js
 * puedan reutilizar estas funciones.
 */

(function () {
  'use strict';

  /* ===== 1. Configuración ================================================
     Cambia estos valores para adaptar la plantilla a tu tienda.          */
  const CONFIG = {
    moneda: 'EUR',
    local: 'es-ES',
    envioGratisDesde: 99,      // A partir de este importe el envío es gratis.
    envioCoste: 4.95,
    maximoPorProducto: 10,
    clave: 'novatech-carrito'  // Nombre con el que se guarda en el navegador.
  };

  // Las páginas de productos/ están una carpeta más abajo que el resto.
  const BASE = location.pathname.includes('/productos/') ? '../' : '';

  /** Convierte 549.9 en "549,90 €". */
  const precio = (n) =>
    new Intl.NumberFormat(CONFIG.local, { style: 'currency', currency: CONFIG.moneda }).format(n);

  /* ===== 2. El carrito ==================================================
     Se guarda como una lista de productos en el navegador. Si el usuario
     borra los datos de navegación, el carrito se vacía: es lo normal en
     una plantilla sin base de datos.                                     */
  const Carrito = {
    leer() {
      try {
        const guardado = JSON.parse(localStorage.getItem(CONFIG.clave));
        return Array.isArray(guardado) ? guardado : [];
      } catch (error) {
        return []; // Datos corruptos: empezamos de cero.
      }
    },

    guardar(lineas) {
      try {
        localStorage.setItem(CONFIG.clave, JSON.stringify(lineas));
      } catch (error) {
        console.warn('No se ha podido guardar el carrito:', error);
      }
      actualizarCabecera();
    },

    vaciar() {
      try {
        localStorage.removeItem(CONFIG.clave);
      } catch (error) { /* nada que hacer */ }
      actualizarCabecera();
    },

    /** Añade un producto (o suma unidades si ya estaba). */
    anadir(producto, cantidad) {
      const lineas = Carrito.leer();
      const existente = lineas.find((linea) => linea.slug === producto.slug);
      const tope = Math.min(CONFIG.maximoPorProducto, producto.stock);

      if (existente) {
        existente.cantidad = Math.min(existente.cantidad + cantidad, tope);
      } else {
        lineas.push({ ...producto, cantidad: Math.min(cantidad, tope) });
      }

      Carrito.guardar(lineas);
      return lineas;
    },

    /** Fija la cantidad exacta de un producto (0 = quitarlo). */
    actualizar(slug, cantidad) {
      let lineas = Carrito.leer();
      const linea = lineas.find((l) => l.slug === slug);
      if (!linea) return lineas;

      if (cantidad <= 0) {
        lineas = lineas.filter((l) => l.slug !== slug);
      } else {
        linea.cantidad = Math.min(cantidad, CONFIG.maximoPorProducto, linea.stock);
      }

      Carrito.guardar(lineas);
      return lineas;
    },

    eliminar(slug) {
      const lineas = Carrito.leer().filter((l) => l.slug !== slug);
      Carrito.guardar(lineas);
      return lineas;
    },

    /** Suma el carrito: unidades, subtotal, envío y total. */
    resumen(lineas = Carrito.leer()) {
      const unidades = lineas.reduce((suma, l) => suma + l.cantidad, 0);
      const subtotal = Number(lineas.reduce((suma, l) => suma + l.precio * l.cantidad, 0).toFixed(2));
      const envio = subtotal === 0 || subtotal >= CONFIG.envioGratisDesde ? 0 : CONFIG.envioCoste;

      return {
        unidades,
        subtotal,
        envio,
        total: Number((subtotal + envio).toFixed(2)),
        faltaParaEnvioGratis: Number(Math.max(CONFIG.envioGratisDesde - subtotal, 0).toFixed(2))
      };
    }
  };

  /** Pone al día el icono del carrito de la cabecera. */
  function actualizarCabecera() {
    const resumen = Carrito.resumen();

    document.querySelectorAll('[data-carrito-total]').forEach((el) => {
      el.textContent = precio(resumen.total);
    });

    document.querySelectorAll('[data-carrito-contador]').forEach((el) => {
      el.textContent = resumen.unidades;
      el.hidden = resumen.unidades === 0;
    });

    document.querySelectorAll('[data-carrito-resumen]').forEach((el) => {
      el.textContent = resumen.unidades === 0
        ? 'Carrito vacío'
        : `(${resumen.unidades} ${resumen.unidades === 1 ? 'producto' : 'productos'})`;
    });
  }

  /**
   * Envía datos al servidor si lo hay.
   * Devuelve la respuesta, o null si la página se ha abierto sin servidor
   * (por ejemplo haciendo doble clic en el archivo HTML).
   */
  async function enviarAlServidor(ruta, datos) {
    try {
      const respuesta = await fetch(BASE + ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(datos)
      });
      return await respuesta.json();
    } catch (error) {
      console.info('Sin servidor: los datos no se han enviado a ningún sitio.');
      return null;
    }
  }

  /** Mensaje flotante de confirmación (por ejemplo al añadir al carrito). */
  let temporizadorAviso;
  function avisar(texto) {
    let aviso = document.querySelector('[data-aviso-flotante]');

    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'aviso-flotante';
      aviso.setAttribute('role', 'status');
      aviso.setAttribute('data-aviso-flotante', '');
      document.body.appendChild(aviso);
    }

    aviso.textContent = texto;
    aviso.classList.add('aviso-flotante--visible');

    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove('aviso-flotante--visible'), 3000);
  }

  /* ===== 3. Menú móvil, acordeón y carrusel ============================== */
  const botonMenu = document.querySelector('[data-menu-boton]');
  const menu = document.querySelector('[data-menu]');

  if (botonMenu && menu) {
    const cerrarMenu = () => {
      menu.classList.remove('navegacion--abierto');
      botonMenu.setAttribute('aria-expanded', 'false');
    };

    botonMenu.addEventListener('click', () => {
      const abierto = botonMenu.getAttribute('aria-expanded') === 'true';
      botonMenu.setAttribute('aria-expanded', String(!abierto));
      menu.classList.toggle('navegacion--abierto', !abierto);
    });

    menu.addEventListener('click', (evento) => {
      if (evento.target.closest('a')) cerrarMenu();
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && menu.classList.contains('navegacion--abierto')) {
        cerrarMenu();
        botonMenu.focus();
      }
    });
  }

  // Los <details> del acordeón ya funcionan solos; esto solo cierra el resto.
  const acordeon = document.querySelector('[data-acordeon]');
  if (acordeon) {
    const items = Array.from(acordeon.querySelectorAll('details'));
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((otro) => { if (otro !== item) otro.open = false; });
      });
    });
  }

  const carrusel = document.querySelector('[data-carrusel]');
  if (carrusel) {
    const pista = carrusel.querySelector('[data-carrusel-pista]');
    const anterior = carrusel.querySelector('[data-carrusel-anterior]');
    const siguiente = carrusel.querySelector('[data-carrusel-siguiente]');

    const actualizarControles = () => {
      const maximo = pista.scrollWidth - pista.clientWidth - 2;
      anterior.disabled = pista.scrollLeft <= 2;
      siguiente.disabled = pista.scrollLeft >= maximo;
    };

    anterior.addEventListener('click', () => pista.scrollBy({ left: -pista.clientWidth, behavior: 'smooth' }));
    siguiente.addEventListener('click', () => pista.scrollBy({ left: pista.clientWidth, behavior: 'smooth' }));
    pista.addEventListener('scroll', actualizarControles, { passive: true });
    window.addEventListener('resize', actualizarControles);
    actualizarControles();
  }

  /* ===== 4. Botón "Añadir al carrito" ==================================== */
  // Un solo listener para toda la página: funciona con los botones que ya
  // existen y con los que se creen después.
  document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-anadir]');
    if (!boton) return;

    // En la ficha de producto hay un desplegable de cantidad al lado del botón.
    const selector = boton.closest('.ficha__compra, .producto__cuerpo, body')
      .querySelector('[data-cantidad]');
    const cantidad = selector ? parseInt(selector.value, 10) || 1 : 1;

    Carrito.anadir({
      slug: boton.dataset.slug,
      nombre: boton.dataset.nombre,
      precio: parseFloat(boton.dataset.precio),
      imagen: boton.dataset.imagen,
      stock: parseInt(boton.dataset.stock, 10) || 1
    }, cantidad);

    // En la ficha de producto hay un aviso fijo; en el resto, uno flotante.
    const avisoFicha = document.querySelector('[data-aviso-carrito]');
    if (avisoFicha) {
      avisoFicha.hidden = false;
    } else {
      avisar(`Añadido: ${boton.dataset.nombre}`);
    }
  });

  /* ===== 5. Boletín ====================================================== */
  const boletin = document.querySelector('[data-boletin]');
  if (boletin) {
    const resultado = boletin.querySelector('[data-resultado]');
    const campo = boletin.querySelector('input[type="email"]');
    const boton = boletin.querySelector('button[type="submit"]');

    boletin.addEventListener('submit', async (evento) => {
      evento.preventDefault();

      const email = campo.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        resultado.textContent = 'Escribe un correo electrónico válido.';
        resultado.className = 'boletin__resultado boletin__resultado--error';
        campo.setAttribute('aria-invalid', 'true');
        campo.focus();
        return;
      }

      campo.removeAttribute('aria-invalid');
      boton.disabled = true;
      resultado.textContent = 'Enviando…';
      resultado.className = 'boletin__resultado';

      const respuesta = await enviarAlServidor('api/boletin', { email });

      resultado.textContent = respuesta && respuesta.mensaje
        ? respuesta.mensaje
        : '¡Listo! Te avisaremos de las próximas ofertas.';
      resultado.className = 'boletin__resultado boletin__resultado--ok';
      boletin.reset();
      boton.disabled = false;
    });
  }

  /* ===== 6. Animación de entrada ========================================= */
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!sinMovimiento && 'IntersectionObserver' in window) {
    const objetivos = document.querySelectorAll(
      '.seccion__encabezado, .categoria, .producto, .guia, .opinion, .oferta__tarjeta, .boletin__tarjeta, .ventaja'
    );
    objetivos.forEach((el) => el.classList.add('revelar'));

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('revelar--visible');
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.1 });

    objetivos.forEach((el) => observador.observe(el));
  }

  /* ===== Arranque ======================================================== */
  actualizarCabecera();

  // Lo que necesitan js/catalogo.js y js/carrito.js.
  window.Tienda = { CONFIG, BASE, precio, Carrito, enviarAlServidor, avisar };
})();
