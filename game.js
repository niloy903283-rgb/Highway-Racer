/**
 * Highway Racer Pro - Fully Procedural AAA Edition
 * Completely self-contained engine. Zero external dependencies.
 */

// --- 1. PROCEDURAL ASSET GENERATOR ---
class AssetManager {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalAssets = 13; // Player + 10 Enemies + Coin + Fuel
    }

    async loadAll(progressCallback) {
        return new Promise(async (resolve) => {
            const svgHeader = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"`;
            const shadow = `<ellipse cx="50" cy="100" rx="45" ry="95" fill="rgba(0,0,0,0.6)" filter="blur(3px)"/>`;

            // 1. Player Sports Car (Red)
            const playerSvg = `<svg ${svgHeader}>${shadow}
                <rect x="20" y="20" width="60" height="160" rx="15" fill="#e60000"/>
                <path d="M 25 40 L 75 40 L 70 80 L 30 80 Z" fill="#111"/> <!-- Windshield -->
                <path d="M 25 140 L 75 140 L 70 110 L 30 110 Z" fill="#111"/> <!-- Rear window -->
                <rect x="15" y="30" width="5" height="30" fill="#222" rx="2"/> <!-- Mirrors -->
                <rect x="80" y="30" width="5" height="30" fill="#222" rx="2"/>
                <rect x="25" y="10" width="12" height="8" fill="#fff" rx="3"/> <!-- Headlights -->
                <rect x="63" y="10" width="12" height="8" fill="#fff" rx="3"/>
                <rect x="25" y="185" width="15" height="5" fill="#ff0000" rx="2"/> <!-- Taillights -->
                <rect x="60" y="185" width="15" height="5" fill="#ff0000" rx="2"/>
                <line x1="50" y1="20" x2="50" y2="180" stroke="#990000" stroke-width="2"/>
                <polygon points="50,90 35,160 65,160" fill="rgba(255,255,255,0.1)"/> <!-- Reflection -->
            </svg>`;

            // Enemy Definitions (Width/Height define actual bounding box inside 100x200 canvas)
            const enemyDefs = [
                { id: 'sedan', color: '#0055ff', w: 60, h: 150, r: 60 },
                { id: 'hatchback', color: '#00cc44', w: 55, h: 130, r: 70 },
                { id: 'taxi', color: '#ffcc00', w: 60, h: 150, r: 60, taxi: true },
                { id: 'police', color: '#ffffff', w: 60, h: 150, r: 60, cop: true },
                { id: 'suv', color: '#1a1a1a', w: 65, h: 170, r: 80 },
                { id: 'pickup', color: '#8c8c8c', w: 65, h: 175, r: 50, bed: true },
                { id: 'sports', color: '#ff6600', w: 60, h: 145, r: 50 },
                { id: 'muscle', color: '#6600cc', w: 62, h: 155, r: 55 },
                { id: 'bus', color: '#e62e00', w: 75, h: 240, bus: true },
                { id: 'truck', color: '#e6e6e6', w: 70, h: 220, box: true }
            ];

            const generateEnemy = (def) => {
                let svg = `<svg ${svgHeader}>${shadow}
                    <rect x="${50 - def.w/2}" y="${100 - def.h/2}" width="${def.w}" height="${def.h}" rx="10" fill="${def.color}"/>`;
                
                if (def.bus) {
                    svg += `<rect x="18" y="10" width="64" height="35" fill="#111" rx="4"/>`;
                    svg += `<rect x="18" y="60" width="64" height="150" fill="#222" rx="4"/>`;
                    svg += `<rect x="25" y="195" width="15" height="5" fill="#ff0000" rx="2"/>`;
                    svg += `<rect x="60" y="195" width="15" height="5" fill="#ff0000" rx="2"/>`;
                } else if (def.box) {
                    svg += `<rect x="15" y="40" width="70" height="160" fill="#ddd" rx="2"/>
                            <rect x="20" y="5" width="60" height="30" fill="${def.color}" rx="5"/>
                            <path d="M 25 35 L 75 35 L 75 15 L 25 15 Z" fill="#111"/>`;
                } else {
                    const wy = 100 - def.h/2 + 30;
                    // Windows
                    svg += `<path d="M ${50 - def.w/2 + 5} ${wy} L ${50 + def.w/2 - 5} ${wy} L ${50 + def.w/2 - 10} ${wy+def.r} L ${50 - def.w/2 + 10} ${wy+def.r} Z" fill="#111"/>`;
                    
                    if (def.bed) {
                        svg += `<rect x="${50 - def.w/2 + 5}" y="${100 + def.h/2 - 60}" width="${def.w - 10}" height="55" fill="#333" rx="2"/>`;
                    }
                    if (def.cop) {
                        svg += `<rect x="25" y="${wy+15}" width="25" height="8" fill="#ff0000" rx="1"/>
                                <rect x="50" y="${wy+15}" width="25" height="8" fill="#0000ff" rx="1"/>
                                <rect x="${50 - def.w/2}" y="${100 - def.h/2}" width="${def.w}" height="${def.h}" rx="10" fill="transparent" stroke="#000" stroke-width="2"/>
                                <text x="50" y="${wy+50}" font-family="Arial" font-weight="bold" font-size="12" fill="#000" text-anchor="middle" transform="rotate(90 50 ${wy+50})">POLICE</text>`;
                    }
                    if (def.taxi) {
                        svg += `<rect x="40" y="${wy+10}" width="20" height="10" fill="#fff" rx="2"/>
                                <text x="50" y="${wy+18}" font-family="Arial" font-weight="bold" font-size="8" fill="#000" text-anchor="middle">TAXI</text>`;
                    }
                    // Taillights
                    const ty = 100 + def.h/2 - 10;
                    svg += `<rect x="${50 - def.w/2 + 5}" y="${ty}" width="15" height="5" fill="#ff0000" rx="2"/>
                            <rect x="${50 + def.w/2 - 20}" y="${ty}" width="15" height="5" fill="#ff0000" rx="2"/>`;
                }
                svg += `</svg>`;
                return svg;
            };

            // Items
            const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#ffaa00" stroke="#cc8800" stroke-width="5"/>
                <circle cx="50" cy="50" r="35" fill="#ffcc00"/>
                <text x="50" y="68" font-family="Arial" font-size="50" font-weight="bold" fill="#cc8800" text-anchor="middle">$</text>
            </svg>`;

            const fuelSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="15" y="25" width="70" height="70" rx="10" fill="#00cc44" stroke="#009933" stroke-width="4"/>
                <path d="M 35 25 L 35 10 L 65 10 L 65 25 Z" fill="#009933"/>
                <rect x="45" y="0" width="10" height="10" fill="#222"/>
                <text x="50" y="70" font-family="Arial" font-size="25" font-weight="bold" fill="#fff" text-anchor="middle">FUEL</text>
            </svg>`;

            const loadImg = (name, svgStr) => {
                return new Promise((res) => {
                    const img = new Image();
                    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
                    img.onload = () => {
                        this.images[name] = img;
                        this.loadedCount++;
                        if (progressCallback) progressCallback(this.loadedCount / this.totalAssets);
                        res();
                    };
                    img.onerror = () => res(); // Prevent hang on error
                    img.src = url;
                });
            };

            await loadImg('player', playerSvg);
            await loadImg('coin', coinSvg);
            await loadImg('fuel', fuelSvg);
            
            this.enemyData = enemyDefs; // Store definitions for physics
            
            for (let i = 0; i < enemyDefs.length; i++) {
                await loadImg(`enemy_${i}`, generateEnemy(enemyDefs[i]));
            }
            resolve();
        });
    }

    getImg(name) {
        return this.images[name];
    }
}

