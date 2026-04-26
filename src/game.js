export function startGame() {
  const app = document.getElementById("app");

  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  app.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const player = { x: 380, y: 420, w: 40, h: 40, speed: 6 };

  const keys = {};

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  function loop() {
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    requestAnimationFrame(loop);
  }

  loop();
}
