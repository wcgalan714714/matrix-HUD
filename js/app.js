import { fetchVitals, demoVitals } from './oura-client.js';
import {
    getToken, setToken, getAutoSync, setAutoSync,
    setMode, getCachedVitals, setCachedVitals, clearMode,
} from './storage.js';
import { initMatrixRain } from './matrix-rain.js';
import { initRadar } from './radar.js';
import {
    bindLiquidButtons, runPreloader, runWakeUpSequence, runBootSequence,
    startHexTicker, startMarquee, startBlueTicker,
} from './startup.js';
import {
    navigateTo, playBlockReveal, playCascade, playMatrixGlitchReveal,
    playWhiteRabbit, playBlinds, playFileParsing, showScreenInstant,
} from './transitions.js';
import { duckAmbience, restoreAmbience } from './ambience.js';

const AUTO_SYNC_MS = 30 * 1000;
const STALE_MS = 2 * 60 * 1000;

let rain = null;
let radar = null;
let autoSyncTimer = null;
let syncing = false;
let focusMode = false;
let currentVitals = null;
let experienceMode = null;

const els = {};

function $(id) { return document.getElementById(id); }

function hudScreenId() {
    return experienceMode === 'blue' ? 'screen-hud-blue' : 'screen-hud-red';
}

function cacheElements() {
    els.statusLine = $('status-line');
    els.warningBanner = $('warning-banner');
    els.syncBtn = $('sync-btn');
    els.syncBtnBlue = $('sync-btn-blue');
    els.tokenInput = $('token-input');
    els.autoToggle = $('auto-toggle');
    els.tokenStatusDot = $('token-status-dot');
    els.tokenStatusLabel = $('token-status-label');
    els.hudErrorRed = $('hud-error-red');
    els.hudErrorBlue = $('hud-error-blue');
    els.syncDotRed = $('sync-dot-red');
    els.syncDotBlue = $('sync-dot-blue');
    els.tokenPillRed = $('token-pill-red');
    els.tokenPillBlue = $('token-pill-blue');
}

function setBodyPhase(phase) {
    document.body.className = phase;
    if (experienceMode === 'red') document.body.classList.add('mode-red');
    if (experienceMode === 'blue') document.body.classList.add('mode-blue');
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
    if (!ts) return 'NEVER';
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 8) return 'JUST NOW';
    if (secs < 60) return `${secs}S AGO`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}M AGO`;
    return `${Math.floor(mins / 60)}H AGO`;
}

function setLoadingState(loading) {
    document.querySelectorAll('[data-sync-loading]').forEach(el => {
        el.classList.toggle('hidden', !loading);
    });
    document.querySelectorAll('[data-vitals-panel]').forEach(el => {
        el.classList.toggle('is-syncing', loading);
    });
    [els.syncDotRed, els.syncDotBlue].forEach(dot => {
        if (!dot) return;
        dot.classList.toggle('loading', loading);
        if (loading) dot.classList.remove('live', 'error');
    });
}

function setSyncDotState(state) {
    const dots = [els.syncDotRed, els.syncDotBlue].filter(Boolean);
    dots.forEach(dot => {
        dot.classList.remove('live', 'loading', 'error');
        if (state) dot.classList.add(state);
    });
}

function showHudError(message) {
    const el = experienceMode === 'blue' ? els.hudErrorBlue : els.hudErrorRed;
    if (!el) return;
    if (!message) {
        el.classList.add('hidden');
        el.textContent = '';
        return;
    }
    el.textContent = message;
    el.classList.remove('hidden');
}

function updateTokenIndicators(state = 'idle') {
    const hasToken = !!getToken();
    [els.tokenPillRed, els.tokenPillBlue].forEach(pill => {
        if (!pill) return;
        if (hasToken) {
            pill.classList.add('hidden');
        } else {
            pill.textContent = 'NO TOKEN — DEMO DATA';
            pill.classList.remove('hidden');
        }
    });
    if (els.tokenStatusDot && els.tokenStatusLabel) {
        els.tokenStatusDot.classList.remove('live', 'loading', 'error');
        if (state === 'loading') {
            els.tokenStatusDot.classList.add('loading');
            els.tokenStatusLabel.textContent = 'TESTING CONNECTION...';
            els.tokenStatusLabel.className = 'token-status-label';
        } else if (!hasToken) {
            els.tokenStatusLabel.textContent = 'NOT CONFIGURED';
            els.tokenStatusLabel.className = 'token-status-label';
        } else if (state === 'error') {
            els.tokenStatusDot.classList.add('error');
            els.tokenStatusLabel.textContent = 'CONNECTION FAILED';
            els.tokenStatusLabel.className = 'token-status-label error';
        } else if (state === 'connected') {
            els.tokenStatusDot.classList.add('live');
            els.tokenStatusLabel.textContent = 'OURA RING 5 LINKED';
            els.tokenStatusLabel.className = 'token-status-label connected';
        } else {
            els.tokenStatusDot.classList.add('live');
            els.tokenStatusLabel.textContent = 'TOKEN SAVED';
            els.tokenStatusLabel.className = 'token-status-label connected';
        }
    }
}

function updateStatusLine(vitals, state) {
    if (!els.statusLine || experienceMode !== 'red') return;
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
    if (!els.warningBanner || experienceMode !== 'red') return;
    if (!vitals || vitals.readiness == null || vitals.readiness >= 55) {
        els.warningBanner.classList.add('hidden');
        return;
    }
    els.warningBanner.textContent = '⚠ WARNING — READINESS LOW — CONSIDER REST';
    els.warningBanner.classList.remove('hidden');
}

function animateValues() {
    const pulseClass = experienceMode === 'blue' ? 'sync-pulse' : 'sync-pulse';
    document.querySelectorAll(`#${hudScreenId()} .vital-value`).forEach(v => {
        v.classList.add(pulseClass);
        setTimeout(() => v.classList.remove(pulseClass), 600);
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
    if (experienceMode === 'red') {
        setVital('steps', vitals.steps != null ? vitals.steps.toLocaleString() : dash);
    }
    setMeta('activity', vitals.activityMeta || '—');

    setMeta('readiness', vitals.readinessMeta || '—');
    setMeta('sleep', vitals.sleepMeta || 'Last night');
    setMeta('hrv', vitals.hrvMeta || '—');
    setMeta('hr', vitals.hrMeta || '—');

    const age = vitals.syncedAt ? Date.now() - vitals.syncedAt : Infinity;
    const label = state === 'error' ? 'SYNC FAILED' : `LAST SYNC: ${formatSyncTime(vitals.syncedAt)}`;
    const syncClass = 'last-sync' + (age > STALE_MS ? ' stale' : '') + (state === 'error' ? ' error' : '');
    setSyncLabel(label, syncClass);

    updateStatusLine(vitals, state);
    updateWarning(vitals);
    updateTokenIndicators(state === 'error' ? 'error' : getToken() ? 'connected' : 'idle');
    if (state !== 'error') showHudError(null);
}

