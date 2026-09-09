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
const PIPE_GAP = 190;
const PIPE_SPEED = 190; // px/s
const PIPE_SPAWN_INTERVAL = 1.5; // seconds

let pipes = [];
let timeSinceSpawn = 0;

function spawnPipe(){
  const margin = 80;
  const minTop = margin;
  const maxTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin;
  const topHeight = minTop + Math.random() * (maxTop - minTop);
  pipes.push({
    x: WIDTH + PIPE_WIDTH,
    topHeight,
    bottomY: topHeight + PIPE_GAP,
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

function drawGround(){
  ctx.fillStyle = '#2d1b3d';
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = '#3a2450';
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 10);
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
  drawPipes();
  drawGround();
  drawBuddy();
}

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');

function startGame(){
  pipes = [];
  timeSinceSpawn = 0;
  score = 0;
  resetBuddy();
  state = 'playing';

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  scoreDisplay.textContent = '0';
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
  gameOverScreen.classList.remove('hidden');
}

function loop(timestamp){
  if (lastTime === null) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;

  if (state === 'playing'){
    updateBuddy(dt);
    updatePipes(dt);
    updateScore();
    scoreDisplay.textContent = String(score);

    if (checkCollisions()){
      endGame();
    }
  }

  render();
  requestAnimationFrame(loop);
}

function handleFlapInput(e){
  if (e.type === 'keydown' && e.code !== 'Space') return;
  if (state !== 'playing') return;
  e.preventDefault();
  flap();
}

window.addEventListener('keydown', handleFlapInput);
canvas.addEventListener('mousedown', handleFlapInput);
canvas.addEventListener('touchstart', handleFlapInput, { passive:false });

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

resetBuddy();
requestAnimationFrame(loop);
