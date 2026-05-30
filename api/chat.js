// Vercel serverless function — proxies requests to the Google Gemini API (free tier).
// This keeps your GEMINI_API_KEY on the server, never exposed in the browser.
// Get a free key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in
// your Vercel project's Environment Variables. Optionally set GEMINI_MODEL to override
// the default model (e.g. gemini-2.5-flash-lite).

export default async function handler(req, res) {
  // CORS (same-origin in prod, but helps local dev)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY not configured. Add it in your Vercel project settings → Environment Variables. Get a free key at https://aistudio.google.com/apikey.'
    });
  }

  try {
    const { system, messages, model, max_tokens } = req.body || {};
    const useModel = model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    // Map our chat format (role: user|assistant) → Gemini contents (role: user|model).
    const contents = (messages || [])
      .filter(m => m && m.content != null)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content) }],
      }));

    const body = {
      contents,
      generationConfig: { maxOutputTokens: max_tokens || 1024 },
    };
    if (system) {
      body.systemInstruction = { parts: [{ text: String(system) }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(useModel)}:generateContent`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message || `Gemini API error (${geminiRes.status})`;
      return res.status(geminiRes.status).json({ error: msg });
    }

    // A blocked prompt returns no candidates.
    if (data.promptFeedback?.blockReason) {
      return res.status(200).json({ error: `Request blocked: ${data.promptFeedback.blockReason}` });
    }

    const cand = data.candidates?.[0];
    const text = cand?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';

    if (!text) {
      const reason = cand?.finishReason ? ` (finishReason: ${cand.finishReason})` : '';
      return res.status(200).json({ error: `Gemini returned no text${reason}.` });
    }

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
