# EduGenie

An AI-powered study workspace with a Gemini tutor, quick study prompts, and a focused learning dashboard.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
```

Add your Google AI Studio API key to `GEMINI_API_KEY` in `.env`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without an API key, the tutor displays a setup prompt instead of making a request. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

## Stack

- Express serves the app and proxies tutor requests to Gemini.
- The browser never receives the Gemini API key.
- Set `GEMINI_MODEL` to override the default `gemini-3.8-flash` model.