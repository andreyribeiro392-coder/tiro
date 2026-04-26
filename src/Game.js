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
   🌍 MUNDO + CÉU + CIDADE
========================= */

function createWorld(scene) {

  // chão
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // grid leve
  const grid = new THREE.GridHelper(3000, 200, 0x444444, 0x222222);
  scene.add(grid);

  // luz
  const light = new THREE.DirectionalLight(0xffffff, 1.3);
  light.position.set(100, 200, 100);
  scene.add(light);

  scene.add(new THREE.AmbientLight(0x666666));

  /* =========================
     🌌 SKYBOX (CÉU 3D)
  ========================= */

  const skyGeo = new THREE.SphereGeometry(1500, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide
  });

  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  /* =========================
     🏙️ PRÉDIOS
  ========================= */

  for (let i = 0; i < 120; i++) {

    const height = 10 + Math.random() * 60;

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(
        10 + Math.random() * 20,
        height,
        10 + Math.random() * 20
      ),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          Math.random() * 0.2 + 0.1,
          Math.random() * 0.2 + 0.1,
          Math.random() * 0.2 + 0.1
        ),
        roughness: 0.7
      })
    );

    building.position.set(
      (Math.random() - 0.5) * 2000,
      height / 2,
      (Math.random() - 0.5) * 2000
    );

    scene.add(building);
  }
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

  if (keys["w"]) speed += 0.04;
  if (keys["s"]) speed -= 0.03;

  if (keys["shift"] && nitro > 0) {
    speed += 0.08;
    nitro -= 0.7;
  } else {
    nitro += 0.3;
  }

  nitro = Math.max(0, Math.min(100, nitro));

  speed *= 0.97;

  if (Math.abs(speed) > 0.05) {
    if (keys["a"]) angle += 0.035 * speed;
    if (keys["d"]) angle -= 0.035 * speed;
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

  // câmera
  const camOffset = new THREE.Vector3(0, 6, -12)
    .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

  camera.position.lerp(
    player.position.clone().add(camOffset),
    0.08
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

    c.angle += (Math.random() - 0.5) * 0.03;
    c.mesh.rotation.y = c.angle;
  }

  // HUD
  const speedEl = document.getElementById("speed");
  const nitroEl = document.getElementById("nitro");

  if (speedEl) speedEl.innerText = "Speed: " + Math.floor(speed * 200);
  if (nitroEl) nitroEl.innerText = "Nitro: " + Math.floor(nitro);
}
