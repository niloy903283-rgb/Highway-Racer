/**
 * HIGHWAY RACER
 * Created & Owned By DiaryOfParvez
 * Copyright © 2026 DiaryOfParvez
 * All Rights Reserved.
 * Version 1.0.0
 */

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');

const startMenu = document.getElementById('start-menu');
const countdownScreen = document.getElementById('countdown-screen');
const pauseMenu = document.getElementById('pause-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const hud = document.getElementById('hud');
const mobileControls = document.getElementById('mobile-controls');

const scoreText = document.getElementById('score-text');
const startHighScore = document.getElementById('start-high-score');
const finalScore = document.getElementById('final-score');
const finalHighScore = document.getElementById('final-high-score');
const fuelBar = document.getElementById('fuel-bar');
const comboContainer = document.getElementById('combo-container');
const comboText = document.getElementById('combo-text');
const countdownText = document.getElementById('countdown-text');
const weatherAlert = document.getElementById('weather-alert');

// Buttons
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const btnRestartPause = document.getElementById('btn-restart-pause');
const btnRestart = document.getElementById('btn-restart');
const rewardBtns = document.querySelectorAll('.claim-reward');

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnBrake = document.getElementById('btn-brake');

// Game Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 800;
const LANE_WIDTH = CANVAS_WIDTH / 3;
const REWARD_URL = 'https://omg10.com/4/8195678';

// System State
let gameState = 'MENU'; // MENU, COUNTDOWN, PLAYING, PAUSED, GAMEOVER
let lastTime = 0;
let animationFrameId;

// Game Variables
let score = 0;
let highScore = localStorage.getItem('highwayRacerHighScore') || 0;
let fuel = 100;
let baseSpeed = 300; // pixels per second
let globalSpeed = 0;
let difficultyMultiplier = 1.0;
let combo = 1;
let comboTimer = 0;

// Player
const player = {
    x: LANE_WIDTH + LANE_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 140,
    w: 50,
    h: 100,
    vx: 0,
    speed: 400, // lateral speed
    speedMultiplier: 1.0, // Used for braking
    targetMultiplier: 1.0
};

// Entities
let enemies = [];
let items = [];
let particles = [];
let roadOffset = 0;

// Environment / Weather
const weatherTypes = ['DAY', 'NIGHT', 'RAIN', 'FOG'];
let currentWeather = 'DAY';
let weatherTimer = 0;
const WEATHER_DURATION = 20000; // 20 seconds per weather

// Input Handling
const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false, Space: false, ArrowDown: false };
const touch = { left: false, right: false, brake: false };

// Audio Context (Synthesized sounds to avoid missing files)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let engineOsc;
let engineGain;

// Setup Initial UI
startHighScore.innerText = Math.floor(highScore);

// ---------------------------------------------------------
// INPUT LISTENERS
// ---------------------------------------------------------
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = true;
    if (e.code === 'Space' || e.code === 'ArrowDown') {
        keys.Space = true;
        if (gameState === 'PLAYING') e.preventDefault();
    }
    if (e.code === 'Escape' && gameState === 'PLAYING') togglePause();
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = false;
    if (e.code === 'Space' || e.code === 'ArrowDown') keys.Space = false;
});

// Touch / Mouse controls for UI Buttons
const addControl = (btn, action) => {
    const start = (e) => { e.preventDefault(); touch[action] = true; };
    const end = (e) => { e.preventDefault(); touch[action] = false; };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
    btn.addEventListener('touchend', end);
};
addControl(btnLeft, 'left');
addControl(btnRight, 'right');
addControl(btnBrake, 'brake');

// Reward Links
rewardBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(REWARD_URL, '_blank');
    });
});

// Menu Actions
btnPlay.addEventListener('click', startCountdown);
btnRestart.addEventListener('click', startCountdown);
btnRestartPause.addEventListener('click', startCountdown);
btnPause.addEventListener('click', togglePause);
btnResume.addEventListener('click', togglePause);

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseMenu.classList.remove('hidden');
        if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseMenu.classList.add('hidden');
        lastTime = performance.now();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// ---------------------------------------------------------
