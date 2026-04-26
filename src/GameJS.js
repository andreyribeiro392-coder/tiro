const app = document.getElementById("app");

// botão
const button = document.createElement("button");
button.innerText = "START";
button.style.padding = "10px 20px";
button.style.background = "green";
button.style.color = "white";
button.style.border = "none";
button.style.cursor = "pointer";

app.appendChild(button);

// canvas
const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 500;
canvas.style.display = "none"; // começa escondido
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

document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// clique no botão
button.onclick = () => {
  button.style.display = "none";
  canvas.style.display = "block";
  loop();
};

function update() {
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
