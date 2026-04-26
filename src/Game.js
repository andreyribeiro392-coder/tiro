import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let enemies = [];
let score = 0;

export function initGame(scene) {
  for (let i = 0; i < 10; i++) {
    spawnEnemy(scene);
  }
}

function spawnEnemy(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  mesh.position.set(
    (Math.random() - 0.5) * 50,
    0.5,
    (Math.random() - 0.5) * 50
  );

  scene.add(mesh);

  enemies.push({
    mesh,
    hp: 100,
    speed: 0.02 + Math.random() * 0.02
  });
}

export function updateGame(scene, camera, player) {

  for (let e of enemies) {

    const dir = new THREE.Vector3()
      .subVectors(player.position, e.mesh.position)
      .normalize();

    e.mesh.position.add(dir.multiplyScalar(e.speed));

    if (e.mesh.position.distanceTo(player.position) < 1.2) {
      player.hp -= 0.5;
    }
  }

  document.getElementById("hp").innerText = "HP: " + Math.floor(player.hp);
  document.getElementById("score").innerText = "Score: " + score;
}

export function shoot(scene, camera, player) {

  const raycaster = new THREE.Raycaster();

  raycaster.set(
    camera.position,
    camera.getWorldDirection(new THREE.Vector3())
  );

  const meshes = enemies.map(e => e.mesh);
  const hits = raycaster.intersectObjects(meshes);

  if (hits.length > 0) {

    const hit = hits[0].object;

    const enemy = enemies.find(e => e.mesh === hit);

    if (enemy) {
      enemy.hp -= 50;

      if (enemy.hp <= 0) {
        scene.remove(enemy.mesh);
        enemies = enemies.filter(e => e !== enemy);
        score += 10;
      }
    }
  }
}