async function syncVitals({ forceDemo = false } = {}) {
    if (syncing) return;
    syncing = true;
    if (els.syncBtn) els.syncBtn.disabled = true;
    if (els.syncBtnBlue) els.syncBtnBlue.disabled = true;
    setLoadingState(true);
    updateStatusLine(currentVitals, 'loading');
    setSyncLabel('SYNCING...', 'last-sync');
    animateValues();
    if (experienceMode === 'red') rain?.burst();

    const token = getToken();
    try {
        let vitals;
        if (!token || forceDemo) {
            await wait(400);
            vitals = demoVitals();
            if (!token) vitals.source = 'demo';
        } else {
            try {
                vitals = await fetchVitals(token);
            } catch (err) {
                const cached = getCachedVitals();
                const msg = err.message || 'OURA UNREACHABLE';
                showHudError(`⚠ ${msg}`);
                setSyncDotState('error');
                updateTokenIndicators('error');
                if (cached) {
                    renderVitals({ ...cached, source: 'cache' }, 'error');
                    setSyncLabel(`CACHED · ${msg}`, 'last-sync error');
                } else {
                    vitals = demoVitals();
                    vitals.source = 'demo';
                    renderVitals(vitals, 'error');
                    setSyncLabel(`${msg} — DEMO FALLBACK`, 'last-sync error');
                }
                return;
            }
        }
        setCachedVitals(vitals);
        renderVitals(vitals, 'success');
        setSyncDotState('live');
    } finally {
        syncing = false;
        setLoadingState(false);
        if (els.syncBtn) els.syncBtn.disabled = false;
        if (els.syncBtnBlue) els.syncBtnBlue.disabled = false;
    }
}

function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
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
    rain.start(0.9);

    await runPreloader(pct => {
        $('preloader-fill').style.width = `${pct}%`;
        $('preloader-pct').textContent = `${String(pct).padStart(3, '0')}%`;
        if (pct > 60) $('preloader-status').textContent = 'DECRYPTING NEURAL PATHWAY...';
        if (pct > 85) $('preloader-status').textContent = 'MATRIX PROTOCOL READY';
        if (pct > 95) $('preloader-status').textContent = 'GLITCH REVEAL IMMINENT...';
    }, $('preloader-terminal'));

    rain?.burst();
    await playMatrixGlitchReveal();

    showScreenInstant('screen-wake');
    $('screen-wake')?.classList.add('wake-zoom');
    setTimeout(() => $('screen-wake')?.classList.remove('wake-zoom'), 700);
    setBodyPhase('phase-wake');
    rain.setIntensity(0.5);
    bindLiquidButtons();

    const enterBtn = $('enter-btn');
    enterBtn?.classList.add('wake-btn-hidden');

    runWakeUpSequence($('wake-container'), () => {
        enterBtn?.classList.remove('wake-btn-hidden');
        enterBtn?.classList.add('wake-btn-reveal');
        bindLiquidButtons();
    });
}