// AUDIO SYSTEM (Synthesizers)
// ---------------------------------------------------------
function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        
        // Engine Sound
        engineOsc = audioCtx.createOscillator();
        engineGain = audioCtx.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 50;
        engineGain.gain.value = 0;
        engineOsc.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function updateEngineSound() {
    if (!audioCtx || gameState !== 'PLAYING') {
        if (engineGain) engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        return;
    }
    // Modulate pitch based on speed
    const targetFreq = 50 + (globalSpeed * 0.15) * player.speedMultiplier;
    engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
    
    // Volume lower when braking
    const targetVol = player.speedMultiplier < 0.9 ? 0.05 : 0.1;
    engineGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.2);
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'crash') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'fuel') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

// ---------------------------------------------------------
// GAME MECHANICS
// ---------------------------------------------------------
function initGame() {
    score = 0;
    fuel = 100;
    baseSpeed = 300;
    difficultyMultiplier = 1.0;
    combo = 1;
    comboTimer = 0;
    roadOffset = 0;
    
    player.x = LANE_WIDTH + LANE_WIDTH / 2 - player.w / 2;
    player.speedMultiplier = 1.0;
    
    enemies = [];
    items = [];
    particles = [];
    
    currentWeather = 'DAY';
    weatherTimer = 0;

    updateHUD();
}

function startCountdown() {
    initAudio();
    initGame();
    
    startMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    hud.classList.add('hidden');
    mobileControls.classList.add('hidden');
    
    countdownScreen.classList.remove('hidden');
    
    let count = 3;
    countdownText.innerText = count;
    
    const countInt = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.innerText = count;
        } else if (count === 0) {
            countdownText.innerText = 'GO!';
        } else {
            clearInterval(countInt);
            countdownScreen.classList.add('hidden');
            startGame();
        }
    }, 800);
}

function startGame() {
    gameState = 'PLAYING';
    hud.classList.remove('hidden');
    if (window.innerWidth <= 600) {
        mobileControls.classList.remove('hidden');
    } else {
        mobileControls.classList.remove('hidden'); // Keep functional but hidden via CSS
    }
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'GAMEOVER';
    playSound('crash');
    createParticles(player.x + player.w/2, player.y + player.h/2, '#ef4444', 30);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highwayRacerHighScore', highScore);
    }
    
    finalScore.innerText = Math.floor(score);
    finalHighScore.innerText = Math.floor(highScore);
    
    setTimeout(() => {
        hud.classList.add('hidden');
        mobileControls.classList.add('hidden');
        gameOverMenu.classList.remove('hidden');
        if (engineGain) engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    }, 1000);
}

// ---------------------------------------------------------
// SPAWN LOGIC (Safe Lane AI)
// ---------------------------------------------------------
let spawnDistance = 0;
const ENEMY_COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#ecfdf5', '#fcd34d'];

function spawnWave() {
    // Determine number of obstacles (1 or 2, never 3 to keep a safe lane)
    let numObstacles = Math.random() > 0.5 ? 2 : 1;
    let lanes = [0, 1, 2].sort(() => 0.5 - Math.random()).slice(0, numObstacles);
    
    lanes.forEach(lane => {
        let x = lane * LANE_WIDTH + (LANE_WIDTH - 50) / 2;
        let y = -120;
        
        // 20% chance to spawn an item instead of an enemy
        if (Math.random() < 0.2) {
            let isFuel = Math.random() < 0.3;
            items.push({
                type: isFuel ? 'fuel' : 'coin',
                x: x + 10,
                y: y,
                w: 30,
                h: 30,
                collected: false
            });
        } else {
            enemies.push({
                x: x,
                y: y,
                w: 50,
                h: 100,
                color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
                passed: false
            });
        }
    });
}

