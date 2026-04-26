import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;

let hitFlash = 0;

export function initGame(scene) {
  for (let i = 0; i < 12; i++) {
    spawnEnemy(scene);
  }
}

function spawnEnemy(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
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
    speed: 0.02 + Math.random() * 0.03
  });
}

export function updateGame(scene, camera, player) {

  for (let e of enemies) {

    const dir = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position)
      .normalize();

    e.mesh.position.add(dir.multiplyScalar(e.speed));

    const dist = e.mesh.position.distanceTo(player.position);

    if (dist < 1.3) {
      player.hp -= 0.6;
      hitFlash = 10;
    }
  }

  // HUD
  document.getElementById("hp").innerText = "HP: " + Math.floor(player.hp);
  document.getElementById("score").innerText = "Score: " + score;

  // hit flash UI
  if (hitFlash > 0) {
    hitFlash--;
    document.body.style.filter = "brightness(1.5)";
  } else {
    document.body.style.filter = "none";
  }
}

export function shoot(scene, camera, player) {

  if (player.cooldown > 0) return;
  player.cooldown = 10;

  const raycaster = new THREE.Raycaster();

  raycaster.set(
    camera.position,
    camera.getWorldDirection(new THREE.Vector3())
  );

  const hits = raycaster.intersectObjects(enemies.map(e => e.mesh));

  if (hits.length > 0) {

    const hit = hits[0].object;

    const enemy = enemies.find(e => e.mesh === hit);

    if (enemy) {
      enemy.hp -= 50;

      // recoil visual leve
      camera.rotation.x -= 0.01;

      if (enemy.hp <= 0) {
        scene.remove(enemy.mesh);
        enemies = enemies.filter(e => e !== enemy);
        score += 10;
      }

      // hitmarker simples
      showHitmarker();
    }
  }
}

function showHitmarker() {
  const marker = document.createElement("div");
  marker.innerText = "+";
  marker.style.position = "absolute";
  marker.style.left = "50%";
  marker.style.top = "50%";
  marker.style.transform = "translate(-50%, -50%)";
  marker.style.color = "white";
  marker.style.fontSize = "30px";
  marker.style.zIndex = "999";

  document.body.appendChild(marker);

  setTimeout(() => marker.remove(), 100);
}

export function gameTick(player) {
  if (player.cooldown > 0) player.cooldown--;
}
