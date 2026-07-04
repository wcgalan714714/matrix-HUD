import { fetchVitals, demoVitals } from './oura-client.js';
import {
    getToken, setToken, getAutoSync, setAutoSync,
    setMode, getCachedVitals, setCachedVitals, clearMode,
} from './storage.js';
import { initMatrixRain } from './matrix-rain.js';
import { initRadar } from './radar.js';
import {
    bindLiquidButtons, runPreloader, runWakeUpSequence,
    runBootSequence, startHexTicker, startMarquee,
} from './startup.js';
import {
    transitionToScreen, playCascade, playBlockReveal,
    playBinaryDissolve, playFileParsing, playBlinds,
} from './transitions.js';
import { duckAmbience, restoreAmbience } from './ambience.js';

const AUTO_SYNC_MS = 30 * 60 * 1000;
const STALE_MS = 15 * 60 * 1000;

let rain = null;
let radar = null;
let autoSyncTimer = null;
let syncing = false;
let focusMode = false;
let currentVitals = null;
let experienceMode = null;
let wakeInput = null;

const els = {};

function $(id) { return document.getElementById(id); }

function cacheElements() {
    els.readiness = $('readiness');
    els.sleep = $('sleep');
    els.hrv = $('hrv');
    els.hr = $('hr');
    els.activity = $('activity');
    els.steps = $('steps');
    els.readinessMeta = $('readiness-meta');
    els.sleepMeta = $('sleep-meta');
    els.hrvMeta = $('hrv-meta');
    els.hrMeta = $('hr-meta');
    els.activityMeta = $('activity-meta');
    els.lastSync = $('last-sync');
    els.statusLine = $('status-line');
    els.warningBanner = $('warning-banner');
    els.syncBtn = $('sync-btn');
    els.tokenInput = $('token-input');
    els.autoToggle = $('auto-toggle');
}

function setBodyPhase(phase) {
    document.body.className = phase + (experienceMode === 'blue' ? ' blue-pill' : '') + (focusMode ? ' focus-mode' : '');
}

function contextGreeting() {
    const h = new Date().getHours();
    if (h < 6) return 'NIGHT WATCH';
    if (h < 12) return 'MORNING STATUS';
    if (h < 17) return 'AFTERNOON STATUS';
    if (h < 21) return 'EVENING STATUS';
    return 'NIGHT WATCH';
}

function formatSyncTime(ts) {
    if (!ts) return 'NEVER SYNCED';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'JUST NOW';
    if (mins < 60) return `${mins} MIN AGO`;
    return `${Math.floor(mins / 60)} HR AGO`;
}

function updateStatusLine(vitals, state) {
    const greeting = contextGreeting();
    const token = getToken();
    if (!token) {
        els.statusLine.textContent = `${greeting} • NO TOKEN`;
        els.statusLine.className = 'status-line amber';
        return;
    }
    if (state === 'error') {
        els.statusLine.textContent = `${greeting} • SYNC FAILED`;
        els.statusLine.className = 'status-line alert';
        return;
    }
    if (state === 'loading') {
        els.statusLine.textContent = `${greeting} • SYNCING...`;
        els.statusLine.className = 'status-line';
        return;
    }
    const src = vitals?.source === 'demo' ? 'DEMO' : 'OURA 5';
    els.statusLine.textContent = `${greeting} • ${src} • LINKED`;
    els.statusLine.className = 'status-line';
}

function updateWarning(vitals) {
    if (!vitals || vitals.readiness == null || vitals.readiness >= 55) {
        els.warningBanner.classList.add('hidden');
        return;
    }
    els.warningBanner.textContent = '⚠ WARNING — READINESS LOW — CONSIDER REST';
    els.warningBanner.classList.remove('hidden');
}

function animateValues() {
    document.querySelectorAll('.vital-value').forEach(v => {
        v.classList.add('sync-pulse');
        setTimeout(() => v.classList.remove('sync-pulse'), 600);
    });
}

