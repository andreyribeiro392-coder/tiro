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

  createWorld(scene);

  const car = createCar(0x00ffcc);
  scene.add(car);
  player.mesh = car;

  spawnAI(scene);
}

/* =========================
   🌍 MUNDO MELHORADO
========================= */

function createWorld(scene) {

  // chão melhor
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // grid leve (sensação de movimento)
  const grid = new THREE.GridHelper(2000, 200, 0xffffff, 0x444444);
  scene.add(grid);

  // luz forte (resolve escuridão)
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(50, 100, 50);
  scene.add(light);

  // luz ambiente
  scene.add(new THREE.AmbientLight(0x555555));

  // "céu" fake (gradiente)
  scene.background = new THREE.Color(0x0a0a0a);
}

/* =========================
   🚗 CARRO MELHOR
========================= */

function createCar(color) {

  const car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.6, 4),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.5,
      roughness: 0.4
    })
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

/* ========================= */

function spawnAI(scene) {

  for (let i = 0; i < 8; i++) {

    const car = createCar(0xff0000);

    car.position.set(
      (Math.random() - 0.5) * 300,
      0.5,
      (Math.random() - 0.5) * 300
    );

    scene.add(car);

    cars.push({
      mesh: car,
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5
    });
  }
}

/* =========================
   🎮 UPDATE
========================= */

export function updateGame(scene, camera, player) {

  // aceleração
  if (keys["w"]) speed += 0.04;
  if (keys["s"]) speed -= 0.03;

  // nitro
  if (keys["shift"] && nitro > 0) {
    speed += 0.08;
    nitro -= 0.7;
  } else {
    nitro += 0.3;
  }

  nitro = Math.max(0, Math.min(100, nitro));

  // atrito
  speed *= 0.97;

  // curva baseada na velocidade
  if (Math.abs(speed) > 0.05) {
    if (keys["a"]) angle += 0.035 * (speed);
    if (keys["d"]) angle -= 0.035 * (speed);
  }

  const forward = new THREE.Vector3(
    Math.sin(angle),
    0,
    Math.cos(angle)
  );

  player.position.add(forward.multiplyScalar(speed));
  player.rotation.y = angle;

  player.mesh.position.copy(player.position);
  player.mesh.rotation.y = angle;

  /* =========================
     🎥 CÂMERA MELHORADA
  ========================= */

  const camDistance = 10 + Math.abs(speed * 20);

  const camOffset = new THREE.Vector3(0, 5, -camDistance)
    .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

  camera.position.lerp(
    player.position.clone().add(camOffset),
    0.08
  );

  camera.lookAt(player.position);

  /* =========================
     🚗 IA
  ========================= */

  for (let c of cars) {

    const dir = new THREE.Vector3(
      Math.sin(c.angle),
      0,
      Math.cos(c.angle)
    );

    c.mesh.position.add(dir.multiplyScalar(c.speed));

    c.angle += (Math.random() - 0.5) * 0.03;
    c.mesh.rotation.y = c.angle;
  }

  /* =========================
     HUD
  ========================= */

  const speedEl = document.getElementById("speed");
  const nitroEl = document.getElementById("nitro");

  if (speedEl) speedEl.innerText = "Speed: " + Math.floor(speed * 200);
  if (nitroEl) nitroEl.innerText = "Nitro: " + Math.floor(nitro);
}
