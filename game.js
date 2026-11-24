
// =====================================
// STREET RACER - GAME ENGINE
// =====================================

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML elements
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const speedElement = document.getElementById("speed");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayButton = document.getElementById("overlayButton");

// =====================================
// GAME SETTINGS
// =====================================

const roadWidth = 300;
const roadX = (canvas.width - roadWidth) / 2;

let gameRunning = false;
let gameOver = false;
let score = 0;
let roadOffset = 0;
let gameSpeed = 5;
let spawnTimer = 0;
let lastTime = 0;

let animationId = null;

const keys = {
    left: false,
    right: false
};

let highScore = Number(localStorage.getItem("streetRacerBest")) || 0;

highScoreElement.textContent = highScore;

// =====================================
// PLAYER CAR
// =====================================

const player = {
    x: 175,
    y: 475,
    width: 50,
    height: 85,
    speed: 6
};

// =====================================
// ENEMY CARS
// =====================================

let enemies = [];

const enemyColors = [
    "#2585ed",
    "#f0c419",
    "#eeeeee",
    "#9b59b6",
    "#e67e22"
];

// =====================================
// DRAW ROAD
// =====================================

function drawRoad() {

    // Grass
    ctx.fillStyle = "#267326";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road
    ctx.fillStyle = "#383838";
    ctx.fillRect(roadX, 0, roadWidth, canvas.height);

    // Road edges
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(roadX, 0, 5, canvas.height);
    ctx.fillRect(roadX + roadWidth - 5, 0, 5, canvas.height);

    // Moving lane markings
    ctx.fillStyle = "#ffffff";

    for (let y = -60; y < canvas.height; y += 90) {

        ctx.fillRect(
            canvas.width / 2 - 3,
            y + roadOffset,
            6,
            45
        );
    }
}

// =====================================
// DRAW CAR
// =====================================

function drawCar(car, color, isPlayer = false) {

    const x = car.x;
    const y = car.y;
    const w = car.width;
    const h = car.height;

    // Wheels
    ctx.fillStyle = "#111111";

    ctx.fillRect(x - 5, y + 12, 8, 23);
    ctx.fillRect(x + w - 3, y + 12, 8, 23);

    ctx.fillRect(x - 5, y + h - 35, 8, 23);
    ctx.fillRect(x + w - 3, y + h - 35, 8, 23);

    // Car body
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 9);
    ctx.fill();

    // Windows
    ctx.fillStyle = "#91d5ed";

    ctx.fillRect(x + 8, y + 12, w - 16, 20);
    ctx.fillRect(x + 8, y + 54, w - 16, 16);

    // Front headlights
    ctx.fillStyle = "#fff7a1";

    ctx.fillRect(x + 5, y + 3, 10, 5);
    ctx.fillRect(x + w - 15, y + 3, 10, 5);

    // Rear lights
    ctx.fillStyle = "#ff2020";

    ctx.fillRect(x + 5, y + h - 6, 10, 5);
    ctx.fillRect(x + w - 15, y + h - 6, 10, 5);

    // Player stripe
    if (isPlayer) {

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            x + w / 2 - 2,
            y + 35,
            4,
            13
        );
    }
}

// =====================================
// DRAW EVERYTHING
// =====================================

function drawGame() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRoad();

    // Enemy cars
    enemies.forEach(enemy => {
        drawCar(enemy, enemy.color);
    });

    // Player car
    drawCar(player, "#e60000", true);
}

// =====================================
// PLAYER MOVEMENT
// =====================================

function movePlayer(delta) {

    const movement = player.speed * delta / 16.67;

    if (keys.left) {
        player.x -= movement;
    }

    if (keys.right) {
        player.x += movement;
    }

    // Keep player on the road
    const minX = roadX + 15;
    const maxX = roadX + roadWidth - player.width - 15;

    player.x = Math.max(minX, Math.min(maxX, player.x));
}

// =====================================
// CREATE ENEMY CARS
// =====================================

function createEnemy() {

    const lanes = [
        roadX + 35,
        roadX + 125,
        roadX + 215
    ];

    const lane = lanes[Math.floor(Math.random() * lanes.length)];

    const enemy = {
        x: lane,
        y: -100,
        width: 50,
        height: 85,
        speed: gameSpeed + Math.random() * 2,
        color: enemyColors[
            Math.floor(Math.random() * enemyColors.length)
        ]
    };

    enemies.push(enemy);
}

// =====================================
// MOVE ENEMY CARS
// =====================================

function moveEnemies(delta) {

    enemies.forEach(enemy => {

        enemy.y += enemy.speed * delta / 16.67;

    });

    // Remove cars that leave the screen
    enemies = enemies.filter(enemy => {
        return enemy.y < canvas.height + 100;
    });
}

// =====================================
// COLLISION DETECTION
// =====================================

function checkCollision(a, b) {

    const margin = 8;

    return (
        a.x + margin < b.x + b.width - margin &&
        a.x + a.width - margin > b.x + margin &&
        a.y + margin < b.y + b.height - margin &&
        a.y + a.height - margin > b.y + margin
    );
}

