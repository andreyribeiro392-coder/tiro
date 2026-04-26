const app = document.getElementById("app");

// cria canvas
const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 500;
canvas.style.background = "#111";
canvas.style.border = "2px solid white";

app.appendChild(canvas);

const ctx = canvas.getContext("2d");

// jogador
const player = {
  x: 380,
  y: 420,
  w: 40,
  h: 40,
  speed: 6,
};

const keys = {};

// controles
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function update() {
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  // limites da tela
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // fundo
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // jogador
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
