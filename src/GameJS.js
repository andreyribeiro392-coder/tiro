const canvas = document.createElement("canvas");
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

let mouseX = 0;
let sensitivity = 0.0025;

document.body.addEventListener("click", () => {
  canvas.requestPointerLock();
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === canvas) {
    mouseX += e.movementX * sensitivity;
  }
});

const player = {
  x: 0,
  y: 0,
  angle: 0,
  hp: 100,
  speed: 2.2,
  cooldown: 0,
};

const enemies = [];
let score = 0;
let gameOver = false;

function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 400 + Math.random() * 400;
  enemies.push({
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    hp: 100,
    speed: 0.6 + Math.random() * 0.5,
  });
}

let spawnTimer = 0;

function clampMap(p) {
  const limit = 1200;
  if (p.x > limit) p.x = limit;
  if (p.x < -limit) p.x = -limit;
  if (p.y > limit) p.y = limit;
  if (p.y < -limit) p.y = -limit;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function shoot() {
  if (player.cooldown > 0) return;

  player.cooldown = 12;

  let best = null;
  let bestDiff = 0.15;

  for (let e of enemies) {
    const ang = angleTo(player, e);
    let diff = Math.atan2(Math.sin(ang - player.angle), Math.cos(ang - player.angle));
    const d = Math.abs(diff);

    if (d < bestDiff) {
      bestDiff = d;
      best = e;
    }
  }

  if (best) {
    best.hp -= 50;
    if (best.hp <= 0) {
      enemies.splice(enemies.indexOf(best), 1);
      score += 10;
    }
  }
}

let hitFlash = 0;

function update() {
  if (gameOver) return;

  player.angle = mouseX;

  let forwardX = Math.cos(player.angle);
  let forwardY = Math.sin(player.angle);
  let rightX = Math.cos(player.angle + Math.PI / 2);
  let rightY = Math.sin(player.angle + Math.PI / 2);

  let vx = 0;
  let vy = 0;

  if (keys["w"]) {
    vx += forwardX;
    vy += forwardY;
  }
  if (keys["s"]) {
    vx -= forwardX;
    vy -= forwardY;
  }
  if (keys["a"]) {
    vx -= rightX;
    vy -= rightY;
  }
  if (keys["d"]) {
    vx += rightX;
    vy += rightY;
  }

  player.x += vx * player.speed;
  player.y += vy * player.speed;

  clampMap(player);

  if (player.cooldown > 0) player.cooldown--;

  spawnTimer++;
  if (spawnTimer > 60) {
    spawnTimer = 0;
    spawnEnemy();
  }

  for (let e of enemies) {
    const ang = angleTo(e, player);
    e.x += Math.cos(ang) * e.speed;
    e.y += Math.sin(ang) * e.speed;

    if (dist(e, player) < 18) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  if (player.hp <= 0) {
    gameOver = true;
  }

  if (keys[" "]) shoot();

  hitFlash = Math.max(0, hitFlash - 1);
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#0b0f1a");
  g.addColorStop(1, "#05070d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  drawBackground();

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for (let e of enemies) {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const distVal = Math.hypot(dx, dy);

    const ang = Math.atan2(dy, dx) - player.angle;

    if (Math.cos(ang) <= 0) continue;

    const screenX = cx + Math.tan(ang) * 500;

    const size = Math.max(2, 1200 / distVal);

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(screenX, cy, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("HP: " + Math.max(0, Math.floor(player.hp)), 20, 30);
  ctx.fillText("Score: " + score, 20, 55);

  if (hitFlash > 0) {
    ctx.fillStyle = "rgba(255,0,0,0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", cx - 120, cy);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
