const BOOT_LINES = [
    { text: '> WAKE UP, NEO.', cls: '' },
    { text: '> INITIALIZING CORE...', cls: '' },
    { text: '> MAGI SYSTEM READY', cls: 'amber' },
    { text: '> SYNTH NEURAL LINK ONLINE', cls: '' },
    { text: '> OURA CHANNEL: STANDBY', cls: 'dim' },
    { text: '> GLANCEABILITY PROTOCOL ACTIVE', cls: 'dim' },
    { text: '> FOLLOW THE WHITE RABBIT...', cls: 'dim' },
];

const WAKE_LINES = [
    { text: 'Wake up, Neo...', dim: false },
    { text: 'The Matrix has you.', dim: false },
    { text: 'Follow the white rabbit.', dim: false },
    { text: '', dim: true },
    { text: 'Knock, knock, Neo.', dim: true },
];

function bindRipple(btn) {
    if (btn.dataset.liquidBound) return;
    btn.dataset.liquidBound = '1';
    const setPos = (x, y) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--x', `${x - rect.left}px`);
        btn.style.setProperty('--y', `${y - rect.top}px`);
    };
    btn.addEventListener('mousemove', e => setPos(e.clientX, e.clientY));
    btn.addEventListener('touchstart', e => {
        const t = e.touches[0];
        setPos(t.clientX, t.clientY);
    }, { passive: true });
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

export function runWakeUpSequence(container, onComplete) {
    container.innerHTML = '';
    let lineIdx = 0;

    function typeNextLine() {
        if (lineIdx >= WAKE_LINES.length) {
            const inputRow = document.createElement('div');
            inputRow.style.marginTop = '8px';
            const prompt = document.createElement('span');
            prompt.className = 'wake-line dim';
            prompt.textContent = '> ';
            const input = document.createElement('input');
            input.className = 'terminal-input';
            input.placeholder = 'ENTER  OR  WHITE RABBIT';
            input.id = 'wake-input';
            inputRow.appendChild(prompt);
            inputRow.appendChild(input);
            container.appendChild(inputRow);
            onComplete?.(input);
            return;
        }

        const spec = WAKE_LINES[lineIdx++];
        const lineEl = document.createElement('div');
        lineEl.className = 'wake-line' + (spec.dim ? ' dim' : '');
        container.appendChild(lineEl);

        if (!spec.text) {
            setTimeout(typeNextLine, 200);
            return;
        }

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
                setTimeout(typeNextLine, spec.dim ? 400 : 550);
            }
        }, 36);
    }

    typeNextLine();
}

export function runBootSequence(container, progressEl, onComplete) {
    container.innerHTML = '';
    const GAP = 340;

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
        setTimeout(onComplete, 700);
    }, BOOT_LINES.length * GAP + 200);
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