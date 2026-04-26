import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export let yaw = 0;
export let pitch = 0;
export let viewMode = "first";

const keys = {};
const sensitivity = 0.0022;

/* =========================
   INPUT
========================= */

export function initPlayerControls() {

  document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  document.addEventListener("mousemove", (e) => {

    if (document.pointerLockElement !== document.body) return;

    yaw -= e.movementX * sensitivity;
    pitch -= e.movementY * sensitivity;

    pitch = Math.max(-1.5, Math.min(1.5, pitch));
  });

  document.body.addEventListener("click", () => {
    document.body.requestPointerLock();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "v") {
      viewMode = viewMode === "first" ? "third" : "first";
    }
  });
}

/* =========================
   MOVIMENTO + CÂMERA
========================= */

export function updatePlayerView(camera, player) {

  const forward = new THREE.Vector3(0, 0, -1)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

  const right = new THREE.Vector3(1, 0, 0)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

  let move = new THREE.Vector3();

  if (keys["w"]) move.add(forward);
  if (keys["s"]) move.sub(forward);
  if (keys["a"]) move.sub(right);
  if (keys["d"]) move.add(right);

  if (move.length() > 0) move.normalize();

  player.position.add(move.multiplyScalar(player.speed));

  if (viewMode === "first") {

    camera.position.copy(player.position);
    camera.position.y += 1.6;

  } else {

    const offset = new THREE.Vector3(0, 3, 6)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    camera.position.copy(player.position).add(offset);
  }

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  player.rotationY = yaw;
  player.rotationX = pitch;
}

/* =========================
   EXPORT COMPAT (IMPORTANTE)
   evita erro de “update missing”
========================= */

export function getInputState() {
  return keys;
}
