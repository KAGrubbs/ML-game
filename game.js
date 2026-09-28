const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const URL = ""; // ADD URL TO TEACHABLE MACHINE MODEL HERE

let model, webcam, maxPredictions;

async function initModel() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  webcam = new tmImage.Webcam(200, 200, true);
  await webcam.setup();
  await webcam.play();
  window.requestAnimationFrame(loopPrediction);

  document.body.appendChild(webcam.canvas);
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

  // Map class names → actions
  if (highest.className === "Up") currentAction = "up";
  else if (highest.className === "Down") currentAction = "down";
  else currentAction = "idle";
}

initModel();

let player = { x: 50, y: 200, size: 30 };
let obstacles = [];

let currentAction = "idle";

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
  // Move player based on AI or keyboard
  if (keys.up) {
    player.y -= 5;
  } else if (keys.down) {
    player.y += 5;
  } else {
    // If no keyboard input, use AI prediction
    if (currentAction === "up") player.y -= 5;
    if (currentAction === "down") player.y += 5;
  }

  // Gravity-ish clamp
  if (player.y < 0) player.y = 0;
  if (player.y > canvas.height - player.size)
    player.y = canvas.height - player.size;

  // Move obstacles
  obstacles.forEach((o) => (o.x -= 3));

  // Add obstacles
  if (Math.random() < 0.02) {
    obstacles.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 30),
      size: 30,
    });
  }

  // Remove offscreen
  obstacles = obstacles.filter((o) => o.x > -30);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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
