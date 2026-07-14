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
let countdownInterval;

// Game Variables
let score = 0;
let highScore = 0;

// Safe Local Storage Wrapper (Prevents Incognito/Iframe Crashes)
try {
    highScore = localStorage.getItem('highwayRacerHighScore') || 0;
} catch (e) {
    console.warn("LocalStorage disabled - High scores won't be saved.");
}

let fuel = 100;
let baseSpeed = 300; 
let globalSpeed = 0;
let difficultyMultiplier = 1.0;
let combo = 1;
let comboTimer = 0;

// Player Settings
const player = {
    x: LANE_WIDTH + LANE_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 140,
    w: 50,
    h: 100,
    vx: 0,
    speed: 400,
    speedMultiplier: 1.0, 
    targetMultiplier: 1.0
};

// Entities
let enemies = [];
let items = [];
let particles = [];
let roadOffset = 0;

// Environment
const weatherTypes = ['DAY', 'NIGHT', 'RAIN', 'FOG'];
let currentWeather = 'DAY';
let weatherTimer = 0;
const WEATHER_DURATION = 20000; 

// Input Logic
const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false, Space: false, ArrowDown: false };
const touch = { left: false, right: false, brake: false };

// Safe Audio Initializer
const WebAudioCtor = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let engineOsc = null;
let engineGain = null;

// Initialize UI
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

// Mobile Controls Interface
const addControl = (btn, action) => {
    if (!btn) return;
    const start = (e) => { if (e.cancelable) e.preventDefault(); touch[action] = true; };
    const end = (e) => { if (e.cancelable) e.preventDefault(); touch[action] = false; };
    
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
    btn.addEventListener('touchend', end);
};
addControl(btnLeft, 'left');
addControl(btnRight, 'right');
addControl(btnBrake, 'brake');

// Snappy Menu Button Binder (Prevents double taps and missing clicks)
function bindMenuButton(btn, callback) {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        callback();
    });
    btn.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault(); 
        callback();
    }, { passive: false });
}

bindMenuButton(btnPlay, startCountdown);
bindMenuButton(btnRestart, startCountdown);
bindMenuButton(btnRestartPause, startCountdown);
bindMenuButton(btnPause, togglePause);
bindMenuButton(btnResume, togglePause);

// Claim Reward Action
rewardBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(REWARD_URL, '_blank');
    });
});

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
// AUDIO SYSTEM (Synthesized & Handled Safely)
// ---------------------------------------------------------
function initAudio() {
    if (!WebAudioCtor) return; // Failsafe
    try {
        if (!audioCtx) {
            audioCtx = new WebAudioCtor();
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
    } catch (e) {
        console.warn("Audio Context init failed. Playing silently.", e);
        audioCtx = null; 
    }
}

function updateEngineSound() {
    if (!audioCtx || !engineGain || !engineOsc) return;
    if (gameState !== 'PLAYING') {
        try { engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1); } catch (e) {}
        return;
    }
    try {
        const targetFreq = 50 + (globalSpeed * 0.15) * player.speedMultiplier;
        engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
        const targetVol = player.speedMultiplier < 0.9 ? 0.05 : 0.1;
        engineGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.2);
    } catch (e) {}
}

function playSound(type) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
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
    } catch (e) {}
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
    if (gameState === 'COUNTDOWN' || gameState === 'PLAYING') return; // Prevent double pressing
    
    gameState = 'COUNTDOWN';
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
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.innerText = count;
        } else if (count === 0) {
            countdownText.innerText = 'GO!';
        } else {
            clearInterval(countdownInterval);
            countdownScreen.classList.add('hidden');
            startGame();
        }
    }, 800);
}

function startGame() {
    gameState = 'PLAYING';
    hud.classList.remove('hidden');
    mobileControls.classList.remove('hidden');
    
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'GAMEOVER';
    playSound('crash');
    createParticles(player.x + player.w/2, player.y + player.h/2, '#ef4444', 30);
    
    if (score > highScore) {
        highScore = score;
        try { localStorage.setItem('highwayRacerHighScore', highScore); } catch (e) {}
    }
    
    finalScore.innerText = Math.floor(score);
    finalHighScore.innerText = Math.floor(highScore);
    
    setTimeout(() => {
        hud.classList.add('hidden');
        mobileControls.classList.add('hidden');
        gameOverMenu.classList.remove('hidden');
        if (engineGain && audioCtx) {
            try { engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1); } catch (e) {}
        }
    }, 1000);
}

// ---------------------------------------------------------
// SPAWN LOGIC
// ---------------------------------------------------------
let spawnDistance = 0;
const ENEMY_COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#ecfdf5', '#fcd34d'];

