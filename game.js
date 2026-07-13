/**
 * Highway Racer - Procedural AAA Edition
 * Completely self-contained game engine with zero external dependencies.
 */

// --- 1. PROCEDURAL ASSET GENERATOR (SVG to Base64 Images) ---
// We generate all graphics procedurally using SVG so the game requires NO image files.
class AssetManager {
    constructor() {
        this.images = {};
        this.loaded = 0;
        this.total = 13; // Player + 10 Enemies + Coin + Fuel
    }

    async generateAssets(callback) {
        const svgHeader = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"`;
        const shadow = `<ellipse cx="50" cy="100" rx="45" ry="95" fill="rgba(0,0,0,0.5)" filter="blur(2px)"/>`;

        // 1. Player Sports Car (Red)
        const playerSvg = `<svg ${svgHeader}>${shadow}
            <rect x="20" y="20" width="60" height="160" rx="15" fill="#cc0000"/>
            <path d="M 25 40 L 75 40 L 70 80 L 30 80 Z" fill="#111"/> <!-- Windshield -->
            <path d="M 25 140 L 75 140 L 70 110 L 30 110 Z" fill="#111"/> <!-- Rear window -->
            <rect x="15" y="30" width="5" height="30" fill="#222" rx="2"/> <!-- Mirrors -->
            <rect x="80" y="30" width="5" height="30" fill="#222" rx="2"/>
            <rect x="25" y="10" width="12" height="8" fill="#fff" rx="3"/> <!-- Headlights -->
            <rect x="63" y="10" width="12" height="8" fill="#fff" rx="3"/>
            <rect x="25" y="185" width="15" height="5" fill="#ff0000" rx="2"/> <!-- Taillights -->
            <rect x="60" y="185" width="15" height="5" fill="#ff0000" rx="2"/>
            <line x1="50" y1="20" x2="50" y2="180" stroke="#990000" stroke-width="2"/> <!-- Detail line -->
        </svg>`;

        // Enemy Types Generation
        const enemyDefs = [
            { id: 'sedan', color: '#0055ff', width: 60, height: 150, roof: 60 },
            { id: 'hatchback', color: '#00cc44', width: 55, height: 130, roof: 70 },
            { id: 'taxi', color: '#ffcc00', width: 60, height: 150, roof: 60, taxiSign: true },
            { id: 'police', color: '#ffffff', width: 60, height: 150, roof: 60, lightbar: true },
            { id: 'suv', color: '#1a1a1a', width: 65, height: 170, roof: 80 },
            { id: 'pickup', color: '#8c8c8c', width: 65, height: 175, roof: 50, bed: true },
            { id: 'sports', color: '#ff6600', width: 60, height: 145, roof: 50 },
            { id: 'muscle', color: '#6600cc', width: 62, height: 155, roof: 55 },
            { id: 'bus', color: '#e62e00', width: 75, height: 240, bus: true },
            { id: 'truck', color: '#e6e6e6', width: 70, height: 220, box: true }
        ];

        const generateEnemy = (def) => {
            let svg = `<svg ${svgHeader}>${shadow}
                <rect x="${50 - def.width/2}" y="${100 - def.height/2}" width="${def.width}" height="${def.height}" rx="10" fill="${def.color}"/>`;
            
            if (def.bus) {
                svg += `<rect x="18" y="10" width="64" height="30" fill="#111"/> <!-- Big Window -->`;
            } else if (def.box) {
                svg += `<rect x="15" y="40" width="70" height="150" fill="#ccc" rx="2"/> <!-- Box -->
                        <rect x="20" y="10" width="60" height="25" fill="${def.color}" rx="5"/> <!-- Cab -->
                        <path d="M 25 35 L 75 35 L 75 15 L 25 15 Z" fill="#111"/>`;
            } else {
                // Standard windows
                const wy = 100 - def.height/2 + 30;
                svg += `<path d="M ${50 - def.width/2 + 5} ${wy} L ${50 + def.width/2 - 5} ${wy} L ${50 + def.width/2 - 10} ${wy+def.roof} L ${50 - def.width/2 + 10} ${wy+def.roof} Z" fill="#111"/>`;
                
                if (def.bed) {
                    svg += `<rect x="${50 - def.width/2 + 5}" y="${100 + def.height/2 - 60}" width="${def.width - 10}" height="55" fill="#333" rx="2"/>`;
                }
                
                if (def.lightbar) {
                    svg += `<rect x="25" y="${wy+15}" width="25" height="8" fill="#ff0000"/><rect x="50" y="${wy+15}" width="25" height="8" fill="#0000ff"/>
                            <rect x="${50 - def.width/2}" y="${100 - def.height/2}" width="${def.width}" height="${def.height}" rx="10" fill="transparent" stroke="#000" stroke-width="2"/>`;
                }
                if (def.taxiSign) {
                    svg += `<rect x="40" y="${wy+10}" width="20" height="10" fill="#fff"/><text x="42" y="${wy+18}" font-size="8" fill="#000">TAXI</text>`;
                }
            }
            
            // Taillights
            const ty = 100 + def.height/2 - 10;
            svg += `<rect x="${50 - def.width/2 + 5}" y="${ty}" width="15" height="5" fill="#ff0000" rx="2"/>
                    <rect x="${50 + def.width/2 - 20}" y="${ty}" width="15" height="5" fill="#ff0000" rx="2"/>`;
                    
            svg += `</svg>`;
            return svg;
        };

        // Items
        const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#ffaa00" stroke="#cc8800" stroke-width="5"/>
            <circle cx="50" cy="50" r="35" fill="#ffcc00"/>
            <text x="50" y="65" font-family="Arial" font-size="40" font-weight="bold" fill="#cc8800" text-anchor="middle">$</text>
        </svg>`;

        const fuelSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect x="20" y="30" width="60" height="60" rx="10" fill="#00cc44" stroke="#009933" stroke-width="4"/>
            <path d="M 35 30 L 35 15 L 65 15 L 65 30 Z" fill="#009933"/>
            <rect x="45" y="5" width="10" height="15" fill="#333"/>
            <text x="50" y="70" font-family="Arial" font-size="25" font-weight="bold" fill="#fff" text-anchor="middle">FUEL</text>
        </svg>`;

        // Load Function
        const loadSvg = (name, svgStr) => {
            return new Promise((resolve) => {
                const img = new Image();
                const blob = new Blob([svgStr], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                    this.images[name] = img;
                    this.loaded++;
                    if (this.loaded === this.total && callback) callback();
                    resolve();
                };
                img.src = url;
            });
        };

        // Initiate Loading
        await loadSvg('player', playerSvg);
        await loadSvg('coin', coinSvg);
        await loadSvg('fuel', fuelSvg);
        
        for (let i = 0; i < enemyDefs.length; i++) {
            await loadSvg(`enemy_${i}`, generateEnemy(enemyDefs[i]));
        }
    }

