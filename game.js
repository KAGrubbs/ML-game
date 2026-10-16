const gameContainer = document.getElementById("game-container");
const canvasWrapper = document.getElementById("canvas-wrapper");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");
const actionDisplay = document.getElementById("action");
const modelInput = document.getElementById("model-input");
const inputDiv = document.getElementById("input-div");
const loadModelButton = document.getElementById("load-model");
let URL = "";
let gameStarted = false;

loadModelButton.addEventListener("click", () => {
  URL = modelInput.value.trim();
  initModel();
});

let model, webcam, maxPredictions;

async function initModel() {
  let startupStep = "loading model";

  try {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    statusText.textContent = "Loading model...";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    statusText.textContent = "Model loaded. Requesting camera permission...";
    startupStep = "requesting camera permission";
    webcam = new tmImage.Webcam(200, 200, true);
    await webcam.setup();
    statusText.textContent = "Starting camera video...";
    startupStep = "starting camera video";
    await webcam.play();
    webcam.canvas.id = "webcam";
    canvasWrapper.appendChild(webcam.canvas);
    gameStarted = true;
    statusText.textContent = "";
    inputDiv.style.display = "none";
    window.requestAnimationFrame(loopPrediction);
  } catch (error) {
    gameStarted = false;
    console.error("Unable to start the model or camera:", error);
    const detail = error instanceof Error ? error.message : String(error);
    statusText.textContent = `Startup failed while ${startupStep}: ${detail}`;
  }
}

async function loopPrediction() {
  webcam.update();
  await predict();
  window.requestAnimationFrame(loopPrediction);
}

async function predict() {
  const prediction = await model.predict(webcam.canvas);

  let highest = prediction.reduce((a, b) =>
    a.probability > b.probability ? a : b,
  );

  // The model is expected to provide "up" and "idle" classes.
  const className = highest.className.trim().toLowerCase();
  currentAction = className === "up" ? "up" : "idle";
  actionDisplay.textContent = `${currentAction} (${Math.round(highest.probability * 100)}%)`;
}

let player = { x: 50, y: 200, size: 30, velocityY: 0 };
let obstacles = [];

let currentAction = "idle";
const ENTITY_HEIGHT_RATIO = 1 / 6;
const UP_SPEED = 5;
const GRAVITY = 0.5;

// Dynamically change canvas size on window resize
function resizeCanvas() {
  const width = canvasWrapper.clientWidth;
  const height = canvasWrapper.clientHeight;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const entitySize = canvas.height * ENTITY_HEIGHT_RATIO;
  player.size = entitySize;
  obstacles.forEach((obstacle) => (obstacle.size = entitySize));
  player.y = Math.min(player.y, canvas.height - player.size);
  obstacles = obstacles.filter((obstacle) => obstacle.x < canvas.width);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let keys = {
  up: false,
  down: false,
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") keys.up = true;
  if (e.key === "ArrowDown") keys.down = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") keys.up = false;
  if (e.key === "ArrowDown") keys.down = false;
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  if (!gameStarted) return;

  // Move player based on keyboard or AI prediction.
  if (keys.up) {
    player.velocityY = 0;
    player.y -= UP_SPEED;
  } else if (keys.down) {
    player.velocityY = 0;
    player.y += UP_SPEED;
  } else {
    if (currentAction === "up") {
      player.velocityY = 0;
      player.y -= UP_SPEED;
    } else {
      player.velocityY += GRAVITY;
      player.y += player.velocityY;
    }
  }

  if (player.y < 0) player.y = 0;
  if (player.y > canvas.height - player.size) {
    player.y = canvas.height - player.size;
    player.velocityY = 0;
  }

  // Move obstacles
  obstacles.forEach((o) => (o.x -= 3));

  // Add obstacles
  if (Math.random() < 0.02) {
    const obstacleSize = canvas.height * ENTITY_HEIGHT_RATIO;
    obstacles.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - obstacleSize),
      size: obstacleSize,
    });
  }

  // Check for collisions and end game if detected
  obstacles.forEach((o) => {
    if (checkCollision(player, o)) {
      alert("Game Over!");
      obstacles = [];
      player.y = 200;
      player.velocityY = 0;
    }
  });

  // Remove offscreen
  obstacles = obstacles.filter((o) => o.x > -o.size);
}

function checkCollision(a, b) {
  return false; // Turn collisions off for testing
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameStarted) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  // Player
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Obstacles
  ctx.fillStyle = "red";
  obstacles.forEach((o) => {
    ctx.fillRect(o.x, o.y, o.size, o.size);
  });
}

gameLoop();
