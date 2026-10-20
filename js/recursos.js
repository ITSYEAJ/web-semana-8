const COLOR = {
  fondo: "#0b0c10",
  tarjeta: "#1b1e27",
  violeta: "#a78bfa",
  cian: "#67e8f9",
  blanco: "#f4f5f8"
};

function ajustarCanvas(canvas, ancho, alto) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(ancho * dpr);
  canvas.height = Math.round(alto * dpr);
  canvas.style.width = ancho + "px";
  canvas.style.height = alto + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function degradado(ctx, x0, y0, x1, y1) {
  const relleno = ctx.createLinearGradient(x0, y0, x1, y1);
  relleno.addColorStop(0, COLOR.violeta);
  relleno.addColorStop(1, COLOR.cian);
  return relleno;
}

function circulo(ctx, x, y, radio, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fill();
}

function dibujarLogo(canvas) {
  const ctx = ajustarCanvas(canvas, 64, 64);

  ctx.fillStyle = degradado(ctx, 0, 0, 64, 64);
  ctx.beginPath();
  ctx.roundRect(0, 0, 64, 64, 16);
  ctx.fill();

  ctx.strokeStyle = COLOR.fondo;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(20, 45);
  ctx.lineTo(20, 19);
  ctx.lineTo(44, 45);
  ctx.lineTo(44, 19);
  ctx.stroke();

  circulo(ctx, 20, 45, 5, COLOR.fondo);
  circulo(ctx, 20, 45, 2, COLOR.blanco);
  circulo(ctx, 44, 19, 5, COLOR.fondo);
  circulo(ctx, 44, 19, 2, COLOR.blanco);
}

