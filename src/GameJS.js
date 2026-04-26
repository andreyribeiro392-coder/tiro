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

  const player = { x: 3.5, y: 3.5 };

  // 🗺 MAPA (1 = pedra, 2 = grama, 3 = árvore)
  const map = [
    "111111111111111",
    "100000000000001",
    "102222000022201",
    "100020000020001",
    "100020000020001",
    "100000033000001",
    "100020000020001",
    "102222000022201",
    "100000000000001",
    "111111111111111",
  ];

  const FOV = Math.PI / 3;
  const DEPTH = 18;

  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  canvas.addEventListener("click", () => canvas.requestPointerLock?.());

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      angle += e.movementX * 0.0025;
    }
  });

  function tile(x, y) {
    return map[Math.floor(y)]?.[Math.floor(x)] || "0";
  }

  function isWall(x, y) {
    return tile(x, y) !== "0";
  }

  function getColor(type, dist) {
    const fog = Math.max(0, 255 - dist * 18);

    if (type === "1") return `rgb(${fog},${fog},${fog})`;       // pedra
    if (type === "2") return `rgb(40,${fog},60)`;              // grama
    if (type === "3") return `rgb(20,120,40)`;                 // árvore
    return `rgb(${fog},${fog},${fog})`;
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
  }

  function castRay(rayAngle) {
    let dist = 0;
    const step = 0.02;

    while (dist < DEPTH) {
      const x = player.x + Math.cos(rayAngle) * dist;
      const y = player.y + Math.sin(rayAngle) * dist;

      if (isWall(x, y)) {
        return { dist, type: tile(x, y) };
      }

      dist += step;
    }

    return { dist: DEPTH, type: "0" };
  }

  function renderSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, "#0b1a2a");
    g.addColorStop(0.5, "#1b2a3a");
    g.addColorStop(1, "#2a1f1a");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W(), H());
  }

  function render() {
    renderSky();

    for (let x = 0; x < W(); x++) {
      const rayAngle = (angle - FOV / 2) + (x / W()) * FOV;
      const hit = castRay(rayAngle);

      const dist = hit.dist;

      const lineHeight = (H() / (dist + 0.0001));

      const color = getColor(hit.type, dist);

      ctx.fillStyle = color;
      ctx.fillRect(
        x,
        H() / 2 - lineHeight / 2,
        1,
        lineHeight
      );
    }

    // 🌳 sprites fake (árvores simples)
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[i].length; j++) {
        if (map[i][j] === "3") {
          const dx = j - player.x;
          const dy = i - player.y;
          const dist = Math.hypot(dx, dy);

          const size = Math.max(0, 300 / dist);

          const screenX = W() / 2 + dx * 40;
          const screenY = H() / 2 + dy * 40;

          ctx.fillStyle = `rgba(0,180,80,${1 - dist / 20})`;
          ctx.fillRect(screenX, screenY, size, size);
        }
      }
    }

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("FPS MAP TEST (TEXTURED)", 20, 25);
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
