# Slack Clone with AI

A simple Slack-like chat interface with AI responses, built with Next.js.

## Features

- 3 channels: #general, #random, #ai-bot
- Real-time messaging (polling)
- AI bot auto-responds in #ai-bot channel
- No database — in-memory storage
- No login — just enter a username

## Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variable:
   - `ANTHROPIC_API_KEY` — your Anthropic API key

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for AI responses |
