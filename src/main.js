import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
let scene, camera, renderer;
let keys = {};

export let player = {
  x: 0,
  y: 1.6,
  z: 5,
  velocity: new THREE.Vector3(),
  speed: 0.15,
  hp: 100
};

init();
animate();

document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

document.addEventListener("click", () => {
  document.body.requestPointerLock();
  shoot(scene, camera, player);
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === document.body) {
    camera.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
  }
});

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.set(0, 1.6, 5);

  // ground
  const geo = new THREE.PlaneGeometry(200, 200);
  const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  gameInit(scene);
}

function updatePlayer() {
  let dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;

  dir.applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
  player.velocity.add(dir.multiplyScalar(player.speed));

  player.velocity.multiplyScalar(0.85);

  camera.position.add(player.velocity);
}

function animate() {
  requestAnimationFrame(animate);

  updatePlayer();
  gameUpdate(scene, camera, player);

  renderer.render(scene, camera);
}
