import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
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

  // chão
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
  document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  document.body.addEventListener("click", () => {
    document.body.requestPointerLock();
    shoot(scene, camera, player);
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === document.body) {
      mouseX -= e.movementX * AppState.settings.sensitivity;
      mouseY -= e.movementY * AppState.settings.sensitivity;
    }
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function updatePlayer() {
  let forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), mouseX);
  let right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), mouseX);

  let dir = new THREE.Vector3();

  if (keys["w"]) dir.add(forward);
  if (keys["s"]) dir.sub(forward);
  if (keys["a"]) dir.sub(right);
  if (keys["d"]) dir.add(right);

  dir.normalize();

  player.velocity.add(dir.multiplyScalar(player.speed));
  player.velocity.multiplyScalar(0.85);

  player.position.add(player.velocity);

  camera.position.copy(player.position);
  camera.rotation.y = mouseX;
}

function animate() {
  requestAnimationFrame(animate);

  updatePlayer();
  updateGame(scene, camera, player);

  renderer.render(scene, camera);
}
