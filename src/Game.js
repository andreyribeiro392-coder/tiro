import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* =========================
   🎮 STATE GLOBAL LIMPO
========================= */

let entities = {
  enemies: [],
  bullets: [],
  zones: []
};

let score = 0;
let wave = 1;
let waveTimer = 0;

/* =========================
   🔫 WEAPONS
========================= */

const weapons = {
  rifle: { ammo: 30, max: 30, damage: 45, spread: 0.015, cooldown: 6 },
  shotgun: { ammo: 8, max: 8, damage: 90, spread: 0.09, cooldown: 18 },
  sniper: { ammo: 5, max: 5, damage: 120, spread: 0.002, cooldown: 40 }
};

let currentWeapon = "rifle";
let reloading = false;
let ads = false;

let hitFlash = 0;

/* =========================
   🚀 INIT
========================= */

export function initGame(scene) {

  createZones(scene);
  spawnWave(scene);

  document.addEventListener("keydown", (e) => {
    if (e.key === "1") currentWeapon = "rifle";
    if (e.key === "2") currentWeapon = "shotgun";
    if (e.key === "3") currentWeapon = "sniper";
    if (e.key === "r") reload();
  });

  document.addEventListener("mousedown", e => {
    if (e.button === 2) ads = true;
  });

  document.addEventListener("mouseup", e => {
    if (e.button === 2) ads = false;
  });
}

/* =========================
   🗺️ ZONAS DO MAPA
========================= */

function createZones(scene) {

  for (let i = 0; i < 4; i++) {
    entities.zones.push({
      id: i,
      center: new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        0,
        (Math.random() - 0.5) * 100
      )
    });
  }
}

/* =========================
   👾 SPAWN
========================= */

function spawnWave(scene) {

  const count = 12 + wave * 3;

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

  entities.enemies.push({
    id: Math.random().toString(36).slice(2),
    mesh,
    hp: 100,
    speed: 0.012 + Math.random() * 0.02,
    state: "hunt",
    zoneBias: Math.floor(Math.random() * 4),
    memory: 0
  });
}

/* =========================
   🔄 UPDATE LOOP
========================= */

export function updateGame(scene, camera, player) {

  waveTimer++;

  if (entities.enemies.length === 0 || waveTimer > 1200) {
    wave++;
    waveTimer = 0;
    spawnWave(scene);
  }

  for (let e of entities.enemies) {

    const targetZone = entities.zones[e.zoneBias];

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const toZone = new THREE.Vector3()
      .subVectors(targetZone.center, e.mesh.position);

    const dist = toPlayer.length();

    toPlayer.normalize();

    // 🧠 IA MAIS HUMANA (DECISÃO)
    let move = new THREE.Vector3();

    if (dist < 8) {
      // agressivo
      move.add(toPlayer);
    } else {
      // patrulha por zona
      move.add(toZone.multiplyScalar(0.5));
    }

    // leve random behavior (menos robô)
    move.x += Math.sin(Date.now() * 0.001 + e.id) * 0.1;
    move.z += Math.cos(Date.now() * 0.001 + e.id) * 0.1;

    e.mesh.position.add(move.multiplyScalar(e.speed));

    // dano jogador
    if (dist < 1.3) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  updateHUD(player);

  if (hitFlash > 0) {
    hitFlash--;
    document.body.style.filter = "brightness(1.8) contrast(1.2)";
  } else {
    document.body.style.filter = "none";
  }
}

/* =========================
   🔫 SHOOT SYSTEM FINAL
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

  const hits = raycaster.intersectObjects(entities.enemies.map(e => e.mesh));

  if (hits.length > 0) {

    const enemy = entities.enemies.find(e => e.mesh === hits[0].object);

    if (enemy) {

      enemy.hp -= w.damage;

      camera.rotation.x -= 0.02;

      if (enemy.hp <= 0) {
        scene.remove(enemy.mesh);
        entities.enemies = entities.enemies.filter(e => e !== enemy);
        score += 10;
      }

      showHitmarker();
    }
  }
}

/* =========================
   🔄 RELOAD
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
   🎯 HUD
========================= */

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

/* =========================
   💥 HITMARKER
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

  setTimeout(() => m.remove(), 50);
}
