# MATRIX • HUD — Meta Ray-Ban Display Glasses Web App

A reactive Matrix-themed augmented reality experience optimized for the Meta Ray-Ban Display glasses HUD.

## Features
- Reactive green code rain that responds to your movement and environment
- Live microphone audio processing (echo, filtering, glitch effects)
- Generative audio layers (drone + texture)
- Motion detection (walking increases intensity)
- Glitch events with classic Matrix quotes
- Multiple modes: Subtle / Glitch Protocol / Agent Pursuit
- Red Pill toggle for high-tension mode

## Deployment (Vercel)

This is a static single-file app. Deploy with one click:

### Recommended: GitHub + Vercel (best for updates)
1. Create a new GitHub repo
2. Upload `index.html` and `vercel.json` to the repo
3. Go to [vercel.com](https://vercel.com) → Import Project → select the GitHub repo
4. Deploy (it will auto-detect)

### Quick Deploy (no Git)
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project** → **Import Third-Party Git Repository** or use the dashboard upload if available
3. Or use Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```
   Follow the prompts (it will detect the static site)

After deployment, copy the production URL (e.g. `https://matrix-hud.vercel.app`).

## Using on Your Glasses

1. Make sure **Developer Mode** is enabled on your Meta Ray-Ban Display glasses (in the Meta AI phone app).
2. In the Meta AI app:
   - Go to **Settings** → **App Connections** → **Web Apps**
   - Add your deployed URL
3. On the glasses, launch the app from the HUD menu or via the phone app.
4. Grant microphone permission when prompted.
5. **Recommended**: Use with headphones for the best augmented audio experience.
6. Move around, talk, or clap — watch the simulation react on your glasses display.

## Local Testing
Just open `index.html` in any modern browser (Chrome/Firefox/Safari recommended).  
For full mic + motion features, use on a mobile device or allow permissions in desktop browser.

## Notes
- This is a fan recreation inspired by the 2010 *Inception – The App* concept, rethemed for *The Matrix*.
- Not affiliated with Warner Bros., Meta, or the original developers.
- Best experienced while moving through the real world ("play this app with your life").

Enjoy the simulation, Neo.
