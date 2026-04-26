import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;

let wave = 1;
let waveTimer = 0;

let hitFlash = 0;

export function initGame(scene) {
  spawnWave(scene);
}

function spawnWave(scene) {
  const count = 8 + wave * 2;

  for (let i = 0; i < count; i++) {
    spawnEnemy(scene);
  }
}

function spawnEnemy(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff2b2b })
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
    speed: 0.015 + Math.random() * 0.03,
    jitter: Math.random() * Math.PI * 2
  });
}

export function updateGame(scene, camera, player) {

  // 🌊 WAVES SYSTEM
  waveTimer++;

  if (enemies.length === 0 || waveTimer > 600) {
    wave++;
    waveTimer = 0;
    spawnWave(scene);
  }

  for (let e of enemies) {

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const dist = toPlayer.length();

    toPlayer.normalize();

    // 👾 MOVIMENTO INTELIGENTE SIMPLES
    e.jitter += 0.06;

    const strafe = new THREE.Vector3(
      Math.sin(e.jitter) * 0.03,
      0,
      Math.cos(e.jitter) * 0.03
    );

    const move = toPlayer.add(strafe);

    // mais agressivo quando perto
    const speedBoost = 1 + (1 / Math.max(dist, 1));

    e.mesh.position.add(move.multiplyScalar(e.speed * speedBoost));

    // dano no player
    if (dist < 1.3) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  // HUD
  document.getElementById("hp").innerText = "HP: " + Math.max(0, Math.floor(player.hp));
  document.getElementById("score").innerText = "Score: " + score + " | Wave: " + wave;

  // dano visual
  if (hitFlash > 0) {
    hitFlash--;
    document.body.style.filter = "brightness(1.6) contrast(1.2)";
  } else {
    document.body.style.filter = "none";
  }
}

export function shoot(scene, camera, player) {

  if (player.cooldown > 0) return;
  player.cooldown = 7;

  const raycaster = new THREE.Raycaster();

  // 🔫 spread leve (arma realista)
  const dir = camera.getWorldDirection(new THREE.Vector3());

  dir.x += (Math.random() - 0.5) * 0.01;
  dir.y += (Math.random() - 0.5) * 0.01;

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

function showHitmarker() {
  const m = document.createElement("div");
  m.innerText = "+";
  m.style.position = "absolute";
  m.style.left = "50%";
  m.style.top = "50%";
  m.style.transform = "translate(-50%, -50%)";
  m.style.color = "white";
  m.style.fontSize = "28px";
  m.style.fontWeight = "bold";
  m.style.zIndex = "999";

  document.body.appendChild(m);

  setTimeout(() => m.remove(), 80);
}
