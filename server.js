/**
 * server.js — Servidor opcional de la plantilla.
 *
 * Las páginas son HTML normal: puedes abrir index.html con doble clic y la
 * tienda funciona (catálogo, filtros y carrito incluidos). Este servidor
 * sirve para dos cosas:
 *
 *   1. Ver la web como se verá en producción (con rutas y un 404 de verdad).
 *   2. Recoger los pedidos y las suscripciones y guardarlos en almacenamiento/.
 *
 * Arrancar:  npm install  y luego  npm start
 */

const fs = require('fs/promises');
const path = require('path');
const express = require('express');

const app = express();
const PUERTO = process.env.PORT || 3000;
const CARPETA_DATOS = path.join(__dirname, 'almacenamiento');

app.use(express.json({ limit: '100kb' }));

// Sirve index.html, catalogo.html, css/, js/, img/, productos/… tal cual.
app.use(express.static(__dirname, { extensions: ['html'], maxAge: '1h' }));

/** Añade un registro al final de un archivo JSON (lo crea si no existe). */
async function guardar(archivo, registro) {
  const destino = path.join(CARPETA_DATOS, archivo);

  let registros = [];
  try {
    registros = JSON.parse(await fs.readFile(destino, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error; // Si no existe, empezamos de cero.
  }

  registros.push(registro);
  await fs.mkdir(CARPETA_DATOS, { recursive: true });
  await fs.writeFile(destino, JSON.stringify(registros, null, 2), 'utf8');
}

// --- Pedidos ---------------------------------------------------------------
// OJO: aquí el pedido llega ya calculado por el navegador. Para una tienda
// real hay que comprobar los precios contra tu catálogo antes de cobrar.
app.post('/api/pedido', async (req, res, next) => {
  try {
    const pedido = req.body;

    if (!pedido || !Array.isArray(pedido.lineas) || pedido.lineas.length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'El pedido está vacío.' });
    }

    await guardar('pedidos.json', { ...pedido, recibido: new Date().toISOString() });
    res.status(201).json({ ok: true, mensaje: 'Pedido recibido.', referencia: pedido.referencia });
  } catch (error) {
    next(error);
  }
});

// --- Boletín ---------------------------------------------------------------
app.post('/api/boletin', async (req, res, next) => {
  try {
    const email = String((req.body || {}).email || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ ok: false, mensaje: 'Escribe un correo electrónico válido.' });
    }

    await guardar('suscripciones.json', { email, fecha: new Date().toISOString() });
    res.status(201).json({ ok: true, mensaje: '¡Listo! Te avisaremos de las próximas ofertas.' });
  } catch (error) {
    next(error);
  }
});

const MOTIVOS_CONTACTO = ['producto', 'presupuesto', 'pedido', 'garantia', 'otro'];

app.post('/api/contacto', async (req, res, next) => {
  try {
    const datos = req.body || {};
    const texto = (campo) => String(datos[campo] || '').trim();
    const mensaje = {
      nombre: texto('nombre'),
      correo: texto('correo'),
      telefono: texto('telefono'),
      motivo: texto('motivo'),
      mensaje: texto('mensaje')
    };

    const valido = mensaje.nombre.length >= 3 && mensaje.nombre.length <= 80
      && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mensaje.correo) && mensaje.correo.length <= 120
      && (mensaje.telefono === '' || /^[0-9]{4}-?[0-9]{4}$/.test(mensaje.telefono))
      && MOTIVOS_CONTACTO.includes(mensaje.motivo)
      && mensaje.mensaje.length >= 10 && mensaje.mensaje.length <= 300
      && datos.acepto === 'on';

    if (!valido) {
      return res.status(400).json({ ok: false, mensaje: 'Revisa los datos del formulario e inténtalo de nuevo.' });
    }

    await guardar('mensajes.json', { ...mensaje, fecha: new Date().toISOString() });
    res.status(201).json({ ok: true, mensaje: 'Mensaje recibido.' });
  } catch (error) {
    next(error);
  }
});

// Comprobación rápida de que el servidor está vivo (útil al desplegar).
app.get('/salud', (req, res) => {
  res.json({ estado: 'ok', hora: new Date().toISOString() });
});

// --- Errores ----------------------------------------------------------------
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.use((error, req, res, next) => {
  console.error('[error]', error.message);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});

app.listen(PUERTO, () => {
  console.log(`Tienda disponible en http://localhost:${PUERTO}`);
});

module.exports = app;
