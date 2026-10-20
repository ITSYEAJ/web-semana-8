/**
 * js/catalogo.js — Filtros, orden y paginación del catálogo.
 *
 * Los productos están escritos en catalogo.html; aquí solo se muestran,
 * se ocultan y se reordenan. Cada tarjeta lleva sus datos en atributos:
 *
 *   <article data-producto data-categoria="graficas" data-marca="Nytro"
 *            data-precio="549.9" data-valoracion="4.7" data-oferta="si">
 *
 * Los filtros viajan en la dirección (catalogo.html?categoria=graficas),
 * así que se pueden compartir y se mantienen al recargar.
 */

(function () {
  'use strict';

  const lista = document.querySelector('[data-lista]');
  if (!lista) return; // No estamos en el catálogo.

  const POR_PAGINA = 9;

  const formularioFiltros = document.querySelector('[data-filtros]');
  const formularioOrden = document.querySelector('[data-orden]');
  const contador = document.querySelector('[data-contador]');
  const titulo = document.querySelector('[data-titulo-resultados]');
  const vacio = document.querySelector('[data-vacio]');
  const paginacion = document.querySelector('[data-paginacion]');
  const salidaPrecio = document.querySelector('[data-salida-precio]');
  const rangoPrecio = document.querySelector('[data-rango-precio]');

  // Los <li> que envuelven cada tarjeta: son los que se muestran u ocultan.
  const elementos = Array.from(lista.children);
  const orden = { inicial: elementos.slice() };

  /** Lee los filtros de la dirección de la página. */
  function leerFiltros() {
    const url = new URLSearchParams(location.search);
    return {
      categoria: url.get('categoria') || '',
      marca: url.get('marca') || '',
      buscar: (url.get('buscar') || '').trim(),
      precioMax: url.get('precioMax') || '',
      oferta: url.get('oferta') || '',
      orden: url.get('orden') || 'relevancia',
      pagina: parseInt(url.get('pagina'), 10) || 1
    };
  }

  /** Quita acentos y mayúsculas para que "gráfica" encuentre "grafica". */
  const normalizar = (texto) =>
    texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /** ¿Esta tarjeta encaja con los filtros? */
  function encaja(elemento, filtros) {
    const datos = elemento.querySelector('[data-producto]').dataset;

    if (filtros.categoria && datos.categoria !== filtros.categoria) return false;
    if (filtros.marca && datos.marca !== filtros.marca) return false;
    if (filtros.oferta === 'si' && datos.oferta !== 'si') return false;
    if (filtros.precioMax && parseFloat(datos.precio) > parseFloat(filtros.precioMax)) return false;

    if (filtros.buscar) {
      const texto = normalizar(`${datos.nombre} ${datos.marca} ${elemento.textContent}`);
      if (!texto.includes(normalizar(filtros.buscar))) return false;
    }

    return true;
  }

  /** Ordena la lista de tarjetas según la opción elegida. */
  function ordenar(seleccion, criterio) {
    const valor = (el, campo) => el.querySelector('[data-producto]').dataset[campo];

    const criterios = {
      'precio-asc': (a, b) => valor(a, 'precio') - valor(b, 'precio'),
      'precio-desc': (a, b) => valor(b, 'precio') - valor(a, 'precio'),
      valoracion: (a, b) => valor(b, 'valoracion') - valor(a, 'valoracion'),
      nombre: (a, b) => valor(a, 'nombre').localeCompare(valor(b, 'nombre'))
    };

    // "Relevancia" es el orden en que están escritos en el HTML.
    return criterio in criterios
      ? seleccion.slice().sort(criterios[criterio])
      : orden.inicial.filter((el) => seleccion.includes(el));
  }

  /** Escribe los botones de página. */
  function pintarPaginacion(paginas, actual, filtros) {
    const contenedor = paginacion.querySelector('ul');
    contenedor.innerHTML = '';
    paginacion.hidden = paginas <= 1;
    if (paginas <= 1) return;

    const enlaceA = (numero) => {
      const parametros = new URLSearchParams(location.search);
      parametros.set('pagina', numero);
      return `catalogo.html?${parametros.toString()}`;
    };

    const anadir = (contenido) => {
      const li = document.createElement('li');
      li.innerHTML = contenido;
      contenedor.appendChild(li);
    };

    anadir(actual > 1
      ? `<a href="${enlaceA(actual - 1)}" rel="prev">Anterior</a>`
      : '<span aria-hidden="true">Anterior</span>');

    for (let n = 1; n <= paginas; n++) {
      anadir(n === actual
        ? `<span class="paginacion__actual" aria-current="page">${n}</span>`
        : `<a href="${enlaceA(n)}"><span class="solo-lectores">Página </span>${n}</a>`);
    }

    anadir(actual < paginas
      ? `<a href="${enlaceA(actual + 1)}" rel="next">Siguiente</a>`
      : '<span aria-hidden="true">Siguiente</span>');
  }

  /** Aplica filtros, orden y paginación, y actualiza los textos. */
  function aplicar() {
    const filtros = leerFiltros();

    const visibles = ordenar(elementos.filter((el) => encaja(el, filtros)), filtros.orden);
    const paginas = Math.max(Math.ceil(visibles.length / POR_PAGINA), 1);
    const pagina = Math.min(Math.max(filtros.pagina, 1), paginas);
    const desde = (pagina - 1) * POR_PAGINA;
    const enPagina = visibles.slice(desde, desde + POR_PAGINA);

    // Primero se ocultan todas y luego se muestran las de esta página,
    // reordenándolas dentro de la lista.
    elementos.forEach((el) => { el.hidden = true; });
    enPagina.forEach((el) => {
      el.hidden = false;
      lista.appendChild(el);
    });

    // Textos de la cabecera de resultados.
    const nombreCategoria = formularioFiltros
      ? (formularioFiltros.categoria.selectedOptions[0] || {}).text || ''
      : '';

    if (filtros.buscar) titulo.textContent = `Resultados para “${filtros.buscar}”`;
    else if (filtros.categoria) titulo.textContent = nombreCategoria.replace(/\s*\(\d+\)$/, '');
    else if (filtros.oferta === 'si') titulo.textContent = 'Productos en oferta';
    else titulo.textContent = 'Todo el catálogo';

    contador.textContent = `${visibles.length} ${visibles.length === 1 ? 'producto' : 'productos'}`
      + (paginas > 1 ? ` · página ${pagina} de ${paginas}` : '');

    vacio.hidden = visibles.length > 0;
    lista.hidden = visibles.length === 0;
    pintarPaginacion(paginas, pagina, filtros);
  }

  /** Deja los controles con los valores que trae la dirección. */
  function rellenarControles() {
    const filtros = leerFiltros();
    if (!formularioFiltros) return;

    formularioFiltros.categoria.value = filtros.categoria;
    formularioFiltros.marca.value = filtros.marca;
    formularioFiltros.oferta.checked = filtros.oferta === 'si';
    if (filtros.precioMax) rangoPrecio.value = filtros.precioMax;
    salidaPrecio.textContent = `${rangoPrecio.value} €`;

    formularioOrden.orden.value = filtros.orden;

    // La búsqueda del buscador de la cabecera se conserva al filtrar.
    const buscador = document.querySelector('.buscador__campo');
    if (buscador) buscador.value = filtros.buscar;

    if (filtros.buscar) {
      [formularioFiltros, formularioOrden].forEach((formulario) => {
        const oculto = document.createElement('input');
        oculto.type = 'hidden';
        oculto.name = 'buscar';
        oculto.value = filtros.buscar;
        formulario.appendChild(oculto);
      });
    }
  }

  /** Cambia la dirección sin recargar y vuelve a aplicar los filtros. */
  function actualizarDireccion(formulario) {
    // Partimos de lo que ya hay en la dirección para no perder lo que
    // controla el otro formulario (los filtros al ordenar, y al revés).
    const parametros = new URLSearchParams(location.search);

    // Se borran los campos de este formulario y se vuelven a poner con su
    // valor actual (así una casilla desmarcada también desaparece).
    Array.from(formulario.elements).forEach((control) => {
      if (control.name) parametros.delete(control.name);
    });
    new FormData(formulario).forEach((valor, clave) => {
      if (valor) parametros.set(clave, valor);
    });

    parametros.delete('pagina'); // Al cambiar un filtro se vuelve a la página 1.

    const texto = parametros.toString();
    history.replaceState(null, '', texto ? `catalogo.html?${texto}` : 'catalogo.html');
    aplicar();
  }

  /* ----- Puesta en marcha ----- */
  rellenarControles();
  aplicar();

  if (formularioFiltros) {
    formularioFiltros.addEventListener('submit', (evento) => {
      evento.preventDefault();
      actualizarDireccion(formularioFiltros);
    });

    formularioFiltros.querySelectorAll('select, input[type="checkbox"]').forEach((control) => {
      control.addEventListener('change', () => actualizarDireccion(formularioFiltros));
    });

    rangoPrecio.addEventListener('input', () => {
      salidaPrecio.textContent = `${rangoPrecio.value} €`;
    });
    rangoPrecio.addEventListener('change', () => actualizarDireccion(formularioFiltros));
  }

  if (formularioOrden) {
    formularioOrden.addEventListener('submit', (evento) => {
      evento.preventDefault();
      actualizarDireccion(formularioOrden);
    });
    formularioOrden.orden.addEventListener('change', () => actualizarDireccion(formularioOrden));
  }
})();