    getImage(name) {
        return this.images[name];
    }
}

// --- 2. PROCEDURAL AUDIO GENERATOR (Web Audio API) ---
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.musicPlaying = false;
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3;
        this.engineOsc = null;
        this.engineGain = null;
    }

    resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playClick() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playCoin() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.setValueAtTime(1600, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playFuel() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    playCrash() {
        if (!this.enabled) return;
        this.resume();
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        // Lowpass filter for explosion sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    startEngine() {
        if (!this.enabled || this.engineOsc) return;
        this.resume();
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 50;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        this.engineGain.gain.value = 0.1;
        
        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);
        this.engineOsc.start();
    }

    updateEngine(speedRatio) {
        if (this.engineOsc && this.enabled) {
            // Speed ratio 0 to 1
            const freq = 50 + (speedRatio * 100);
            this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
        }
    }

    stopEngine() {
        if (this.engineOsc) {
            this.engineGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            this.engineOsc.stop(this.ctx.currentTime + 0.5);
            this.engineOsc = null;
        }
    }
}

// --- 3. INPUT MANAGER ---
class InputManager {
    constructor() {
        this.keys = { left: false, right: false, up: false, down: false };
        this.setupKeyboard();
        this.setupTouch();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
    }

    handleKey(e, isDown) {
        if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = isDown;
        if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = isDown;
        if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = isDown;
        if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = isDown;
    }

