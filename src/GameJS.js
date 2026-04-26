(() => {
  const canvas = document.querySelector("canvas") || document.createElement("canvas");
  if (!canvas.parentNode) document.body.appendChild(canvas);

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
  let angle = 0;

  const ui = {
    inventory: false,
    map: false
  };

  const player = {
    x: 5,
    y: 5,
    hp: 100,
    weapon: 1,
    recoil: 0
  };

  const weapons = {
    1: { name: "Pistola", dmg: 20, range: 10 },
    2: { name: "Rifle", dmg: 10, range: 18 }
  };

  const enemies = [];

  const map = [
    "111111111111",
    "100000000001",
    "100011000001",
    "100000000001",
    "100000000001",
    "100001110001",
    "100000000001",
    "111111111111",
  ];

  const FOV = Math.PI / 3;
  const DEPTH = 20;

  function rand(a, b) {
    return Math.random() * (b - a) + a;
  }

  function spawnEnemy() {
    enemies.push({
      x: rand(2, 10),
      y: rand(2, 6),
      hp: 50,
      speed: 0.02
    });
  }

  for (let i = 0; i < 5; i++) spawnEnemy();

  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === "1") player.weapon = 1;
    if (e.key === "2") player.weapon = 2;

    if (e.key.toLowerCase() === "i") ui.inventory = !ui.inventory;
    if (e.key.toLowerCase() === "m") ui.map = !ui.map;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock?.();
    shoot();
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      angle += e.movementX * 0.002;
    }
  });

  function isWall(x, y) {
    return map[Math.floor(y)]?.[Math.floor(x)] === "1";
  }

  function shoot() {
    const w = weapons[player.weapon];

    let hit = null;
    let distHit = 999;

    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.hypot(dx, dy);

      const dir = (dx * Math.cos(angle) + dy * Math.sin(angle)) / dist;

      if (dir > 0.98 && dist < w.range) {
        if (dist < distHit) {
          hit = e;
          distHit = dist;
        }
      }
    }

    if (hit) {
      hit.hp -= w.dmg;

      if (hit.hp <= 0) {
        enemies.splice(enemies.indexOf(hit), 1);
        spawnEnemy();
      }
    }

    player.recoil = 10;
  }

  function update() {
    const speed = 0.05;

    let dx = 0, dy = 0;

    if (keys["w"]) {
      dx += Math.cos(angle) * speed;
      dy += Math.sin(angle) * speed;
    }
    if (keys["s"]) {
      dx -= Math.cos(angle) * speed;
      dy -= Math.sin(angle) * speed;
    }
    if (keys["a"]) {
      dx += Math.cos(angle - Math.PI / 2) * speed;
      dy += Math.sin(angle - Math.PI / 2) * speed;
    }
    if (keys["d"]) {
      dx += Math.cos(angle + Math.PI / 2) * speed;
      dy += Math.sin(angle + Math.PI / 2) * speed;
    }

    if (!isWall(player.x + dx, player.y)) player.x += dx;
    if (!isWall(player.x, player.y + dy)) player.y += dy;

    player.recoil *= 0.85;

    for (const e of enemies) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;

      if (dist < 0.5) player.hp -= 0.2;
    }
  }

  function cast(rayAngle) {
    let dist = 0;

    while (dist < DEPTH) {
      const x = player.x + Math.cos(rayAngle) * dist;
      const y = player.y + Math.sin(rayAngle) * dist;

      if (isWall(x, y)) return dist;

      dist += 0.02;
    }

    return DEPTH;
  }

  function render() {
    ctx.fillStyle = "#0a0f14";
    ctx.fillRect(0, 0, W(), H());

    for (let x = 0; x < W(); x++) {
      const rayAngle = (angle - FOV / 2) + (x / W()) * FOV;
      const dist = cast(rayAngle);

      const h = H() / (dist + 0.001);

      const shade = 255 - dist * 20;

      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(x, H() / 2 - h / 2 + player.recoil, 1, h);
    }

    // HUD
    ctx.fillStyle = "white";
    ctx.fillText("HP: " + player.hp.toFixed(0), 20, 20);
    ctx.fillText("Weapon: " + weapons[player.weapon].name, 20, 40);

    // INVENTORY
    if (ui.inventory) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(100, 100, 300, 200);

      ctx.fillStyle = "white";
      ctx.fillText("INVENTÁRIO", 120, 130);
      ctx.fillText("1 - Pistola", 120, 160);
      ctx.fillText("2 - Rifle", 120, 190);
    }

    // MAP
    if (ui.map) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(W() - 200, 20, 180, 180);

      ctx.fillStyle = "lime";
      ctx.fillRect(W() - 200 + player.x * 10, 20 + player.y * 10, 5, 5);
    }
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
