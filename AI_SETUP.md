# AI Integration Setup Guide

The Layers app now supports AI-powered dynamic paths, questions, and insights using **Google Gemini** (free tier)! 

## What's AI-Powered?

With Gemini API (already configured with a default key), the app will:

1. **Generate dynamic paths** based on your brain dump (instead of keyword matching)
2. **Create context-aware questions** that adapt to your answers and chosen path
3. **Generate personalized insights** and root concerns based on your entire journey

## Setup Instructions

### Default Setup (Already Configured!)

✅ **The app already has a default Gemini API key configured** - you can start using AI features immediately!

### Option 1: Use Default Key (Recommended)

No setup needed! Just start using the app - it will automatically use the default Gemini API key.

### Option 2: Use Your Own API Key

If you want to use your own API key:

1. Click the ⚙️ settings button in the top-right corner
2. Enter your Google Gemini API key
3. Click "Save Key"

### Option 3: Environment Variable (For Development)

Create a `.env` file in the `layers-app` directory:
```
VITE_GEMINI_API_KEY=your-api-key-here
```

## Getting Your Own Gemini API Key (Optional)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key (it's free!)
4. Copy it (starts with `AIza`)
5. Paste it in settings if you want to override the default

## How It Works

### Without API Key (Fallback Mode)
- Uses keyword-based path detection
- Uses predefined questions from `utils/questions.ts`
- Uses simple heuristic-based summaries

### With API Key (AI Mode) - Default!
- **Paths**: Gemini analyzes your brain dump and suggests 3-4 relevant paths
- **Questions**: Each layer generates 2-3 context-aware questions based on:
  - Your brain dump
  - The selected path
  - Previous answers
  - **Do not restate the user's words**—respond with a direct question.  
    - Before: `When you say you're so stressed out about life, what's one specific thing making you feel the most stressed right now?`  
    - After: `what's one specific thing making you feel the most stressed right now?`
- **Insights**: Generates personalized summary and root concern analysis

## API Costs

- Uses `gemini-1.5-flash` model (FREE tier!)
- No cost for most usage
- Google provides generous free tier limits
- Typical session uses ~5 API calls (all free)

## Security Notes

⚠️ **Important**: For production deployments, API keys should be stored on a backend server, not in the browser. The current implementation stores keys in localStorage (or uses a default key) for convenience.

## Fallback Behavior

If the AI service fails:
- Automatically falls back to keyword detection
- Uses predefined questions
- Shows an error banner but continues working

The app gracefully degrades, so it always works even if AI is unavailable.

## Model Information

- **Model**: `gemini-2.0-flash` (latest free model, fast, efficient)
- **Provider**: Google Generative AI
- **Cost**: FREE tier (generous limits)
- **API Endpoint**: Uses Google Generative AI SDK (handles authentication automatically)
