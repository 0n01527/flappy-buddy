const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
  canvas.width = 480;
  canvas.height = 720;
}
resizeCanvas();

function drawPlaceholder(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
drawPlaceholder();
