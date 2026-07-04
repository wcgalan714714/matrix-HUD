const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

export function initMatrixRain(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const fontSize = 11;
    let width = 0;
    let height = 0;
    let columns = 0;
    let drops = [];
    let speeds = [];
    let running = false;
    let frameId = null;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        columns = Math.floor(width / fontSize) + 1;
        drops = Array.from({ length: columns }, () => Math.random() * (height / fontSize));
        speeds = Array.from({ length: columns }, () => 0.35 + Math.random() * 0.55);
    }

    function draw(intensity = 0.3) {
        ctx.fillStyle = `rgba(10, 15, 10, ${0.08 + intensity * 0.04})`;
        ctx.fillRect(0, 0, width, height);
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < columns; i++) {
            const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            const alpha = 0.25 + Math.random() * 0.35;
            ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
            ctx.fillText(ch, x, y);

            if (y > height && Math.random() > 0.985) drops[i] = 0;
            drops[i] += speeds[i] * (0.6 + intensity * 0.4);
        }
    }

    function loop(intensity) {
        if (!running) return;
        draw(intensity);
        frameId = requestAnimationFrame(() => loop(intensity));
    }

    window.addEventListener('resize', resize);
    resize();

    return {
        start(intensity = 0.3) {
            if (running) return;
            running = true;
            loop(intensity);
        },
        stop() {
            running = false;
            if (frameId) cancelAnimationFrame(frameId);
            ctx.clearRect(0, 0, width, height);
        },
        setIntensity(intensity) {
            this._intensity = intensity;
        },
        _intensity: 0.3,
    };
}