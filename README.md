# ZDF Rosamunde Pilcher Collection - Stremio Add-on (Vercel Serverless)

A custom Stremio add-on built with Node.js and `@stremio/stremio-addon-sdk`, tailored for **100% free serverless deployment on Vercel**. It streams the German romance TV-movie collection "Rosamunde Pilcher" directly from ZDF (ZDFmediathek) using the public MediathekViewWeb search API.

## Project Structure
```text
rosamunder/
├── api/
│   └── index.js      # Serverless function entry point with Stremio router export
├── package.json      # Dependencies and main entry ("api/index.js")
├── vercel.json       # Vercel rewrite configuration for routing all Stremio requests to api/index.js
└── README.md         # Deployment & usage instructions
```

## How It Works on Vercel
1. **Serverless Router**: Instead of a continuous port listener via `serveHTTP`, `api/index.js` exports an Express-compatible middleware handler.
2. **Global Rewrites (`vercel.json`)**: Rewrites all root-level Stremio protocol requests (`/manifest.json`, `/catalog/...`, `/meta/...`, `/stream/...`) directly into `api/index.js`.
3. **No Long-Running Server Needed**: Vercel boots the function on demand, fetches the live HLS stream from ZDF/MediathekViewWeb, and serves it to Stremio.

## Deploying to Vercel

### Option 1: Via Vercel CLI (Quickest)
1. Install Vercel CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```
2. In the project root directory, run:
   ```bash
   vercel
   ```
3. Follow the on-screen prompts (accept defaults). When complete, Vercel gives you your live URL (e.g., `https://rosamunde-pilcher-zdf.vercel.app`).

### Option 2: Via GitHub / GitLab / Bitbucket
1. Push this folder to a GitHub repository.
2. Open the [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository.
4. Keep all build and output settings as default and click **Deploy**.

## Installing into Stremio

Once deployed to Vercel:
1. Copy your deployment's manifest link:
   ```text
   https://<your-vercel-domain>.vercel.app/manifest.json
   ```
2. Open **Stremio** (Desktop, Web, Android, or Android TV).
3. Go to the **Add-ons** page.
4. Paste the URL into the search bar and click **Install**.
5. You can also install directly via the protocol link in your browser:
   ```text
   stremio://<your-vercel-domain>.vercel.app/manifest.json
   ```
6. Navigate to **Discover** -> **Movies** -> Select the **Rosamunde Pilcher (ZDF)** catalog row!

## Expanding the Episode Database (120+ Episodes)

In [`api/index.js`](file:///c:/Users/krata/Downloads/rosamunder/api/index.js), locate the `EPISODES` array and append new items:

```javascript
{
  id: 'rp_006',
  type: 'movie',
  name: 'Rosamunde Pilcher: Das Geheimnis der Blumeninsel',
  poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
  description: 'Kurzbeschreibung der Episode hier eintragen...'
}
```
Deploying new episodes takes just a `git push` or running `vercel --prod`.