function renderVitals(vitals, state = 'success') {
    currentVitals = vitals;
    const dash = '—';

    els.readiness.textContent = vitals.readiness ?? dash;
    els.sleep.textContent = vitals.sleep ?? dash;
    els.hrv.textContent = vitals.hrv ?? dash;
    els.hr.textContent = vitals.restingHr ?? dash;
    els.activity.textContent = vitals.activity ?? dash;
    els.steps.textContent = vitals.steps != null ? vitals.steps.toLocaleString() : dash;

    els.readinessMeta.textContent = vitals.readinessMeta || '—';
    els.sleepMeta.textContent = vitals.sleepMeta || 'Last night';
    els.hrvMeta.textContent = vitals.hrvMeta || '—';
    els.hrMeta.textContent = vitals.hrMeta || '—';
    els.activityMeta.textContent = vitals.activityMeta || '—';

    const age = vitals.syncedAt ? Date.now() - vitals.syncedAt : Infinity;
    els.lastSync.textContent = state === 'error' ? 'SYNC FAILED' : `LAST SYNC: ${formatSyncTime(vitals.syncedAt)}`;
    els.lastSync.className = 'last-sync' + (age > STALE_MS ? ' stale' : '') + (state === 'error' ? ' error' : '');

    updateStatusLine(vitals, state);
    updateWarning(vitals);
}

async function syncVitals({ forceDemo = false } = {}) {
    if (syncing) return;
    syncing = true;
    els.syncBtn.disabled = true;
    updateStatusLine(currentVitals, 'loading');
    animateValues();
    rain?.burst();

    const token = getToken();
    try {
        let vitals;
        if (!token || forceDemo) {
            vitals = demoVitals();
            if (!token) vitals.source = 'demo';
        } else {
            try {
                vitals = await fetchVitals(token);
            } catch (err) {
                const cached = getCachedVitals();
                if (cached) {
                    renderVitals(cached, 'error');
                    els.lastSync.textContent = err.message || 'OURA UNREACHABLE';
                    els.lastSync.className = 'last-sync error';
                    throw err;
                }
                vitals = demoVitals();
                vitals.source = 'demo';
                els.lastSync.textContent = `${err.message} — DEMO DATA`;
                els.lastSync.className = 'last-sync stale';
            }
        }
        setCachedVitals(vitals);
        renderVitals(vitals, 'success');
    } catch { /* handled */ } finally {
        syncing = false;
        els.syncBtn.disabled = false;
    }
}

function setupAutoSync() {
    if (autoSyncTimer) clearInterval(autoSyncTimer);
    if (!getAutoSync()) return;
    autoSyncTimer = setInterval(() => {
        if (!document.hidden) syncVitals();
    }, AUTO_SYNC_MS);
}

/* ── Startup flow (always runs on fresh page load) ── */

async function runStartupFlow() {
    clearMode();
    rain.start(0.85);

    await runPreloader(pct => {
        $('preloader-fill').style.width = `${pct}%`;
        if (pct > 60) $('preloader-status').textContent = 'DECRYPTING NEURAL PATHWAY...';
        if (pct > 85) $('preloader-status').textContent = 'MATRIX PROTOCOL READY';
    });

    document.querySelector('#screen-preloader .preloader-content')?.classList.add('crt-glitch');
    await playCascade('rise');

    rain.setIntensity(0.5);
    await transitionToScreen('screen-wake', 'none');
    setBodyPhase('phase-wake');

    const wakeContainer = $('wake-container');
    runWakeUpSequence(wakeContainer, input => {
        wakeInput = input;
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') enterSimulation();
            if (input.value.toUpperCase().includes('WHITE RABBIT')) enterSimulation();
        });
    });
}

async function enterSimulation() {
    await playBlockReveal('SYSTEM START');
    await playCascade('rise');
    await transitionToScreen('screen-pill', 'none');
}

