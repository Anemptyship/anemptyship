/**
 * Antigravity Maps - Particle Network System
 * 
 * Interactivity:
 * - Mouse proximity exerts a repulsion force ("Antigravity").
 * - Particles connect when close ("Connectivity").
 */

const canvas = document.getElementById('dots-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouse = { x: null, y: null, radius: 150 };

// Configuration
const PARTICLE_COUNT = 100; // Adjusted for performance
const CONNECT_DISTANCE = 120;
const PARTICLE_SIZE = 3;
const MOUSE_REPULSION_FORCE = 5;

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5; // Velocity X
        this.vy = (Math.random() - 0.5) * 1.5; // Velocity Y
        this.size = Math.random() * 2 + 1;
        this.color = '#ffffff'; // White dots
    }

    update() {
        // Basic movement
        this.x += this.vx;
        this.y += this.vy;

        // Boundary check (Bounce)
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse Interaction (Antigravity / Repulsion)
        if (mouse.x != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                const directionX = forceDirectionX * force * MOUSE_REPULSION_FORCE;
                const directionY = forceDirectionY * force * MOUSE_REPULSION_FORCE;

                this.x -= directionX;
                this.y -= directionY;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function init() {
    particles = [];
    resize();
    for (let i = 0; i < (width * height) / 9000; i++) { // Responsive count
        particles.push(new Particle());
    }
}

function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Draw connections
        for (let j = i; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < CONNECT_DISTANCE) {
                ctx.beginPath();
                let opacityValue = 1 - (distance / CONNECT_DISTANCE);
                ctx.strokeStyle = 'rgba(255, 255, 255,' + opacityValue * 0.5 + ')'; // Faint white lines
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Event Listeners
window.addEventListener('resize', () => {
    resize();
    init();
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// Start
init();
animate();
