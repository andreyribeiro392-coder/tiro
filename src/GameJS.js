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

  const player = { x: 6, y: 6 };

  // 🗺 MAPA ABERTO (não labirinto)
  const mapW = 20;
  const mapH = 20;

  const map = [];
  for (let y = 0; y < mapH; y++) {
    const row = [];
    for (let x = 0; x < mapW; x++) {
      const border = x === 0 || y === 0 || x === mapW - 1 || y === mapH - 1;
      const tree = Math.random() < 0.08;
      row.push(border ? 1 : tree ? 2 : 0);
    }
    map.push(row);
  }

  const FOV = Math.PI / 3;
  const DEPTH = 25;

  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  canvas.addEventListener("click", () => canvas.requestPointerLock?.());

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      angle += e.movementX * 0.0025;
    }
  });

  function tile(x, y) {
    return map[Math.floor(y)]?.[Math.floor(x)] ?? 1;
  }

  function isWall(x, y) {
    return tile(x, y) === 1;
  }

  function isTree(x, y) {
    return tile(x, y) === 2;
  }

  function update() {
    const speed = 0.06;

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

      if (isWall(x, y)) return { dist, type: "wall" };

      dist += step;
    }

    return { dist: DEPTH, type: "none" };
  }

  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, "#4aa3ff");
    g.addColorStop(0.5, "#87c7ff");
    g.addColorStop(1, "#2c6b2f");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W(), H());
  }

  function ground() {
    ctx.fillStyle = "#2f6b2f";
    ctx.fillRect(0, H() / 2, W(), H() / 2);
  }

  function render() {
    sky();
    ground();

    for (let x = 0; x < W(); x++) {
      const rayAngle = (angle - FOV / 2) + (x / W()) * FOV;
      const hit = castRay(rayAngle);

      const dist = hit.dist;

      const height = H() / (dist + 0.0001);

      // 🪨 parede com textura fake (noise + shading)
      let shade = 255 - dist * 18;
      shade = Math.max(40, shade);

      const noise = Math.random() * 20;

      ctx.fillStyle = `rgb(${shade - 30 + noise},${shade - 30 + noise},${shade - 30 + noise})`;

      ctx.fillRect(
        x,
        H() / 2 - height / 2,
        1,
        height
      );
    }

    // 🌳 árvores (sprites fake realistas)
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (!isTree(x, y)) continue;

        const dx = x - player.x;
        const dy = y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.5) continue;

        const size = 400 / dist;

        const screenX = W() / 2 + dx * 60;
        const screenY = H() / 2 + dy * 60;

        ctx.fillStyle = `rgba(20,120,40,${1 - dist / 25})`;
        ctx.fillRect(screenX, screenY, size, size * 1.5);
      }
    }

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("FPS WORLD (REALISTIC MAP MODE)", 20, 25);
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
