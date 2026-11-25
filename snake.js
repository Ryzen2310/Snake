
var blockSize = 25;
var rows = 20;
var cols = 20;
var board;
var context;


var snakeX = blockSize * 5;
var snakeY = blockSize * 5;
var prevSnakeX = snakeX; 
var prevSnakeY = snakeY;

var velocityX = 0;
var velocityY = 0;

var snakeBody = [];       
var prevSnakeBody = [];   

//food
var foodX;
var foodY;
var foodType = "normal";  
var shrinkFoodChance = 0.2;

var gameOver = false;

//score
var score = 0;
var highScore = 0;

var baseInterval = 100;   
var minInterval = 45;     
var speedStep = 2;        
var tickInterval = baseInterval;
var lastTickTime = 0;
var animationFrameId;


var scoreEl, highScoreEl, overlayEl, retryButton;

window.onload = function() {
    board = document.getElementById("board");
    board.height = rows * blockSize;
    board.width = cols * blockSize;
    context = board.getContext("2d"); //used for drawing on the board

    scoreEl = document.getElementById("score");
    highScoreEl = document.getElementById("highScore");
    overlayEl = document.getElementById("gameOverOverlay");
    retryButton = document.getElementById("retryButton");

    highScore = Number(localStorage.getItem("snakeHighScore")) || 0;
    highScoreEl.textContent = highScore;

    document.addEventListener("keyup", changeDirection);
    retryButton.addEventListener("click", resetGame);

    placeFood();
    lastTickTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}


function gameLoop(timestamp) {
    if (gameOver) {
        return; 
    }

    var elapsed = timestamp - lastTickTime;

    if (elapsed >= tickInterval) {
        logicUpdate();
        lastTickTime = timestamp;
        elapsed = 0;
    }

    var t = Math.min(elapsed / tickInterval, 1); // 0 = just ticked, 1 = about to tick
    draw(t);

    animationFrameId = requestAnimationFrame(gameLoop);
}

function logicUpdate() 
{
    tickInterval = Math.max(minInterval, baseInterval - score * speedStep);

    prevSnakeX = snakeX;
    prevSnakeY = snakeY;
    prevSnakeBody = snakeBody.map(function(seg) { return [seg[0], seg[1]]; });

    if (snakeX == foodX && snakeY == foodY) {
        if (foodType == "shrink") {
            if (snakeBody.length > 0) {
                snakeBody.pop(); // remove tail segment, snake gets one shorter
            }
        } else {
            snakeBody.push([foodX, foodY]);
            score++;
            scoreEl.textContent = score;
        }
        placeFood();
    }

    for (let i = snakeBody.length-1; i > 0; i--) {
        snakeBody[i] = snakeBody[i-1];
    }
    if (snakeBody.length) {
        snakeBody[0] = [snakeX, snakeY];
    }

    snakeX += velocityX * blockSize;
    snakeY += velocityY * blockSize;

    if (snakeX < 0 || snakeX > cols*blockSize || snakeY < 0 || snakeY > rows*blockSize) {
        triggerGameOver();
        return;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
            triggerGameOver();
            return;
        }
    }
}

function draw(t) {
    context.fillStyle = "#2e7d32";
    context.fillRect(0, 0, board.width, board.height);

    drawGrid();

    //food
    context.fillStyle = (foodType == "shrink") ? "#4a0072" : "red";
    context.fillRect(foodX, foodY, blockSize, blockSize);

    context.fillStyle = "#1b5e20";
    for (let i = 0; i < snakeBody.length; i++) {
        var curr = snakeBody[i];
        var prev = prevSnakeBody[i];
        var x = prev ? lerp(prev[0], curr[0], t) : curr[0];
        var y = prev ? lerp(prev[1], curr[1], t) : curr[1];
        context.fillRect(x, y, blockSize, blockSize);
    }

    var headX = lerp(prevSnakeX, snakeX, t);
    var headY = lerp(prevSnakeY, snakeY, t);

    context.fillStyle = "lime";
    context.fillRect(headX, headY, blockSize, blockSize);

    drawEyes(headX, headY);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function drawGrid() {
    context.strokeStyle = "rgba(255, 255, 255, 0.12)";
    context.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
        context.beginPath();
        context.moveTo(c * blockSize, 0);
        context.lineTo(c * blockSize, board.height);
        context.stroke();
    }
    for (let r = 0; r <= rows; r++) {
        context.beginPath();
        context.moveTo(0, r * blockSize);
        context.lineTo(board.width, r * blockSize);
        context.stroke();
    }
}

function drawEyes(x, y) {
    context.fillStyle = "#1b1b1b";
    var eyeSize = blockSize * 0.15;
    var offset = blockSize * 0.25;
    var ex1, ey1, ex2, ey2;

    if (velocityX == 1) {        // moving right
        ex1 = x + blockSize - offset; ey1 = y + offset;
        ex2 = x + blockSize - offset; ey2 = y + blockSize - offset;
    } else if (velocityX == -1) { // moving left
        ex1 = x + offset; ey1 = y + offset;
        ex2 = x + offset; ey2 = y + blockSize - offset;
    } else if (velocityY == -1) { // moving up
        ex1 = x + offset; ey1 = y + offset;
        ex2 = x + blockSize - offset; ey2 = y + offset;
    } else if (velocityY == 1) {  // moving down
        ex1 = x + offset; ey1 = y + blockSize - offset;
        ex2 = x + blockSize - offset; ey2 = y + blockSize - offset;
    } else {                      // not moving yet, default facing right
        ex1 = x + blockSize - offset; ey1 = y + offset;
        ex2 = x + blockSize - offset; ey2 = y + blockSize - offset;
    }

    context.beginPath();
    context.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
    context.fill();
}

function triggerGameOver() {
    gameOver = true;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
        highScoreEl.textContent = highScore;
    }

    overlayEl.classList.remove("hidden");
}

function resetGame() {
    snakeX = blockSize * 5;
    snakeY = blockSize * 5;
    prevSnakeX = snakeX;
    prevSnakeY = snakeY;
    velocityX = 0;
    velocityY = 0;
    snakeBody = [];
    prevSnakeBody = [];
    score = 0;
    scoreEl.textContent = score;
    tickInterval = baseInterval;
    gameOver = false;

    overlayEl.classList.add("hidden");

    placeFood();
    lastTickTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function changeDirection(e) {
    if (e.code == "ArrowUp" && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
    }
    else if (e.code == "ArrowDown" && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
    }
    else if (e.code == "ArrowLeft" && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
    }
    else if (e.code == "ArrowRight" && velocityX != -1) {
        velocityX = 1;
        velocityY = 0;
    }
}


function placeFood() {
    foodX = Math.floor(Math.random() * cols) * blockSize;
    foodY = Math.floor(Math.random() * rows) * blockSize;
    foodType = (Math.random() < shrinkFoodChance) ? "shrink" : "normal";
}
