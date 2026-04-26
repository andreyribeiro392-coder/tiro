import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;

let wave = 1;
let waveTimer = 0;

let ammo = 30;
let maxAmmo = 30;
let reloading = false;

let hitFlash = 0;

const walls = [];

export function initGame(scene) {

  // 🌍 MAPA SIMPLES (paredes)
  createWall(scene, 0, 0, -20, 40, 2);
  createWall(scene, 20, 0, 0, 2, 40);
  createWall(scene, -20, 0, 0, 2, 40);

  spawnWave(scene);
}

function createWall(scene, x, y, z, w, h) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, 3, h),
    new THREE.MeshBasicMaterial({ color: 0x444444 })
  );

  wall.position.set(x, 1.5, z);
  scene.add(wall);
  walls.push(wall);
}

function spawnWave(scene) {
  const count = 6 + wave * 2;

  for (let i = 0; i < count; i++) {
    spawnEnemy(scene);
  }
}

function spawnEnemy(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff3b3b })
  );

  mesh.position.set(
    (Math.random() - 0.5) * 60,
    0.5,
    (Math.random() - 0.5) * 60
  );

  scene.add(mesh);

  enemies.push({
    mesh,
    hp: 100,
    speed: 0.015 + Math.random() * 0.02,
    jitter: Math.random() * Math.PI * 2
  });
}

export function updateGame(scene, camera, player) {

  waveTimer++;

  if (enemies.length === 0 || waveTimer > 800) {
    wave++;
    waveTimer = 0;
    spawnWave(scene);
  }

  for (let e of enemies) {

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const dist = toPlayer.length();

    toPlayer.normalize();

    e.jitter += 0.05;

    // 🧠 DESVIO SIMPLES + INTELIGÊNCIA
    const strafe = new THREE.Vector3(
      Math.sin(e.jitter) * 0.03,
      0,
      Math.cos(e.jitter) * 0.03
    );

    const move = toPlayer.add(strafe);

    const nextPos = e.mesh.position.clone().add(move.multiplyScalar(e.speed));

    // 🚧 colisão simples com paredes
    if (!collidesWall(nextPos)) {
      e.mesh.position.copy(nextPos);
    }

    if (dist < 1.3) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  document.getElementById("hp").innerText =
    "HP: " + Math.max(0, Math.floor(player.hp));

  document.getElementById("score").innerText =
    "Score: " + score + " | Wave: " + wave + " | Ammo: " + ammo;

  if (hitFlash > 0) {
    hitFlash--;
    document.body.style.filter = "brightness(1.7)";
  } else {
    document.body.style.filter = "none";
  }
}

function collidesWall(pos) {
  for (let w of walls) {
    const dx = Math.abs(pos.x - w.position.x);
    const dz = Math.abs(pos.z - w.position.z);

    if (dx < 2 && dz < 2) return true;
  }
  return false;
}

export function shoot(scene, camera, player) {

  if (reloading) return;
  if (player.cooldown > 0) return;
  if (ammo <= 0) return;

  player.cooldown = 6;
  ammo--;

  const raycaster = new THREE.Raycaster();

  const dir = camera.getWorldDirection(new THREE.Vector3());

  dir.x += (Math.random() - 0.5) * 0.015;
  dir.y += (Math.random() - 0.5) * 0.015;

  raycaster.set(camera.position, dir.normalize());

  const hits = raycaster.intersectObjects(enemies.map(e => e.mesh));

  if (hits.length > 0) {

    const enemy = enemies.find(e => e.mesh === hits[0].object);

    if (enemy) {
      enemy.hp -= 50;

      camera.rotation.x -= 0.02;

      if (enemy.hp <= 0) {
        scene.remove(enemy.mesh);
        enemies = enemies.filter(e => e !== enemy);
        score += 10;
      }

      showHitmarker();
    }
  }
}

export function reload(player) {
  if (reloading) return;

  reloading = true;

  setTimeout(() => {
    ammo = maxAmmo;
    reloading = false;
  }, 1200);
}

function showHitmarker() {
  const m = document.createElement("div");
  m.innerText = "+";
  m.style.position = "absolute";
  m.style.left = "50%";
  m.style.top = "50%";
  m.style.transform = "translate(-50%, -50%)";
  m.style.color = "white";
  m.style.fontSize = "30px";
  m.style.fontWeight = "bold";

  document.body.appendChild(m);
  setTimeout(() => m.remove(), 70);
}
