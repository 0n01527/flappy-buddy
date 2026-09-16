const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 90;

const GRAVITY = 1500;      // px/s^2
const FLAP_VELOCITY = -430; // px/s

const buddy = {
  x: WIDTH * 0.32,
  y: HEIGHT * 0.42,
  radius: 22,
  velocityY: 0,
  rotation: 0
};

const PIPE_WIDTH = 64;

const DIFFICULTY_PRESETS = {
  easy:   { gapMin: 190, gapMax: 260, speed: 160, spawnInterval: 1.7 },
  normal: { gapMin: 140, gapMax: 230, speed: 190, spawnInterval: 1.5 },
  hard:   { gapMin: 110, gapMax: 180, speed: 230, spawnInterval: 1.2 }
};

let currentDifficulty = 'normal';
let PIPE_GAP_MIN = DIFFICULTY_PRESETS.normal.gapMin;
let PIPE_GAP_MAX = DIFFICULTY_PRESETS.normal.gapMax;
let PIPE_SPEED = DIFFICULTY_PRESETS.normal.speed;
let PIPE_SPAWN_INTERVAL = DIFFICULTY_PRESETS.normal.spawnInterval;

function applyDifficulty(name){
  const preset = DIFFICULTY_PRESETS[name] || DIFFICULTY_PRESETS.normal;
  currentDifficulty = name;
  PIPE_GAP_MIN = preset.gapMin;
  PIPE_GAP_MAX = preset.gapMax;
  PIPE_SPEED = preset.speed;
  PIPE_SPAWN_INTERVAL = preset.spawnInterval;
}

let pipes = [];
let timeSinceSpawn = 0;

function spawnPipe(){
  const gap = PIPE_GAP_MIN + Math.random() * (PIPE_GAP_MAX - PIPE_GAP_MIN);
  const margin = 80;
  const minTop = margin;
  const maxTop = HEIGHT - GROUND_HEIGHT - gap - margin;
  const topHeight = minTop + Math.random() * (maxTop - minTop);
  pipes.push({
    x: WIDTH + PIPE_WIDTH,
    topHeight,
    bottomY: topHeight + gap,
    passed: false
  });
}

function updatePipes(dt){
  timeSinceSpawn += dt;
  if (timeSinceSpawn >= PIPE_SPAWN_INTERVAL){
    timeSinceSpawn = 0;
    spawnPipe();
  }

  for (const pipe of pipes){
    pipe.x -= PIPE_SPEED * dt;
  }

  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > -10);
}

function drawPipe(x, topHeight, bottomY){
  const capHeight = 18;

  // top pillar
  ctx.fillStyle = '#8b5e34';
  ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x - 4, topHeight - capHeight, PIPE_WIDTH + 8, capHeight);
  ctx.fillStyle = '#5ec8b3';
  ctx.fillRect(x - 4, topHeight - capHeight - 4, PIPE_WIDTH + 8, 4);

  // bottom pillar
  const bottomHeight = HEIGHT - GROUND_HEIGHT - bottomY;
  ctx.fillStyle = '#8b5e34';
  ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomHeight);
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x - 4, bottomY, PIPE_WIDTH + 8, capHeight);
  ctx.fillStyle = '#5ec8b3';
  ctx.fillRect(x - 4, bottomY + capHeight, PIPE_WIDTH + 8, 4);
}

function drawPipes(){
  for (const pipe of pipes){
    drawPipe(pipe.x, pipe.topHeight, pipe.bottomY);
  }
}

function checkCollisions(){
  if (buddy.y + buddy.radius >= HEIGHT - GROUND_HEIGHT){
    return true;
  }

  for (const pipe of pipes){
    const withinX = buddy.x + buddy.radius > pipe.x && buddy.x - buddy.radius < pipe.x + PIPE_WIDTH;
    if (!withinX) continue;

    const hitsTop = buddy.y - buddy.radius < pipe.topHeight;
    const hitsBottom = buddy.y + buddy.radius > pipe.bottomY;
    if (hitsTop || hitsBottom){
      return true;
    }
  }
  return false;
}