// ---------------------------------------------------------
// MAIN LOOP
// ---------------------------------------------------------
function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') return;

    let dt = (timestamp - lastTime) / 1000;
    // Cap dt to prevent massive jumps if tab is backgrounded
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;

    update(dt);
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    // 1. BRAKING MECHANIC
    let isBraking = keys.Space || keys.ArrowDown || touch.brake;
    player.targetMultiplier = isBraking ? 0.4 : 1.0;
    
    // Smooth transition
    player.speedMultiplier += (player.targetMultiplier - player.speedMultiplier) * 10 * dt;
    
    // Difficulty Scaling
    difficultyMultiplier += 0.01 * dt;
    globalSpeed = baseSpeed * difficultyMultiplier * player.speedMultiplier;

    // Fuel logic
    fuel -= 5 * dt; // Consume fuel
    if (fuel <= 0) {
        fuel = 0;
        gameOver();
        return;
    }
    
    // Score & Combo
    score += (globalSpeed * 0.01) * dt * combo;
    if (combo > 1) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            combo = 1;
            comboContainer.classList.add('hidden');
        }
    }
    
    updateHUD();
    updateEngineSound();

    // Weather Cycle
    weatherTimer += dt * 1000;
    if (weatherTimer > WEATHER_DURATION) {
        weatherTimer = 0;
        let nextIdx = (weatherTypes.indexOf(currentWeather) + 1) % weatherTypes.length;
        currentWeather = weatherTypes[nextIdx];
        showWeatherAlert(currentWeather);
    }

    // Player Movement (Lateral)
    let moveLeft = keys.ArrowLeft || keys.a || touch.left;
    let moveRight = keys.ArrowRight || keys.d || touch.right;
    
    // Slightly reduce lateral speed while braking for realism
    let currentLatSpeed = player.speed * (0.6 + 0.4 * player.speedMultiplier);

    if (moveLeft) player.x -= currentLatSpeed * dt;
    if (moveRight) player.x += currentLatSpeed * dt;
    
    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.w;

    // Road Animation
    roadOffset += globalSpeed * dt;
    if (roadOffset > 100) roadOffset -= 100;

    // Spawning Logic (Dynamic gap based on speed to ensure fairness)
    spawnDistance -= globalSpeed * dt;
    let minGap = 350 + (globalSpeed * 0.4); // Gap increases as speed increases
    
    if (spawnDistance <= 0) {
        spawnWave();
        spawnDistance = minGap;
    }

    // Update Enemies & Collision
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        // Enemies move down relative to player speed
        e.y += globalSpeed * dt; 
        
        // AABB Collision (Real Box)
        if (intersect(player, e, 5)) { // 5px tolerance
            gameOver();
            return;
        }

        // Near Miss Logic (Expanded Box)
        if (!e.passed && e.y > player.y + player.h) {
            e.passed = true;
            // Check if it was close horizontally
            let dist = Math.abs((player.x + player.w/2) - (e.x + e.w/2));
            if (dist < 80) { // Near miss
                combo++;
                comboTimer = 3.0; // 3 seconds to keep combo
                score += 100 * combo;
                comboText.innerText = combo;
                comboContainer.classList.remove('hidden');
                createParticles(e.x + e.w/2, e.y, '#fbbf24', 5);
                playSound('coin');
            }
        }

        if (e.y > CANVAS_HEIGHT) {
            enemies.splice(i, 1);
        }
    }

    // Update Items
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += globalSpeed * dt;
        
        if (!item.collected && intersect(player, item, 0)) {
            item.collected = true;
            if (item.type === 'coin') {
                score += 50 * combo;
                playSound('coin');
                createParticles(item.x + 15, item.y + 15, '#fbbf24', 10);
            } else if (item.type === 'fuel') {
                fuel = Math.min(100, fuel + 30);
                playSound('fuel');
                createParticles(item.x + 15, item.y + 15, '#22c55e', 10);
            }
        }

        if (item.y > CANVAS_HEIGHT || item.collected) {
            items.splice(i, 1);
        }
    }

    // Weather Particles (Rain)
    if (currentWeather === 'RAIN') {
        if (Math.random() < 0.5) {
            particles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: -10,
                vx: -50,
                vy: 800,
                life: 1.0,
                color: 'rgba(255, 255, 255, 0.6)',
                type: 'rain'
            });
        }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ---------------------------------------------------------
