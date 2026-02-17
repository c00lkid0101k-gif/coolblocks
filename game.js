// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const crosshair = document.getElementById('crosshair');
const scoreDisplay = document.getElementById('score');

let score = 0;
let blocks = [];
let mouseX = 0;
let mouseY = 0;

// Block class
class Block {
    constructor() {
        this.size = 40;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = 1 + Math.random() * 2;
        this.color = this.getRandomColor();
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        
        // Add border to block
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.size, this.size);
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.size &&
               y >= this.y && y <= this.y + this.size;
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// Crosshair positioning
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Position crosshair at mouse location
    crosshair.style.left = e.clientX - 15 + 'px';
    crosshair.style.top = e.clientY - 15 + 'px';
    crosshair.style.display = 'block';
});

canvas.addEventListener('mouseleave', () => {
    crosshair.style.display = 'none';
});

canvas.addEventListener('mouseenter', () => {
    crosshair.style.display = 'block';
});

// Click to shoot blocks
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if any block was hit
    for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].isClicked(x, y)) {
            blocks.splice(i, 1);
            score += 10;
            scoreDisplay.textContent = 'Score: ' + score;
            
            // Visual feedback
            createExplosion(x, y);
            break;
        }
    }
});

// Create visual explosion effect
function createExplosion(x, y) {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Spawn new blocks periodically
function spawnBlock() {
    blocks.push(new Block());
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
        blocks[i].update();
        blocks[i].draw();
        
        // Remove blocks that went off screen
        if (blocks[i].isOffScreen()) {
            blocks.splice(i, 1);
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Start game
setInterval(spawnBlock, 1000);
gameLoop();