function updateScore(){
  for (const pipe of pipes){
    if (!pipe.passed && pipe.x + PIPE_WIDTH < buddy.x - buddy.radius){
      pipe.passed = true;
      score += 1;
    }
  }
}

let score = 0;
let bestScore = Number(localStorage.getItem('flappyBuddyBest') || 0);
let state = 'start'; // 'start' | 'playing' | 'gameover'
let groundOffset = 0;
let elapsedTime = 0;

const LIVES_MAX = 3;
let lives = LIVES_MAX;
let invulnerable = false;
let invulnerableTimer = 0;
const INVULNERABLE_DURATION = 1.2; // seconds

let paused = false;

const COUNTDOWN_START = 3;
let countdownValue = COUNTDOWN_START;
let countdownTimer = 0;

let lastTime = null;

function resetBuddy(){
  buddy.y = HEIGHT * 0.42;
  buddy.velocityY = 0;
  buddy.rotation = 0;
}

function flap(){
  buddy.velocityY = FLAP_VELOCITY;
}

function updateBuddy(dt){
  buddy.velocityY += GRAVITY * dt;
  buddy.y += buddy.velocityY * dt;

  // clamp rotation between looking-up and diving
  const targetRotation = Math.max(-0.5, Math.min(1.1, buddy.velocityY / 600));
  buddy.rotation = targetRotation;

  if (buddy.y - buddy.radius < 0){
    buddy.y = buddy.radius;
    buddy.velocityY = 0;
  }
  if (buddy.y + buddy.radius > HEIGHT - GROUND_HEIGHT){
    buddy.y = HEIGHT - GROUND_HEIGHT - buddy.radius;
    buddy.velocityY = 0;
  }
}

const stars = Array.from({ length: 40 }, () => ({
  x: Math.random() * WIDTH,
  y: Math.random() * (HEIGHT * 0.55),
  r: Math.random() * 1.6 + 0.4,
  twinkle: Math.random() * Math.PI * 2
}));

