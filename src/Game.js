import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let keys = {};
let cars = [];

let speed = 0;
let angle = 0;

let nitro = 100;

/* ========================= */

export function initGame(scene, camera, player) {

  document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  createMap(scene);

  // player car
  const car = createCar(0x00ffcc);
  scene.add(car);
  player.mesh = car;

  spawnAI(scene);
}

/* ========================= */

function createMap(scene) {

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );

  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // linhas de pista
  for (let i = 0; i < 100; i++) {

    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.05, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    line.position.set(0, 0.03, i * 10 - 500);
    scene.add(line);
  }
}

/* ========================= */

function createCar(color) {

  const car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.5, 3),
    new THREE.MeshStandardMaterial({ color, metalness:0.3, roughness:0.6 })
  );

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.6, 1.5),
    new THREE.MeshStandardMaterial({ color:0x111111 })
  );

  cabin.position.y = 0.6;

  car.add(body);
  car.add(cabin);

  return car;
}

/* ========================= */

function spawnAI(scene) {

  for (let i = 0; i < 6; i++) {

    const car = createCar(0xff0000);

    car.position.set(
      (Math.random() - 0.5) * 200,
      0.5,
      (Math.random() - 0.5) * 200
    );

    scene.add(car);

    cars.push({
      mesh: car,
      angle: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.4
    });
  }
}

/* ========================= */

export function updateGame(scene, camera, player) {

  // aceleração
  if (keys["w"]) speed += 0.03;
  if (keys["s"]) speed -= 0.03;

  // nitro
  if (keys["shift"] && nitro > 0) {
    speed += 0.05;
    nitro -= 0.5;
  } else {
    nitro += 0.2;
  }

  nitro = Math.max(0, Math.min(100, nitro));

  // atrito
  speed *= 0.98;

  // direção
  if (Math.abs(speed) > 0.05) {
    if (keys["a"]) angle += 0.03;
    if (keys["d"]) angle -= 0.03;
  }

  const forward = new THREE.Vector3(
    Math.sin(angle),
    0,
    Math.cos(angle)
  );

  player.position.add(forward.multiplyScalar(speed));
  player.rotation.y = angle;

  // atualiza mesh
  player.mesh.position.copy(player.position);
  player.mesh.rotation.y = angle;

  // câmera suave
  const camOffset = new THREE.Vector3(0, 5, -10)
    .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

  camera.position.lerp(
    player.position.clone().add(camOffset),
    0.1
  );

  camera.lookAt(player.position);

  // IA
  for (let c of cars) {

    const dir = new THREE.Vector3(
      Math.sin(c.angle),
      0,
      Math.cos(c.angle)
    );

    c.mesh.position.add(dir.multiplyScalar(c.speed));

    c.angle += (Math.random() - 0.5) * 0.02;
    c.mesh.rotation.y = c.angle;
  }

  // HUD
  const speedEl = document.getElementById("speed");
  const nitroEl = document.getElementById("nitro");

  if (speedEl) speedEl.innerText = "Speed: " + Math.floor(speed * 100);
  if (nitroEl) nitroEl.innerText = "Nitro: " + Math.floor(nitro);
}
