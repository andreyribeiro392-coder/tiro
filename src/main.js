import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { initGame, updateGame, shoot } from "./game.js";
import { initApp, AppState } from "./app.js";

let scene, camera, renderer;

const keys = {};
let mouseX = 0;
let mouseY = 0;

const player = {
  position: new THREE.Vector3(0, 1.6, 5),
  velocity: new THREE.Vector3(),
  speed: 0.15,
  hp: 100,
  cooldown: 0
};

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.copy(player.position);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshBasicMaterial({ color: 0x222222 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  initGame(scene);
  initApp();

  setupControls();
}

function setupControls() {
  document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  document.body.addEventListener("click", () => {
    document.body.requestPointerLock();
    shoot(scene, camera, player);
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === document.body) {
      mouseX -= e.movementX * AppState.settings.sensitivity;
      mouseY -= e.movementY * AppState.settings.sensitivity;

      mouseY = Math.max(-1.5, Math.min(1.5, mouseY));
    }
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function updatePlayer() {
  const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    mouseX
  );

  const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    mouseX
  );

  const dir = new THREE.Vector3();

  if (keys["w"]) dir.add(forward);
  if (keys["s"]) dir.sub(forward);
  if (keys["a"]) dir.sub(right);
  if (keys["d"]) dir.add(right);

  if (dir.length() > 0) dir.normalize();

  player.velocity.add(dir.multiplyScalar(player.speed));
  player.velocity.multiplyScalar(0.85);

  player.position.add(player.velocity);

  camera.position.copy(player.position);

  camera.rotation.y = mouseX;
  camera.rotation.x = mouseY;
}

function animate() {
  requestAnimationFrame(animate);

  updatePlayer();
  updateGame(scene, camera, player);

  renderer.render(scene, camera);
}
