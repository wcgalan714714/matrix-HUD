const OURA_BASE = 'https://api.ouraring.com/v2/usercollection';

function today() {
    return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

async function ouraFetch(path, token) {
    const res = await fetch(`${OURA_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) throw new Error('Token invalid — check settings');
    if (!res.ok) throw new Error('Oura unreachable');
    return res.json();
}

function latestEntry(items) {
    if (!items?.length) return null;
    return items[items.length - 1];
}

function readinessLabel(score) {
    if (score >= 85) return 'Optimal';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Moderate';
    return 'Low — consider rest';
}

function hrvLabel(ms) {
    if (ms >= 70) return 'Excellent recovery';
    if (ms >= 50) return 'Balanced';
    if (ms >= 35) return 'Below baseline';
    return 'Recovery needed';
}

function hrTrend(hr, avg) {
    if (!avg) return 'Stable';
    const diff = hr - avg;
    if (diff > 2) return `↑ ${Math.round(diff)} from avg`;
    if (diff < -2) return `↓ ${Math.abs(Math.round(diff))} from avg`;
    return '→ Near average';
}

export async function fetchVitals(token) {
    const start = daysAgo(2);
    const end = today();

    const [readinessRes, sleepRes, activityRes, hrRes] = await Promise.all([
        ouraFetch(`/daily_readiness?start_date=${start}&end_date=${end}`, token),
        ouraFetch(`/daily_sleep?start_date=${start}&end_date=${end}`, token),
        ouraFetch(`/daily_activity?start_date=${start}&end_date=${end}`, token),
        ouraFetch(`/heartrate?start_datetime=${daysAgo(1)}T00:00:00&end_datetime=${end}T23:59:59`, token),
    ]);

    const readiness = latestEntry(readinessRes.data);
    const sleep = latestEntry(sleepRes.data);
    const activity = latestEntry(activityRes.data);

    const restingSamples = (hrRes.data || []).filter(s => s.source === 'rest');
    const latestHr = restingSamples.length
        ? restingSamples[restingSamples.length - 1]
        : (hrRes.data || [])[(hrRes.data || []).length - 1];

    const readinessScore = readiness?.score ?? null;
    const sleepScore = sleep?.score ?? null;
    const hrv = sleep?.average_hrv ?? readiness?.contributors?.hrv_balance ?? null;
    const restingHr = latestHr?.bpm ?? null;
    const activityScore = activity?.score ?? null;
    const steps = activity?.steps ?? null;

    return {
        readiness: readinessScore,
        sleep: sleepScore,
        hrv,
        restingHr,
        activity: activityScore,
        steps,
        readinessMeta: readinessScore != null ? readinessLabel(readinessScore) : '—',
        sleepMeta: 'Last night',
        hrvMeta: hrv != null ? hrvLabel(hrv) : '—',
        hrMeta: restingHr != null ? hrTrend(restingHr, 60) : '—',
        activityMeta: steps != null ? `${steps.toLocaleString()} steps` : '—',
        syncedAt: Date.now(),
        source: 'oura',
    };
}

export function demoVitals() {
    const readiness = Math.floor(72 + Math.random() * 22);
    const sleep = Math.floor(68 + Math.random() * 26);
    const hrv = Math.floor(45 + Math.random() * 40);
    const restingHr = Math.floor(54 + Math.random() * 12);
    const steps = Math.floor(3000 + Math.random() * 9000);

    return {
        readiness,
        sleep,
        hrv,
        restingHr,
        activity: Math.floor(60 + Math.random() * 35),
        steps,
        readinessMeta: readinessLabel(readiness),
        sleepMeta: 'Last night',
        hrvMeta: hrvLabel(hrv),
        hrMeta: hrTrend(restingHr, 60),
        activityMeta: `${steps.toLocaleString()} steps`,
        syncedAt: Date.now(),
        source: 'demo',
    };
}