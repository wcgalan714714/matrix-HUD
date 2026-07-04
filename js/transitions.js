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

/** Single clean transition — one quick cascade */
export async function playQuickTransition() {
    await playCascade('rise');
}

export function showScreenInstant(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active', 'entering', 'blue-enter');
    });
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

export async function transitionToScreen(screenId) {
    await playQuickTransition();
    showScreenInstant(screenId);
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('entering');
        setTimeout(() => screen.classList.remove('entering'), 400);
    }
}

export function playBlinds(direction = 'close') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'blinds-overlay';
        const slats = 6;
        for (let i = 0; i < slats; i++) {
            const slat = document.createElement('div');
            slat.className = `blind-slat ${direction}`;
            slat.style.animationDelay = `${i * 30}ms`;
            overlay.appendChild(slat);
        }
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.remove(); resolve(); }, 300);
    });
}

export function playFileParsing() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'parse-flash';
        el.innerHTML = '<span>▸ FILE PARSING...</span>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => { el.remove(); resolve(); }, 600);
    });
}