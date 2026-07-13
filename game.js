const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const road = {
  offset: 0,
  speed: 6
};

const player = {
  x: 155,
  y: 520,
  width: 50,
  height: 90,
  speed: 7
};

const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function update() {

  if (keys["ArrowLeft"]) {
    player.x -= player.speed;
  }

  if (keys["ArrowRight"]) {
    player.x += player.speed;
  }

  if (player.x < 20) player.x = 20;
  if (player.x > 290) player.x = 290;

  road.offset += road.speed;
  if (road.offset >= 80) road.offset = 0;
}

function drawRoad() {

  ctx.fillStyle = "#555";
  ctx.fillRect(0, 0, 360, 640);

  ctx.fillStyle = "#ffffff";

  for (let y = -80; y < 640; y += 80) {
    ctx.fillRect(175, y + road.offset, 10, 40);
  }
}

function drawPlayer() {

  ctx.fillStyle = "#ff0000";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop() {

  update();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoad();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

gameLoop();
