# SYNTH — Neural Companion HUD

**A glanceable personal vitals dashboard for Meta Ray-Ban Display glasses.**

SYNTH displays health and readiness data from your Oura Ring 5 directly in your field of view — reducing the need to check your phone.

**Tagline**: *See yourself clearly.*

Built from the [NoPhoneMetaApp](https://github.com/wcgalan714714/matrix-HUD) Obsidian research vault.

## Vision

A calm, premium, always-available **neural companion** that shows your most important body signals in a highly glanceable format optimized for the small glasses HUD.

## Core Features

### MVP
- **Main HUD View** — Readiness, Sleep, HRV, Resting HR, Activity, Steps in a 2×3 glassmorphism grid
- **Red Pill / Blue Pill** — Full Matrix experience vs. minimal static vitals (accessibility)
- **Wake Up Boot Sequence** — Terminal startup with NERV-style system lines
- **Manual Sync** — `FORCE SYNC` liquid button (primary refresh method)
- **Oura Ring 5 API** — Personal Access Token stored locally
- **Settings** — Token input, optional 30-min auto-sync toggle
- **Context-aware status** — Time-of-day greeting, low-readiness warning banner
- **Demo fallback** — Works without token for testing on glasses

### Design System (from vault)
- **Primary**: `#00FF41` (Matrix green)
- **Accent**: `#FFB800` (amber)
- **Alert**: `#FF3B5C`
- **Background**: `#0A0F0A`
- **Style**: Glassmorphism + Evangelion tactical panels + calm Matrix rain
- **Typography**: VT323 (data) + Inter (labels)
- **Motion**: Subtle scanlines, liquid buttons, cascade transitions — no aggressive glitches

## Technical Stack

- Pure static HTML/CSS/JS (ES modules, no build step)
- Deployed on Vercel via GitHub
- Optimized for ~600×600px Meta Ray-Ban Display HUD
- Event-driven sync (not aggressive polling)
- Privacy-first: Oura token never leaves the device

## Project Structure

```
matrix-HUD/
├── index.html
├── css/
│   ├── tokens.css      # Design tokens
│   ├── layout.css      # HUD layout, scanlines, screens
│   └── components.css  # Cards, liquid buttons, boot terminal
├── js/
│   ├── app.js          # Main app orchestration
│   ├── oura-client.js  # Oura API client
│   ├── storage.js      # Local token & cache
│   ├── matrix-rain.js  # Subtle background rain
│   └── startup.js      # Pill choice, boot, transitions
└── vercel.json
```

## Deployment (Vercel + GitHub)

1. Push to `main` on GitHub (`wcgalan714714/matrix-HUD`)
2. Vercel auto-deploys from the connected repo
3. Add the production URL in Meta AI app → **Settings → Web Apps**

## Using on Glasses

1. Enable **Developer Mode** on Meta Ray-Ban Display (Meta AI app)
2. Add your Vercel URL under **Web Apps**
3. Launch from glasses HUD menu
4. Choose **Red Pill** (full experience) or **Blue Pill** (minimal)
5. Open **Settings** (⚙) and paste your Oura Personal Access Token
6. Tap **FORCE SYNC** to pull live vitals

## Local Testing

```bash
cd matrix-HUD
python -m http.server 8080
# Open http://localhost:8080
```

> ES modules require a local server — do not open `index.html` directly as `file://`.

## Keyboard Shortcuts (desktop testing)

- `S` — Settings
- `F` — Focus mode (dims effects)

## Notes

- Inspired by Matrix + Evangelion tactical interfaces
- Follows Herald hub best practices: glanceable, shallow nav, voice-first hints
- Not affiliated with Warner Bros., Meta, Oura, or Gainax

---

**Status**: Full revamp complete per NoPhoneMetaApp vault spec.