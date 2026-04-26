window.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  if (!app) {
    console.error("Elemento #app não encontrado no HTML");
    return;
  }

  // =====================
  // BOTÃO START
  // =====================
  const button = document.createElement("button");
  button.innerText = "START";
  button.style.padding = "12px 24px";
  button.style.background = "green";
  button.style.color = "white";
  button.style.border = "none";
  button.style.cursor = "pointer";
  button.style.fontSize = "16px";

  app.appendChild(button);

  // =====================
  // CANVAS
  // =====================
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 500;
  canvas.style.display = "none";
  canvas.style.background = "#0d0d0d";
  canvas.style.border = "2px solid white";

  app.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // =====================
  // PLAYER
  // =====================
  const player = {
    x: 450,
    y: 430,
    w: 35,
    h: 35,
    speed: 6,
    cooldown: 0,
  };

  // =====================
  // INPUT
  // =====================
  const keys = {};

  document.addEventListener("keydown", (e) => (keys[e.key] = true));
  document.addEventListener("keyup", (e) => (keys[e.key] = false));

  // =====================
  // BULLETS
  // =====================
  const bullets = [];

  function shoot() {
    if (player.cooldown <= 0) {
      bullets.push({
        x: player.x + player.w / 2,
        y: player.y,
        speed: 8,
      });
      player.cooldown = 15;
    }
  }

  // =====================
  // ENEMIES
  // =====================
  const enemies = [];

  function spawnEnemy() {
    enemies.push({
      x: Math.random() * (canvas.width - 30),
      y: -20,
      w: 30,
      h: 30,
      speed: 2 + Math.random() * 2,
    });
  }

  setInterval(spawnEnemy, 1200);

  // =====================
  // GAME LOOP
  // =====================
  let score = 0;

  function update() {
    // movimento
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;

    // tiro
    if (keys[" "]) shoot();

    if (player.cooldown > 0) player.cooldown--;

    // limites
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;

      if (b.y < 0) bullets.splice(i, 1);
    }

    // enemies
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      e.y += e.speed;

      // colisão com player
      if (
        e.x < player.x + player.w &&
        e.x + e.w > player.x &&
        e.y < player.y + player.h &&
        e.y + e.h > player.y
      ) {
        score = 0;
        enemies.length = 0;
        bullets.length = 0;
        break;
      }

      // colisão com bala
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];

        if (
          b.x < e.x + e.w &&
          b.x > e.x &&
          b.y < e.y + e.h &&
          b.y > e.y
        ) {
          enemies.splice(ei, 1);
          bullets.splice(bi, 1);
          score += 10;
          break;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // fundo
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid
    ctx.strokeStyle = "#1f1f1f";
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // player
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // bullets
    ctx.fillStyle = "yellow";
    bullets.forEach((b) => ctx.fillRect(b.x, b.y, 5, 10));

    // enemies
    ctx.fillStyle = "red";
    enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.w, e.h));

    // score
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score, 10, 20);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // botão inicia jogo
  button.onclick = () => {
    button.style.display = "none";
    canvas.style.display = "block";
    loop();
  };
});
