import playerImg from "./assets/player.png";

let player = { x: 500, y: 400, speed: 4 };
let enemies = [];
let bullets = [];
let keys = {};
let mouse = { x: 0, y: 0 };

export function startGame(canvas) {
  const ctx = canvas.getContext("2d");

  spawnEnemies();

  window.addEventListener("keydown", (e) => (keys[e.key] = true));
  window.addEventListener("keyup", (e) => (keys[e.key] = false));

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener("click", shoot);

  function shoot() {
    bullets.push({
      x: player.x,
      y: player.y,
      dx: mouse.x - player.x,
      dy: mouse.y - player.y
    });
  }

  function spawnEnemies() {
    for (let i = 0; i < 10; i++) {
      enemies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        health: 100
      });
    }
  }

  function update() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    bullets.forEach((b) => {
      b.x += b.dx * 0.05;
      b.y += b.dy * 0.05;
    });

    bullets.forEach((b) => {
      enemies.forEach((e) => {
        let dx = e.x - b.x;
        let dy = e.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
          e.health -= 50;
        }
      });
    });

    enemies = enemies.filter((e) => e.health > 0);
  }

  function drawMap() {
    ctx.fillStyle = "#2e7d32";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = "#795548";
      ctx.fillRect(100 + i * 150, 100, 80, 80);
    }

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = "#555";
      ctx.fillRect(200 + i * 200, 300, 100, 150);
    }
  }

  function drawPlayer() {
    ctx.drawImage(playerImg, player.x - 20, player.y - 20, 40, 40);
  }

  function drawEnemies() {
    enemies.forEach((e) => {
      ctx.fillStyle = "red";
      ctx.fillRect(e.x, e.y, 30, 30);
    });
  }

  function drawBullets() {
    ctx.fillStyle = "yellow";
    bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update();
    drawMap();
    drawPlayer();
    drawEnemies();
    drawBullets();

    requestAnimationFrame(loop);
  }

  loop();
}