async function enterSimulation() {
    await playBlockReveal('CHOICE PROTOCOL');
    await playWhiteRabbit();
    await playCascade('rise');
    showScreenInstant('screen-pill');
    $('screen-pill')?.classList.add('entering');
    setTimeout(() => $('screen-pill')?.classList.remove('entering'), 520);
    bindLiquidButtons();
}

async function choosePill(mode) {
    experienceMode = mode;
    setMode(mode);

    if (mode === 'blue') {
        rain.stop();
        setBodyPhase('phase-hud');
        await navigateTo('screen-hud-blue', { effect: 'binary', enterClass: 'blue-enter' });
        startBlueDecorations();
        bindLiquidButtons();
        await syncVitals({ forceDemo: !getToken() });
        return;
    }

    await playCascade('rise');
    showScreenInstant('screen-boot');
    $('screen-boot')?.classList.add('entering');
    setTimeout(() => $('screen-boot')?.classList.remove('entering'), 520);
    setBodyPhase('phase-boot');
    document.body.classList.add('mode-red');
    rain.setIntensity(0.65);
    rain.start(0.65);
    bindLiquidButtons();

    radar = initRadar($('boot-radar'));
    radar.start();

    runBootSequence($('boot-terminal'), $('boot-progress-fill'), async () => {
        radar.stop();
        await playBlockReveal('NEURAL LINK');
        await playCascade('fall');
        setBodyPhase('phase-hud');
        showScreenInstant('screen-hud-red');
        $('screen-hud-red')?.classList.add('entering');
        setTimeout(() => $('screen-hud-red')?.classList.remove('entering'), 520);
        rain.setIntensity(0.3);
        rain.start(0.3);
        startHudDecorations();
        bindLiquidButtons();
        await syncVitals();
    });
}

function startHudDecorations() {
    startMarquee($('top-marquee'));
    startHexTicker($('hex-ticker'));
}

function startBlueDecorations() {
    startBlueTicker($('blue-hex-ticker'));
}

async function openSettings() {
    els.tokenInput.value = getToken();
    els.autoToggle.classList.toggle('on', getAutoSync());
    els.autoToggle.setAttribute('aria-checked', getAutoSync() ? 'true' : 'false');
    updateTokenIndicators(getToken() ? 'connected' : 'idle');
    await playBlinds('close');
    await playFileParsing();
    showScreenInstant('screen-settings');
    await playBlinds('open');
    bindLiquidButtons();
}

async function closeSettings() {
    await playBlinds('close');
    showScreenInstant(hudScreenId());
    await playBlinds('open');
}

async function saveSettings() {
    setToken(els.tokenInput.value);
    const autoOn = els.autoToggle.classList.contains('on');
    setAutoSync(autoOn);
    els.autoToggle.setAttribute('aria-checked', autoOn ? 'true' : 'false');
    setupAutoSync();
    updateTokenIndicators('loading');
    await closeSettings();
    await syncVitals({ forceDemo: !getToken() });
}

function setupVoiceHints() {
    const el = $('voice-hints');
    if (!el) return;
    const hints = [
        '"Show vitals" · "How\'s my recovery?"',
        '"Sync" · "Focus mode" · "Settings"',
    ];
    let i = 0;
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
        if (e.key === 'Enter' && $('screen-wake')?.classList.contains('active')
            && !$('enter-btn')?.classList.contains('wake-btn-hidden')) enterSimulation();
        if (e.key === 's' || e.key === 'S') {
            if ($('screen-hud-red')?.classList.contains('active')
                || $('screen-hud-blue')?.classList.contains('active')) openSettings();
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
    $('settings-btn-blue')?.addEventListener('click', openSettings);
    $('settings-close').addEventListener('click', closeSettings);
    $('settings-save').addEventListener('click', saveSettings);
    els.autoToggle.addEventListener('click', () => {
        els.autoToggle.classList.toggle('on');
        els.autoToggle.setAttribute('aria-checked', els.autoToggle.classList.contains('on') ? 'true' : 'false');
    });

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
    updateTokenIndicators();
    runStartupFlow();
}

document.addEventListener('DOMContentLoaded', boot);