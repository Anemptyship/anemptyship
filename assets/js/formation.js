/**
 * Particle Shape Formation - Homepage Concept
 * Particles spawn at edges and steer towards target points to form text "AN EMPTYSHIP".
 * Features: Large dots, Separation behavior (floating), No mouse interaction, Fluid wander.
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let targets = []; // Array of {x, y} coordinates for the text

const SETTINGS = {
    TEXT: "AN EMPTYSHIP", // Updated for Homepage
    FONT_SIZE: 150,
    SAMPLE_STEP: 18,   // Very large spacing for "few dots" look
    PARTICLE_SIZE: 10, // Large dots
    SPAWN_RATE: 0.5,   // Spawn every other frame (very slow)
    MAX_SPEED: 2.2,
    MAX_FORCE: 0.08,
    SEPARATION_DIST: 24, // Radius to push neighbors away
    SEPARATION_FORCE: 1.5 // Strong separation to make them "move aside"
};

class Particle {
    constructor(target) {
        // Start at random edge
        if (Math.random() < 0.5) {
            this.pos = {
                x: Math.random() < 0.5 ? -20 : width + 20,
                y: Math.random() * height
            };
        } else {
            this.pos = {
                x: Math.random() * width,
                y: Math.random() < 0.5 ? -20 : height + 20
            };
        }

        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        this.target = target;
        // More subtle, premium palette: White/Blue-Grey
        this.hue = Math.random() * 20 + 200; // 200-220 (Slate Blue)
        this.sat = Math.random() * 30 + 50;  // Lower saturation
        this.light = Math.random() * 30 + 50; // Varying lightness

        this.maxSpeed = SETTINGS.MAX_SPEED + (Math.random() - 0.5) * 1;
    }

    applyForce(force) {
        this.acc.x += force.x;
        this.acc.y += force.y;
    }

    behaviors(particles) {
        const arrive = this.arrive(this.target);
        const separate = this.separate(particles);

        // Fluid Wander (to look like floating on water)
        const time = Date.now() * 0.001;
        const wander = {
            x: Math.cos(time + this.pos.y * 0.01) * 0.03, // Wave-like motion
            y: Math.sin(time + this.pos.x * 0.01) * 0.03
        };

        // Weighting
        separate.x *= SETTINGS.SEPARATION_FORCE;
        separate.y *= SETTINGS.SEPARATION_FORCE;

        this.applyForce(arrive);
        this.applyForce(separate);
        this.applyForce(wander);
    }

    arrive(target) {
        const desired = { x: target.x - this.pos.x, y: target.y - this.pos.y };
        const d = Math.hypot(desired.x, desired.y);

        let speed = this.maxSpeed;
        if (d < 200) {
            speed = (d / 200) * this.maxSpeed; // Smooth arrival from far away
        }

        if (d > 0) {
            desired.x = (desired.x / d) * speed;
            desired.y = (desired.y / d) * speed;
        }

        const steer = { x: desired.x - this.vel.x, y: desired.y - this.vel.y };

        const steerLen = Math.hypot(steer.x, steer.y);
        if (steerLen > SETTINGS.MAX_FORCE) {
            steer.x = (steer.x / steerLen) * SETTINGS.MAX_FORCE;
            steer.y = (steer.y / steerLen) * SETTINGS.MAX_FORCE;
        }
        return steer;
    }

    separate(particles) {
        let steer = { x: 0, y: 0 };
        let count = 0;

        for (let other of particles) {
            if (other === this) continue;

            const d = Math.hypot(this.pos.x - other.pos.x, this.pos.y - other.pos.y);

            if (d > 0 && d < SETTINGS.SEPARATION_DIST) {
                let diff = { x: this.pos.x - other.pos.x, y: this.pos.y - other.pos.y };
                diff.x /= d;
                diff.y /= d;
                steer.x += diff.x;
                steer.y += diff.y;
                count++;
            }
        }

        if (count > 0) {
            steer.x /= count;
            steer.y /= count;

            const mag = Math.hypot(steer.x, steer.y);
            if (mag > 0) {
                steer.x = (steer.x / mag) * this.maxSpeed;
                steer.y = (steer.y / mag) * this.maxSpeed;
                steer.x -= this.vel.x;
                steer.y -= this.vel.y;

                const steerLen = Math.hypot(steer.x, steer.y);
                if (steerLen > SETTINGS.MAX_FORCE) {
                    steer.x = (steer.x / steerLen) * SETTINGS.MAX_FORCE;
                    steer.y = (steer.y / steerLen) * SETTINGS.MAX_FORCE;
                }
            }
        }
        return steer;
    }

    update() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        this.acc.x = 0;
        this.acc.y = 0;
    }

    draw() {
        ctx.fillStyle = `hsl(${this.hue}, ${this.sat}%, ${this.light}%)`;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, SETTINGS.PARTICLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // 1. Create Offscreen canvas to render text
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');

    // Responsive Font
    SETTINGS.FONT_SIZE = Math.min(width * 0.12, 180); // Size tuned for "AN EMPTYSHIP" length
    offCtx.font = `800 ${SETTINGS.FONT_SIZE}px "Space Grotesk", "Inter", sans-serif`; // Changed font for bolder look
    offCtx.fillStyle = 'white';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(SETTINGS.TEXT, width / 2, height / 2);

    // 2. Scan pixels
    targets = [];
    const imageData = offCtx.getImageData(0, 0, width, height).data;
    const step = SETTINGS.SAMPLE_STEP;

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            if (imageData[index + 3] > 128) {
                // Add jitter
                targets.push({
                    x: x + (Math.random() - 0.5) * 8,
                    y: y + (Math.random() - 0.5) * 8
                });
            }
        }
    }

    targets.sort(() => Math.random() - 0.5);
    particles = [];
}

function loop() {
    ctx.fillStyle = '#0d1117'; // Site background color match
    ctx.fillRect(0, 0, width, height);

    if (particles.length < targets.length) {
        if (Math.random() < SETTINGS.SPAWN_RATE) {
            const target = targets[particles.length];
            particles.push(new Particle(target));
        }
    }

    for (let p of particles) {
        p.behaviors(particles);
        p.update();
        p.draw();
    }

    requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
    init();
});

init();
loop();
