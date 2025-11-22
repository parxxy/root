// Simple Express proxy to keep the Gemini API key on the server
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '1mb' }));

app.post('/api/gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    res.json({ text });
  } catch (err) {
    console.error('Gemini proxy error', err);
    res.status(500).json({ error: 'Gemini request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini proxy listening on port ${PORT}`);
});