// --- 2. PROCEDURAL AUDIO GENERATOR ---
class AudioManager {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.enabled = true;
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.4;
        
        this.engineOsc = null;
        this.engineGain = null;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
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
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
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
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
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
        filter.frequency.value = 150;

        this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.engineGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 1);
        
        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);
        this.engineOsc.start();
    }

    updateEngine(speedRatio) {
        if (this.engineOsc && this.enabled) {
            const freq = 50 + (speedRatio * 150);
            this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
        }
    }

    stopEngine() {
        if (this.engineOsc) {
            this.engineGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.engineGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
            this.engineOsc.stop(this.ctx.currentTime + 0.3);
            this.engineOsc = null;
        }
    }
}

// --- 3. INPUT MANAGER ---
class InputManager {
    constructor() {
        this.keys = { left: false, right: false };
        this.setupKeyboard();
        this.setupTouch();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        });
    }

    setupTouch() {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouch) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }

        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        
        const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

        btnLeft.addEventListener('touchstart', (e) => { prevent(e); this.keys.left = true; }, {passive: false});
        btnLeft.addEventListener('touchend', (e) => { prevent(e); this.keys.left = false; }, {passive: false});
        btnRight.addEventListener('touchstart', (e) => { prevent(e); this.keys.right = true; }, {passive: false});
        btnRight.addEventListener('touchend', (e) => { prevent(e); this.keys.right = false; }, {passive: false});
        
        // Touch Sides of screen support
        window.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('.menu')) return;
            prevent(e);
            const touchX = e.touches[0].clientX;
            if (touchX < window.innerWidth / 2) this.keys.left = true;
            else this.keys.right = true;
        }, {passive: false});

        window.addEventListener('touchend', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('.menu')) return;
            prevent(e);
            this.keys.left = false;
            this.keys.right = false;
        }, {passive: false});
    }
}

