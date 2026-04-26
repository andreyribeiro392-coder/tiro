window.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 500;
  canvas.style.background = "#0d0d0d";
  canvas.style.border = "2px solid white";

  app.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const player = {
    x: 450,
    y: 430,
    w: 35,
    h: 35,
    speed: 6,
  };

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
});
