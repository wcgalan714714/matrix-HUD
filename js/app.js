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
    transitionToScreen, playCascade, playPortalTransition,
    playRedPillTransition, playRedHudReveal, playFileParsing,
    playBlinds, showScreenInstant,
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
    els.statusLine = $('status-line');
    els.warningBanner = $('warning-banner');
    els.syncBtn = $('sync-btn');
    els.syncBtnBlue = $('sync-btn-blue');
    els.tokenInput = $('token-input');
    els.autoToggle = $('auto-toggle');
}

function setBodyPhase(phase) {
    document.body.className = phase;
    if (experienceMode === 'red') document.body.classList.add('red-pill');
    if (experienceMode === 'blue') document.body.classList.add('blue-pill');
    if (focusMode) document.body.classList.add('focus-mode');
}

function setVital(key, value) {
    document.querySelectorAll(`[data-vital="${key}"]`).forEach(el => {
        el.textContent = value;
    });
}

function setMeta(key, value) {
    document.querySelectorAll(`[data-meta="${key}"]`).forEach(el => {
        el.textContent = value;
    });
}

function setSyncLabel(text, className = 'last-sync') {
    document.querySelectorAll('[data-sync="label"]').forEach(el => {
        el.textContent = text;
        el.className = className;
    });
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
    if (!els.statusLine) return;
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
    if (!els.warningBanner) return;
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

    setVital('readiness', vitals.readiness ?? dash);
    setVital('sleep', vitals.sleep ?? dash);
    setVital('hrv', vitals.hrv ?? dash);
    setVital('hr', vitals.restingHr ?? dash);
    setVital('activity', vitals.activity ?? dash);
    setVital('steps', vitals.steps != null ? vitals.steps.toLocaleString() : dash);

    setMeta('readiness', vitals.readinessMeta || '—');
    setMeta('sleep', vitals.sleepMeta || 'Last night');
    setMeta('hrv', vitals.hrvMeta || '—');
    setMeta('hr', vitals.hrMeta || '—');
    setMeta('activity', vitals.activityMeta || '—');

    const age = vitals.syncedAt ? Date.now() - vitals.syncedAt : Infinity;
    const label = state === 'error' ? 'SYNC FAILED' : `LAST SYNC: ${formatSyncTime(vitals.syncedAt)}`;
    const syncClass = 'last-sync' + (age > STALE_MS ? ' stale' : '') + (state === 'error' ? ' error' : '');
    setSyncLabel(label, syncClass);

    updateStatusLine(vitals, state);
    updateWarning(vitals);
}

async function syncVitals({ forceDemo = false } = {}) {
    if (syncing) return;
    syncing = true;
    if (els.syncBtn) els.syncBtn.disabled = true;
    if (els.syncBtnBlue) els.syncBtnBlue.disabled = true;
    updateStatusLine(currentVitals, 'loading');
    animateValues();
    if (experienceMode === 'red') rain?.burst();

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
                    setSyncLabel(err.message || 'OURA UNREACHABLE', 'last-sync error');
                    throw err;
                }
                vitals = demoVitals();
                vitals.source = 'demo';
                setSyncLabel(`${err.message} — DEMO DATA`, 'last-sync stale');
            }
        }
        setCachedVitals(vitals);
        renderVitals(vitals, 'success');
    } catch { /* handled */ } finally {
        syncing = false;
        if (els.syncBtn) els.syncBtn.disabled = false;
        if (els.syncBtnBlue) els.syncBtnBlue.disabled = false;
    }
}

function setupAutoSync() {
    if (autoSyncTimer) clearInterval(autoSyncTimer);
    if (!getAutoSync()) return;
    autoSyncTimer = setInterval(() => {
        if (!document.hidden) syncVitals();
    }, AUTO_SYNC_MS);
}

/* ── Startup flow ── */

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
    bindLiquidButtons();

    runWakeUpSequence($('wake-container'), input => {
        wakeInput = input;
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') enterSimulation();
            if (input.value.toUpperCase().includes('WHITE RABBIT')) enterSimulation();
        });
    });
}

async function enterSimulation() {
    await playPortalTransition();
    await transitionToScreen('screen-pill', 'none');
    bindLiquidButtons();
}

async function choosePill(mode) {
    experienceMode = mode;
    setMode(mode);

    if (mode === 'blue') {
        document.body.classList.add('blue-pill');
        rain.stop();
        setBodyPhase('phase-hud');

        // Blue pill: no transition animation — instant minimal HUD
        await showScreenInstant('screen-hud');
        $('screen-hud')?.classList.add('blue-enter');
        setTimeout(() => $('screen-hud')?.classList.remove('blue-enter'), 400);
        bindLiquidButtons();
        await syncVitals({ forceDemo: !getToken() });
        return;
    }

    // Red pill: full cinematic transition → boot → tactical HUD
    document.body.classList.add('red-pill');
    await playRedPillTransition();
    await transitionToScreen('screen-boot', 'none');
    setBodyPhase('phase-boot');
    rain.setIntensity(0.7);
    rain.start(0.7);

    radar = initRadar($('boot-radar'));
    radar.start();

    runBootSequence($('boot-terminal'), $('boot-progress-fill'), async () => {
        radar.stop();
        await playRedHudReveal();
        await transitionToScreen('screen-hud', 'none');
        setBodyPhase('phase-hud');
        rain.setIntensity(0.3);
        rain.start(0.3);
        startHudDecorations();
        bindLiquidButtons();
        await syncVitals();
    });
}

function startHudDecorations() {
    if (experienceMode !== 'red') return;
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
    bindLiquidButtons();
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
            if ($('screen-hud')?.classList.contains('active') && experienceMode === 'red') openSettings();
        }
        if (e.key === 'f' || e.key === 'F') toggleFocus();
    });
}

function toggleFocus() {
    if (experienceMode !== 'red') return;
    focusMode = !focusMode;
    document.body.classList.toggle('focus-mode', focusMode);
    if (focusMode) {
        rain?.stop();
        duckAmbience();
    } else {
        rain?.start(0.25);
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
    els.syncBtn?.addEventListener('click', () => syncVitals());
    els.syncBtnBlue?.addEventListener('click', () => syncVitals());
    $('settings-btn')?.addEventListener('click', openSettings);
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