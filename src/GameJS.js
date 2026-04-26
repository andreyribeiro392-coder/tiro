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

  const keys = {};
  let angle = 0;

  const player = { x: 3, y: 3 };

  const map = [
    "111111111111",
    "100000000001",
    "101111011101",
    "101000000101",
    "101011110101",
    "101000000101",
    "101111011101",
    "100000000001",
    "111111111111",
  ];

  const FOV = Math.PI / 3;
  const depth = 16;

  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  window.addEventListener("mousemove", e => {
    if (document.pointerLockElement === canvas) {
      angle += e.movementX * 0.002;
    }
  });

  canvas.addEventListener("click", () => canvas.requestPointerLock?.());

  function isWall(x, y) {
    return map[Math.floor(y)]?.[Math.floor(x)] === "1";
  }

  function update() {
    const speed = 0.05;

    let dx = 0;
    let dy = 0;

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

    while (dist < depth) {
      const testX = player.x + Math.cos(rayAngle) * dist;
      const testY = player.y + Math.sin(rayAngle) * dist;

      if (isWall(testX, testY)) return dist;

      dist += step;
    }

    return depth;
  }

  function render() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x++) {
      const rayAngle = (angle - FOV / 2) + (x / canvas.width) * FOV;
      const dist = castRay(rayAngle);

      const lineHeight = (canvas.height / dist);

      const shade = 255 - dist * 20;

      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(x, canvas.height / 2 - lineHeight / 2, 1, lineHeight);
    }

    ctx.fillStyle = "white";
    ctx.fillText("FPS DOOM MODE OK", 20, 20);
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
