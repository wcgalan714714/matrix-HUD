const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

export function initMatrixRain(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const fontSize = 12;
    let width = 0, height = 0, columns = 0;
    let drops = [], speeds = [];
    let running = false, frameId = null;
    let intensity = 0.6;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        columns = Math.floor(width / fontSize) + 2;
        drops = Array.from({ length: columns }, () => Math.random() * (height / fontSize));
        speeds = Array.from({ length: columns }, () => 0.5 + Math.random() * 1.2);
    }

    function draw() {
        const fade = 0.06 + intensity * 0.06;
        ctx.fillStyle = `rgba(10, 15, 10, ${fade})`;
        ctx.fillRect(0, 0, width, height);
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < columns; i++) {
            const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            const headAlpha = 0.5 + intensity * 0.4;
            const tailAlpha = 0.15 + intensity * 0.2;

            ctx.fillStyle = `rgba(0, 255, 65, ${headAlpha})`;
            ctx.fillText(ch, x, y);
            ctx.fillStyle = `rgba(0, 255, 65, ${tailAlpha * 0.5})`;
            ctx.fillText(ch, x, y - fontSize);

            if (y > height && Math.random() > 0.975) drops[i] = 0;
            drops[i] += speeds[i] * (0.5 + intensity * 0.6);
        }
    }

    function loop() {
        if (!running) return;
        draw();
        frameId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    resize();

    return {
        start(level = 0.6) {
            intensity = level;
            if (running) return;
            running = true;
            loop();
        },
        stop() {
            running = false;
            if (frameId) cancelAnimationFrame(frameId);
            ctx.clearRect(0, 0, width, height);
        },
        setIntensity(level) {
            intensity = Math.max(0.15, Math.min(1, level));
        },
        burst() {
            intensity = Math.min(1, intensity + 0.25);
            setTimeout(() => { intensity = Math.max(0.25, intensity - 0.15); }, 800);
        },
    };
}