function drawSky(elapsed){
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(WIDTH - 70, 90, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,179,71,0.25)';
  ctx.beginPath();
  ctx.arc(WIDTH - 70, 90, 46, 0, Math.PI * 2);
  ctx.fill();

  for (const star of stars){
    const alpha = 0.4 + 0.4 * Math.sin(elapsed * 2 + star.twinkle);
    ctx.fillStyle = `rgba(255,243,226,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(){
  ctx.fillStyle = '#2d1b3d';
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = '#3a2450';
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 10);

  ctx.fillStyle = '#5ec8b3';
  for (let x = -groundOffset % 40; x < WIDTH; x += 40){
    ctx.beginPath();
    ctx.moveTo(x, HEIGHT - GROUND_HEIGHT + 10);
    ctx.lineTo(x + 8, HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(x + 16, HEIGHT - GROUND_HEIGHT + 10);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBuddy(){
  ctx.save();
  ctx.translate(buddy.x, buddy.y);
  ctx.rotate(buddy.rotation * 0.6);

  // ears
  ctx.fillStyle = '#e08a2c';
  ctx.beginPath();
  ctx.ellipse(-12, -20, 7, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, -20, 7, 12, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // body
  const grad = ctx.createRadialGradient(-8, -8, 4, 0, 0, buddy.radius);
  grad.addColorStop(0, '#ffe0a3');
  grad.addColorStop(0.6, '#ffb347');
  grad.addColorStop(1, '#e08a2c');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, buddy.radius, 0, Math.PI * 2);
  ctx.fill();

  // eyes
  ctx.fillStyle = '#241a2e';
  ctx.beginPath();
  ctx.arc(6, -3, 3, 0, Math.PI * 2);
  ctx.fill();

  // cheek
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(-7, -7, 6, 0, Math.PI * 2);
  ctx.fill();

  // beak/nose
  ctx.fillStyle = '#c1652e';
  ctx.beginPath();
  ctx.moveTo(buddy.radius - 4, -2);
  ctx.lineTo(buddy.radius + 8, 2);
  ctx.lineTo(buddy.radius - 4, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function render(){
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawSky(elapsedTime);
  drawPipes();
  drawGround();

  const blinkOff = invulnerable && Math.floor(elapsedTime * 10) % 2 === 0;
  if (!blinkOff){
    drawBuddy();
  }

  if (state === 'countdown'){
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.font = "800 64px 'Baloo 2', sans-serif";
    ctx.fillStyle = '#fff3e2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillText(String(countdownValue), WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }
}

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const resumeBtn = document.getElementById('resumeBtn');
const livesDisplay = document.getElementById('livesDisplay');
const heartEls = Array.from(document.querySelectorAll('#livesDisplay .heart'));
const diffButtons = Array.from(document.querySelectorAll('.diff-btn'));

diffButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    diffButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyDifficulty(btn.dataset.diff);
  });
});

function updateHeartsDisplay(){
  heartEls.forEach((heart, index) => {
    heart.classList.toggle('lost', index >= lives);
  });
}

function startGame(){
  pipes = [];
  timeSinceSpawn = 0;
  score = 0;
  groundOffset = 0;
  lives = LIVES_MAX;
  invulnerable = false;
  invulnerableTimer = 0;
  paused = false;
  resetBuddy();

  countdownValue = COUNTDOWN_START;
  countdownTimer = 1;
  state = 'countdown';

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  livesDisplay.classList.remove('hidden');
  scoreDisplay.textContent = '0';
  updateHeartsDisplay();
}

function setPaused(value){
  paused = value;
  pauseScreen.classList.toggle('hidden', !paused);
}

function loseLife(){
  lives -= 1;
  updateHeartsDisplay();

  if (lives <= 0){
    endGame();
    return;
  }

  invulnerable = true;
  invulnerableTimer = INVULNERABLE_DURATION;
  buddy.velocityY = FLAP_VELOCITY * 0.7;
}

function endGame(){
  state = 'gameover';
  if (score > bestScore){
    bestScore = score;
    localStorage.setItem('flappyBuddyBest', String(bestScore));
  }
  finalScoreEl.textContent = String(score);
  bestScoreEl.textContent = String(bestScore);
  hud.classList.add('hidden');
  livesDisplay.classList.add('hidden');
  gameOverScreen.classList.remove('hidden');
}

function loop(timestamp){
  if (lastTime === null) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;

  elapsedTime += dt;

  if (state === 'countdown'){
    countdownTimer -= dt;
    if (countdownTimer <= 0){
      countdownValue -= 1;
      countdownTimer = 1;
      if (countdownValue <= 0){
        state = 'playing';
      }
    }
  }

  if (state === 'playing' && !paused){
    updateBuddy(dt);
    updatePipes(dt);
    updateScore();
    groundOffset += PIPE_SPEED * dt;
    scoreDisplay.textContent = String(score);

    if (score >= 5){
      endGame();
    }

    if (invulnerable){
      invulnerableTimer -= dt;
      if (invulnerableTimer <= 0){
        invulnerable = false;
      }
    } else if (checkCollisions()){
      loseLife();
    }
  }

  render();
  requestAnimationFrame(loop);
}

function handleFlapInput(e){
  if (e.type === 'keydown' && e.code !== 'Space') return;
  if (state !== 'playing' || paused) return;
  e.preventDefault();
  flap();
}

function handlePauseInput(e){
  if (e.code !== 'KeyP') return;
  if (state !== 'playing') return;
  setPaused(!paused);
}

window.addEventListener('keydown', handleFlapInput);
window.addEventListener('keydown', handlePauseInput);
canvas.addEventListener('mousedown', handleFlapInput);
canvas.addEventListener('touchstart', handleFlapInput, { passive:false });

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', () => setPaused(false));

resetBuddy();
requestAnimationFrame(loop);
