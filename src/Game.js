import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let cars = [];
let keys = {};

let speed = 0;
let maxSpeed = 1.2;
let acceleration = 0.03;
let friction = 0.02;
let turnSpeed = 0.03;

let angle = 0;

export function initGame(scene, camera, player) {

  document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  createMap(scene);
  spawnCars(scene);

  // CARRO DO PLAYER VISUAL
  const playerCar = createCarMesh(0x00ffcc);
  scene.add(playerCar);
  player.mesh = playerCar;
}

function createMap(scene) {

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshBasicMaterial({ color: 0x1e1e1e })
  );

  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
}

function createCarMesh(color) {

  const car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.5, 3),
    new THREE.MeshBasicMaterial({ color })
  );

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 1.5),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );

  top.position.y = 0.5;

  car.add(body);
  car.add(top);

  return car;
}

function spawnCars(scene) {

  for (let i = 0; i < 5; i++) {

    const mesh = createCarMesh(0xff0000);

    mesh.position.set(
      (Math.random() - 0.5) * 100,
      0.5,
      (Math.random() - 0.5) * 100
    );

    scene.add(mesh);

    cars.push({
      mesh,
      speed: 0.5 + Math.random() * 0.5,
      angle: Math.random() * Math.PI * 2
    });
  }
}

export function updateGame(scene, camera, player) {

  if (keys["w"]) speed += acceleration;
  if (keys["s"]) speed -= acceleration;

  if (!keys["w"] && !keys["s"]) {
    if (speed > 0) speed -= friction;
    if (speed < 0) speed += friction;
  }

  speed = Math.max(-0.6, Math.min(maxSpeed, speed));

  if (Math.abs(speed) > 0.05) {
    if (keys["a"]) angle += turnSpeed;
    if (keys["d"]) angle -= turnSpeed;
  }

  const forward = new THREE.Vector3(
    Math.sin(angle),
    0,
    Math.cos(angle)
  );

  player.position.add(forward.multiplyScalar(speed));

  player.rotation.y = angle;

  // atualiza mesh do player
  if (player.mesh) {
    player.mesh.position.copy(player.position);
    player.mesh.rotation.y = angle;
  }

  // câmera
  const camOffset = new THREE.Vector3(0, 4, -8)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

  camera.position.copy(player.position).add(camOffset);
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

    if (c.mesh.position.length() > 200) {
      c.angle += Math.PI;
    }
  }
}

export function shoot() {}