function spawnWave() {
    let numObstacles = Math.random() > 0.5 ? 2 : 1;
    let lanes = [0, 1, 2].sort(() => 0.5 - Math.random()).slice(0, numObstacles);
    
    lanes.forEach(lane => {
        let x = lane * LANE_WIDTH + (LANE_WIDTH - 50) / 2;
        let y = -120;
        
        if (Math.random() < 0.2) {
            let isFuel = Math.random() < 0.3;
            items.push({ type: isFuel ? 'fuel' : 'coin', x: x + 10, y: y, w: 30, h: 30, collected: false });
        } else {
            enemies.push({ x: x, y: y, w: 50, h: 100, color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)], passed: false });
        }
    });
}

// ---------------------------------------------------------
// MAIN LOOP
// ---------------------------------------------------------
function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') return;

    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;

    update(dt);
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    let isBraking = keys.Space || keys.ArrowDown || touch.brake;
    player.targetMultiplier = isBraking ? 0.4 : 1.0;
    
    player.speedMultiplier += (player.targetMultiplier - player.speedMultiplier) * 10 * dt;
    difficultyMultiplier += 0.01 * dt;
    globalSpeed = baseSpeed * difficultyMultiplier * player.speedMultiplier;

    fuel -= 5 * dt; 
    if (fuel <= 0) {
        fuel = 0;
        gameOver();
        return;
    }
    
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

    weatherTimer += dt * 1000;
    if (weatherTimer > WEATHER_DURATION) {
        weatherTimer = 0;
        let nextIdx = (weatherTypes.indexOf(currentWeather) + 1) % weatherTypes.length;
        currentWeather = weatherTypes[nextIdx];
        showWeatherAlert(currentWeather);
    }

    let moveLeft = keys.ArrowLeft || keys.a || touch.left;
    let moveRight = keys.ArrowRight || keys.d || touch.right;
    let currentLatSpeed = player.speed * (0.6 + 0.4 * player.speedMultiplier);

    if (moveLeft) player.x -= currentLatSpeed * dt;
    if (moveRight) player.x += currentLatSpeed * dt;
    
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.w;

    roadOffset += globalSpeed * dt;
    if (roadOffset > 100) roadOffset -= 100;

    spawnDistance -= globalSpeed * dt;
    let minGap = 350 + (globalSpeed * 0.4); 
    
    if (spawnDistance <= 0) {
        spawnWave();
        spawnDistance = minGap;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += globalSpeed * dt; 
        
        if (intersect(player, e, 5)) { 
            gameOver();
            return;
        }

        if (!e.passed && e.y > player.y + player.h) {
            e.passed = true;
            let dist = Math.abs((player.x + player.w/2) - (e.x + e.w/2));
            if (dist < 80) { 
                combo++;
                comboTimer = 3.0; 
                score += 100 * combo;
                comboText.innerText = combo;
                comboContainer.classList.remove('hidden');
                createParticles(e.x + e.w/2, e.y, '#fbbf24', 5);
                playSound('coin');
            }
        }

        if (e.y > CANVAS_HEIGHT) enemies.splice(i, 1);
    }

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

        if (item.y > CANVAS_HEIGHT || item.collected) items.splice(i, 1);
    }

    if (currentWeather === 'RAIN' && Math.random() < 0.5) {
        particles.push({ x: Math.random() * CANVAS_WIDTH, y: -10, vx: -50, vy: 800, life: 1.0, color: 'rgba(255, 255, 255, 0.6)', type: 'rain' });
    }

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
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#cbd5e1';
    for (let i = 1; i < 3; i++) {
        let x = i * LANE_WIDTH - 2;
        for (let y = roadOffset - 100; y < CANVAS_HEIGHT; y += 100) {
            ctx.fillRect(x, y, 4, 50);
        }
    }
    
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 8, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - 8, 0, 8, CANVAS_HEIGHT);

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

    enemies.forEach(e => drawCar(e.x, e.y, e.w, e.h, e.color, false));

    if (gameState !== 'GAMEOVER') drawCar(player.x, player.y, player.w, player.h, '#3b82f6', true);

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

    if (currentWeather === 'NIGHT') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 5, y + 5, w, h);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 8);
    else ctx.rect(x, y, w, h); // Fallback for older devices that crash on roundRect
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 5, y + 20, w - 10, h - 40, 4);
    else ctx.rect(x + 5, y + 20, w - 10, h - 40);
    ctx.fill();

    ctx.fillStyle = isPlayer ? '#fef08a' : '#fff';
    ctx.fillRect(x + 5, y + 2, 12, 6);
    ctx.fillRect(x + w - 17, y + 2, 12, 6);

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
            x: x, y: y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.5) * 400,
            life: 1.0, color: color, type: 'explode'
        });
    }
}

function showWeatherAlert(text) {
    weatherAlert.innerText = text;
    weatherAlert.classList.remove('hidden');
    weatherAlert.style.animation = 'none';
    void weatherAlert.offsetWidth; 
    weatherAlert.style.animation = 'fadeOut 2s forwards';
    setTimeout(() => { weatherAlert.classList.add('hidden'); }, 2000);
}
