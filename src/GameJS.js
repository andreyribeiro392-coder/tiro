window.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  // botão start
  const button = document.createElement("button");
  button.innerText = "START FPS";
  app.appendChild(button);

  // canvas
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 500;
  canvas.style.display = "none";
  canvas.style.background = "#111";
  app.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // player (FPS simulado)
  const player = {
    x: 450,
    y: 450,
    speed: 4,
    hp: 100,
  };

  const keys = {};
  document.addEventListener("keydown", (e) => (keys[e.key] = true));
  document.addEventListener("keyup", (e) => (keys[e.key] = false));

  // inimigos
  const enemies = [];

  function spawnEnemy() {
    enemies.push({
      x: Math.random() * canvas.width,
      y: -20,
      size: 25,
      speed: 1.5 + Math.random() * 2,
    });
  }

  setInterval(spawnEnemy, 1000);

  let score = 0;
  let shootingCooldown = 0;

  function shoot() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // "raycast simples"
      const dx = e.x - player.x;
      const dy = e.y - player.y;

      if (Math.abs(dx) < 40 && dy < 200) {
        enemies.splice(i, 1);
        score += 10;
        break;
      }
    }
  }

  function update() {
    // movimento
    if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
    if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;
    if (keys["ArrowUp"] || keys["w"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["s"]) player.y += player.speed;

    // limites
    player.x = Math.max(0, Math.min(canvas.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height, player.y));

    // tiro
    if (keys[" "] && shootingCooldown <= 0) {
      shoot();
      shootingCooldown = 15;
    }

    if (shootingCooldown > 0) shootingCooldown--;

    // inimigos descendo
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.speed;

      // colisão com player
      const dx = e.x - player.x;
      const dy = e.y - player.y;

      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        player.hp -= 10;
        enemies.splice(i, 1);
      }

      if (e.y > canvas.height) {
        enemies.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // chão / céu (FPS vibe)
    ctx.fillStyle = "#222";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    // mira
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 10);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
    ctx.stroke();

    // inimigos (simulando distância)
    enemies.forEach((e) => {
      const size = e.size + (e.y / canvas.height) * 50;

      ctx.fillStyle = "red";
      ctx.fillRect(e.x, e.y, size, size);
    });

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("HP: " + player.hp, 10, 20);
    ctx.fillText("Score: " + score, 10, 40);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  button.onclick = () => {
    button.style.display = "none";
    canvas.style.display = "block";
    loop();
  };
});
