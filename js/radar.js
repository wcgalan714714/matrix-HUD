export function initRadar(canvas) {
    const ctx = canvas.getContext('2d');
    let size = 0;
    let angle = 0;
    let running = false;
    let frameId = null;

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        size = Math.min(rect.width, rect.height, 140);
        canvas.width = size;
        canvas.height = size;
    }

    function draw() {
        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2 - 4;

        ctx.clearRect(0, 0, size, size);

        // rings
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, (r / 3) * i, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 65, ${0.15 + i * 0.08})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // cross
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
        ctx.beginPath();
        ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
        ctx.stroke();

        // sweep
        const sweep = angle;
        const grad = ctx.createConicalGradient
            ? null
            : null;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, sweep - 0.5, sweep);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 65, 0.18)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sweep) * r, cy + Math.sin(sweep) * r);
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // corner brackets
        const b = 10;
        ctx.strokeStyle = 'rgba(255, 184, 0, 0.5)';
        ctx.lineWidth = 1;
        [[4, 4, b, 0, 0, b], [size - 4, 4, -b, 0, 0, b], [4, size - 4, b, 0, 0, -b], [size - 4, size - 4, -b, 0, 0, -b]].forEach(([x, y, dx1, dy1, dx2, dy2]) => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + dx1, y + dy1);
            ctx.moveTo(x, y);
            ctx.lineTo(x + dx2, y + dy2);
            ctx.stroke();
        });

        angle += 0.035;
    }

    function loop() {
        if (!running) return;
        draw();
        frameId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    resize();

    return {
        start() {
            if (running) return;
            running = true;
            resize();
            loop();
        },
        stop() {
            running = false;
            if (frameId) cancelAnimationFrame(frameId);
            ctx.clearRect(0, 0, size, size);
        },
    };
}