// GameJS.js - FPS Arcade PRO (Canvas 2D)

(() => {
  let canvas = document.getElementById("game") ||
               document.getElementById("canvas") ||
               document.querySelector("canvas");

  if (!canvas) {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const W = () => canvas.width;
  const H = () => canvas.height;

  const keys = {};
  let mouseDX = 0;
  let mouseDY = 0;

  let sensitivity = 0.0025;

  const player = {
    x: 0,
    y: 0,
    angle: 0,
    hp: 100,
    score: 0,
    speed: 2.6,
    cooldown: 0
  };

  const bullets = [];
  const enemies = [];

  const WORLD = 2200;

  function rand(a, b) {
    return Math.random() * (b - a) + a;
  }

  function spawnEnemy() {
    enemies.push({
      x: rand(-WORLD, WORLD),
      y: rand(-WORLD, WORLD),
      hp: 40,
      speed: rand(0.6, 1.4)
    });
  }

  for (let i = 0; i < 14; i++) spawnEnemy();

  // INPUT
  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  // POINTER LOCK (FPS FEEL)
  canvas.addEventListener("click", () => {
    canvas.requestPointerLock?.();
    shoot();
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      mouseDX = e.movementX || 0;
      mouseDY = e.movementY || 0;

      player.angle += mouseDX * sensitivity;
    }
  });

  function shoot() {
    if (player.cooldown > 0) return;
    player.cooldown = 10;

    // hitscan (raycast simplificado)
    const range = 900;
    const cx = Math.cos(player.angle);
    const cy = Math.sin(player.angle);

    let hitEnemy = null;
    let bestDist = 999999;

    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;

      const dist = Math.hypot(dx, dy);
      if (dist > range) continue;

      const dir = (dx * cx + dy * cy) / dist;

      if (dir > 0.98) {
        if (dist < bestDist) {
          bestDist = dist;
          hitEnemy = e;
        }
      }
    }

    if (hitEnemy) {
      hitEnemy.hp -= 25;
      player.score += 5;

      if (hitEnemy.hp <= 0) {
        enemies.splice(enemies.indexOf(hitEnemy), 1);
        spawnEnemy();
        player.score += 10;
      }
    }
  }

  function updatePlayer() {
    let vx = 0, vy = 0;

    const cos = Math.cos(player.angle);
    const sin = Math.sin(player.angle);

    if (keys["w"]) {
      vx += cos * player.speed;
      vy += sin * player.speed;
    }
    if (keys["s"]) {
      vx -= cos * player.speed;
      vy -= sin * player.speed;
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

    player.cooldown = Math.max(0, player.cooldown - 1);

    // limites do mapa
    player.x = Math.max(-WORLD, Math.min(WORLD, player.x));
    player.y = Math.max(-WORLD, Math.min(WORLD, player.y));
  }

  function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;

      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;

      if (dist < 25) {
        player.hp -= 0.4;
      }

      if (e.hp <= 0) {
        enemies.splice(i, 1);
        spawnEnemy();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());

    // background
    ctx.fillStyle = "#070a10";
    ctx.fillRect(0, 0, W(), H());

    ctx.save();
    ctx.translate(W() / 2 - player.x, H() / 2 - player.y);

    // grid
    ctx.strokeStyle = "#111";
    for (let i = -WORLD; i < WORLD; i += 120) {
      ctx.beginPath();
      ctx.moveTo(i, -WORLD);
      ctx.lineTo(i, WORLD);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-WORLD, i);
      ctx.lineTo(WORLD, i);
      ctx.stroke();
    }

    // enemies (fake depth scaling)
    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d = Math.hypot(dx, dy);

      const scale = Math.max(0.4, 1 - d / 2000);

      ctx.fillStyle = "red";
      ctx.fillRect(
        e.x - 10 * scale,
        e.y - 10 * scale,
        20 * scale,
        20 * scale
      );
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

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("HP: " + Math.max(0, Math.floor(player.hp)), 20, 30);
    ctx.fillText("Score: " + player.score, 20, 55);

    // crosshair
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(W() / 2 - 10, H() / 2);
    ctx.lineTo(W() / 2 + 10, H() / 2);
    ctx.moveTo(W() / 2, H() / 2 - 10);
    ctx.lineTo(W() / 2, H() / 2 + 10);
    ctx.stroke();

    // hit marker style feedback (simple)
    if (player.cooldown > 7) {
      ctx.strokeStyle = "yellow";
      ctx.beginPath();
      ctx.arc(W() / 2, H() / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function loop() {
    updatePlayer();
    updateEnemies();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