function dibujarChip(ctx, x, y, lado) {
  ctx.save();

  ctx.globalAlpha = 0.6;
  ctx.fillStyle = COLOR.blanco;
  for (let i = 1; i <= 4; i++) {
    const p = (lado / 5) * i;
    ctx.fillRect(x + p - 2, y - 8, 4, 8);
    ctx.fillRect(x + p - 2, y + lado, 4, 8);
    ctx.fillRect(x - 8, y + p - 2, 8, 4);
    ctx.fillRect(x + lado, y + p - 2, 8, 4);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLOR.tarjeta;
  ctx.strokeStyle = COLOR.violeta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, lado, lado, 10);
  ctx.fill();
  ctx.stroke();

  const margen = lado * 0.2;
  ctx.shadowColor = COLOR.cian;
  ctx.shadowBlur = 25;
  ctx.fillStyle = degradado(ctx, x, y, x + lado, y + lado);
  ctx.beginPath();
  ctx.roundRect(x + margen, y + margen, lado - margen * 2, lado - margen * 2, 8);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLOR.fondo;
  ctx.font = `700 ${lado * 0.4}px Outfit, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", x + lado / 2, y + lado / 2);

  ctx.restore();
}

function dibujarBanner(canvas) {
  const ancho = canvas.parentElement.clientWidth;
  const alto = ancho < 600 ? 150 : 230;
  const chico = ancho < 600;
  const ctx = ajustarCanvas(canvas, ancho, alto);

  const titulo = chico ? 30 : 54;
  const subtitulo = chico ? 14 : 20;
  const frase = chico ? "Computadoras y gaming" : "Computadoras, componentes y gaming";
  const relleno = chico ? 14 : 24;
  const espacio = chico ? 6 : 12;

  ctx.font = `700 ${titulo}px Outfit, sans-serif`;
  const anchoTitulo = ctx.measureText("NovaTech").width;
  ctx.font = `500 ${subtitulo}px Outfit, sans-serif`;
  const anchoFrase = ctx.measureText(frase).width;

  const caja = {
    x: chico ? 12 : 32,
    ancho: Math.max(anchoTitulo, anchoFrase) + relleno * 2,
    alto: titulo + espacio + subtitulo + relleno * 2
  };
  caja.y = (alto - caja.alto) / 2;

  const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
  fondo.addColorStop(0, COLOR.tarjeta);
  fondo.addColorStop(1, "#2b1f63");
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ancho, alto);

  const lado = chico ? 64 : 110;
  const chipX = Math.max(ancho - lado - (chico ? 28 : 90), caja.x + caja.ancho + 40);
  const chipY = (alto - lado) / 2;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = COLOR.cian;
  ctx.lineWidth = 2;
  for (let i = 1; i <= 4; i++) {
    const y = chipY + (lado / 5) * i;
    const inicio = caja.x + caja.ancho + 12 + i * 14;
    ctx.beginPath();
    ctx.moveTo(inicio, y);
    ctx.lineTo(ancho, y);
    ctx.stroke();
    circulo(ctx, inicio, y, 4, COLOR.cian);
  }
  ctx.restore();

  dibujarChip(ctx, chipX, chipY, lado);

  ctx.fillStyle = "rgba(11, 12, 16, 0.75)";
  ctx.beginPath();
  ctx.roundRect(caja.x, caja.y, caja.ancho, caja.alto, 16);
  ctx.fill();

  ctx.textBaseline = "top";
  ctx.font = `700 ${titulo}px Outfit, sans-serif`;
  ctx.fillStyle = degradado(ctx, caja.x, 0, caja.x + caja.ancho, 0);
  ctx.fillText("NovaTech", caja.x + relleno, caja.y + relleno);

  ctx.font = `500 ${subtitulo}px Outfit, sans-serif`;
  ctx.fillStyle = COLOR.blanco;
  ctx.fillText(frase, caja.x + relleno, caja.y + relleno + titulo + espacio);
}

function dibujarIcono(canvas, tipo) {
  const ctx = ajustarCanvas(canvas, 96, 96);

  circulo(ctx, 48, 48, 46, COLOR.fondo);
  ctx.lineWidth = 2;
  ctx.strokeStyle = degradado(ctx, 0, 0, 96, 96);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = COLOR.violeta;
  ctx.beginPath();

  if (tipo === "pc") {
    ctx.roundRect(22, 24, 52, 36, 5);
    ctx.moveTo(48, 60);
    ctx.lineTo(48, 70);
    ctx.moveTo(36, 72);
    ctx.lineTo(60, 72);
    ctx.stroke();

    ctx.strokeStyle = COLOR.cian;
    ctx.beginPath();
    ctx.moveTo(32, 50);
    ctx.lineTo(42, 40);
    ctx.lineTo(50, 46);
    ctx.lineTo(62, 34);
    ctx.stroke();
  } else if (tipo === "escudo") {
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
  } else if (tipo === "envio") {
    ctx.roundRect(20, 32, 32, 28, 3);
    ctx.moveTo(52, 41);
    ctx.lineTo(64, 41);
    ctx.lineTo(74, 51);
    ctx.lineTo(74, 60);
    ctx.lineTo(52, 60);
    ctx.stroke();

    ctx.strokeStyle = COLOR.cian;
    for (const x of [31, 64]) {
      circulo(ctx, x, 63, 6, COLOR.fondo);
      ctx.stroke();
    }
  }
}

function dibujarFondo(canvas) {
  const caja = canvas.parentElement;
  const ancho = caja.clientWidth;
  const alto = caja.clientHeight;
  const ctx = ajustarCanvas(canvas, ancho, alto);

  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 2;
  for (let y = 30; y < alto; y += 70) {
    for (let x = 30; x < ancho; x += 70) {
      const par = (x + y) % 140 === 60;
      const color = par ? COLOR.violeta : COLOR.cian;
      const giro = par ? 12 : -12;

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.moveTo(x + 4, y);
      ctx.lineTo(x + 26, y);
      ctx.lineTo(x + 38, y + giro);
      ctx.stroke();
      circulo(ctx, x + 38, y + giro, 3, color);
    }
  }
}

function iniciarRecursos() {
  dibujarLogo(document.getElementById("logo"));

  const banner = document.getElementById("banner");
  if (banner) {
    dibujarBanner(banner);
    window.addEventListener("resize", () => dibujarBanner(banner));
    document.fonts.ready.then(() => dibujarBanner(banner));
  }

  document.querySelectorAll("canvas[data-icono]")
    .forEach((canvas) => dibujarIcono(canvas, canvas.dataset.icono));

  const fondo = document.getElementById("fondo");
  if (fondo) {
    new ResizeObserver(() => dibujarFondo(fondo)).observe(fondo.parentElement);
  }
}

document.addEventListener("DOMContentLoaded", iniciarRecursos);