// RENDERING
// ---------------------------------------------------------
function draw() {
    // Base Road
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Lane Lines
    ctx.fillStyle = '#cbd5e1';
    for (let i = 1; i < 3; i++) {
        let x = i * LANE_WIDTH - 2;
        for (let y = roadOffset - 100; y < CANVAS_HEIGHT; y += 100) {
            ctx.fillRect(x, y, 4, 50);
        }
    }
    
    // Edges
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 8, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - 8, 0, 8, CANVAS_HEIGHT);

    // Draw Items
    items.forEach(item => {
        if (item.type === 'coin') {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(item.x + 15, item.y + 15, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('$', item.x + 15, item.y + 22);
        } else if (item.type === 'fuel') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(item.x, item.y, 30, 30);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('F', item.x + 15, item.y + 22);
        }
    });

    // Draw Enemies
    enemies.forEach(e => {
        drawCar(e.x, e.y, e.w, e.h, e.color, false);
    });

    // Draw Player
    if (gameState !== 'GAMEOVER') {
        drawCar(player.x, player.y, player.w, player.h, '#3b82f6', true);
    }

    // Draw Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        if (p.type === 'rain') {
            ctx.fillRect(p.x, p.y, 2, 15);
        } else {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = 1.0;
        }
    });

    // Draw Weather Overlays
    if (currentWeather === 'NIGHT') {
        // Darkness
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Player Headlights
        if (gameState !== 'GAMEOVER') {
            let grad = ctx.createLinearGradient(player.x + player.w/2, player.y, player.x + player.w/2, player.y - 300);
            grad.addColorStop(0, 'rgba(253, 224, 71, 0.6)');
            grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(player.x + 10, player.y);
            ctx.lineTo(player.x - 50, player.y - 300);
            ctx.lineTo(player.x + player.w + 50, player.y - 300);
            ctx.lineTo(player.x + player.w - 10, player.y);
            ctx.fill();
        }
    } else if (currentWeather === 'FOG') {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (currentWeather === 'RAIN') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Braking visual cue (Tail lights glow)
    if (player.targetMultiplier === 0.4 && gameState === 'PLAYING') {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillRect(player.x + 5, player.y + player.h - 10, 12, 8);
        ctx.fillRect(player.x + player.w - 17, player.y + player.h - 10, 12, 8);
        ctx.shadowBlur = 0;
    }
}

function drawCar(x, y, w, h, color, isPlayer) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 5, y + 5, w, h);
    
    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();

    // Roof / Windshield
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 20, w - 10, h - 40, 4);
    ctx.fill();

    // Headlights
    ctx.fillStyle = isPlayer ? '#fef08a' : '#fff';
    ctx.fillRect(x + 5, y + 2, 12, 6);
    ctx.fillRect(x + w - 17, y + 2, 12, 6);

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 5, y + h - 8, 12, 6);
    ctx.fillRect(x + w - 17, y + h - 8, 12, 6);
}

// ---------------------------------------------------------
// UTILS
// ---------------------------------------------------------
function updateHUD() {
    scoreText.innerText = Math.floor(score);
    fuelBar.style.width = Math.max(0, fuel) + '%';
    
    // Change fuel color if low
    if (fuel < 20) {
        fuelBar.style.background = '#ef4444';
    } else {
        fuelBar.style.background = 'linear-gradient(90deg, #ef4444, #22c55e)';
    }
}

function intersect(a, b, tol) {
    return (a.x + tol < b.x + b.w - tol &&
            a.x + a.w - tol > b.x + tol &&
            a.y + tol < b.y + b.h - tol &&
            a.y + a.h - tol > b.y + tol);
}

function createParticles(x, y, color, amount) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.5) * 400,
            life: 1.0,
            color: color,
            type: 'explode'
        });
    }
}

function showWeatherAlert(text) {
    weatherAlert.innerText = text;
    weatherAlert.classList.remove('hidden');
    weatherAlert.style.animation = 'none';
    void weatherAlert.offsetWidth; // Trigger reflow
    weatherAlert.style.animation = 'fadeOut 2s forwards';
    setTimeout(() => {
        weatherAlert.classList.add('hidden');
    }, 2000);
}
