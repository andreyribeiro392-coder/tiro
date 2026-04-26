import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;
let wave = 1;
let waveTimer = 0;

let hitFlash = 0;

const weapons = {
  rifle: { ammo: 30, max: 30, damage: 45, spread: 0.015, cooldown: 6, speed: 1 },
  shotgun: { ammo: 8, max: 8, damage: 90, spread: 0.08, cooldown: 18, speed: 0.8 },
  sniper: { ammo: 5, max: 5, damage: 120, spread: 0.002, cooldown: 40, speed: 1.5 }
};

let currentWeapon = "rifle";
let reloading = false;

let bots = [];

export function initGame(scene) {
  spawnWave(scene);
  spawnBots(scene);

  document.addEventListener("keydown", (e) => {
    if (e.key === "1") currentWeapon = "rifle";
    if (e.key === "2") currentWeapon = "shotgun";
    if (e.key === "3") currentWeapon = "sniper";
    if (e.key === "r") reload();
  });
}

function spawnBots(scene) {
  for (let i = 0; i < 3; i++) {
    bots.push({
      id: i,
      mood: "aggressive",
      flank: Math.random() > 0.5
    });
  }
}

function spawnWave(scene) {
  const count = 10 + wave * 4;

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
    speed: 0.01 + Math.random() * 0.02,
    id: Math.random(),
    state: "hunt"
  });
}

export function updateGame(scene, camera, player) {

  waveTimer++;

  if (enemies.length === 0 || waveTimer > 1200) {
    wave++;
    waveTimer = 0;
    spawnWave(scene);
  }

  for (let e of enemies) {

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const dist = toPlayer.length();

    toPlayer.normalize();

    // 🧠 IA MAIS HUMANA
    let move = toPlayer.clone();

    if (dist < 10) {
      move.add(new THREE.Vector3(
        Math.sin(e.id + Date.now() * 0.001) * 0.3,
        0,
        Math.cos(e.id + Date.now() * 0.001) * 0.3
      ));
    }

    if (dist < 5) {
      // comportamento agressivo
      move.multiplyScalar(1.2);
    }

    e.mesh.position.add(move.multiplyScalar(e.speed));

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

export function shoot(scene, camera, player) {

  const w = weapons[currentWeapon];

  if (reloading || player.cooldown > 0 || w.ammo <= 0) return;

  player.cooldown = w.cooldown;
  w.ammo--;

  const raycaster = new THREE.Raycaster();

  const dir = camera.getWorldDirection(new THREE.Vector3());

  // 🔫 balística leve (não laser perfeito)
  dir.x += (Math.random() - 0.5) * w.spread;
  dir.y += (Math.random() - 0.5) * w.spread;

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
      playSound("hit");
    }
  } else {
    playSound("shoot");
  }
}

export function reload() {

  if (reloading) return;

  reloading = true;
  playSound("reload");

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

function playSound(type) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.connect(g);
  g.connect(ctx.destination);

  if (type === "shoot") o.frequency.value = 200;
  if (type === "hit") o.frequency.value = 500;
  if (type === "reload") o.frequency.value = 100;

  g.gain.value = 0.05;

  o.start();
  o.stop(ctx.currentTime + 0.1);
}
