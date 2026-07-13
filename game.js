const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Player
const player = {
  x: 155,
  y: 520,
  width: 50,
  height: 90,
  speed: 7
};

// Enemy
let enemy = {
  x: Math.random() * 240 + 40,
  y: -120,
  width: 50,
  height: 90,
  speed: 6
};

let roadOffset = 0;
let score = 0;
let gameOver = false;

const keys = {};

document.addEventListener("keydown", e => {
  keys[e.key] = true;
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

function update(){

  if(gameOver) return;

  if(keys["ArrowLeft"]) player.x -= player.speed;
  if(keys["ArrowRight"]) player.x += player.speed;

  if(player.x < 20) player.x = 20;
  if(player.x > 290) player.x = 290;

  roadOffset += 6;
  if(roadOffset >= 80) roadOffset = 0;

  enemy.y += enemy.speed;

  if(enemy.y > 700){
      enemy.y = -120;
      enemy.x = Math.random()*240+40;
      score++;
  }

  // Collision
  if(
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
  ){
      gameOver = true;
  }
}

function drawRoad(){

  ctx.fillStyle="#555";
  ctx.fillRect(0,0,360,640);

  ctx.fillStyle="white";

  for(let i=-
