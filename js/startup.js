const BOOT_LINES = [
    { text: '> MAGI SYSTEM READY', cls: 'amber' },
    { text: '> SYNTH NEURAL LINK ONLINE', cls: '' },
    { text: '> OURA CHANNEL: STANDBY', cls: 'dim' },
];

function bindRipple(btn) {
    if (btn.dataset.liquidBound) return;
    btn.dataset.liquidBound = '1';
    const setPos = (x, y) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--x', `${x - rect.left}px`);
        btn.style.setProperty('--y', `${y - rect.top}px`);
    };
    btn.addEventListener('pointermove', e => setPos(e.clientX, e.clientY));
    btn.addEventListener('pointerdown', e => setPos(e.clientX, e.clientY));
}

export function bindLiquidButtons(root = document) {
    root.querySelectorAll('.liquid-btn').forEach(bindRipple);
}

export function runPreloader(onProgress) {
    return new Promise(resolve => {
        let pct = 0;
        const interval = setInterval(() => {
            pct += 4 + Math.random() * 8;
            if (pct >= 100) {
                pct = 100;
                clearInterval(interval);
                onProgress?.(100);
                setTimeout(resolve, 400);
            } else {
                onProgress?.(Math.round(pct));
            }
        }, 120);
    });
}

export function runBootSequence(container, progressEl, onComplete) {
    container.innerHTML = '';
    const GAP = 110;

    BOOT_LINES.forEach((spec, i) => {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'boot-line' + (spec.cls ? ` ${spec.cls}` : '');
            el.textContent = spec.text;
            container.appendChild(el);
            if (progressEl) progressEl.style.width = `${Math.round(((i + 1) / BOOT_LINES.length) * 90)}%`;
        }, i * GAP);
    });

    setTimeout(() => {
        const done = document.createElement('div');
        done.className = 'boot-line amber';
        done.textContent = '> NEURAL LINK ESTABLISHED';
        container.appendChild(done);
        if (progressEl) progressEl.style.width = '100%';
        setTimeout(onComplete, 400);
    }, BOOT_LINES.length * GAP + 120);
}

export function startHexTicker(el) {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const chunk = () => Array.from({ length: 40 }, () => `0x${hex()}`).join('  ');
    const text = `${chunk()}    ${chunk()}    `;
    el.innerHTML = `<span class="hex-ticker-inner">${text}${text}</span>`;
}

export function startMarquee(el) {
    const msg = 'NERV TACTICAL HUD  //  SYNTH NEURAL OVERLAY  //  OURA RING 5 LINK  //  META DISPLAY HUD  //  GLANCEABILITY PROTOCOL  //  ';
    el.innerHTML = `<span class="marquee-inner">${msg}${msg}</span>`;
}