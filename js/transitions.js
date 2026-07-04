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
            bar.style.animationDelay = `${i * 28}ms`;
            overlay.appendChild(bar);
        }
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.remove();
            resolve();
        }, 520 + bars * 28);
    });
}

export function playBlinds(direction = 'close') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'blinds-overlay';
        const slats = 8;
        for (let i = 0; i < slats; i++) {
            const slat = document.createElement('div');
            slat.className = `blind-slat ${direction}`;
            slat.style.animationDelay = `${i * 45}ms`;
            overlay.appendChild(slat);
        }
        document.body.appendChild(overlay);
        const duration = direction === 'close' ? 420 + slats * 45 : 380;
        setTimeout(() => {
            overlay.remove();
            resolve();
        }, duration);
    });
}

export function playBlockReveal(text = 'SYSTEM START') {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'block-reveal';
        el.innerHTML = `<div class="block wipe"></div><div class="flash-text">${text}</div>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.querySelector('.flash-text').classList.add('show'));
        setTimeout(() => {
            el.remove();
            resolve();
        }, 650);
    });
}

export function playBinaryDissolve() {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'binary-overlay';
        for (let row = 0; row < 18; row++) {
            const stream = document.createElement('div');
            stream.className = 'binary-stream';
            stream.style.top = `${row * 5.5}%`;
            stream.style.animationDelay = `${row * 30}ms`;
            stream.textContent = Array.from({ length: 80 }, () => Math.random() > 0.5 ? '1' : '0').join('');
            overlay.appendChild(stream);
        }
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        setTimeout(() => {
            overlay.remove();
            resolve();
        }, 720);
    });
}

export function playFileParsing() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'parse-flash';
        el.innerHTML = '<span>▸ FILE PARSING...</span>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.remove();
            resolve();
        }, 900);
    });
}

export function playGlitchFlash() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'glitch-flash';
        el.innerHTML = '<div class="glitch-r"></div><div class="glitch-g"></div><div class="glitch-b"></div>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('active'));
        setTimeout(() => { el.remove(); resolve(); }, 380);
    });
}

export function playWhiteRabbitTrail() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'rabbit-trail';
        el.innerHTML = '<div class="rabbit-icon">🐇</div><div class="trail-line"></div>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('run'));
        setTimeout(() => { el.remove(); resolve(); }, 900);
    });
}

export function playCrtSweep() {
    return new Promise(resolve => {
        const el = document.createElement('div');
        el.className = 'crt-sweep';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('sweep'));
        setTimeout(() => { el.remove(); resolve(); }, 650);
    });
}

/** Wake → Pill: Matrix portal (glitch + rabbit + cascade + block reveal) */
export async function playPortalTransition() {
    document.body.classList.add('crt-glitch');
    await playGlitchFlash();
    await playWhiteRabbitTrail();
    await playCascade('rise');
    await playBlockReveal('FOLLOW THE WHITE RABBIT');
    await playCrtSweep();
}

/** Red pill → Boot: EVA armor shutters + matrix cascade */
export async function playRedPillTransition() {
    await playBlinds('close');
    await playGlitchFlash();
    await playCascade('rise');
    await playBlockReveal('ENTER THE MATRIX');
    await playBlinds('open');
}

/** Boot → Red HUD: neural link establish */
export async function playRedHudReveal() {
    await playBlinds('close');
    await playBinaryDissolve();
    await playBlockReveal('NEURAL LINK');
    await playCascade('fall');
    await playCrtSweep();
    await playBlinds('open');
}

export async function showScreenInstant(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active', 'entering');
    });
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

export async function transitionToScreen(screenId, type = 'cascade') {
    const screen = document.getElementById(screenId);
    if (!screen) return;

    if (type === 'blinds') {
        await playBlinds('close');
    } else if (type === 'binary') {
        await playBinaryDissolve();
    } else if (type === 'block') {
        await playBlockReveal('SYSTEM START');
    } else if (type === 'cascade') {
        await playCascade('rise');
    } else if (type === 'parse') {
        await playBlinds('close');
        await playFileParsing();
    }

    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active', 'entering');
    });
    screen.classList.add('active', 'entering');
    setTimeout(() => screen.classList.remove('entering'), 600);

    if (type === 'blinds') await playBlinds('open');
}