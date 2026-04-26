import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* =========================
   STATE LIMPO
========================= */

let enemies = [];
let zones = [];

let score = 0;
let wave = 1;
let waveTimer = 0;
let hitFlash = 0;

let reloading = false;
let ads = false;

/* =========================
   WEAPONS
========================= */

const weapons = {
  rifle: { ammo: 30, max: 30, damage: 45, spread: 0.015, cooldown: 6 },
  shotgun: { ammo: 8, max: 8, damage: 90, spread: 0.09, cooldown: 18 },
  sniper: { ammo: 5, max: 5, damage: 120, spread: 0.002, cooldown: 40 }
};

let currentWeapon = "rifle";

/* =========================
   INIT
========================= */

export function initGame(scene) {

  createZones(scene);
  spawnWave(scene);

  document.addEventListener("keydown", (e) => {
    if (e.key === "r") reload();
    if (e.key === "1") currentWeapon = "rifle";
    if (e.key === "2") currentWeapon = "shotgun";
    if (e.key === "3") currentWeapon = "sniper";
  });

  document.addEventListener("mousedown", e => {
    if (e.button === 2) ads = true;
  });

  document.addEventListener("mouseup", e => {
    if (e.button === 2) ads = false;
  });
}

/* =========================
   ZONES
========================= */

function createZones(scene) {

  for (let i = 0; i < 4; i++) {
    zones.push({
      center: new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        0,
        (Math.random() - 0.5) * 100
      )
    });
  }
}

/* =========================
   SPAWN
========================= */

function spawnWave(scene) {
  const count = 10 + wave * 3;
  for (let i = 0; i < count; i++) spawnEnemy(scene);
}

function spawnEnemy(scene) {

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff4444 })
  );

  mesh.position.set(
    (Math.random() - 0.5) * 100,
    0.5,
    (Math.random() - 0.5) * 100
  );

  scene.add(mesh);

  enemies.push({
    mesh,
    hp: 100,
    speed: 0.015 + Math.random() * 0.02,
    zone: Math.floor(Math.random() * zones.length)
  });
}

/* =========================
   UPDATE
========================= */

export function updateGame(scene, camera, player) {

  waveTimer++;

  if (enemies.length === 0 || waveTimer > 1200) {
    wave++;
    waveTimer = 0;
    spawnWave(scene);
  }

  for (let e of enemies) {

    const zone = zones[e.zone];

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const toZone = new THREE.Vector3()
      .subVectors(zone.center, e.mesh.position);

    const dist = toPlayer.length();

    let move = new THREE.Vector3();

    if (dist < 8) {
      move.add(toPlayer.normalize());
    } else {
      move.add(toZone.multiplyScalar(0.5));
    }

    move.x += Math.sin(Date.now() * 0.001 + dist) * 0.05;
    move.z += Math.cos(Date.now() * 0.001 + dist) * 0.05;

    e.mesh.position.add(move.multiplyScalar(e.speed));

    if (dist < 1.3) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  updateHUD(player);

  document.body.style.filter =
    hitFlash > 0 ? "brightness(1.8)" : "none";

  if (hitFlash > 0) hitFlash--;
}

/* =========================
   SHOOT
========================= */

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

      if (enemy.hp <= 0) {
        scene.remove(enemy.mesh);
        enemies = enemies.filter(e => e !== enemy);
        score += 10;
      }

      showHitmarker();
    }
  }
}

/* =========================
   RELOAD
========================= */

export function reload() {

  if (reloading) return;

  reloading = true;

  setTimeout(() => {
    weapons[currentWeapon].ammo = weapons[currentWeapon].max;
    reloading = false;
  }, 1200);
}

/* =========================
   HUD
========================= */

function updateHUD(player) {

  const w = weapons[currentWeapon];

  const hp = document.getElementById("hp");
  const scoreEl = document.getElementById("score");

  if (hp) hp.innerText = "HP: " + Math.max(0, Math.floor(player.hp));
  if (scoreEl) scoreEl.innerText = `Score: ${score} | Wave: ${wave}`;
}

/* =========================
   HITMARKER
========================= */

function showHitmarker() {

  const m = document.createElement("div");
  m.innerText = "+";
  m.style.position = "absolute";
  m.style.left = "50%";
  m.style.top = "50%";
  m.style.transform = "translate(-50%, -50%)";
  m.style.color = "white";
  m.style.fontSize = "36px";
  m.style.fontWeight = "bold";

  document.body.appendChild(m);

  setTimeout(() => m.remove(), 60);
}
