// GameJS.js — FPS 3D Battle Royale Lite Engine (Browser)
// No external libraries
// Optimized pseudo-3D raycasting engine (Wolfenstein-style)

(() => {
  const canvas = document.createElement('canvas');
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  });

  // ===== MAP =====
  const map = [
    "1111111111111111",
    "1000000000000001",
    "1011110111111101",
    "1000010000000101",
    "1011011110110101",
    "1001000000100001",
    "1011110111101101",
    "1000000000000001",
    "1111111111111111"
  ];

  const mapW = map[0].length;
  const mapH = map.length;

  const tileSize = 64;

  // ===== PLAYER =====
  const player = {
    x: 100,
    y: 100,
    angle: 0,
    hp: 100,
    speed: 2.2
  };

  // ===== ENEMIES =====
  const enemies = [];

  function spawnEnemy() {
    enemies.push({
      x: Math.random() * mapW * tileSize,
      y: Math.random() * mapH * tileSize,
      hp: 100
    });
  }

  for (let i = 0; i < 8; i++) spawnEnemy();

  // ===== INPUT =====
  const keys = {};
  document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  document.addEventListener('mousemove', e => {
    player.angle += e.movementX * 0.002;
  });

  document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
    shoot();
  });

  // ===== COLLISION =====
  function isWall(x, y) {
    const mx = Math.floor(x / tileSize);
    const my = Math.floor(y / tileSize);
    if (mx < 0 || my < 0 || mx >= mapW || my >= mapH) return true;
    return map[my][mx] === '1';
  }

  // ===== SHOOT =====
  function shoot() {
    for (let i = 0; i < enemies.length; i++) {
      const dx = enemies[i].x - player.x;
      const dy = enemies[i].y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        enemies[i].hp -= 50;
        if (enemies[i].hp <= 0) enemies.splice(i, 1);
        break;
      }
    }
  }

  // ===== UPDATE =====
  function update() {
    let moveX = 0, moveY = 0;

    if (keys['w']) {
      moveX += Math.cos(player.angle) * player.speed;
      moveY += Math.sin(player.angle) * player.speed;
    }
    if (keys['s']) {
      moveX -= Math.cos(player.angle) * player.speed;
      moveY -= Math.sin(player.angle) * player.speed;
    }
    if (keys['a']) {
      moveX += Math.cos(player.angle - Math.PI / 2) * player.speed;
      moveY += Math.sin(player.angle - Math.PI / 2) * player.speed;
    }
    if (keys['d']) {
      moveX += Math.cos(player.angle + Math.PI / 2) * player.speed;
      moveY += Math.sin(player.angle + Math.PI / 2) * player.speed;
    }

    if (!isWall(player.x + moveX, player.y)) player.x += moveX;
    if (!isWall(player.x, player.y + moveY)) player.y += moveY;

    // enemies simple AI
    for (let e of enemies) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < 200) {
        e.x += dx / d * 0.6;
        e.y += dy / d * 0.6;
      }

      if (d < 20) player.hp -= 0.2;
    }
  }

  // ===== RAYCAST =====
  function castRay(angle) {
    let rayX = player.x;
    let rayY = player.y;

    const step = 2;
    for (let i = 0; i < 300; i += step) {
      rayX += Math.cos(angle) * step;
      rayY += Math.sin(angle) * step;

      if (isWall(rayX, rayY)) {
        return i;
      }
    }
    return 300;
  }

  // ===== RENDER =====
  function render() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, H / 2, W, H / 2);

    const fov = Math.PI / 3;
    const rays = W;

    for (let i = 0; i < rays; i += 4) {
      const rayAngle = player.angle - fov / 2 + (i / rays) * fov;
      const dist = castRay(rayAngle);

      const corrected = dist * Math.cos(rayAngle - player.angle);
      const wallHeight = (tileSize * 300) / (corrected + 0.0001);

      ctx.fillStyle = `rgb(${255 - corrected * 0.6},${200 - corrected * 0.4},${100})`;
      ctx.fillRect(i, H / 2 - wallHeight / 2, 4, wallHeight);
    }

    // enemies
    for (let e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const angle = Math.atan2(dy, dx) - player.angle;
      const size = 200 / dist;

      const sx = W / 2 + Math.tan(angle) * W;

      ctx.fillStyle = 'red';
      ctx.fillRect(sx, H / 2 - size / 2, size, size);
    }

    // HUD
    ctx.fillStyle = 'white';
    ctx.fillText("HP: " + Math.floor(player.hp), 20, 20);
    ctx.fillText("ENEMIES: " + enemies.length, 20, 40);
  }

  // ===== LOOP =====
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
