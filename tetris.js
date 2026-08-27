/* Tetris - tetris.js
   Implementación basada en la clásica estructura de "arena" + jugador.
   Comentarios en español para facilitar cambios. */

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');
const linesElem = document.getElementById('lines');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');

// Escala de cada celda en pixeles
const scale = 24;
canvas.width = 10 * scale; // 10 columnas
canvas.height = 20 * scale; // 20 filas
context.scale(scale, scale);
nextCtx.scale(20/20, 20/20); // mantener tamaño sencillo

// Crear la arena (matriz) vacía
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

// Figuras (tetrominós) codificadas como matrices
const tetrominoes = {
  'T': [[0,0,0],[1,1,1],[0,1,0]],
  'O': [[2,2],[2,2]],
  'L': [[0,3,0],[0,3,0],[0,3,3]],
  'J': [[0,4,0],[0,4,0],[4,4,0]],
  'I': [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]],
  'S': [[0,6,6],[6,6,0],[0,0,0]],
  'Z': [[7,7,0],[0,7,7],[0,0,0]]
};

const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

let arena = createMatrix(10, 20);

// Jugador (pieza activa)
const player = {
  pos: {x:0, y:0},
  matrix: null,
  next: null,
  score: 0,
  level: 0,
  lines: 0
};

function createPiece(type) {
  return tetrominoes[type].map(row => row.slice());
}

function drawMatrix(matrix, offset, ctx = context) {
  ctx.save();
  ctx.translate(offset.x, offset.y);
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      const value = matrix[y][x];
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x, y, 1, 1);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.05;
        ctx.strokeRect(x, y, 1, 1);
      }
    }
  }
  ctx.restore();
}

function draw() {
  // Limpiar
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width/scale, canvas.height/scale);

  drawMatrix(arena, {x:0, y:0});
  drawMatrix(player.matrix, player.pos, context);

  // Next piece
  nextCtx.clearRect(0,0,nextCanvas.width, nextCanvas.height);
  const nextMatrix = player.next;
  if (nextMatrix) {
    // centrar el siguiente
    const offsetX = Math.floor((nextCanvas.width/scale - nextMatrix[0].length)/2);
    const offsetY = Math.floor((nextCanvas.height/scale - nextMatrix.length)/2);
    // dibujar en nextCtx con escala en pixeles (cada celda 20px aprox)
    nextCtx.save();
    nextCtx.scale(1,1);
    drawMatrix(nextMatrix, {x: offsetX, y: offsetY}, nextCtx);
    nextCtx.restore();
  }
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    sweepLines();
    playerReset();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function sweepLines() {
  let rowCount = 0;
  outer: for (let y = arena.length -1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;
    rowCount++;
  }
  if (rowCount > 0) {
    const pointsByLines = [0, 40, 100, 300, 1200];
    player.score += pointsByLines[rowCount] * (player.level + 1);
    player.lines += rowCount;
    player.level = Math.floor(player.lines / 10);
    // incrementar velocidad
    dropInterval = 1000 - player.level * 80;
  }
}

function updateScore() {
  scoreElem.textContent = player.score;
  levelElem.textContent = player.level;
  linesElem.textContent = player.lines;
}

function randomPiece() {
  const pieces = 'ILJOTSZ';
  const type = pieces[ Math.floor(Math.random() * pieces.length) ];
  return createPiece(type);
}

function playerReset() {
  if (!player.next) {
    player.matrix = randomPiece();
    player.next = randomPiece();
  } else {
    player.matrix = player.next;
    player.next = randomPiece();
  }
  player.pos.y = 0;
  player.pos.x = Math.floor((arena[0].length / 2) - (player.matrix[0].length / 2));

  if (collide(arena, player)) {
    // Game over -> limpiar arena y resetear puntuación
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.level = 0;
    player.lines = 0;
    updateScore();
    running = false;
    pause();
    // Mostrar mensaje simple
    setTimeout(() => alert('Game Over'), 50);
  }
}

let dropCounter = 0;
let dropInterval = 1000; // ms
let lastTime = 0;
let running = false;
let paused = false;

function update(time = 0) {
  if (!running || paused) {
    lastTime = time;
    requestAnimationFrame(update);
    return;
  }
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

function start() {
  arena = createMatrix(10, 20);
  player.score = 0;
  player.level = 0;
  player.lines = 0;
  player.next = null;
  playerReset();
  updateScore();
  running = true;
  paused = false;
  dropInterval = 1000;
  lastTime = 0;
  requestAnimationFrame(update);
}

function pause() {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Reanudar' : 'Pausa';
}

// Controles
document.addEventListener('keydown', event => {
  if (!running) return;
  if (event.keyCode === 37) { // left
    playerMove(-1);
  } else if (event.keyCode === 39) { // right
    playerMove(1);
  } else if (event.keyCode === 40) { // down
    playerDrop();
  } else if (event.keyCode === 81) { // Q rotate left
    playerRotate(-1);
  } else if (event.keyCode === 38 || event.keyCode === 87) { // up or W rotate
    playerRotate(1);
  } else if (event.keyCode === 32) { // space - hard drop
    while (!collide(arena, player)) {
      player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    sweepLines();
    playerReset();
    updateScore();
    dropCounter = 0;
  }
});

startBtn.addEventListener('click', () => start());
pauseBtn.addEventListener('click', () => pause());

// Iniciar automáticamente al cargar
start();