// --- 4. GAME ENTITIES ---
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, color, count, speedMulti = 1) {
        for(let i=0; i<count; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 400 * speedMulti,
                vy: (Math.random() - 0.5) * 400 * speedMulti,
                life: 1.0,
                color: color,
                size: Math.random() * 6 + 2
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 1.5;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
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
        // AABB Collision with slight margin for fairness
        const margin = 5;
        return (
            this.x + margin < other.x + other.w - margin &&
            this.x + this.w - margin > other.x + margin &&
            this.y + margin < other.y + other.h - margin &&
            this.y + this.h - margin > other.y + margin
        );
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 50, 100);
        this.lateralSpeed = 450;
        this.fuel = 100;
        this.angle = 0;
    }

    update(dt, input, roadLeft, roadRight) {
        if (input.left) {
            this.x -= this.lateralSpeed * dt;
            this.angle = -0.05;
        } else if (input.right) {
            this.x += this.lateralSpeed * dt;
            this.angle = 0.05;
        } else {
            this.angle = 0;
        }

        if (this.x < roadLeft) this.x = roadLeft;
        if (this.x + this.w > roadRight) this.x = roadRight - this.w;

        this.fuel -= dt * 1.5;
        if (this.fuel < 0) this.fuel = 0;
        if (this.fuel > 100) this.fuel = 100;
    }

    draw(ctx, assets, isNight) {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.angle);
        
        if (isNight) {
            ctx.globalCompositeOperation = 'screen';
            const gradient = ctx.createLinearGradient(0, -this.h/2, 0, -this.h/2 - 400);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(-this.w/2 + 10, -this.h/2 + 10);
            ctx.lineTo(-this.w*2, -this.h/2 - 400);
            ctx.lineTo(this.w*2, -this.h/2 - 400);
            ctx.lineTo(this.w/2 - 10, -this.h/2 + 10);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        const img = assets.getImg('player');
        if (img) {
            // Draw 100x200 asset centered, scaled to actual 50x100 hitbox
            ctx.drawImage(img, -50, -100, 100, 200);
        }

        // Exhaust
        ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(-15, 95, Math.random()*4 + 2, 0, Math.PI*2);
        ctx.arc(15, 95, Math.random()*4 + 2, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, typeId, speed, def) {
        // Assign exact bounding box based on definition
        super(x, y, def.w, def.h); 
        this.typeId = typeId;
        this.baseSpeed = speed;
        this.passed = false;
        this.cop = def.cop || false;
        this.copLight = 0;
    }

    update(dt, playerSpeed) {
        this.y += (playerSpeed - this.baseSpeed) * dt;
        if (this.y > window.innerHeight + 200) {
            this.markedForDeletion = true;
        }
        if (this.cop) {
            this.copLight += dt * 10;
        }
    }

    draw(ctx, assets, isNight) {
        const img = assets.getImg(`enemy_${this.typeId}`);
        if(img) {
            // Draw 100x200 asset centered at the bounding box
            const cx = this.x + this.w/2;
            const cy = this.y + this.h/2;
            ctx.drawImage(img, cx - 50, cy - 100, 100, 200);
        }

        if (isNight) {
            ctx.fillStyle = 'rgba(255,0,0,0.8)';
            ctx.fillRect(this.x + 5, this.y + this.h - 10, 15, 5);
            ctx.fillRect(this.x + this.w - 20, this.y + this.h - 10, 15, 5);
        }

        if (this.cop && isNight) {
            ctx.globalCompositeOperation = 'screen';
            const color = Math.sin(this.copLight) > 0 ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,255,0.5)';
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.x + this.w/2, this.y + 30, 60, 0, Math.PI*2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
    }
}

