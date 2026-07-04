const BOOT_LINES = [
    { text: '> WAKE UP, NEO.', cls: '' },
    { text: '> INITIALIZING CORE...', cls: '' },
    { text: '> MAGI SYSTEM READY', cls: 'amber' },
    { text: '> SYNTH NEURAL LINK ONLINE', cls: '' },
    { text: '> OURA CHANNEL: STANDBY', cls: 'dim' },
    { text: '> GLANCEABILITY PROTOCOL ACTIVE', cls: 'dim' },
    { text: '> FOLLOW THE WHITE RABBIT...', cls: 'dim' },
];

const PRELOADER_LINES = [
    { at: 8,  text: '> BOOTSTRAP MATRIX KERNEL...', cls: '' },
    { at: 22, text: '> INITIALIZING CORE...', cls: '' },
    { at: 38, text: '> DECRYPTING NEURAL PATHWAY...', cls: 'amber' },
    { at: 55, text: '> MAGI SYSTEM READY', cls: 'amber' },
    { at: 72, text: '> SYNTH LINK STANDBY', cls: '' },
    { at: 88, text: '> MATRIX PROTOCOL SYNC...', cls: 'dim' },
];

const WAKE_LINES = [
    { text: 'Wake up, Neo...', dim: false },
    { text: 'The Matrix has you.', dim: false },
    { text: 'Follow the white rabbit.', dim: true },
    { text: 'Knock, knock, Neo.', dim: true },
];

function bindRipple(btn) {
    if (btn.dataset.liquidBound) return;
    btn.dataset.liquidBound = '1';
    const setPos = (clientX, clientY) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--x', `${clientX - rect.left}px`);
        btn.style.setProperty('--y', `${clientY - rect.top}px`);
    };
    btn.addEventListener('mousemove', e => setPos(e.clientX, e.clientY));
    btn.addEventListener('pointermove', e => setPos(e.clientX, e.clientY));
    btn.addEventListener('pointerdown', e => setPos(e.clientX, e.clientY));
}

export function bindLiquidButtons(root = document) {
    root.querySelectorAll('.liquid-btn, .liquid-button').forEach(bindRipple);
}

export function runWakeUpSequence(container, onComplete) {
    container.innerHTML = '';
    let lineIdx = 0;

    function typeNextLine() {
        if (lineIdx >= WAKE_LINES.length) {
            onComplete?.();
            return;
        }

        const spec = WAKE_LINES[lineIdx++];
        const lineEl = document.createElement('div');
        lineEl.className = 'wake-line' + (spec.dim ? ' dim' : '');
        container.appendChild(lineEl);

        let charIdx = 0;
        const cursor = document.createElement('span');
        cursor.className = 'type-cursor';

        const typeTimer = setInterval(() => {
            if (charIdx < spec.text.length) {
                lineEl.textContent = spec.text.slice(0, ++charIdx);
                lineEl.appendChild(cursor);
            } else {
                clearInterval(typeTimer);
                cursor.remove();
                setTimeout(typeNextLine, spec.dim ? 380 : 520);
            }
        }, 42);
    }

    typeNextLine();
}

export function startBlueTicker(el) {
    if (!el) return;
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const chunk = () => Array.from({ length: 32 }, () => `0x${hex()}`).join('  ');
    const text = `${chunk()}    ${chunk()}    `;
    el.innerHTML = `<span class="hex-ticker-inner blue-ticker-inner">${text}${text}</span>`;
}

export function runPreloader(onProgress, terminalEl) {
    const emitted = new Set();

    return new Promise(resolve => {
        let pct = 0;
        const interval = setInterval(() => {
            pct += 3 + Math.random() * 7;
            if (pct >= 100) {
                pct = 100;
                clearInterval(interval);
                onProgress?.(100);
                setTimeout(resolve, 500);
            } else {
                const rounded = Math.round(pct);
                onProgress?.(rounded);

                if (terminalEl) {
                    PRELOADER_LINES.forEach(spec => {
                        if (rounded >= spec.at && !emitted.has(spec.at)) {
                            emitted.add(spec.at);
                            const line = document.createElement('div');
                            line.className = 'preloader-term-line' + (spec.cls ? ` ${spec.cls}` : '');
                            line.textContent = spec.text;
                            terminalEl.appendChild(line);
                            terminalEl.scrollTop = terminalEl.scrollHeight;
                        }
                    });
                }
            }
        }, 100);
    });
}

export function runBootSequence(container, progressEl, onComplete) {
    container.innerHTML = '';
    const GAP = 280;

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
        setTimeout(onComplete, 600);
    }, BOOT_LINES.length * GAP + 180);
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