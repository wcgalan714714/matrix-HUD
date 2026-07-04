const TRACKS = [
    'audio/matrix-main-theme-web.mp3',
    'audio/matrix-cityscape-web.mp3',
];

const AMBIENT_VOLUME = 0.38;
const DUCKED_VOLUME = 0.14;

let audio = null;
let currentTrack = null;
let gestureBound = false;

function pickTrack() {
    return TRACKS[Math.floor(Math.random() * TRACKS.length)];
}

function bindGestureFallback() {
    if (gestureBound) return;
    gestureBound = true;
    const resume = () => {
        if (audio && audio.paused) audio.play().catch(() => {});
    };
    document.addEventListener('click', resume, { once: true, passive: true });
    document.addEventListener('keydown', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true, passive: true });
}

function attemptPlay() {
    if (!audio) return;
    audio.play().catch(() => bindGestureFallback());
}

export function startAmbience() {
    if (audio) return;

    currentTrack = pickTrack();
    audio = new Audio(currentTrack);
    audio.loop = true;
    audio.volume = AMBIENT_VOLUME;
    audio.preload = 'auto';

    // Start playback immediately; retry as buffer fills
    attemptPlay();
    audio.addEventListener('loadeddata', attemptPlay, { once: true });
    audio.addEventListener('canplay', attemptPlay, { once: true });
    audio.load();
}

export function stopAmbience() {
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio = null;
    currentTrack = null;
}

export function duckAmbience() {
    if (audio) audio.volume = DUCKED_VOLUME;
}

export function restoreAmbience() {
    if (audio) audio.volume = AMBIENT_VOLUME;
}

export function getCurrentTrack() {
    return currentTrack;
}