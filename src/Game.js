import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;
let wave = 1;
let waveTimer = 0;

let hitFlash = 0;

// 🔫 ARMAS
const weapons = {
  rifle: { ammo: 30, max: 30, damage: 50, spread: 0.015, cooldown: 6 },
  shotgun: { ammo: 8, max: 8, damage: 80, spread: 0.08, cooldown: 18 },
  sniper: { ammo: 5, max: 5, damage: 100, spread: 0.002, cooldown: 40 }
};

let currentWeapon = "rifle";
let reloading = false;

export function initGame(scene) {
  spawnWave(scene);

  document.addEventListener("keydown", (e) => {
    if (e.key === "1") currentWeapon = "rifle";
    if (e.key === "2") currentWeapon = "shotgun";
    if (e.key === "3") currentWeapon = "sniper";

    if (e.key === "r") reload();
  });
}

function spawnWave(scene) {
  const count = 6 + wave * 3;

  for (let i = 0; i < count; i++) {
    spawnEnemy(scene);
  }
}

function spawnEnemy(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff4444 })
  );

  mesh.position.set(
    (Math.random() - 0.5) * 80,
    0.5,
    (Math.random() - 0.5) * 80
  );

  scene.add(mesh);

  enemies.push({
    mesh,
    hp: 100,
    speed: 0.012 + Math.random() * 0.02,
    group: Math.floor(Math.random() * 3) // 👾 grupos
  });
}

export function updateGame(scene, camera, player) {

  waveTimer++;

  if (enemies.length === 0 || waveTimer > 900) {
    wave++;
    waveTimer = 0;
    spawnWave(scene);
  }

  // 👾 IA EM GRUPO
  for (let e of enemies) {

    const groupCenter = getGroupCenter(e.group);

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const toGroup = new THREE.Vector3()
      .subVectors(groupCenter, e.mesh.position)
      .multiplyScalar(0.3);

    const dist = toPlayer.length();

    toPlayer.normalize();

    const move = toPlayer.add(toGroup);

    e.mesh.position.add(move.multiplyScalar(e.speed * (1 + 1 / Math.max(dist, 1))));

    if (dist < 1.3) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  updateHUD(player);

  if (hitFlash > 0) {
    hitFlash--;
    document.body.style.filter = "brightness(1.7)";
  } else {
    document.body.style.filter = "none";
  }
}

function getGroupCenter(group) {
  const members = enemies.filter(e => e.group === group);
  const center = new THREE.Vector3();

  for (let m of members) {
    center.add(m.mesh.position);
  }

  return members.length ? center.divideScalar(members.length) : new THREE.Vector3();
}

export function shoot(scene, camera, player) {

  const w = weapons[currentWeapon];

  if (reloading) return;
  if (player.cooldown > 0) return;
  if (w.ammo <= 0) return;

  player.cooldown = w.cooldown;
  w.ammo--;

  const raycaster = new THREE.Raycaster();

  const dir = camera.getWorldDirection(new THREE.Vector3());

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
    }
  }
}

function reload() {

  if (reloading) return;

  reloading = true;

  setTimeout(() => {
    const w = weapons[currentWeapon];
    w.ammo = w.max;
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
    div.style.color = "white";
    div.style.position = "absolute";
    div.style.top = "80px";
    div.style.left = "10px";
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
  m.style.fontSize = "32px";
  m.style.fontWeight = "bold";

  document.body.appendChild(m);

  setTimeout(() => m.remove(), 60);
}