class Item extends Entity {
    constructor(x, y, type) {
        super(x, y, 40, 40);
        this.type = type;
        this.bob = Math.random() * Math.PI * 2;
    }

    update(dt, playerSpeed) {
        this.y += playerSpeed * dt;
        this.bob += dt * 5;
        if (this.y > window.innerHeight + 100) this.markedForDeletion = true;
    }

    draw(ctx, assets) {
        const img = assets.getImg(this.type);
        const yOffset = Math.sin(this.bob) * 5;
        if(img) ctx.drawImage(img, this.x, this.y + yOffset, this.w, this.h);
    }
}

// --- 5. MAIN GAME ENGINE ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Systems
        this.assets = new AssetManager();
        this.audio = new AudioManager();
        this.input = new InputManager();
        this.particles = new ParticleSystem();

        // State
        this.state = 'LOADING'; 
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highwayRacerHighScore')) || 0;
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
        this.weather = { type: 'day', timer: 0 };
        this.screenShake = 0;
        this.vfxEnabled = true;

        // Entities
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.trees = [];
        
        this.bindUI();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Start Loading
        this.assets.loadAll((prog) => {
            document.getElementById('loadingFill').style.width = (prog * 100) + '%';
        }).then(() => {
            document.getElementById('loadingMenu').classList.add('hidden');
            document.getElementById('startMenu').classList.remove('hidden');
            this.state = 'MENU';
            requestAnimationFrame((t) => this.loop(t));
        });
    }

    bindUI() {
        const el = (id) => document.getElementById(id);
        
        el('playBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.startCountdown();
        });
        el('settingsBtn').addEventListener('click', () => {
            this.audio.playClick();
            el('startMenu').classList.add('hidden');
            el('settingsMenu').classList.remove('hidden');
        });
        el('closeSettingsBtn').addEventListener('click', () => {
            this.audio.playClick();
            el('settingsMenu').classList.add('hidden');
            el('startMenu').classList.remove('hidden');
        });
        el('pauseBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.togglePause();
        });
        el('resumeBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.togglePause();
        });
        el('quitBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.resetToMenu();
        });
        el('restartBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.startCountdown();
        });
        el('menuBtn').addEventListener('click', () => {
            this.audio.playClick();
            this.resetToMenu();
        });

        el('soundToggle').addEventListener('change', (e) => {
            this.audio.enabled = e.target.checked;
        });
        el('vfxToggle').addEventListener('change', (e) => {
            this.vfxEnabled = e.target.checked;
        });

        el('highScoreVal').innerText = this.highScore;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.roadWidth = Math.min(this.canvas.width * 0.9, 700);
        this.roadLeft = (this.canvas.width - this.roadWidth) / 2;
        this.initScenery();
    }

    initScenery() {
        this.trees = [];
        for (let i = 0; i < 25; i++) {
            this.spawnTree(true);
        }
    }

    spawnTree(randomY = false) {
        const isLeft = Math.random() > 0.5;
        const x = isLeft ? 
            Math.random() * (this.roadLeft - 50) : 
            this.roadLeft + this.roadWidth + 50 + Math.random() * (this.roadLeft - 50);
        
        this.trees.push({
            x: x,
            y: randomY ? Math.random() * this.canvas.height : -100,
            size: Math.random() * 50 + 30,
            type: Math.random() > 0.5 ? 1 : 2
        });
    }

    startCountdown() {
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
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
                countEl.style.animation = 'none';
                countEl.offsetHeight; 
                countEl.style.animation = 'pulse 1s infinite'; 
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
        this.particles.particles = [];
        this.weather.timer = 0;
        this.weather.type = 'day';
        
        this.player = new Player(this.canvas.width / 2 - 25, this.canvas.height - 180);
        
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('comboText').classList.add('hidden');
        document.getElementById('nearMissText').classList.add('hidden');
        
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
        this.screenShake = 30;
        
        if (this.vfxEnabled && this.player) {
            this.particles.emit(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#ff5500', 60, 2);
            this.particles.emit(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#555', 40, 1.5);
        }

        let fScore = Math.floor(this.score);
        if (fScore > this.highScore) {
            this.highScore = fScore;
            localStorage.setItem('highwayRacerHighScore', this.highScore);
            document.getElementById('highScoreVal').innerText = this.highScore;
        }

        setTimeout(() => {
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('gameOverMenu').classList.remove('hidden');
            document.getElementById('goScore').innerText = fScore;
            document.getElementById('goBestScore').innerText = this.highScore;
            document.getElementById('goDist').innerText = Math.floor(this.distance);
        }, 1500);
    }

    spawnEntities() {
        const spawnChance = 0.025 + (this.distance / 40000); 
        
        if (Math.random() < Math.min(spawnChance, 0.08)) {
            const laneWidth = this.roadWidth / this.laneCount;
            const lane = Math.floor(Math.random() * this.laneCount);
            
            const typeId = Math.floor(Math.random() * this.assets.enemyData.length);
            const def = this.assets.enemyData[typeId];
            
            const x = this.roadLeft + (lane * laneWidth) + (laneWidth/2) - (def.w/2);
            
            let canSpawn = true;
            for(let e of this.enemies) {
                if (Math.abs(e.x - x) < laneWidth && e.y < 200) canSpawn = false;
            }

            if (canSpawn) {
                const speed = this.baseSpeed * (0.3 + Math.random() * 0.3);
                this.enemies.push(new Enemy(x, -200, typeId, speed, def));
            }
        }

        if (Math.random() < 0.008) {
            const laneWidth = this.roadWidth / this.laneCount;
            const lane = Math.floor(Math.random() * this.laneCount);
            const x = this.roadLeft + (lane * laneWidth) + (laneWidth/2) - 20;
            const type = Math.random() > 0.7 ? 'fuel' : 'coin';
            
            let canSpawn = true;
            for(let i of this.items) {
                if (Math.abs(i.x - x) < laneWidth && i.y < 100) canSpawn = false;
            }
            if(canSpawn) this.items.push(new Item(x, -100, type));
        }
    }

    update(dt) {
        if (dt > 0.1) dt = 0.1; // Cap delta to prevent clipping

        this.baseSpeed += dt * 8; 
        this.currentSpeed = this.baseSpeed;
        if (this.player.fuel <= 0) this.currentSpeed *= 0.3; 

        this.distance += (this.currentSpeed * dt) / 10;
        this.score += dt * 15 * this.combo;

        this.audio.updateEngine(Math.min(this.currentSpeed / 1200, 1));

        this.weather.timer += dt;
        if (this.weather.timer > 25) {
            this.weather.timer = 0;
            const types = ['day', 'night', 'rain', 'fog'];
            this.weather.type = types[Math.floor(Math.random() * types.length)];
        }

        // Road & Scenery
        this.roadY += this.currentSpeed * dt;
        if (this.roadY > 100) this.roadY %= 100;

        for (let tree of this.trees) {
            tree.y += this.currentSpeed * dt;
            if (tree.y > this.canvas.height + 150) {
                this.trees.splice(this.trees.indexOf(tree), 1);
                this.spawnTree(false);
            }
        }

        // Player Update
        this.player.update(dt, this.input.keys, this.roadLeft, this.roadLeft + this.roadWidth);
        
        if (this.player.fuel <= 0 && this.currentSpeed < 150) {
            this.gameOver();
            return;
        }

        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                document.getElementById('comboText').classList.add('hidden');
            }
        }

        this.spawnEntities();

        // Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            enemy.update(dt, this.currentSpeed);

            if (this.player.checkCollision(enemy)) {
                this.gameOver();
                return;
            }

            // Near Miss
            if (!enemy.passed && enemy.y > this.player.y + this.player.h) {
                enemy.passed = true;
                const distX = Math.abs((this.player.x + this.player.w/2) - (enemy.x + enemy.w/2));
                if (distX < this.player.w + 40) {
                    this.score += 50 * this.combo;
                    this.combo++;
                    this.comboTimer = 2.5; 
                    
                    const nmEl = document.getElementById('nearMissText');
                    nmEl.classList.remove('hidden');
                    nmEl.style.animation = 'none';
                    nmEl.offsetHeight; 
                    nmEl.style.animation = 'popInOut 1s ease-in-out forwards';
                    
                    if (this.combo > 1) {
                        const cbEl = document.getElementById('comboText');
                        cbEl.classList.remove('hidden');
                        document.getElementById('comboVal').innerText = this.combo;
                        cbEl.style.animation = 'none';
                        cbEl.offsetHeight; 
                        cbEl.style.animation = 'popInOut 1s ease-in-out forwards';
                    }
                }
            }

            if (enemy.markedForDeletion) this.enemies.splice(i, 1);
        }

        // Items
        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];
            item.update(dt, this.currentSpeed);

            if (this.player.checkCollision(item)) {
                if (item.type === 'coin') {
                    this.score += 100 * this.combo;
                    this.audio.playCoin();
                    if(this.vfxEnabled) this.particles.emit(item.x+20, item.y+20, '#ffaa00', 15, 0.5);
                } else if (item.type === 'fuel') {
                    this.player.fuel += 30;
                    this.audio.playFuel();
                    if(this.vfxEnabled) this.particles.emit(item.x+20, item.y+20, '#00ff00', 15, 0.5);
                }
                item.markedForDeletion = true;
            }

            if (item.markedForDeletion) this.items.splice(i, 1);
        }

        if (this.vfxEnabled) {
            if (this.currentSpeed > 600 && Math.random() < 0.3) {
                this.particles.emit(this.player.x + 10, this.player.y + this.player.h, '#888', 1, 0.3);
                this.particles.emit(this.player.x + this.player.w - 10, this.player.y + this.player.h, '#888', 1, 0.3);
            }
            this.particles.update(dt);
        }

        if (this.screenShake > 0) {
            this.screenShake -= dt * 40;
            if (this.screenShake < 0) this.screenShake = 0;
        }

        // UI Updates
        document.getElementById('scoreVal').innerText = Math.floor(this.score);
        document.getElementById('distVal').innerText = Math.floor(this.distance);
        
        const fuelFill = document.getElementById('fuelFill');
        fuelFill.style.width = this.player.fuel + '%';
        fuelFill.style.background = this.player.fuel < 25 ? '#ff0000' : 'linear-gradient(90deg, #ff0000, #ffaa00, #00ff00)';
    }

    render() {
        this.ctx.fillStyle = '#223816'; // Grass
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        if (this.screenShake > 0) {
            const dx = (Math.random() - 0.5) * this.screenShake;
            const dy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(dx, dy);
        }

        // Road Base
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(this.roadLeft, 0, this.roadWidth, this.canvas.height);
        
        // Road Edges
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.roadLeft - 6, 0, 6, this.canvas.height);
        this.ctx.fillRect(this.roadLeft + this.roadWidth, 0, 6, this.canvas.height);

        // Lane Markings
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 6;
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

        // Scenery Trees
        for(let tree of this.trees) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(tree.x, tree.y + tree.size/2, tree.size/2, tree.size/4, 0, 0, Math.PI*2);
            this.ctx.fill();

            this.ctx.fillStyle = tree.type === 1 ? '#1b4d0e' : '#14380a';
            this.ctx.beginPath();
            this.ctx.arc(tree.x, tree.y, tree.size, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillStyle = '#2d7a18';
            this.ctx.beginPath();
            this.ctx.arc(tree.x - tree.size*0.2, tree.y - tree.size*0.2, tree.size*0.6, 0, Math.PI*2);
            this.ctx.fill();
        }

        const isNight = this.weather.type === 'night';
        
        for (let enemy of this.enemies) enemy.draw(this.ctx, this.assets, isNight);
        for (let item of this.items) item.draw(this.ctx, this.assets);
        if (this.player && this.state !== 'GAMEOVER') this.player.draw(this.ctx, this.assets, isNight);
        
        if (this.vfxEnabled) this.particles.draw(this.ctx);

        // Weather FX
        if (this.weather.type === 'night') {
            this.ctx.fillStyle = 'rgba(5, 5, 15, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.weather.type === 'fog') {
            const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            grad.addColorStop(0, 'rgba(210, 230, 255, 0.95)');
            grad.addColorStop(1, 'rgba(210, 230, 255, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (this.weather.type === 'rain' && this.vfxEnabled) {
            this.ctx.fillStyle = 'rgba(40, 60, 90, 0.4)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for(let i=0; i<150; i++) {
                let rx = Math.random() * this.canvas.width;
                let ry = Math.random() * this.canvas.height;
                this.ctx.moveTo(rx, ry);
                this.ctx.lineTo(rx - 15, ry + 40);
            }
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        if (this.state !== 'LOADING') {
            if (this.state === 'MENU' || this.state === 'COUNTDOWN') {
                this.roadY += 200 * dt;
                if (this.roadY > 100) this.roadY %= 100;
            }
            this.render();
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.onload = () => {
    new Game();
};
