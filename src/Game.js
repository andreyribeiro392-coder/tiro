import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let keys = {};

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

let angle = 0;
let angularVelocity = 0;

let mass = 1200;
let engineForce = 0.25;
let brakeForce = 0.4;
let friction = 0.98;
let driftFactor = 0.92;

let buildings = [];

/* ========================= */

export function initGame(scene, camera, player) {

  document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  createCity(scene);

  const car = createCar(0x00ffcc);
  scene.add(car);
  player.mesh = car;
}

/* =========================
   🌆 CIDADE
========================= */

function createCity(scene) {

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (let i = -10; i <= 10; i++) {

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 20),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = i * 80;
    scene.add(road);

    const road2 = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 2000),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    road2.rotation.x = -Math.PI / 2;
    road2.position.x = i * 80;
    scene.add(road2);
  }

  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {

      if (Math.random() < 0.7) continue;

      const h = 20 + Math.random() * 60;

      const b = new THREE.Mesh(
        new THREE.BoxGeometry(30, h, 30),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );

      b.position.set(x * 80, h / 2, z * 80);

      scene.add(b);
      buildings.push(b);
    }
  }

  scene.add(new THREE.AmbientLight(0x333333));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(100, 200, 100);
  scene.add(light);
}

/* =========================
   🚗 CARRO
========================= */

function createCar(color) {

  const car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.6, 4),
    new THREE.MeshStandardMaterial({ color })
  );

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.7, 2),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );

  cabin.position.y = 0.7;

  car.add(body);
  car.add(cabin);

  return car;
}

/* =========================
   🎮 UPDATE (FÍSICA PESADA)
========================= */

export function updateGame(scene, camera, player) {

  let forward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
  let right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

  // aceleração
  if (keys["w"]) velocity.add(forward.clone().multiplyScalar(engineForce));
  if (keys["s"]) velocity.add(forward.clone().multiplyScalar(-engineForce));

  // freio
  if (keys[" "]) velocity.multiplyScalar(0.9);

  // direção (depende da velocidade)
  let speed = velocity.length();

  if (speed > 0.05) {
    if (keys["a"]) angularVelocity += 0.002 * speed;
    if (keys["d"]) angularVelocity -= 0.002 * speed;
  }

  angle += angularVelocity;

  // drift (perda lateral)
  let forwardVel = forward.clone().multiplyScalar(velocity.dot(forward));
  let sideVel = right.clone().multiplyScalar(velocity.dot(right));

  sideVel.multiplyScalar(0.2); // controla drift

  velocity = forwardVel.add(sideVel);

  // atrito
  velocity.multiplyScalar(friction);

  // colisão com prédios
  let nextPos = player.position.clone().add(velocity);

  for (let b of buildings) {
    if (nextPos.distanceTo(b.position) < 18) {
      velocity.multiplyScalar(-0.4);
      angularVelocity *= -0.5;
      return;
    }
  }

  player.position.copy(nextPos);

  // aplicar no mesh
  player.mesh.position.copy(player.position);
  player.mesh.rotation.y = angle;

  // câmera pesada (segue com atraso)
  const camOffset = new THREE.Vector3(0, 6, -14)
    .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

  camera.position.lerp(
    player.position.clone().add(camOffset),
    0.05
  );

  camera.lookAt(player.position);

  // reduzir rotação ao longo do tempo
  angularVelocity *= 0.9;

  // HUD
  const speedEl = document.getElementById("speed");
  if (speedEl) speedEl.innerText = "Speed: " + Math.floor(velocity.length() * 200);
}
