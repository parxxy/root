// Simple Express proxy to keep the Gemini API key on the server
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS SETUP ---
// While developing you *can* use app.use(cors()) to allow everything,
// but here's a safer version allowing only your real frontends:
app.use(
  cors({
    origin: [
      'https://digtotheroot.com',
      'https://www.digtotheroot.com',
      // optional: your static site's Render URL if you want
      'https://root-0ncx.onrender.com',
    ],
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// --- BODY PARSER ---
app.use(express.json({ limit: '1mb' }));

// --- GEMINI PROXY ROUTE ---
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
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    res.json({ text });
  } catch (err) {
    console.error('Gemini proxy error', err);
    res.status(500).json({ error: 'Gemini request failed' });
  }
});

// --- HEALTHCHECK ROUTES ---
// Simple "I'm alive" route for uptime pings
app.get('/', (req, res) => {
  res.send('OK');
});

// Optional: specific healthcheck for the Gemini proxy
app.get('/api/gemini', (req, res) => {
  res.send('Gemini proxy is alive (use POST for real requests)');
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Gemini proxy listening on port ${PORT}`);
});