const BOOT_LINES = [
    { text: '> WAKE UP, NEO.', delay: 0 },
    { text: '> INITIALIZING CORE...', delay: 400 },
    { text: '> MAGI SYSTEM READY', delay: 800, cls: 'amber' },
    { text: '> SYNTH NEURAL LINK ONLINE', delay: 1200 },
    { text: '> OURA CHANNEL: STANDBY', delay: 1600, cls: 'dim' },
    { text: '> GLANCEABILITY PROTOCOL ACTIVE', delay: 2000, cls: 'dim' },
];

export function bindLiquidButtons(root = document) {
    root.querySelectorAll('.liquid-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            btn.style.setProperty('--x', `${e.clientX - rect.left}px`);
            btn.style.setProperty('--y', `${e.clientY - rect.top}px`);
        });
    });
}

export function playCascade(onDone) {
    const overlay = document.createElement('div');
    overlay.className = 'cascade-overlay';
    const bars = 12;
    for (let i = 0; i < bars; i++) {
        const bar = document.createElement('div');
        bar.className = 'cascade-bar';
        bar.style.animationDelay = `${i * 25}ms`;
        overlay.appendChild(bar);
    }
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        overlay.querySelectorAll('.cascade-bar').forEach(b => b.classList.add('animate'));
    });
    setTimeout(() => {
        overlay.remove();
        onDone?.();
    }, 450);
}

export function runBootSequence(container, onComplete) {
    container.innerHTML = '';
    const GAP = 380;

    BOOT_LINES.forEach((spec, i) => {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'boot-line' + (spec.cls ? ` ${spec.cls}` : '');
            el.textContent = spec.text;
            container.appendChild(el);
        }, i * GAP);
    });

    setTimeout(() => {
        const cursor = document.createElement('div');
        cursor.innerHTML = '<span class="boot-cursor"></span>';
        container.appendChild(cursor);
        setTimeout(onComplete, 900);
    }, BOOT_LINES.length * GAP);
}

export function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
}