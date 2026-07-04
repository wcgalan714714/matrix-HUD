const STORAGE_KEYS = {
    token: 'synth_oura_token',
    autoSync: 'synth_auto_sync',
    mode: 'synth_mode',
    cache: 'synth_vitals_cache',
};

export function getToken() {
    return localStorage.getItem(STORAGE_KEYS.token) || '';
}

export function setToken(token) {
    localStorage.setItem(STORAGE_KEYS.token, token.trim());
}

export function getAutoSync() {
    return localStorage.getItem(STORAGE_KEYS.autoSync) === 'true';
}

export function setAutoSync(enabled) {
    localStorage.setItem(STORAGE_KEYS.autoSync, enabled ? 'true' : 'false');
}

export function getMode() {
    return localStorage.getItem(STORAGE_KEYS.mode) || '';
}

export function setMode(mode) {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
}

export function getCachedVitals() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.cache);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setCachedVitals(vitals) {
    localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify({
        ...vitals,
        cachedAt: Date.now(),
    }));
}