'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle, color = '#fff') {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
    this.color = color;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Power-up Velocidad ─────────────────────────────────────────────────────────
const POWERUP_DROP_CHANCE = 0.12;
const POWERUP_LIFETIME     = 10;
const SPEED_DURATION       = 5;
const SPEED_MULT           = 2;
const TRIPLE_DURATION      = 5;
const TRIPLE_SPREAD        = 0.17;  // ~10° a cada lado del ángulo de la nave
const POWERUP_TYPES        = ['speed', 'triple'];

// ── Estrella fugaz (asteroide especial) ────────────────────────────────────────
const SHOOTING_STAR_LIFETIME       = 6;      // segundos antes de desaparecer
const SHOOTING_STAR_SPEED_MULT     = 2.5;    // sobre la velocidad base
const SHOOTING_STAR_POINTS         = 200;
const SHOOTING_STAR_POWERUP_CHANCE = 0.5;    // alta probabilidad de soltar power-up
const SHOOTING_STAR_INTERVAL       = [12, 18]; // rango del temporizador (s)

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz (asteroide especial rápido y temporal) ──────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y, angle) {
    super(x, y, 2);
    this.isShootingStar = true;
    const speed = SPEEDS[2] * SHOOTING_STAR_SPEED_MULT + rand(-20, 20);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-3, 3);
    this.ttl  = SHOOTING_STAR_LIFETIME;
    this.life = SHOOTING_STAR_LIFETIME;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() { return []; }

  draw() {
    // Parpadeo al final de su vida
    if (this.ttl < 1.5 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Estela corta en sentido opuesto al movimiento
    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 0) {
      const ux = -this.vx / spd;
      const uy = -this.vy / spd;
      const tx = ux * this.radius * 2.2;
      const ty = uy * this.radius * 2.2;
      const grad = ctx.createLinearGradient(0, 0, tx, ty);
      grad.addColorStop(0, 'rgba(255, 221, 0, 0.55)');
      grad.addColorStop(1, 'rgba(255, 221, 0, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.lineCap   = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    ctx.rotate(this.rot);

    // Halo brillante pulsante
    const pulse = 1 + Math.sin((this.life - this.ttl) * 6) * 0.1;
    ctx.fillStyle = 'rgba(255, 221, 0, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Estrella de 5 puntas
    ctx.strokeStyle = '#fd0';
    ctx.fillStyle   = 'rgba(255, 221, 0, 0.3)';
    ctx.lineWidth   = 1.8;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    const spikes = 5;
    const outer  = this.radius;
    const inner  = this.radius * 0.45;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
    this.speedTimer    = 0;
    this.tripleTimer   = 0;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const mult  = this.speedTimer > 0 ? SPEED_MULT : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * mult * dt;
      this.vy += Math.sin(this.angle) * THRUST * mult * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      const c = '#f3f';
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD, c),
        new Bullet(ox, oy, this.angle,               c),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD, c),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const boosting = this.speedTimer > 0;
    const tripling = this.tripleTimer > 0;
    const bodyColor = tripling ? '#f3f' : (boosting ? '#0ff' : '#fff');
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14) * (boosting ? 1.6 : 1), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = tripling ? 'rgba(255, 51, 255, 0.9)'
                        : (boosting ? 'rgba(0, 255, 255, 0.9)' : 'rgba(255, 130, 0, 0.85)');
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up (ítem flotante: velocidad o triple shot) ──────────────────────────
const POWERUP_STYLE = {
  speed:  { stroke: '#0ff', halo: 'rgba(0, 255, 255, 0.18)',  fill: 'rgba(0, 255, 255, 0.35)',  sym: '#bff' },
  triple: { stroke: '#f3f', halo: 'rgba(255, 51, 255, 0.18)', fill: 'rgba(255, 51, 255, 0.35)', sym: '#fbf' },
};

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.type   = POWERUP_TYPES.includes(type) ? type : 'speed';
    this.radius = 12;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(15, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ttl  = POWERUP_LIFETIME;
    this.life = POWERUP_LIFETIME;
    this.dead = false;
    this.pulse = 0;
  }

  update(dt) {
    this.x     = wrap(this.x + this.vx * dt, W);
    this.y     = wrap(this.y + this.vy * dt, H);
    this.pulse += dt;
    this.ttl  -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadea en el último tramo de vida
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const s = POWERUP_STYLE[this.type];
    const p = 1 + Math.sin(this.pulse * 6) * 0.12;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Halo brillante
    ctx.fillStyle   = s.halo;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.6 * p, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo
    ctx.strokeStyle = s.stroke;
    ctx.fillStyle   = s.fill;
    ctx.lineWidth   = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * p, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Símbolo: "V" (velocidad) o "T" (triple shot)
    ctx.strokeStyle = s.sym;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    if (this.type === 'triple') {
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo( 5, -4);
      ctx.moveTo( 0, -4);
      ctx.lineTo( 0,  5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo( 0,  5);
      ctx.lineTo( 5, -4);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const border = randInt(0, 3);
  let x, y, angle;
  switch (border) {
    case 0: // arriba -> hacia abajo
      x = rand(0, W); y = 0;
      angle = rand(Math.PI * 0.25, Math.PI * 0.75);
      break;
    case 1: // abajo -> hacia arriba
      x = rand(0, W); y = H;
      angle = rand(-Math.PI * 0.75, -Math.PI * 0.25);
      break;
    case 2: // izquierda -> hacia derecha
      x = 0; y = rand(0, H);
      angle = rand(-Math.PI * 0.25, Math.PI * 0.25);
      break;
    default: // derecha -> hacia izquierda
      x = W; y = rand(0, H);
      angle = rand(Math.PI * 0.75, Math.PI * 1.25);
  }
  asteroids.push(new ShootingStar(x, y, angle));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  shootingStarTimer = rand(SHOOTING_STAR_INTERVAL[0], SHOOTING_STAR_INTERVAL[1]);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Temporizador de estrella fugaz
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    if (!asteroids.some(a => a.isShootingStar)) spawnShootingStar();
    shootingStarTimer = rand(SHOOTING_STAR_INTERVAL[0], SHOOTING_STAR_INTERVAL[1]);
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  // Explosión suave al expirar la estrella fugaz por tiempo
  for (const a of asteroids) {
    if (a.isShootingStar && a.dead && a.ttl <= 0) explode(a.x, a.y, 6);
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        const isStar = !!a.isShootingStar;
        score += isStar ? SHOOTING_STAR_POINTS : POINTS[a.size];
        explode(a.x, a.y, isStar ? 16 : a.size * 5);
        newAsteroids.push(...a.split());
        const dropChance = isStar ? SHOOTING_STAR_POWERUP_CHANCE : POWERUP_DROP_CHANCE;
        if (Math.random() < dropChance) {
          const type = Math.random() < 0.5 ? 'speed' : 'triple';
          powerups.push(new PowerUp(a.x, a.y, type));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerups) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if (p.type === 'triple') ship.tripleTimer = TRIPLE_DURATION;
        else                     ship.speedTimer  = SPEED_DURATION;
        explode(p.x, p.y, 6);
      }
    }
    powerups = powerups.filter(p => !p.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  if (ship.speedTimer > 0) {
    ctx.fillStyle = '#0ff';
    ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, 14, 46);
    ctx.fillStyle = '#fff';
  }

  if (ship.tripleTimer > 0) {
    ctx.fillStyle = '#f3f';
    ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}s`, 14, 66);
    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