async function choosePill(mode) {
    experienceMode = mode;
    setMode(mode);
    document.body.classList.toggle('blue-pill', mode === 'blue');

    if (mode === 'blue') {
        rain.stop();
        await playBinaryDissolve();
        await transitionToScreen('screen-hud', 'none');
        setBodyPhase('phase-hud');
        startHudDecorations();
        await syncVitals({ forceDemo: !getToken() });
        return;
    }

    await playCascade('rise');
    await transitionToScreen('screen-boot', 'none');
    setBodyPhase('phase-boot');
    rain.setIntensity(0.7);

    radar = initRadar($('boot-radar'));
    radar.start();

    const progressFill = $('boot-progress-fill');
    runBootSequence($('boot-terminal'), progressFill, async () => {
        radar.stop();
        await playBlockReveal('NEURAL LINK');
        await playCascade('fall');
        rain.setIntensity(0.3);
        await transitionToScreen('screen-hud', 'none');
        setBodyPhase('phase-hud');
        rain.start(0.3);
        startHudDecorations();
        await syncVitals();
    });
}

function startHudDecorations() {
    startMarquee($('top-marquee'));
    startHexTicker($('hex-ticker'));
}

async function openSettings() {
    els.tokenInput.value = getToken();
    els.autoToggle.classList.toggle('on', getAutoSync());
    await playBlinds('close');
    await playFileParsing();
    await transitionToScreen('screen-settings', 'none');
    await playBlinds('open');
}

async function closeSettings() {
    await playBlinds('close');
    await transitionToScreen('screen-hud', 'none');
    await playBlinds('open');
}

async function saveSettings() {
    setToken(els.tokenInput.value);
    setAutoSync(els.autoToggle.classList.contains('on'));
    setupAutoSync();
    await closeSettings();
    syncVitals();
}

function setupVoiceHints() {
    const hints = [
        '"Show vitals" · "How\'s my recovery?"',
        '"Sync" · "Focus mode" · "Settings"',
        '"Log note" · "Focus mode"',
    ];
    let i = 0;
    const el = $('voice-hints');
    if (!el) return;
    setInterval(() => {
        i = (i + 1) % hints.length;
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = hints[i];
            el.style.opacity = '0.7';
        }, 280);
    }, 7000);
}

function setupKeyboard() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && $('screen-wake')?.classList.contains('active')) enterSimulation();
        if (e.key === 's' || e.key === 'S') {
            if ($('screen-hud')?.classList.contains('active')) openSettings();
        }
        if (e.key === 'f' || e.key === 'F') toggleFocus();
    });
}

function toggleFocus() {
    focusMode = !focusMode;
    document.body.classList.toggle('focus-mode', focusMode);
    if (focusMode) {
        rain?.stop();
        duckAmbience();
    } else {
        if (experienceMode === 'red') rain?.start(0.25);
        restoreAmbience();
    }
}

function boot() {
    cacheElements();
    bindLiquidButtons();

    rain = initMatrixRain($('matrix-canvas'));

    $('enter-btn').addEventListener('click', enterSimulation);
    $('pill-red').addEventListener('click', () => choosePill('red'));
    $('pill-blue').addEventListener('click', () => choosePill('blue'));
    els.syncBtn.addEventListener('click', () => syncVitals());
    $('settings-btn').addEventListener('click', openSettings);
    $('settings-close').addEventListener('click', closeSettings);
    $('settings-save').addEventListener('click', saveSettings);
    els.autoToggle.addEventListener('click', () => els.autoToggle.classList.toggle('on'));

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            rain?.stop();
            duckAmbience();
        } else {
            if (experienceMode === 'red' && !focusMode) rain?.start(0.28);
            if (!focusMode) restoreAmbience();
        }
    });

    setupVoiceHints();
    setupKeyboard();
    setupAutoSync();

    runStartupFlow();
}

document.addEventListener('DOMContentLoaded', boot);