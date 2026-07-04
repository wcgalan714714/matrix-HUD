# SYNTH — Neural Companion HUD

**A glanceable personal vitals dashboard for Meta Ray-Ban Display glasses.**

SYNTH displays live health and readiness data from your Oura Ring 5 directly in your field of view — reducing the need to check your phone.

## Vision
A calm, premium, always-available neural overlay that shows your most important body signals (Readiness, Sleep, HRV, Resting HR) in a highly glanceable format optimized for the small glasses HUD.

**Tagline**: *See yourself clearly.*

## Core Features (MVP)
- **Main HUD View** — Four key vitals in a clean 2×2 glassmorphism grid
- **Manual + Gentle Auto Sync** — User-initiated refresh with subtle visual feedback
- **Premium Aesthetic** — Matrix green + amber accents, glassmorphism panels, subtle scanlines
- **Optimized for Glasses** — High contrast, large typography, no scrolling, <2 second glanceability

## Design System
- **Primary**: `#00FF41` (Matrix green)
- **Accent**: `#FFB800` (amber)
- **Alert**: `#FF3B5C`
- **Typography**: VT323 (monospace) + Inter (sans)
- **Motion**: Subtle, relaxing liquid-style transitions and soft scanlines

## Technical Stack
- Pure static HTML/CSS/JS (no build step)
- Deployed on Vercel
- Designed for Meta Ray-Ban Display glasses (Web App path)
- Future: Oura API integration with personal access token

## Deployment (Vercel)

This is a static single-file app.

### Recommended: GitHub + Vercel
1. Push to GitHub
2. Import repo into Vercel
3. Deploy (auto-detects static site)

After deployment, add the URL in the Meta AI app under **Web Apps**.

## Local Testing
Simply open `index.html` in any browser.

## Notes
- Built for the Meta Ray-Ban Display glasses HUD
- Privacy-first: All Oura data stays on-device
- Inspired by Matrix + Evangelion tactical interfaces
- Part of the NoPhoneMetaApp research vault

---

**Status**: MVP complete. Next: Real Oura API integration.
