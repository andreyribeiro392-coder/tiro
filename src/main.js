import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { initGame, updateGame } from "./Game.js";

let scene, camera, renderer;
let player;

init();
animate();

function init() {

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 50, 300);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  player = {
    position: new THREE.Vector3(0, 0.5, 0),
    rotation: { y: 0 },
    speed: 0
  };

  // iluminação (melhora gráfico MUITO)
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(50, 100, 50);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  initGame(scene, camera, player);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  requestAnimationFrame(animate);

  updateGame(scene, camera, player);

  renderer.render(scene, camera);
}
