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
const enemy = {
    x: 150,
    y: -100,
    width: 50,
    height: 90,
    speed: 5
};

let roadOffset = 0;
let score = 0;
let gameOver = false;

const keys = {};
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

leftBtn.addEventListener("touchstart", () => {
    keys["ArrowLeft"] = true;
});

leftBtn.addEventListener("touchend", () => {
    keys["ArrowLeft"] = false;
});

rightBtn.addEventListener("touchstart", () => {
    keys["ArrowRight"] = true;
});

rightBtn.addEventListener("touchend", () => {
    keys["ArrowRight"] = false;
});
document.addEventListener("keydown", (e)=>{
    keys[e.key]=true;
});

document.addEventListener("keyup",(e)=>{
    keys[e.key]=false;
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
        enemy.y = -100;
        enemy.x = Math.random() * 240 + 40;
        score++;
    }

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

    for(let i=-80;i<640;i+=80){
        ctx.fillRect(175,i+roadOffset,10,40);
    }
}function drawPlayer(){

    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);

}

function drawEnemy(){

    ctx.fillStyle = "blue";
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

}

function drawScore(){

    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText("Score: " + score, 15, 35);

}

function drawGameOver(){

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,360,640);

    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.fillText("GAME OVER", 65, 300);

    ctx.font = "22px Arial";
    ctx.fillText("Score: " + score, 120, 340);

}

function gameLoop(){

    update();

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawRoad();
    drawEnemy();
    drawPlayer();
    drawScore();

    if(gameOver){
        drawGameOver();
        return;
    }

    requestAnimationFrame(gameLoop);

}

gameLoop();