    setupTouch() {
        const checkTouch = () => {
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                document.getElementById('mobileControls').classList.remove('hidden');
            }
        };
        checkTouch();

        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        
        const handleTouch = (btn, isDown) => (e) => {
            e.preventDefault();
            btn === 'left' ? this.keys.left = isDown : this.keys.right = isDown;
        };

        btnLeft.addEventListener('touchstart', handleTouch('left', true));
        btnLeft.addEventListener('touchend', handleTouch('left', false));
        btnRight.addEventListener('touchstart', handleTouch('right', true));
        btnRight.addEventListener('touchend', handleTouch('right', false));
        
        // Swipe Support
        let startX = 0;
        let startY = 0;
        window.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, {passive: false});

        window.addEventListener('touchmove', e => {
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('.menu')) {
                e.preventDefault(); // Prevent scrolling on game
            }
        }, {passive: false});
    }
}

// --- 4. GAME ENTITIES ---

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, color, count, speedMultiplier = 1) {
        for(let i=0; i<count; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10 * speedMultiplier,
                vy: (Math.random() - 0.5) * 10 * speedMultiplier,
                life: 1.0,
                color: color,
                size: Math.random() * 5 + 2
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= dt * 2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.markedForDeletion = false;
    }
    
    checkCollision(other) {
        return (
            this.x < other.x + other.w &&
            this.x + this.w > other.x &&
            this.y < other.y + other.h &&
            this.y + this.h > other.y
        );
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 50, 100);
        this.speed = 0;
        this.maxSpeed = 800; // Pixels per second
        this.lateralSpeed = 400;
        this.fuel = 100;
        this.angle = 0;
    }

    update(dt, input, roadLeft, roadRight) {
        // Lateral Movement
        if (input.left) {
            this.x -= this.lateralSpeed * dt;
            this.angle = -0.1;
        } else if (input.right) {
            this.x += this.lateralSpeed * dt;
            this.angle = 0.1;
        } else {
            this.angle = 0;
        }

        // Constraints
        if (this.x < roadLeft) this.x = roadLeft;
        if (this.x + this.w > roadRight) this.x = roadRight - this.w;

        // Fuel Consumption
        this.fuel -= dt * 2; // Lose 2% per second
        if (this.fuel < 0) this.fuel = 0;
        if (this.fuel > 100) this.fuel = 100;
    }

    draw(ctx, assets, isNight) {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.angle);
        
        // Headlights at night
        if (isNight) {
            ctx.globalCompositeOperation = 'screen';
            const gradient = ctx.createLinearGradient(0, -this.h/2, 0, -this.h/2 - 300);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(-this.w/2 + 10, -this.h/2 + 10);
            ctx.lineTo(-this.w*2, -this.h/2 - 300);
            ctx.lineTo(this.w*2, -this.h/2 - 300);
            ctx.lineTo(this.w/2 - 10, -this.h/2 + 10);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.drawImage(assets.getImage('player'), -this.w/2, -this.h/2, this.w, this.h);
        
        // Braking / Acceleration lights
        if (this.speed > 0) {
            // Engine exhaust
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(-15, this.h/2, Math.random()*5 + 2, 0, Math.PI*2);
            ctx.arc(15, this.h/2, Math.random()*5 + 2, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, typeId, speed, assets) {
        // Find dimensions based on generated image ratio roughly
        super(x, y, 50, 100); 
        this.typeId = typeId;
        this.baseSpeed = speed; // Pixels per second
        this.passed = false;
        
        // Adjust size based on type
        if(typeId >= 8) { // Bus / Truck
            this.w = 60;
            this.h = 160;
        } else {
            this.w = 50;
            this.h = 110;
        }
    }

    update(dt, playerSpeed) {
        // Move enemy relative to player speed
        this.y += (playerSpeed - this.baseSpeed) * dt;
        if (this.y > window.innerHeight + 100) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, assets, isNight) {
        const img = assets.getImage(`enemy_${this.typeId}`);
        if(img) ctx.drawImage(img, this.x, this.y, this.w, this.h);

        if (isNight) {
            ctx.fillStyle = 'rgba(255,0,0,0.8)';
            ctx.fillRect(this.x + 5, this.y + this.h - 5, 10, 5);
            ctx.fillRect(this.x + this.w - 15, this.y + this.h - 5, 10, 5);
        }
    }
}

class Item extends Entity {
    constructor(x, y, type) {
        super(x, y, 40, 40);
        this.type = type; // 'coin' or 'fuel'
        this.bob = Math.random() * Math.PI * 2;
    }

    update(dt, playerSpeed) {
        this.y += playerSpeed * dt;
        this.bob += dt * 5;
        if (this.y > window.innerHeight + 100) this.markedForDeletion = true;
    }

    draw(ctx, assets) {
        const img = assets.getImage(this.type);
        const yOffset = Math.sin(this.bob) * 5;
        if(img) ctx.drawImage(img, this.x, this.y + yOffset, this.w, this.h);
    }
}

// --- 5. MAIN GAME ENGINE ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Systems
        this.assets = new AssetManager();
        this.audio = new AudioManager();
        this.input = new InputManager();
        this.particles = new ParticleSystem();

        // Game State
        this.state = 'MENU'; // MENU, COUNTDOWN, PLAYING, PAUSED, GAMEOVER
        this.score = 0;
        this.highScore = localStorage.getItem('highwayRacerHighScore') || 0;
        this.distance = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.lastTime = 0;
        this.baseSpeed = 300;
        this.currentSpeed = 0;
        
        // Environment
        this.roadY = 0;
        this.laneCount = 4;
        this.roadWidth = 0;
        this.roadLeft = 0;
        
        this.weather = { type: 'day', transition: 0, timer: 0 };

        // Entities
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.trees = [];
        
        // Visual FX
        this.screenShake = 0;
        this.vfxEnabled = true;

        this.bindUI();
        
        // Load Assets then start loop
        this.assets.generateAssets().then(() => {
            requestAnimationFrame((t) => this.loop(t));
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Calculate road dimensions
        this.roadWidth = Math.min(this.canvas.width * 0.8, 600);
        this.roadLeft = (this.canvas.width - this.roadWidth) / 2;
        
        this.initScenery();
    }

    initScenery() {
        this.trees = [];
        for (let i = 0; i < 20; i++) {
            this.trees.push({
                x: Math.random() > 0.5 ? Math.random() * (this.roadLeft - 50) : this.roadLeft + this.roadWidth + 50 + Math.random() * (this.roadLeft - 50),
                y: Math.random() * this.canvas.height,
                size: Math.random() * 40 + 20,
                type: Math.random() > 0.5 ? 1 : 2
            });
        }
    }

    bindUI() {
        document.getElementById('playBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.startCountdown();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.audio.playClick();
            document.getElementById('startMenu').classList.add('hidden');
            document.getElementById('settingsMenu').classList.remove('hidden');
        });

        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.audio.playClick();
            document.getElementById('settingsMenu').classList.add('hidden');
            document.getElementById('startMenu').classList.remove('hidden');
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.togglePause();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.togglePause();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.resetToMenu();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.startCountdown();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.resetToMenu();
        });

        // Settings
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.audio.enabled = e.target.checked;
        });
        document.getElementById('vfxToggle').addEventListener('change', (e) => {
            this.vfxEnabled = e.target.checked;
        });

        // Update High Score Display
        document.getElementById('highScoreVal').innerText = this.highScore;
    }

    startCountdown() {
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('countdown').classList.remove('hidden');
        this.state = 'COUNTDOWN';
        
        let count = 3;
        const countEl = document.getElementById('countdown');
        countEl.innerText = count;
        this.audio.playClick();

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countEl.innerText = count;
                this.audio.playClick();
                // Reset animation
                countEl.style.animation = 'none';
                countEl.offsetHeight; 
                countEl.style.animation = null; 
            } else if (count === 0) {
                countEl.innerText = "GO!";
                this.audio.playCoin();
            } else {
                clearInterval(interval);
                document.getElementById('countdown').classList.add('hidden');
                this.startGame();
            }
        }, 1000);
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.distance = 0;
        this.combo = 1;
        this.baseSpeed = 400;
        this.enemies = [];
        this.items = [];
        this.weather.timer = 0;
        this.weather.type = 'day';
        
        this.player = new Player(this.canvas.width / 2 - 25, this.canvas.height - 150);
        
        document.getElementById('hud').classList.remove('hidden');
        this.audio.startEngine();
        this.lastTime = performance.now();
    }

    resetToMenu() {
        this.state = 'MENU';
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('startMenu').classList.remove('hidden');
        this.audio.stopEngine();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pauseMenu').classList.remove('hidden');
            this.audio.stopEngine();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pauseMenu').classList.add('hidden');
            this.lastTime = performance.now();
            this.audio.startEngine();
        }
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.audio.stopEngine();
        this.audio.playCrash();
        this.screenShake = 20;
        
        // Explode player
        if (this.vfxEnabled) {
            this.particles.emit(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#ffaa00', 50, 2);
            this.particles.emit(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#555', 30, 1);
        }

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('highwayRacerHighScore', this.highScore);
            document.getElementById('highScoreVal').innerText = this.highScore;
        }

        setTimeout(() => {
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('gameOverMenu').classList.remove('hidden');
            document.getElementById('goScore').innerText = Math.floor(this.score);
            document.getElementById('goBestScore').innerText = this.highScore;
            document.getElementById('goDist').innerText = Math.floor(this.distance);
        }, 1500);
    }

    spawnEntities() {
        // Difficulty scaling
        const spawnChance = 0.02 + (this.distance / 50000); 
        
        if (Math.random() < Math.min(spawnChance, 0.08)) {
            const laneWidth = this.roadWidth / this.laneCount;
            const lane = Math.floor(Math.random() * this.laneCount);
            const x = this.roadLeft + (lane * laneWidth) + (laneWidth/2) - 25;
            
            // Ensure no overlap at spawn
            let canSpawn = true;
            for(let e of this.enemies) {
                if (e.x === x && e.y < 200) canSpawn = false;
            }

            if (canSpawn) {
                const type = Math.floor(Math.random() * 10);
                // Traffic moves slower than player
                const speed = this.baseSpeed * (0.3 + Math.random() * 0.4);
                this.enemies.push(new Enemy(x, -200, type, speed, this.assets));
            }
        }

        // Spawn Items
        if (Math.random() < 0.005) {
            const laneWidth = this.roadWidth / this.laneCount;
            const lane = Math.floor(Math.random() * this.laneCount);
            const x = this.roadLeft + (lane * laneWidth) + (laneWidth/2) - 20;
            const type = Math.random() > 0.8 ? 'fuel' : 'coin';
            this.items.push(new Item(x, -100, type));
        }
    }

    update(dt) {
        if (dt > 0.1) dt = 0.1; // Cap dt for smooth physics on lag

        // Speed logic
        this.baseSpeed += dt * 5; // Gradually increase speed
        this.currentSpeed = this.baseSpeed;
        if (this.player.fuel <= 0) this.currentSpeed *= 0.3; // Out of fuel slowdown

        this.distance += (this.currentSpeed * dt) / 10;
        this.score += dt * 10 * this.combo;

        this.audio.updateEngine(Math.min(this.currentSpeed / 1000, 1));

        // Update Weather
        this.weather.timer += dt;
        if (this.weather.timer > 30) {
            this.weather.timer = 0;
            const types = ['day', 'night', 'rain', 'fog'];
            this.weather.type = types[Math.floor(Math.random() * types.length)];
        }

        // Move Road & Scenery
        this.roadY += this.currentSpeed * dt;
        if (this.roadY > 100) this.roadY %= 100;

        for (let tree of this.trees) {
            tree.y += this.currentSpeed * dt;
            if (tree.y > this.canvas.height + 100) {
                tree.y = -100;
                tree.x = Math.random() > 0.5 ? Math.random() * (this.roadLeft - 50) : this.roadLeft + this.roadWidth + 50 + Math.random() * (this.roadLeft - 50);
            }
        }

        // Player Update
        this.player.update(dt, this.input.keys, this.roadLeft, this.roadLeft + this.roadWidth);
        
        // Out of fuel logic
        if (this.player.fuel <= 0 && this.currentSpeed < 150) {
            this.gameOver();
            return;
        }

        // Combo Logic
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                document.getElementById('comboText').classList.add('hidden');
            }
        }

        // Entity Updates & Collisions
        this.spawnEntities();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            enemy.update(dt, this.currentSpeed);

            // Collision
            if (this.player.checkCollision(enemy)) {
                this.gameOver();
                return;
            }

            // Near Miss Logic
            if (!enemy.passed && enemy.y > this.player.y) {
                enemy.passed = true;
                
                // Check X distance for near miss
                const distX = Math.abs((this.player.x + this.player.w/2) - (enemy.x + enemy.w/2));
                if (distX < this.player.w + 30) { // Close!
                    this.score += 50 * this.combo;
                    this.combo++;
                    this.comboTimer = 2.0; // 2 seconds to keep combo
                    
                    // Show Text
                    const nmEl = document.getElementById('nearMissText');
                    nmEl.classList.remove('hidden');
                    nmEl.style.animation = 'none';
                    nmEl.offsetHeight; 
                    nmEl.style.animation = null;
                    
                    if (this.combo > 1) {
                        const cbEl = document.getElementById('comboText');
                        cbEl.classList.remove('hidden');
                        document.getElementById('comboVal').innerText = this.combo;
                        cbEl.style.animation = 'none';
                        cbEl.offsetHeight; 
                        cbEl.style.animation = null;
                    }
                }
            }

            if (enemy.markedForDeletion) this.enemies.splice(i, 1);
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];
            item.update(dt, this.currentSpeed);

            if (this.player.checkCollision(item)) {
                if (item.type === 'coin') {
                    this.score += 100 * this.combo;
                    this.audio.playCoin();
                    if(this.vfxEnabled) this.particles.emit(item.x+20, item.y+20, '#ffaa00', 10, 0.5);
                } else if (item.type === 'fuel') {
                    this.player.fuel += 40;
                    if(this.player.fuel > 100) this.player.fuel = 100;
                    this.audio.playFuel();
                    if(this.vfxEnabled) this.particles.emit(item.x+20, item.y+20, '#00ff00', 10, 0.5);
                }
                item.markedForDeletion = true;
            }

            if (item.markedForDeletion) this.items.splice(i, 1);
        }

        if (this.vfxEnabled) {
            // Smoke from player speed
            if (this.currentSpeed > 500 && Math.random() < 0.2) {
                this.particles.emit(this.player.x + 10, this.player.y + this.player.h, '#777', 1, 0.2);
                this.particles.emit(this.player.x + this.player.w - 10, this.player.y + this.player.h, '#777', 1, 0.2);
            }
            this.particles.update(dt);
        }

        // Screen Shake decrease
        if (this.screenShake > 0) this.screenShake -= dt * 30;
        if (this.screenShake < 0) this.screenShake = 0;

        // Update UI
        document.getElementById('scoreVal').innerText = Math.floor(this.score);
        document.getElementById('distVal').innerText = Math.floor(this.distance);
        
        const fuelFill = document.getElementById('fuelFill');
        fuelFill.style.width = this.player.fuel + '%';
        fuelFill.style.background = this.player.fuel < 20 ? '#ff0000' : 'linear-gradient(90deg, #ff0000, #00ff00)';
    }

    render() {
        // Clear
        this.ctx.fillStyle = '#2d4c1e'; // Grass base
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        if (this.screenShake > 0) {
            const dx = (Math.random() - 0.5) * this.screenShake;
            const dy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(dx, dy);
        }

        // Draw Road
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.roadLeft, 0, this.roadWidth, this.canvas.height);
        
        // Road edges
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.roadLeft - 5, 0, 5, this.canvas.height);
        this.ctx.fillRect(this.roadLeft + this.roadWidth, 0, 5, this.canvas.height);

        // Lane markings
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 5;
        this.ctx.setLineDash([40, 60]);
        this.ctx.lineDashOffset = -this.roadY;
        
        const laneWidth = this.roadWidth / this.laneCount;
        for (let i = 1; i < this.laneCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.roadLeft + (i * laneWidth), 0);
            this.ctx.lineTo(this.roadLeft + (i * laneWidth), this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);

        // Scenery (Trees)
        for(let tree of this.trees) {
            this.ctx.fillStyle = '#1e3314'; // Shadow
            this.ctx.beginPath();
            this.ctx.ellipse(tree.x, tree.y + tree.size/2, tree.size/2, tree.size/4, 0, 0, Math.PI*2);
            this.ctx.fill();

            this.ctx.fillStyle = tree.type === 1 ? '#286016' : '#1f4a11';
            this.ctx.beginPath();
            this.ctx.arc(tree.x, tree.y, tree.size, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillStyle = '#3a8521';
            this.ctx.beginPath();
            this.ctx.arc(tree.x - tree.size*0.2, tree.y - tree.size*0.2, tree.size*0.6, 0, Math.PI*2);
            this.ctx.fill();
        }

        // Sort entities by Y for pseudo-3D overlap (optional, but 2D top down is fine without)
        const isNight = this.weather.type === 'night';
        
        for (let enemy of this.enemies) enemy.draw(this.ctx, this.assets, isNight);
        for (let item of this.items) item.draw(this.ctx, this.assets);
        if (this.player) this.player.draw(this.ctx, this.assets, isNight);
        
        if (this.vfxEnabled) this.particles.draw(this.ctx);

        // Weather Overlays
        if (this.weather.type === 'night') {
            this.ctx.fillStyle = 'rgba(0, 5, 20, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.weather.type === 'fog') {
            const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            grad.addColorStop(0, 'rgba(200, 220, 255, 0.9)');
            grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.weather.type === 'rain' && this.vfxEnabled) {
            this.ctx.fillStyle = 'rgba(50, 70, 100, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for(let i=0; i<100; i++) {
                let rx = Math.random() * this.canvas.width;
                let ry = Math.random() * this.canvas.height;
                this.ctx.moveTo(rx, ry);
                this.ctx.lineTo(rx - 10, ry + 30);
            }
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        // Always render to keep background behind menus
        if (this.state !== 'MENU' || this.player) {
            this.render();
        } else {
            // Render demo background for menu
            this.roadY += 200 * dt;
            if (this.roadY > 100) this.roadY %= 100;
            this.render();
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Initialize Game on load
window.onload = () => {
    new Game();
};
