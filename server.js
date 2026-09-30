import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(currentDir, 'public')));

app.get('/api/status', (_request, response) => {
  response.json({ configured: Boolean(ai) });
});

app.post('/api/tutor', async (request, response) => {
  const { message, history = [] } = request.body ?? {};
  if (typeof message !== 'string' || !message.trim() || message.length > 4000) {
    return response.status(400).json({ error: 'Add a question under 4,000 characters.' });
  }
  if (!ai) {
    return response.status(503).json({ error: 'Add GEMINI_API_KEY to your .env file to connect your tutor.' });
  }

  const contents = [
    ...history.slice(-12).filter((item) =>
      ['user', 'model'].includes(item.role) && typeof item.text === 'string'
    ).map(({ role, text }) => ({ role, parts: [{ text: text.slice(0, 4000) }] })),
    { role: 'user', parts: [{ text: message.trim() }] },
  ];

  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: 'You are EduGenie, a warm and precise study tutor. Help learners understand concepts rather than simply giving answers. Explain step by step when useful, adapt to the learner, use clear examples, and keep responses concise. Ask one focused follow-up question when it would help the learner think deeper.',
        maxOutputTokens: 900,
      },
    });
    response.json({ reply: result.text || 'I could not form a response. Try rephrasing your question.' });
  } catch (error) {
    console.error('Gemini tutor request failed:', error.message);
    const authenticationError = error.status === 401 || error.status === 403 ||
      /API_KEY_INVALID|UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED/.test(error.message);
    const message = authenticationError
      ? 'Gemini rejected this credential. Use a Gemini API key from Google AI Studio (not an OAuth access token), update GEMINI_API_KEY in .env, and restart the server.'
      : 'The tutor could not respond right now. Check your API key and try again.';
    response.status(502).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`EduGenie is ready at http://localhost:${port}`);
});