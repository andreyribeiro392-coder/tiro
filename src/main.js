import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export let viewMode = "first"; // first | third

export let yaw = 0;
export let pitch = 0;

const sensitivity = 0.0022;

export const keys = {};

/* =========================
   PLAYER CONTROLLER INPUT
========================= */

export function initPlayerControls(camera) {

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

  document.addEventListener("keydown", (e) => {
    if (e.key === "v") {
      viewMode = viewMode === "first" ? "third" : "first";
    }
  });
}

/* =========================
   PLAYER UPDATE CAMERA
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

  /* =========================
     CAMERA MODES
  ========================= */

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
}

/* =========================
   WEAPON VIEWMODEL (ARMA NA MÃO)
========================= */

export function createWeaponView(camera) {

  const weapon = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.2, 1),
    new THREE.MeshBasicMaterial({ color: 0x222222 })
  );

  const barrel = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.8),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );

  barrel.position.z = -0.8;

  weapon.add(body);
  weapon.add(barrel);

  weapon.position.set(0.5, -0.3, -1);

  camera.add(weapon);

  return weapon;
}

/* =========================
   UPDATE WEAPON FEEL (RECOIL + ADS SUPPORT)
========================= */

export function updateWeaponView(weapon, ads) {

  if (!weapon) return;

  const targetZ = ads ? -0.6 : -1;

  weapon.position.z += (targetZ - weapon.position.z) * 0.15;

  weapon.rotation.x *= 0.9;
}
