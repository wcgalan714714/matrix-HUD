const TRACKS = [
    'audio/matrix-main-theme-web.mp3',
    'audio/matrix-cityscape-web.mp3',
    'audio/matrix-rest-in-matrix-web.mp3',
];

const AMBIENT_VOLUME = 0.38;
const DUCKED_VOLUME = 0.14;
const LAST_TRACK_KEY = 'synth_last_track';

let audio = null;
let currentTrack = null;
let gestureBound = false;
let bootstrapped = false;

function pickTrack(exclude = null) {
    let pool = exclude ? TRACKS.filter(t => t !== exclude) : TRACKS.slice();
    if (pool.length === 0) pool = TRACKS.slice();
    return pool[Math.floor(Math.random() * pool.length)];
}

function bindGestureFallback() {
    if (gestureBound) return;
    gestureBound = true;
    const resume = () => {
        if (audio?.paused) aggressivePlay(audio);
    };
    document.addEventListener('pointerdown', resume, { passive: true });
    document.addEventListener('keydown', resume);
    document.addEventListener('touchstart', resume, { passive: true });
}

function aggressivePlay(target) {
    if (!target) return;
    const tryPlay = () => target.play().catch(() => bindGestureFallback());
    tryPlay();
    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'].forEach(ev => {
        target.addEventListener(ev, tryPlay, { once: true });
    });
}

function loadTrack(track) {
    if (audio) {
        audio.pause();
        audio.removeEventListener('ended', onTrackEnded);
    }

    currentTrack = track;
    sessionStorage.setItem(LAST_TRACK_KEY, track);

    audio = new Audio(track);
    audio.volume = AMBIENT_VOLUME;
    audio.preload = 'auto';
    audio.addEventListener('ended', onTrackEnded);
    audio.load();
    aggressivePlay(audio);
}

function onTrackEnded() {
    const next = pickTrack(currentTrack);
    loadTrack(next);
}

export function startAmbience() {
    if (bootstrapped) return;
    bootstrapped = true;

    const existing = window.__synthAmbience;
    if (existing?.audio) {
        audio = existing.audio;
        currentTrack = existing.track;
        audio.removeEventListener('ended', onTrackEnded);
        audio.addEventListener('ended', onTrackEnded);
        audio.loop = false;
        if (audio.paused) aggressivePlay(audio);
        return;
    }

    const last = sessionStorage.getItem(LAST_TRACK_KEY);
    loadTrack(pickTrack(last));
}

export function stopAmbience() {
    if (!audio) return;
    audio.pause();
    audio.removeEventListener('ended', onTrackEnded);
    audio.removeAttribute('src');
    audio.load();
    audio = null;
    currentTrack = null;
    bootstrapped = false;
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