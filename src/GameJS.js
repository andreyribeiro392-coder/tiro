window.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 500;
  canvas.style.background = "#0a0a0a";
  app.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // player FPS (posição + direção do mouse)
  const player = {
    x: 450,
    y: 400,
    angle: 0,
    speed: 4,
  };

  const keys = {};
  let mouse = { x: 0, y: 0, click: false };

  document.addEventListener("keydown", e => keys[e.key] = true);
  document.addEventListener("keyup", e => keys[e.key] = false);

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  });

  canvas.addEventListener("mousedown", () => mouse.click = true);
  canvas.addEventListener("mouseup", () => mouse.click = false);

  // inimigos
  const enemies = [];

  function spawnEnemy() {
    enemies.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      hp: 1,
    });
  }

  setInterval(spawnEnemy, 1500);

  function shoot() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      const dx = e.x - player.x;
      const dy = e.y - player.y;

      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        enemies.splice(i, 1);
        break;
      }
    }
  }

  function update() {
    // movimento FPS
    if (keys["w"]) {
      player.x += Math.cos(player.angle) * player.speed;
      player.y += Math.sin(player.angle) * player.speed;
    }
    if (keys["s"]) {
      player.x -= Math.cos(player.angle) * player.speed;
      player.y -= Math.sin(player.angle) * player.speed;
    }
    if (keys["a"]) {
      player.x += Math.cos(player.angle - Math.PI / 2) * player.speed;
      player.y += Math.sin(player.angle - Math.PI / 2) * player.speed;
    }
    if (keys["d"]) {
      player.x += Math.cos(player.angle + Math.PI / 2) * player.speed;
      player.y += Math.sin(player.angle + Math.PI / 2) * player.speed;
    }

    // tiro
    if (mouse.click) {
      shoot();
      mouse.click = false;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // chão estilo mapa
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid mapa
    ctx.strokeStyle = "#222";
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // player (FPS arma simples)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = "lime";
    ctx.fillRect(0, -5, 30, 10);

    ctx.restore();

    // inimigos
    enemies.forEach(e => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;

      const dist = Math.sqrt(dx * dx + dy * dy);

      const size = Math.max(5, 50 - dist * 0.1);

      ctx.fillStyle = "red";
      ctx.fillRect(e.x, e.y, size, size);
    });

    // mira central
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
});
