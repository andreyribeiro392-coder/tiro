// GameJS.js — FPS Canvas 2D Engine

const canvas = document.querySelector("canvas") || document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const keys = {};
let mouseX = 0;
let mouseY = 0;
let pointerLocked = false;

document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener("mousemove", e => {
    if (!pointerLocked) return;
    player.angle += e.movementX * player.sens;
    player.pitch -= e.movementY * player.sens;
    player.pitch = Math.max(-1, Math.min(1, player.pitch));
});

const map = {
    width: 20,
    height: 20,
    grid: []
};

for (let y = 0; y < map.height; y++) {
    map.grid[y] = [];
    for (let x = 0; x < map.width; x++) {
        map.grid[y][x] = (Math.random() < 0.12) ? 1 : 0;
    }
}

const player = {
    x: 5,
    y: 5,
    angle: 0,
    pitch: 0,
    speed: 0.05,
    runSpeed: 0.09,
    sens: 0.002,
    hp: 100,
    ammo: 30,
    weapon: 1,
    recoil: 0
};

const enemies = [];

function spawnEnemy() {
    enemies.push({
        x: Math.random() * 18 + 1,
        y: Math.random() * 18 + 1,
        hp: 100,
        speed: 0.02 + Math.random() * 0.02
    });
}

for (let i = 0; i < 8; i++) spawnEnemy();

let score = 0;

function castRay(angle) {
    let dist = 0;
    let step = 0.02;

    let dx = Math.cos(angle) * step;
    let dy = Math.sin(angle) * step;

    let x = player.x;
    let y = player.y;

    while (dist < 20) {
        x += dx;
        y += dy;
        dist += step;

        let mx = Math.floor(x);
        let my = Math.floor(y);

        if (map.grid[my] && map.grid[my][mx]) {
            return dist;
        }
    }
    return 20;
}

function shoot() {
    if (player.ammo <= 0) return;
    player.ammo--;

    let hit = enemies.find(e => {
        let dx = e.x - player.x;
        let dy = e.y - player.y;
        let dist = Math.hypot(dx, dy);
        let angle = Math.atan2(dy, dx) - player.angle;

        return Math.abs(angle) < 0.1 && dist < 8;
    });

    if (hit) {
        hit.hp -= 50;
        if (hit.hp <= 0) {
            enemies.splice(enemies.indexOf(hit), 1);
            score++;
            spawnEnemy();
        }
    }

    player.recoil = 0.2;
}

document.addEventListener("mousedown", shoot);

function update() {
    let moveSpeed = keys["ShiftLeft"] ? player.runSpeed : player.speed;

    if (keys["KeyW"]) {
        player.x += Math.cos(player.angle) * moveSpeed;
        player.y += Math.sin(player.angle) * moveSpeed;
    }
    if (keys["KeyS"]) {
        player.x -= Math.cos(player.angle) * moveSpeed;
        player.y -= Math.sin(player.angle) * moveSpeed;
    }
    if (keys["KeyA"]) {
        player.x += Math.cos(player.angle - Math.PI / 2) * moveSpeed;
        player.y += Math.sin(player.angle - Math.PI / 2) * moveSpeed;
    }
    if (keys["KeyD"]) {
        player.x += Math.cos(player.angle + Math.PI / 2) * moveSpeed;
        player.y += Math.sin(player.angle + Math.PI / 2) * moveSpeed;
    }

    enemies.forEach(e => {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);

        e.x += (dx / dist) * e.speed * 0.5;
        e.y += (dy / dist) * e.speed * 0.5;

        if (dist < 0.5) player.hp -= 0.5;
    });

    if (player.recoil > 0) player.recoil -= 0.02;
}

function render() {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    ctx.fillStyle = "#2d5f2d";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    const fov = Math.PI / 3;
    const rays = canvas.width;

    for (let i = 0; i < rays; i++) {
        let rayAngle = player.angle - fov / 2 + (i / rays) * fov;
        let dist = castRay(rayAngle);

        let lineHeight = (canvas.height / dist) * 0.8;

        ctx.fillStyle = `rgb(${255 - dist * 12}, ${100}, ${100})`;
        ctx.fillRect(i, canvas.height / 2 - lineHeight / 2, 1, lineHeight);
    }

    enemies.forEach(e => {
        let dx = e.x - player.x;
        let dy = e.y - player.y;
        let dist = Math.hypot(dx, dy);
        let angle = Math.atan2(dy, dx) - player.angle;

        if (Math.abs(angle) < fov / 2) {
            let size = (canvas.height / dist) * 0.2;
            let x = (angle / fov + 0.5) * canvas.width;

            ctx.fillStyle = "red";
            ctx.fillRect(x, canvas.height / 2 - size / 2, size, size);
        }
    });

    ctx.fillStyle = "white";
    ctx.fillRect(canvas.width / 2 - 5, canvas.height / 2 - 5, 10, 10);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(`HP: ${player.hp.toFixed(0)}`, 20, 20);
    ctx.fillText(`Ammo: ${player.ammo}`, 20, 40);
    ctx.fillText(`Score: ${score}`, 20, 60);
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

loop();
