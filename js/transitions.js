export function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export function playCascade(mode = 'rise') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'cascade-overlay';
        const bars = 10;
        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div');
            bar.className = `cascade-bar ${mode}`;
            bar.style.animationDelay = `${i * 18}ms`;
            overlay.appendChild(bar);
        }
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.remove();
            resolve();
        }, 320 + bars * 18);
    });
}

export function playQuickTransition() {
    return playCascade('rise');
}

export function playBlinds(direction = 'close') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'blinds-overlay';
        const slats = 6;
        for (let i = 0; i < slats; i++) {
            const slat = document.createElement('div');
            slat.className = `blind-slat ${direction}`;
            slat.style.animationDelay = `${i * 28}ms`;
            overlay.appendChild(slat);
        }
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.remove(); resolve(); }, 280 + slats * 28);
    });
}

export function playBlockReveal(text = 'SYSTEM START') {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'block-reveal';
        el.innerHTML = `<div class="block wipe"></div><div class="flash-text">${text}</div>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.querySelector('.flash-text')?.classList.add('show'));
        setTimeout(() => { el.remove(); resolve(); }, 520);
    });
}

export function playBinaryDissolve() {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'binary-overlay';
        for (let row = 0; row < 12; row++) {
            const stream = document.createElement('div');
            stream.className = 'binary-stream';
            stream.style.top = `${row * 8}%`;
            stream.style.animationDelay = `${row * 22}ms`;
            stream.textContent = Array.from({ length: 60 }, () => Math.random() > 0.5 ? '1' : '0').join('');
            overlay.appendChild(stream);
        }
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        setTimeout(() => { overlay.remove(); resolve(); }, 520);
    });
}

export function playCrtSweep() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'crt-sweep sweep';
        document.body.appendChild(el);
        setTimeout(() => { el.remove(); resolve(); }, 480);
    });
}

export function playFileParsing() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'parse-flash';
        el.innerHTML = '<span>▸ FILE PARSING...</span>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => { el.remove(); resolve(); }, 560);
    });
}

export function showScreenInstant(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active', 'entering', 'blue-enter');
    });
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

/**
 * Navigate with a single minimal vault-inspired effect.
 * effect: cascade | cascade-fall | blinds | block | binary | sweep | none
 */
export async function navigateTo(screenId, { effect = 'cascade', enterClass = 'entering' } = {}) {
    if (effect === 'cascade') await playCascade('rise');
    else if (effect === 'cascade-fall') await playCascade('fall');
    else if (effect === 'blinds') await playBlinds('close');
    else if (effect === 'block') await playBlockReveal('SYSTEM START');
    else if (effect === 'binary') await playBinaryDissolve();
    else if (effect === 'sweep') await playCrtSweep();

    showScreenInstant(screenId);
    const screen = document.getElementById(screenId);
    if (screen && enterClass) {
        screen.classList.add(enterClass);
        setTimeout(() => screen.classList.remove(enterClass), 450);
    }

    if (effect === 'blinds') await playBlinds('open');
}

export async function transitionToScreen(screenId, effect = 'cascade') {
    await navigateTo(screenId, { effect });
}