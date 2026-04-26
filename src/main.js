import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { initGame, updateGame } from "./Game.js";

let scene, camera, renderer;
let player;

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

  // PLAYER (OBRIGATÓRIO)
  player = {
    position: new THREE.Vector3(0, 0.5, 0),
    rotation: { y: 0 },
    speed: 1
  };

  // posição inicial câmera
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  // luz (IMPORTANTE PRA NÃO FICAR TUDO PRETO)
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  // inicia jogo
  initGame(scene, camera, player);

  window.addEventListener("resize", onResize);
}

function animate() {
  requestAnimationFrame(animate);

  updateGame(scene, camera, player);

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
