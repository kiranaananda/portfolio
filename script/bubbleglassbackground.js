<script>
document.addEventListener("DOMContentLoaded", function() {
    
    const canvas = document.getElementById('watercolor-canvas');
    if (!canvas) return; // Stop if canvas isn't found
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let blobs = [];

    // YOUR COLORS: Soft Yellow (#FFF7AE) & Soft Blue (#CDE7FF)
    const colors = [
        { r: 255, g: 247, b: 174 }, // Yellow
        { r: 205, g: 231, b: 255 }, // Blue
        { r: 235, g: 245, b: 220 }, // A connecting light green
        { r: 255, g: 250, b: 200 }  // Highlight
    ];

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // A simple pseudo-noise function
    function noise(t) {
        return Math.sin(t) * Math.cos(t * 1.5);
    }

    class Blob {
        constructor() {
            this.init();
        }

        init() {
            this.size = random(Math.min(width, height) * 0.05, Math.min(width, height) * 0.1);
            this.x = random(0, width);
            this.y = random(0, height);
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.points = [];
            this.numPoints = 7; 
            this.angleOffset = random(0, Math.PI * 2);
            this.t = random(0, 100);
            
            for (let i = 0; i < this.numPoints; i++) {
                this.points.push({
                    angle: (Math.PI * 2 / this.numPoints) * i,
                    radiusOffset: random(0.8, 1.2)
                });
            }
        }

        update() {
            this.t += 0.003; // Speed
            this.x += noise(this.t) * 0.3;
            this.y += noise(this.t + 10) * 0.3;
        }

        draw() {
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`;
            
            // KEY: This creates the watercolor "wet" look
            ctx.globalCompositeOperation = 'multiply'; 
            
            ctx.beginPath();
            let firstX, firstY;

            for (let i = 0; i <= this.numPoints; i++) {
                const point = this.points[i % this.numPoints];
                const nextPoint = this.points[(i + 1) % this.numPoints];

                // Organic movement
                const radius = this.size * point.radiusOffset + Math.sin(this.t + i) * 15;
                const nextRadius = this.size * nextPoint.radiusOffset + Math.sin(this.t + i + 1) * 15;

                const x = this.x + Math.cos(point.angle + this.angleOffset) * radius;
                const y = this.y + Math.sin(point.angle + this.angleOffset) * radius;
                
                const nextX = this.x + Math.cos(nextPoint.angle + this.angleOffset) * nextRadius;
                const nextY = this.y + Math.sin(nextPoint.angle + this.angleOffset) * nextRadius;

                // Bezier curves for smooth shapes
                const midX = (x + nextX) / 2;
                const midY = (y + nextY) / 2;

                if (i === 0) {
                    ctx.moveTo(midX, midY);
                    firstX = midX;
                    firstY = midY;
                } else {
                    ctx.quadraticCurveTo(x, y, midX, midY);
                }
            }

            ctx.closePath();
            
            // Shadow creates the "bleed" effect
            ctx.shadowBlur = 60;
            ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.6)`;
            
            ctx.fill();
            
            // Reset for next drawing
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 0;
        }
    }

    function init() {
        resize();
        // Create blobs
        for (let i = 0; i < 6; i++) {
            blobs.push(new Blob());
        }
        animate();
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function animate() {
        // Clear background
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0, width, height);

        blobs.forEach(blob => {
            blob.update();
            blob.draw();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resize();
        blobs = [];
        for (let i = 0; i < 6; i++) blobs.push(new Blob());
    });

    // Start it up!
    init();

});
</script>
