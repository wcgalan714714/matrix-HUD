import { fetchVitals, demoVitals } from './oura-client.js';
import {
    getToken, setToken, getAutoSync, setAutoSync,
    getMode, setMode, getCachedVitals, setCachedVitals,
} from './storage.js';
import { initMatrixRain } from './matrix-rain.js';
import { bindLiquidButtons, playCascade, runBootSequence, showScreen } from './startup.js';

const AUTO_SYNC_MS = 30 * 60 * 1000;
const STALE_MS = 15 * 60 * 1000;

let rain = null;
let autoSyncTimer = null;
let syncing = false;
let focusMode = false;
let currentVitals = null;

const els = {};

function $(id) {
    return document.getElementById(id);
}

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
    const hrs = Math.floor(mins / 60);
    return `${hrs} HR AGO`;
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
    els.warningBanner.textContent = 'WARNING — READINESS LOW — CONSIDER REST';
    els.warningBanner.classList.remove('hidden');
}

function animateValues() {
    document.querySelectorAll('.vital-value').forEach(v => v.classList.add('updating'));
    setTimeout(() => {
        document.querySelectorAll('.vital-value').forEach(v => v.classList.remove('updating'));
    }, 500);
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
    const label = state === 'error' ? 'SYNC FAILED' : `LAST SYNC: ${formatSyncTime(vitals.syncedAt)}`;
    els.lastSync.textContent = label;
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
    } catch {
        // error state already rendered from cache path
    } finally {
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

function openSettings() {
    els.tokenInput.value = getToken();
    els.autoToggle.classList.toggle('on', getAutoSync());
    showScreen('screen-settings');
}

function closeSettings() {
    showScreen('screen-hud');
}

function saveSettings() {
    setToken(els.tokenInput.value);
    setAutoSync(els.autoToggle.classList.contains('on'));
    setupAutoSync();
    closeSettings();
    syncVitals();
}

function choosePill(mode) {
    setMode(mode);
    document.body.classList.toggle('blue-pill', mode === 'blue');

    if (mode === 'blue') {
        playCascade(() => {
            showScreen('screen-hud');
            if (rain) rain.stop();
            syncVitals({ forceDemo: !getToken() });
        });
        return;
    }

    playCascade(() => {
        showScreen('screen-boot');
        const terminal = $('boot-terminal');
        runBootSequence(terminal, () => {
            playCascade(() => {
                showScreen('screen-hud');
                if (rain) rain.start(0.25);
                syncVitals();
            });
        });
    });
}

function setupVoiceHints() {
    const hints = [
        '"Show vitals"  •  "How\'s my recovery?"',
        '"Sync"  •  "Focus mode"  •  "Settings"',
    ];
    let i = 0;
    const el = $('voice-hints');
    if (!el) return;
    el.textContent = hints[0];
    setInterval(() => {
        i = (i + 1) % hints.length;
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = hints[i];
            el.style.opacity = '0.65';
        }, 300);
    }, 8000);
}

function setupMotionContext() {
    if (!window.DeviceMotionEvent) return;
    let last = 0;
    window.addEventListener('devicemotion', e => {
        const a = e.accelerationIncludingGravity || e.acceleration;
        if (!a) return;
        const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
        const delta = Math.abs(mag - last);
        last = mag;
        if (delta > 2.5 && rain) rain._intensity = Math.min(0.7, (rain._intensity || 0.3) + 0.08);
    });
    setInterval(() => {
        if (rain) rain._intensity = Math.max(0.2, (rain._intensity || 0.3) * 0.92);
    }, 2000);
}

function setupKeyboard() {
    document.addEventListener('keydown', e => {
        if (e.key === 's' || e.key === 'S') openSettings();
        if (e.key === 'f' || e.key === 'F') toggleFocus();
        if (e.key === 'Enter' && $('screen-pill').classList.contains('active')) return;
    });
}

function toggleFocus() {
    focusMode = !focusMode;
    document.body.classList.toggle('focus-mode', focusMode);
    if (focusMode && rain) rain.stop();
    else if (!document.body.classList.contains('blue-pill') && rain) rain.start(0.2);
    addLog(focusMode ? 'FOCUS MODE ON' : 'FOCUS MODE OFF');
}

function addLog(msg) {
    const el = $('status-line');
    if (el) el.textContent = msg;
    setTimeout(() => updateStatusLine(currentVitals, 'success'), 2000);
}

function boot() {
    cacheElements();
    bindLiquidButtons();

    const canvas = $('matrix-canvas');
    rain = initMatrixRain(canvas);

    $('pill-red').addEventListener('click', () => choosePill('red'));
    $('pill-blue').addEventListener('click', () => choosePill('blue'));
    els.syncBtn.addEventListener('click', () => syncVitals());
    $('settings-btn').addEventListener('click', openSettings);
    $('settings-close').addEventListener('click', closeSettings);
    $('settings-save').addEventListener('click', saveSettings);
    els.autoToggle.addEventListener('click', () => els.autoToggle.classList.toggle('on'));

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && rain) rain.stop();
        else if (!document.hidden && !document.body.classList.contains('blue-pill') && !focusMode && getMode()) {
            rain?.start(0.25);
        }
    });

    setupVoiceHints();
    setupMotionContext();
    setupKeyboard();
    setupAutoSync();

    const saved = getCachedVitals();
    if (saved) currentVitals = saved;

    const priorMode = getMode();
    if (priorMode) {
        document.body.classList.toggle('blue-pill', priorMode === 'blue');
        showScreen('screen-hud');
        if (priorMode === 'red' && rain) rain.start(0.25);
        renderVitals(saved || demoVitals(), saved ? 'success' : 'success');
        if (!saved) syncVitals({ forceDemo: !getToken() });
    } else {
        showScreen('screen-pill');
    }
}

document.addEventListener('DOMContentLoaded', boot);