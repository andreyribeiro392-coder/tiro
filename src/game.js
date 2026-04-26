import playerImg from "./assets/player.png";

export function startGame() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const player = {
    x: 380,
    y: 420,
    w: 40,
    h: 40,
    speed: 5,
    img: new Image(),
  };

  player.img.src = playerImg;

  const keys = {};

  document.addEventListener("keydown", (e) => (keys[e.key] = true));
  document.addEventListener("keyup", (e) => (keys[e.key] = false));

  function update() {
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(player.img, player.x, player.y, player.w, player.h);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
}
