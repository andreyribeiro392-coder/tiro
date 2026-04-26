import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let keys = {};
let traffic = [];
let buildings = [];

let speed = 0;
let angle = 0;
let nitro = 100;

let time = 0;

/* ========================= */

export function initGame(scene, camera, player) {

  document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  createCity(scene);

  const car = createCar(0x00ffcc);
  scene.add(car);
  player.mesh = car;

  spawnTraffic(scene);
}

/* =========================
   🌆 CIDADE (RUAS + QUADRAS)
========================= */

function createCity(scene) {

  const size = 2000;
  const roadWidth = 20;

  // chão base
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color: 0x0f0f0f })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ruas em grid
  for (let i = -10; i <= 10; i++) {

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(size, roadWidth),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = i * 80;
    scene.add(road);

    const road2 = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, size),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    road2.rotation.x = -Math.PI / 2;
    road2.position.x = i * 80;
    scene.add(road2);
  }

  // prédios organizados
  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {

      if (Math.random() < 0.7) continue;

      const h = 20 + Math.random() * 80;

      const b = new THREE.Mesh(
        new THREE.BoxGeometry(30, h, 30),
        new THREE.MeshStandardMaterial({
          color: 0x111111 + Math.random() * 0x222222
        })
      );

      b.position.set(x * 80, h / 2, z * 80);

      scene.add(b);
      buildings.push(b);
    }
  }

  // céu (noite)
  scene.background = new THREE.Color(0x000011);

  const moon = new THREE.DirectionalLight(0xaaaaff, 0.6);
  moon.position.set(100, 200, 100);
  scene.add(moon);

  scene.add(new THREE.AmbientLight(0x222244));

  createRain(scene);
}

/* =========================
   🌧️ CHUVA
========================= */

let rain;

function createRain(scene) {

  const geo = new THREE.BufferGeometry();
  const count = 2000;

  const pos = [];

  for (let i = 0; i < count; i++) {
    pos.push(
      (Math.random() - 0.5) * 2000,
      Math.random() * 200,
      (Math.random() - 0.5) * 2000
    );
  }

  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.5
  });

  rain = new THREE.Points(geo, mat);
  scene.add(rain);
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
   🚦 TRÁFEGO
========================= */

function spawnTraffic(scene) {

  for (let i = 0; i < 20; i++) {

    const car = createCar(0xff0000);

    car.position.set(
      Math.floor(Math.random()*20-10)*80,
      0.5,
      Math.floor(Math.random()*20-10)*80
    );

    scene.add(car);

    traffic.push({
      mesh: car,
      dir: Math.random() > 0.5 ? "x" : "z",
      speed: 0.5
    });
  }
}

/* =========================
   🎮 UPDATE
========================= */

export function updateGame(scene, camera, player) {

  time += 0.01;

  // ciclo noite leve
  scene.background.offsetHSL(0, 0, Math.sin(time) * 0.0005);

  // chuva animada
  rain.position.y -= 1;
  if (rain.position.y < 0) rain.position.y = 100;

  // movimento player
  if (keys["w"]) speed += 0.04;
  if (keys["s"]) speed -= 0.03;

  if (keys["shift"] && nitro > 0) {
    speed += 0.08;
    nitro -= 0.5;
  } else {
    nitro += 0.2;
  }

  speed *= 0.97;

  if (Math.abs(speed) > 0.05) {
    if (keys["a"]) angle += 0.03 * speed;
    if (keys["d"]) angle -= 0.03 * speed;
  }

  const forward = new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));

  const nextPos = player.position.clone().add(forward.clone().multiplyScalar(speed));

  // colisão com prédios
  let blocked = false;
  for (let b of buildings) {
    if (nextPos.distanceTo(b.position) < 20) {
      blocked = true;
      speed *= -0.3;
      break;
    }
  }

  if (!blocked) player.position.copy(nextPos);

  player.mesh.position.copy(player.position);
  player.mesh.rotation.y = angle;

  // câmera
  const camOffset = new THREE.Vector3(0,6,-12)
    .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

  camera.position.lerp(player.position.clone().add(camOffset),0.08);
  camera.lookAt(player.position);

  // tráfego organizado
  for (let t of traffic) {

    if (t.dir === "x") t.mesh.position.x += t.speed;
    else t.mesh.position.z += t.speed;

    // loop na rua
    if (t.mesh.position.x > 800) t.mesh.position.x = -800;
    if (t.mesh.position.z > 800) t.mesh.position.z = -800;
  }

  // HUD
  const speedEl = document.getElementById("speed");
  const nitroEl = document.getElementById("nitro");

  if (speedEl) speedEl.innerText = "Speed: " + Math.floor(speed * 200);
  if (nitroEl) nitroEl.innerText = "Nitro: " + Math.floor(nitro);
}
