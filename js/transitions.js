export function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export function playCascade(mode = 'rise') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'cascade-overlay';
        const bars = 14;
        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div');
            bar.className = `cascade-bar ${mode}`;
            bar.style.animationDelay = `${i * 24}ms`;
            overlay.appendChild(bar);
        }
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.remove();
            resolve();
        }, 420 + bars * 24);
    });
}

export function playQuickTransition() {
    return playCascade('rise');
}

export function playBlinds(direction = 'close') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'blinds-overlay';
        const slats = 8;
        for (let i = 0; i < slats; i++) {
            const slat = document.createElement('div');
            slat.className = `blind-slat ${direction}`;
            slat.style.animationDelay = `${i * 36}ms`;
            overlay.appendChild(slat);
        }
        document.body.appendChild(overlay);
        setTimeout(() => { overlay.remove(); resolve(); }, 340 + slats * 36);
    });
}

/** Evangelion block-reveal with flash text (vault) */
export function playBlockReveal(text = 'SYSTEM START') {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'block-reveal';
        el.innerHTML = `<div class="block wipe"></div><div class="flash-text">${text}</div>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.querySelector('.flash-text')?.classList.add('show'));
        setTimeout(() => { el.remove(); resolve(); }, 620);
    });
}

/** Matrix binary dissolve (vault) */
export function playBinaryDissolve() {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'binary-overlay';
        for (let row = 0; row < 16; row++) {
            const stream = document.createElement('div');
            stream.className = 'binary-stream';
            stream.style.top = `${row * 6}%`;
            stream.style.animationDelay = `${row * 26}ms`;
            stream.textContent = Array.from({ length: 72 }, () => Math.random() > 0.5 ? '1' : '0').join('');
            overlay.appendChild(stream);
        }
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        setTimeout(() => { overlay.remove(); resolve(); }, 640);
    });
}

/** CRT power sweep — Cyberpunk / Matrix monitor boot (vault) */
export function playCrtSweep() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'crt-sweep sweep';
        document.body.appendChild(el);
        setTimeout(() => { el.remove(); resolve(); }, 560);
    });
}

/** Matrix glitch RGB flash on preloader exit (vault) */
export function playGlitchFlash() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'glitch-flash';
        el.innerHTML = '<div class="glitch-r"></div><div class="glitch-g"></div><div class="glitch-b"></div>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('active'));
        setTimeout(() => { el.remove(); resolve(); }, 420);
    });
}

/** Matrix "Follow the White Rabbit" nav transition (vault) */
export function playWhiteRabbit() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'rabbit-trail run';
        el.innerHTML = '<div class="trail-line"></div><div class="rabbit-icon">🐇</div>';
        document.body.appendChild(el);
        setTimeout(() => { el.remove(); resolve(); }, 880);
    });
}

export function playFileParsing() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'parse-flash';
        el.innerHTML = '<span>▸ FILE PARSING...</span>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => { el.remove(); resolve(); }, 720);
    });
}

/** Matrix glitch reveal exit — CRT jitter + RGB flash + cascade (vault preloader) */
export async function playMatrixGlitchReveal() {
    document.querySelector('#screen-preloader .preloader-content')?.classList.add('crt-glitch');
    await wait(180);
    await playGlitchFlash();
    await playCascade('rise');
    await playCrtSweep();
}

export function showScreenInstant(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active', 'entering', 'blue-enter', 'wake-zoom');
    });
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

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
        setTimeout(() => screen.classList.remove(enterClass), 520);
    }

    if (effect === 'blinds') await playBlinds('open');
}

export async function transitionToScreen(screenId, effect = 'cascade') {
    await navigateTo(screenId, { effect });
}