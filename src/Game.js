import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;
let hitFlash = 0;

export function initGame(scene) {
  for (let i = 0; i < 15; i++) {
    spawnEnemy(scene);
  }
}

function spawnEnemy(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff3333 })
  );

  mesh.position.set(
    (Math.random() - 0.5) * 70,
    0.5,
    (Math.random() - 0.5) * 70
  );

  scene.add(mesh);

  enemies.push({
    mesh,
    hp: 100,
    speed: 0.015 + Math.random() * 0.02,
    wobble: Math.random() * Math.PI * 2
  });
}

export function updateGame(scene, camera, player) {

  for (let e of enemies) {

    const toPlayer = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position);

    const dist = toPlayer.length();

    toPlayer.normalize();

    // 🧠 MOVIMENTO MAIS NATURAL (NÃO RETO)
    e.wobble += 0.05;

    const sideOffset = new THREE.Vector3(
      Math.sin(e.wobble) * 0.02,
      0,
      Math.cos(e.wobble) * 0.02
    );

    const moveDir = toPlayer.add(sideOffset);

    e.mesh.position.add(moveDir.multiplyScalar(e.speed * (1 + 1 / dist)));

    // dano no jogador
    if (dist < 1.3) {
      player.hp -= 0.5;
      hitFlash = 10;
    }
  }

  // HUD
  document.getElementById("hp").innerText = "HP: " + Math.max(0, Math.floor(player.hp));
  document.getElementById("score").innerText = "Score: " + score;

  // efeito de dano
  if (hitFlash > 0) {
    hitFlash--;
    document.body.style.filter = "brightness(1.6) saturate(1.5)";
  } else {
    document.body.style.filter = "none";
  }
}

export function shoot(scene, camera, player) {

  if (player.cooldown > 0) return;
  player.cooldown = 8;

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

      // recoil leve realista
      camera.rotation.x -= 0.015;

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
  const marker = document.createElement("div");
  marker.innerText = "+";
  marker.style.position = "absolute";
  marker.style.left = "50%";
  marker.style.top = "50%";
  marker.style.transform = "translate(-50%, -50%)";
  marker.style.color = "white";
  marker.style.fontSize = "28px";
  marker.style.fontWeight = "bold";
  marker.style.zIndex = "999";

  document.body.appendChild(marker);

  setTimeout(() => marker.remove(), 80);
}