function detectCollisions() {

    for (const enemy of enemies) {

        if (checkCollision(player, enemy)) {

            endGame();
            return;
        }
    }
}

// =====================================
// SCORE SYSTEM
// =====================================

function updateScore(delta) {

    score += delta / 100;

    scoreElement.textContent = Math.floor(score);

    // Increase difficulty gradually
    gameSpeed = Math.min(12, 5 + score / 150);

    speedElement.textContent = Math.floor(gameSpeed * 20);
}

// =====================================
// UPDATE GAME
// =====================================

function updateGame(delta) {

    movePlayer(delta);

    // Animate the road
    roadOffset += gameSpeed * delta / 16.67;

    if (roadOffset >= 90) {
        roadOffset %= 90;
    }

    // Spawn enemy cars
    spawnTimer += delta;

    const spawnInterval = Math.max(650, 1500 - score * 2);

    if (spawnTimer >= spawnInterval) {

        createEnemy();
        spawnTimer = 0;
    }

    moveEnemies(delta);

    updateScore(delta);

    detectCollisions();
}

// =====================================
// GAME LOOP
// =====================================

function gameLoop(timestamp) {

    if (!gameRunning) return;

    let delta = timestamp - lastTime;

    if (!lastTime || delta > 100) {
        delta = 16.67;
    }

    lastTime = timestamp;

    updateGame(delta);

    drawGame();

    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// =====================================
// START GAME
// =====================================

function startGame() {

    if (gameRunning) return;

    if (gameOver) {
        resetGame();
    }

    gameRunning = true;

    overlay.classList.add("hidden");

    startBtn.textContent = "RUNNING";
    pauseBtn.textContent = "PAUSE";

    lastTime = 0;

    animationId = requestAnimationFrame(gameLoop);
}

// =====================================
// PAUSE GAME
// =====================================

function pauseGame() {

    if (!gameRunning) return;

    gameRunning = false;

    cancelAnimationFrame(animationId);

    overlayTitle.textContent = "GAME PAUSED";
    overlayMessage.textContent = "Take a break, driver.";
    overlayButton.textContent = "RESUME";

    overlay.classList.remove("hidden");

    startBtn.textContent = "START";
    pauseBtn.textContent = "RESUME";
}

// =====================================
// END GAME
// =====================================

function endGame() {

    gameRunning = false;
    gameOver = true;

    cancelAnimationFrame(animationId);

    const finalScore = Math.floor(score);

    if (finalScore > highScore) {

        highScore = finalScore;

        localStorage.setItem("streetRacerBest", highScore);

        highScoreElement.textContent = highScore;
    }

    overlayTitle.textContent = "GAME OVER";
    overlayMessage.textContent = "Your score: " + finalScore;
    overlayButton.textContent = "PLAY AGAIN";

    overlay.classList.remove("hidden");

    startBtn.textContent = "START";
    pauseBtn.textContent = "PAUSE";
}

// =====================================
// RESET GAME
// =====================================

function resetGame() {

    gameRunning = false;
    gameOver = false;

    cancelAnimationFrame(animationId);

    score = 0;
    gameSpeed = 5;
    roadOffset = 0;
    spawnTimer = 0;
    lastTime = 0;

    enemies = [];

    player.x = 175;

    keys.left = false;
    keys.right = false;

    scoreElement.textContent = "0";
    speedElement.textContent = "100";

    overlayTitle.textContent = "STREET RACER";
    overlayMessage.textContent = "Ready to race?";
    overlayButton.textContent = "START RACE";

    overlay.classList.remove("hidden");

    startBtn.textContent = "START";
    pauseBtn.textContent = "PAUSE";

    drawGame();
}

// =====================================
// KEYBOARD CONTROLS
// =====================================

document.addEventListener("keydown", function(event) {

    if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = true;
    }

    if (event.key === " " && !gameRunning) {
        event.preventDefault();
        startGame();
    }

    if (event.key.toLowerCase() === "p") {
        if (gameRunning) {
            pauseGame();
        } else if (!gameOver) {
            startGame();
        }
    }
});

document.addEventListener("keyup", function(event) {

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = false;
    }
});

// Stop movement when browser loses focus
window.addEventListener("blur", function() {

    keys.left = false;
    keys.right = false;
});

// =====================================
// BUTTON EVENTS
// =====================================

startBtn.addEventListener("click", startGame);

overlayButton.addEventListener("click", function() {

    if (gameOver) {
        resetGame();
    }

    startGame();
});

pauseBtn.addEventListener("click", function() {

    if (gameRunning) {
        pauseGame();
    } else if (!gameOver) {
        startGame();
    }
});

restartBtn.addEventListener("click", function() {

    resetGame();
});

// =====================================
// INITIALIZE GAME
// =====================================

resetGame();

console.log("Street Racer loaded successfully!");
