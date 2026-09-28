const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let player = { x: 50, y: 200, size: 30 };
let obstacles = [];

let currentAction = "idle";

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Move player based on AI
    if (currentAction === "up") player.y -= 5;
    if (currentAction === "down") player.y += 5;

    // Gravity-ish clamp
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.size)
        player.y = canvas.height - player.size;

    // Move obstacles
    obstacles.forEach(o => o.x -= 3);

    // Add obstacles
    if (Math.random() < 0.02) {
        obstacles.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 30),
            size: 30
        });
    }

    // Remove offscreen
    obstacles = obstacles.filter(o => o.x > -30);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Obstacles
    ctx.fillStyle = "red";
    obstacles.forEach(o => {
        ctx.fillRect(o.x, o.y, o.size, o.size);
    });
}

gameLoop();