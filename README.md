# Health × Gemini

Connect your Fitbit Air / Google Health data to Google Gemini AI. Deployable to Vercel in minutes.

## What it does
- Authenticates with Google Health API v4 (OAuth) to pull your Fitbit Air metrics
- Displays steps, heart rate, sleep, SpO2, calories, HRV
- Lets you chat with Gemini, which gets your health data as context
- Keeps your Gemini API key server-side via a Vercel serverless function

## Deploy to Vercel

1. **Push to GitHub** — upload this folder to a new repo.
2. **Import to Vercel** — go to https://vercel.com/new and import the repo. No build settings needed.
3. **Add your Gemini key** — get a free key at https://aistudio.google.com/apikey, then in Vercel → Project → Settings → Environment Variables, add:
   - Key: `GEMINI_API_KEY`
   - Value: your `AIza...` key
   - (optional) Key: `GEMINI_MODEL`, Value: e.g. `gemini-2.5-flash-lite` to override the default model
   - Then **redeploy**.
4. **Note your URL** — e.g. `https://your-project.vercel.app`

## Google Cloud setup

1. Create a project at https://console.cloud.google.com
2. APIs & Services → Library → enable **Google Health API**
3. OAuth consent screen → External → add your Gmail as a **Test user**
4. Credentials → Create OAuth Client ID → **Web application**
5. Under **Authorized redirect URIs**, add your Vercel URL (exactly — shown on the app's Setup page)
6. Add scopes: `googlehealth.activity_and_fitness.readonly`, `googlehealth.health_metrics_and_measurements.readonly`, `googlehealth.sleep.readonly`
7. Copy the **Client ID** into the app's Setup page

## Local development
```
npm i -g vercel
vercel dev
```
Set `GEMINI_API_KEY` locally with `vercel env` or a `.env` file.

## File structure
```
health-gemini/
├── api/chat.js        serverless Gemini proxy
├── public/index.html  the app
├── vercel.json        config
├── package.json
└── README.md
```

## Notes
- **Historical data bank** — every time you tap **Refresh Data**, the fetched readings are merged into a real SQLite database (via sql.js/WebAssembly) stored in your browser's IndexedDB. History accumulates across sessions and survives reloads, building a growing personal trend bank. The charts and the Gemini context draw from this full history; the metric cards show today's snapshot (UTC+7). Use **Clear history** on the Health Data page to wipe it. The bank is per-browser/per-device and never leaves your machine.
- **SpO2 / breathing rate** may return no data in some regions (e.g. Thailand) due to Google's regional restrictions. Steps, HR, sleep, and calories work everywhere.
- Google Health API v4 is free for personal use. The Gemini API has a free tier — see https://ai.google.dev/gemini-api/docs/rate-limits for current limits.
- Your data stays between your browser, Google, and your own Vercel function. Nothing is logged or stored externally.
