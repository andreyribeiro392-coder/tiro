// GameJS.js - FPS Arcade (Canvas 2D)

(() => {
  const canvas =
    document.getElementById("game") ||
    document.getElementById("canvas") ||
    document.querySelector("canvas");

  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const W = canvas.width;
  const H = canvas.height;

  const keys = {};
  let mouseX = W / 2;
  let mouseY = H / 2;
  let mouseDown = false;

  const player = {
    x: 0,
    y: 0,
    angle: 0,
    hp: 100,
    score: 0,
    speed: 2.5,
  };

  const bullets = [];
  const enemies = [];

  const WORLD_SIZE = 2000;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnEnemy() {
    enemies.push({
      x: rand(-WORLD_SIZE, WORLD_SIZE),
      y: rand(-WORLD_SIZE, WORLD_SIZE),
      hp: 30,
      speed: rand(0.5, 1.2),
    });
  }

  for (let i = 0; i < 12; i++) spawnEnemy();

  window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    player.angle = Math.atan2(mouseY - H / 2, mouseX - W / 2);
  });

  window.addEventListener("mousedown", () => {
    mouseDown = true;
    shoot();
  });

  window.addEventListener("mouseup", () => (mouseDown = false));

  function shoot() {
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(player.angle) * 8,
      dy: Math.sin(player.angle) * 8,
      life: 60,
    });
  }

  function updatePlayer() {
    let vx = 0;
    let vy = 0;

    if (keys["w"]) {
      vx += Math.cos(player.angle) * player.speed;
      vy += Math.sin(player.angle) * player.speed;
    }
    if (keys["s"]) {
      vx -= Math.cos(player.angle) * player.speed;
      vy -= Math.sin(player.angle) * player.speed;
    }
    if (keys["a"]) {
      vx += Math.cos(player.angle - Math.PI / 2) * player.speed;
      vy += Math.sin(player.angle - Math.PI / 2) * player.speed;
    }
    if (keys["d"]) {
      vx += Math.cos(player.angle + Math.PI / 2) * player.speed;
      vy += Math.sin(player.angle + Math.PI / 2) * player.speed;
    }

    player.x += vx;
    player.y += vy;
  }

  function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      b.life--;

      if (b.life <= 0) bullets.splice(i, 1);
    }
  }

  function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;

      // player collision
      if (dist < 30) {
        player.hp -= 0.3;
      }

      // bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const bd = Math.hypot(b.x - e.x, b.y - e.y);

        if (bd < 20) {
          e.hp -= 15;
          bullets.splice(j, 1);

          if (e.hp <= 0) {
            enemies.splice(i, 1);
            player.score += 10;
            spawnEnemy();
            break;
          }
        }
      }
    }
  }

  function drawWorld() {
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2 - player.x, H / 2 - player.y);

    // grid
    ctx.strokeStyle = "#111";
    for (let i = -WORLD_SIZE; i < WORLD_SIZE; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, -WORLD_SIZE);
      ctx.lineTo(i, WORLD_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-WORLD_SIZE, i);
      ctx.lineTo(WORLD_SIZE, i);
      ctx.stroke();
    }

    // enemies
    for (const e of enemies) {
      ctx.fillStyle = "red";
      ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
    }

    // bullets
    ctx.fillStyle = "yellow";
    for (const b of bullets) {
      ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
    }

    // player
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // direction line
    ctx.strokeStyle = "cyan";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x + Math.cos(player.angle) * 20,
      player.y + Math.sin(player.angle) * 20
    );
    ctx.stroke();

    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";

    ctx.fillText("HP: " + Math.max(0, Math.floor(player.hp)), 20, 30);
    ctx.fillText("Score: " + player.score, 20, 55);

    // crosshair
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(W / 2 - 10, H / 2);
    ctx.lineTo(W / 2 + 10, H / 2);
    ctx.moveTo(W / 2, H / 2 - 10);
    ctx.lineTo(W / 2, H / 2 + 10);
    ctx.stroke();
  }

  function loop() {
    updatePlayer();
    updateBullets();
    updateEnemies();

    drawWorld();
    drawHUD();

    requestAnimationFrame(loop);
  }

  loop();
})();
