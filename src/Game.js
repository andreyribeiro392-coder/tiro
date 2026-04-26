import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;
let wave = 1;
let waveTimer = 0;

let hitFlash = 0;
let ads = false;

const weapons = {
  rifle: { ammo: 30, max: 30, damage: 45, spread: 0.015, cooldown: 6 },
  shotgun: { ammo: 8, max: 8, damage: 90, spread: 0.08, cooldown: 18 },
  sniper: { ammo: 5, max: 5, damage: 120, spread: 0.002, cooldown: 40 }
};

let currentWeapon = "rifle";
let reloading = false;

let pickups = [];

export function initGame(scene) {

  createArena(scene);
  spawnWave(scene);

  // 🎮 CONTROLES
  document.addEventListener("keydown", (e) => {
    if (e.key === "1") currentWeapon = "rifle";
    if (e.key === "2") currentWeapon = "shotgun";
    if (e.key === "3") currentWeapon = "sniper";
    if (e.key === "r") reload();
  });

  document.addEventListener("mousedown", (e) => {
    if (e.button === 2) ads = true;
  });

  document.addEventListener("mouseup", (e) => {
    if (e.button === 2) ads = false;
  });
}

function createArena(scene) {

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
  );

  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // paredes externas
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

  const walls = [
    [-100, 0, 0, 2, 50],
    [100, 0, 0, 2, 50],
    [0, 0, -100, 200, 2],
    [0, 0, 100, 200, 2],
  ];

  for (let w of walls) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w[3], 3, w[4]),
      wallMat
    );

    mesh.position.set(w[0], 1.5, w[2]);
    scene.add(mesh);
  }
}

function spawnWave(scene) {
  const count = 8 + wave * 3;

  for (let i = 0; i < count; i++) spawnEnemy(scene);
}

function spawnEnemy(scene) {

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff4444 })
  );

  mesh.position.set(
    (Math.random() - 0.5) * 120,
    0.5,
    (Math.random() - 0.5) * 120
  );

  scene.add(mesh);

  enemies.push({
    mesh,
    hp: 100,
    speed: 0.012 + Math.random() * 0.02,
    role: Math.random() < 0.3 ? "flank" : "normal"
  });
}

export function updateGame(scene, camera, player) {

  waveTimer++;

  if (enemies.length === 0 || waveTimer > 1000) {
    wave++;
    waveTimer = 0;
    spawnWave(scene);
  }

  for (let e of enemies) {

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const dist = toPlayer.length();

    toPlayer.normalize();

    let move = toPlayer;

    // 🤖 FLANK SYSTEM
    if (e.role === "flank") {
      move = new THREE.Vector3(
        -toPlayer.z,
        0,
        toPlayer.x
      ).multiplyScalar(0.5).add(toPlayer);
    }

    // movimentação
    e.mesh.position.add(move.multiplyScalar(e.speed * (1 + 1 / Math.max(dist, 1))));

    // dano
    if (dist < 1.3) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  updateLoot(scene, player);

  updateHUD(player);

  if (hitFlash > 0) {
    hitFlash--;
    document.body.style.filter = "brightness(1.8)";
  } else {
    document.body.style.filter = "none";
  }
}

function updateLoot(scene, player) {

  if (pickups.length < 3 && Math.random() < 0.01) {
    spawnPickup(scene);
  }

  for (let p of pickups) {
    const dist = p.position.distanceTo(player.position);

    if (dist < 1.5) {

      if (p.type === "ammo") {
        weapons[currentWeapon].ammo = weapons[currentWeapon].max;
      }

      if (p.type === "health") {
        player.hp = Math.min(100, player.hp + 30);
      }

      scene.remove(p.mesh);
      pickups = pickups.filter(x => x !== p);
    }
  }
}

function spawnPickup(scene) {

  const type = Math.random() < 0.5 ? "ammo" : "health";

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshBasicMaterial({
      color: type === "ammo" ? 0x00ffcc : 0x00ff00
    })
  );

  mesh.position.set(
    (Math.random() - 0.5) * 100,
    0.5,
    (Math.random() - 0.5) * 100
  );

  scene.add(mesh);

  pickups.push({ mesh, position: mesh.position, type });
}

export function shoot(scene, camera, player) {

  const w = weapons[currentWeapon];

  if (reloading || player.cooldown > 0 || w.ammo <= 0) return;

  player.cooldown = w.cooldown;
  w.ammo--;

  const raycaster = new THREE.Raycaster();

  const dir = camera.getWorldDirection(new THREE.Vector3());

  const spread = ads ? w.spread * 0.3 : w.spread;

  dir.x += (Math.random() - 0.5) * spread;
  dir.y += (Math.random() - 0.5) * spread;

  raycaster.set(camera.position, dir.normalize());

  const hits = raycaster.intersectObjects(enemies.map(e => e.mesh));

  if (hits.length > 0) {

    const enemy = enemies.find(e => e.mesh === hits[0].object);

    if (enemy) {

      enemy.hp -= w.damage;

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

export function reload() {

  if (reloading) return;

  reloading = true;

  setTimeout(() => {
    weapons[currentWeapon].ammo = weapons[currentWeapon].max;
    reloading = false;
  }, 1200);
}

function updateHUD(player) {

  const w = weapons[currentWeapon];

  document.getElementById("hp").innerText =
    "HP: " + Math.max(0, Math.floor(player.hp));

  document.getElementById("score").innerText =
    `Score: ${score} | Wave: ${wave}`;

  if (!document.getElementById("ammo")) {
    const div = document.createElement("div");
    div.id = "ammo";
    div.style.position = "absolute";
    div.style.top = "80px";
    div.style.left = "10px";
    div.style.color = "white";
    document.body.appendChild(div);
  }

  document.getElementById("ammo").innerText =
    `${currentWeapon.toUpperCase()} | Ammo: ${w.ammo}/${w.max}`;
}

function showHitmarker() {
  const m = document.createElement("div");
  m.innerText = "+";
  m.style.position = "absolute";
  m.style.left = "50%";
  m.style.top = "50%";
  m.style.transform = "translate(-50%, -50%)";
  m.style.color = "white";
  m.style.fontSize = "34px";
  m.style.fontWeight = "bold";

  document.body.appendChild(m);

  setTimeout(() => m.remove(), 60);
}
