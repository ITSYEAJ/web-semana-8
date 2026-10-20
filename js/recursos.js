(function () {
  'use strict';

  const COLOR = {
    oscuro: '#0b0c10',
    superficie: '#1b1e27',
    violeta: '#a78bfa',
    violetaFuerte: '#7c5cff',
    cian: '#67e8f9',
    claro: '#f4f5f8'
  };

  const FUENTE = '"Outfit", "Segoe UI", system-ui, sans-serif';

  function ajustarCanvas(canvas, ancho, alto) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    canvas.style.width = ancho + 'px';
    canvas.style.height = alto + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function rgba(hex, alfa) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
  }

  function degradadoMarca(ctx, x0, y0, x1, y1) {
    const degradado = ctx.createLinearGradient(x0, y0, x1, y1);
    degradado.addColorStop(0, COLOR.violeta);
    degradado.addColorStop(1, COLOR.cian);
    return degradado;
  }

  function trazarRectangulo(ctx, x, y, ancho, alto, radio) {
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.arcTo(x + ancho, y, x + ancho, y + alto, radio);
    ctx.arcTo(x + ancho, y + alto, x, y + alto, radio);
    ctx.arcTo(x, y + alto, x, y, radio);
    ctx.arcTo(x, y, x + ancho, y, radio);
    ctx.closePath();
  }

  function circulo(ctx, x, y, radio) {
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
  }

  function dibujarLogo(canvas) {
    const tamano = Number(canvas.dataset.tamano) || 64;
    const ctx = ajustarCanvas(canvas, tamano, tamano);
    ctx.scale(tamano / 64, tamano / 64);

    ctx.fillStyle = degradadoMarca(ctx, 0, 0, 64, 64);
    trazarRectangulo(ctx, 0, 0, 64, 64, 16);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = COLOR.oscuro;
    for (let i = 0; i < 3; i++) {
      const posicion = 22 + i * 10;
      ctx.fillRect(posicion - 1.5, 3, 3, 5);
      ctx.fillRect(posicion - 1.5, 56, 3, 5);
      ctx.fillRect(3, posicion - 1.5, 5, 3);
      ctx.fillRect(56, posicion - 1.5, 5, 3);
    }
    ctx.restore();

    ctx.strokeStyle = COLOR.oscuro;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(20, 45);
    ctx.lineTo(20, 19);
    ctx.lineTo(44, 45);
    ctx.lineTo(44, 19);
    ctx.stroke();

    [[20, 45], [44, 19]].forEach(([x, y]) => {
      ctx.fillStyle = COLOR.oscuro;
      circulo(ctx, x, y, 5.5);
      ctx.fill();
      ctx.fillStyle = COLOR.claro;
      circulo(ctx, x, y, 2.2);
      ctx.fill();
    });
  }

  function dibujarPistas(ctx, ancho, alto) {
    const separacion = alto / 7;

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < 7; i++) {
      const y = separacion * (i + 0.5);
      const salto = (i % 2 ? 1 : -1) * separacion * 0.5;
      const inicio = ancho * (0.08 + ((i * 29) % 40) / 100);
      const quiebre = inicio + ancho * (0.12 + ((i * 17) % 20) / 100);
      const color = i % 2 ? COLOR.cian : COLOR.violeta;

      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(inicio, y);
      ctx.lineTo(quiebre, y);
      ctx.lineTo(quiebre + Math.abs(salto), y + salto);
      ctx.lineTo(ancho, y + salto);
      ctx.stroke();

      circulo(ctx, inicio, y, 3);
      ctx.fill();
    }

    ctx.restore();
  }

  function dibujarVentilador(ctx, x, y, radio) {
    ctx.save();
    ctx.shadowColor = COLOR.violetaFuerte;
    ctx.shadowBlur = radio * 0.5;
    ctx.lineWidth = Math.max(2, radio * 0.09);
    ctx.strokeStyle = degradadoMarca(ctx, x - radio, y - radio, x + radio, y + radio);
    circulo(ctx, x, y, radio);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COLOR.oscuro;
    circulo(ctx, x, y, radio * 0.9);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(COLOR.violeta, 0.45);
    for (let aspa = 0; aspa < 7; aspa++) {
      ctx.rotate((Math.PI * 2) / 7);
      ctx.beginPath();
      ctx.moveTo(radio * 0.2, 0);
      ctx.quadraticCurveTo(radio * 0.55, -radio * 0.35, radio * 0.84, -radio * 0.12);
      ctx.quadraticCurveTo(radio * 0.6, radio * 0.02, radio * 0.2, radio * 0.12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = COLOR.superficie;
    ctx.strokeStyle = COLOR.cian;
    ctx.lineWidth = 1.5;
    circulo(ctx, x, y, radio * 0.22);
    ctx.fill();
    ctx.stroke();
  }

  function dibujarGrafica(ctx, x, y, ancho) {
    const alto = ancho * 0.4;

    ctx.save();
    ctx.shadowColor = rgba(COLOR.oscuro, 0.8);
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = COLOR.superficie;
    trazarRectangulo(ctx, x, y, ancho, alto, 12);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = rgba(COLOR.claro, 0.14);
    ctx.lineWidth = 1.5;
    trazarRectangulo(ctx, x, y, ancho, alto, 12);
    ctx.stroke();

    ctx.fillStyle = degradadoMarca(ctx, x, y, x + ancho, y);
    trazarRectangulo(ctx, x + 18, y + 8, ancho - 36, 4, 2);
    ctx.fill();

    const radio = alto * 0.33;
    dibujarVentilador(ctx, x + ancho * 0.28, y + alto * 0.56, radio);
    dibujarVentilador(ctx, x + ancho * 0.72, y + alto * 0.56, radio);

    ctx.fillStyle = rgba(COLOR.cian, 0.75);
    for (let pin = x + ancho * 0.14; pin < x + ancho * 0.56; pin += 6) {
      ctx.fillRect(pin, y + alto, 3, 7);
    }
  }

  function dibujarProcesador(ctx, x, y, lado) {
    const pines = 5;
    const paso = lado / (pines + 1);

    ctx.fillStyle = rgba(COLOR.claro, 0.55);
    for (let i = 1; i <= pines; i++) {
      ctx.fillRect(x + paso * i - 1.5, y - 7, 3, 7);
      ctx.fillRect(x + paso * i - 1.5, y + lado, 3, 7);
      ctx.fillRect(x - 7, y + paso * i - 1.5, 7, 3);
      ctx.fillRect(x + lado, y + paso * i - 1.5, 7, 3);
    }

    ctx.fillStyle = COLOR.superficie;
    ctx.strokeStyle = rgba(COLOR.claro, 0.2);
    ctx.lineWidth = 1.5;
    trazarRectangulo(ctx, x, y, lado, lado, lado * 0.12);
    ctx.fill();
    ctx.stroke();

    const margen = lado * 0.22;
    ctx.save();
    ctx.shadowColor = COLOR.cian;
    ctx.shadowBlur = lado * 0.25;
    ctx.fillStyle = degradadoMarca(ctx, x + margen, y + margen, x + lado - margen, y + lado - margen);
    trazarRectangulo(ctx, x + margen, y + margen, lado - margen * 2, lado - margen * 2, lado * 0.08);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = COLOR.oscuro;
    ctx.lineWidth = Math.max(2, lado * 0.06);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const izquierda = x + lado * 0.4;
    const derecha = x + lado * 0.6;
    const arriba = y + lado * 0.38;
    const abajo = y + lado * 0.62;
    ctx.beginPath();
    ctx.moveTo(izquierda, abajo);
    ctx.lineTo(izquierda, arriba);
    ctx.lineTo(derecha, abajo);
    ctx.lineTo(derecha, arriba);
    ctx.stroke();
  }

  function dibujarTextoBanner(ctx, alto, estrecho) {
    const lineas = estrecho
      ? [
          { texto: 'TIENDA DE INFORMÁTICA', tamano: 10, peso: 700, color: COLOR.cian },
          { texto: 'NovaTech', tamano: 30, peso: 700, degradado: true },
          { texto: 'Componentes y PCs gaming', tamano: 13, peso: 500, color: COLOR.claro },
          { texto: 'Envío 24 h · Montaje gratis', tamano: 11, peso: 400, color: rgba(COLOR.claro, 0.75) }
        ]
      : [
          { texto: 'TIENDA DE INFORMÁTICA Y GAMING', tamano: 12, peso: 700, color: COLOR.cian },
          { texto: 'NovaTech', tamano: 54, peso: 700, degradado: true },
          { texto: 'Componentes, PCs montados y portátiles', tamano: 19, peso: 500, color: COLOR.claro },
          { texto: 'Envío en 24 h · Montaje gratis · Garantía de 3 años', tamano: 14, peso: 400, color: rgba(COLOR.claro, 0.75) }
        ];

    const relleno = estrecho ? 14 : 24;
    const separacion = estrecho ? 6 : 9;
    const x = estrecho ? 12 : 24;

    ctx.textBaseline = 'top';
    let anchoTexto = 0;
    lineas.forEach((linea) => {
      ctx.font = `${linea.peso} ${linea.tamano}px ${FUENTE}`;
      anchoTexto = Math.max(anchoTexto, ctx.measureText(linea.texto).width);
    });

    const altoTexto = lineas.reduce((suma, linea) => suma + linea.tamano, 0) + separacion * (lineas.length - 1);
    const caja = {
      x,
      y: (alto - altoTexto) / 2 - relleno,
      ancho: anchoTexto + relleno * 2,
      alto: altoTexto + relleno * 2
    };

    ctx.fillStyle = rgba(COLOR.oscuro, 0.78);
    trazarRectangulo(ctx, caja.x, caja.y, caja.ancho, caja.alto, estrecho ? 12 : 18);
    ctx.fill();
    ctx.strokeStyle = rgba(COLOR.violeta, 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();

    let y = caja.y + relleno;
    lineas.forEach((linea) => {
      ctx.font = `${linea.peso} ${linea.tamano}px ${FUENTE}`;
      ctx.fillStyle = linea.degradado
        ? degradadoMarca(ctx, caja.x, y, caja.x + anchoTexto, y + linea.tamano)
        : linea.color;
      ctx.fillText(linea.texto, caja.x + relleno, y);
      y += linea.tamano + separacion;
    });

    return caja.x + caja.ancho;
  }

  function dibujarBanner(canvas) {
    const ancho = canvas.parentElement.clientWidth;
    const alto = ancho < 600 ? 150 : 230;
    const estrecho = ancho < 600;
    const ctx = ajustarCanvas(canvas, ancho, alto);

    const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
    fondo.addColorStop(0, COLOR.superficie);
    fondo.addColorStop(1, COLOR.oscuro);
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);

    [
      { x: ancho * 0.82, y: alto * 0.4, radio: alto * 1.4, color: COLOR.violetaFuerte, alfa: 0.4 },
      { x: ancho * 0.45, y: alto * 1.1, radio: alto * 1.1, color: COLOR.cian, alfa: 0.16 }
    ].forEach((luz) => {
      const brillo = ctx.createRadialGradient(luz.x, luz.y, 0, luz.x, luz.y, luz.radio);
      brillo.addColorStop(0, rgba(luz.color, luz.alfa));
      brillo.addColorStop(1, rgba(luz.color, 0));
      ctx.fillStyle = brillo;
      ctx.fillRect(0, 0, ancho, alto);
    });

    dibujarPistas(ctx, ancho, alto);

    ctx.save();
    const finTexto = dibujarTextoBanner(ctx, alto, estrecho);
    ctx.restore();

    const margen = estrecho ? 16 : 32;
    const zona = { inicio: finTexto + margen, fin: ancho - margen };
    const espacio = zona.fin - zona.inicio;
    const lado = estrecho ? Math.min(58, espacio - 16) : alto * 0.34;
    const anchoGrafica = Math.min(400, espacio - lado - 60);

    if (!estrecho && anchoGrafica >= 200) {
      const xGrafica = zona.fin - anchoGrafica;
      dibujarGrafica(ctx, xGrafica, (alto - anchoGrafica * 0.4) / 2 - 4, anchoGrafica);
      dibujarProcesador(ctx, xGrafica - lado - 36, alto * 0.62 - lado / 2, lado);
    } else if (lado >= 36) {
      dibujarProcesador(ctx, zona.inicio + (espacio - lado) / 2, (alto - lado) / 2, lado);
    }
  }

  function dibujarCamion(ctx) {
    trazarRectangulo(ctx, 26, 32, 32, 28, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(58, 41);
    ctx.lineTo(70, 41);
    ctx.lineTo(80, 51);
    ctx.lineTo(80, 60);
    ctx.lineTo(58, 60);
    ctx.stroke();

    ctx.strokeStyle = COLOR.cian;
    [37, 70].forEach((x) => {
      circulo(ctx, x, 63, 6);
      ctx.fillStyle = COLOR.superficie;
      ctx.fill();
      ctx.stroke();
    });

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(14, 40);
    ctx.lineTo(20, 40);
    ctx.moveTo(12, 49);
    ctx.lineTo(20, 49);
    ctx.stroke();
  }

  function dibujarEscudo(ctx) {
    ctx.beginPath();
    ctx.moveTo(48, 18);
    ctx.lineTo(70, 26);
    ctx.lineTo(70, 46);
    ctx.bezierCurveTo(70, 61, 61, 72, 48, 78);
    ctx.bezierCurveTo(35, 72, 26, 61, 26, 46);
    ctx.lineTo(26, 26);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = COLOR.cian;
    ctx.beginPath();
    ctx.moveTo(37, 48);
    ctx.lineTo(45, 56);
    ctx.lineTo(60, 40);
    ctx.stroke();
  }

  function dibujarEngranaje(ctx) {
    const dientes = 8;
    ctx.beginPath();
    for (let i = 0; i < dientes; i++) {
      const angulo = (i / dientes) * Math.PI * 2;
      [[-0.26, 21], [-0.15, 30], [0.15, 30], [0.26, 21]].forEach(([desvio, radio], j) => {
        const x = 48 + Math.cos(angulo + desvio) * radio;
        const y = 48 + Math.sin(angulo + desvio) * radio;
        if (i === 0 && j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = COLOR.cian;
    circulo(ctx, 48, 48, 8);
    ctx.stroke();
  }

  function dibujarTarjeta(ctx) {
    trazarRectangulo(ctx, 18, 28, 60, 40, 7);
    ctx.stroke();

    ctx.strokeStyle = COLOR.cian;
    ctx.beginPath();
    ctx.moveTo(18, 40);
    ctx.lineTo(78, 40);
    ctx.stroke();

    ctx.lineWidth = 3;
    trazarRectangulo(ctx, 26, 50, 13, 10, 2);
    ctx.stroke();

    ctx.strokeStyle = COLOR.violeta;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(48, 56);
    ctx.lineTo(68, 56);
    ctx.stroke();
  }

  const FIGURAS = {
    envio: dibujarCamion,
    garantia: dibujarEscudo,
    montaje: dibujarEngranaje,
    pago: dibujarTarjeta
  };

  function dibujarIcono(canvas, tipo) {
    const tamano = Number(canvas.dataset.tamano) || 96;
    const ctx = ajustarCanvas(canvas, tamano, tamano);
    ctx.scale(tamano / 96, tamano / 96);

    ctx.fillStyle = COLOR.superficie;
    circulo(ctx, 48, 48, 46);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = degradadoMarca(ctx, 0, 0, 96, 96);
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COLOR.violeta;
    (FIGURAS[tipo] || dibujarEngranaje)(ctx);
  }

  function dibujarFondo(canvas) {
    const caja = canvas.parentElement;
    const ancho = caja.clientWidth;
    const alto = caja.clientHeight;
    const ctx = ajustarCanvas(canvas, ancho, alto);
    const paso = 68;

    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let fila = 0; fila * paso < alto + paso; fila++) {
      for (let columna = 0; columna * paso < ancho + paso; columna++) {
        const giro = (fila * 3 + columna * 5) % 4;
        const color = (fila + columna) % 2 ? COLOR.cian : COLOR.violeta;

        ctx.save();
        ctx.translate(columna * paso + (fila % 2) * (paso / 2), fila * paso);
        ctx.rotate((giro * Math.PI) / 2);
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        if ((fila * 2 + columna) % 7 === 0) {
          ctx.strokeRect(-9, -9, 18, 18);
          ctx.fillRect(-4, -4, 8, 8);
        } else {
          circulo(ctx, 0, 0, 3.5);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(26, 0);
        ctx.lineTo(36, 10);
        ctx.stroke();
        circulo(ctx, 36, 10, 2.5);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  function iniciarRecursos() {
    const banner = document.getElementById('banner');
    const fondo = document.getElementById('fondo');

    document.querySelectorAll('canvas[data-logo]').forEach(dibujarLogo);
    document.querySelectorAll('canvas[data-icono]').forEach((canvas) => dibujarIcono(canvas, canvas.dataset.icono));

    if (banner) {
      dibujarBanner(banner);
      window.addEventListener('resize', () => dibujarBanner(banner));
      if (document.fonts) document.fonts.ready.then(() => dibujarBanner(banner));
    }

    if (fondo && 'ResizeObserver' in window) {
      new ResizeObserver(() => dibujarFondo(fondo)).observe(fondo.parentElement);
    } else if (fondo) {
      dibujarFondo(fondo);
      window.addEventListener('resize', () => dibujarFondo(fondo));
    }
  }

  document.addEventListener('DOMContentLoaded', iniciarRecursos);
})();
