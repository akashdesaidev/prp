# 🆓 Setting Up Free Gemini API Key

## Overview

Google's Gemini 1.5 Flash model is available for free with generous rate limits, making it perfect for development and testing of AI features.

## Steps to Get Free Gemini API Key

### 1. Go to Google AI Studio

Visit: https://aistudio.google.com/

### 2. Sign In

- Use your Google account to sign in
- Accept the terms of service

### 3. Create API Key

- Click on "Get API Key" in the left sidebar
- Click "Create API Key"
- Choose "Create API key in new project" (recommended)
- Copy the generated API key (starts with `AIza...`)

### 4. Configure in Your Application

#### Option A: Through the UI (Recommended)

1. Start your backend server: `cd backend && npm run dev`
2. Start your frontend server: `cd frontend && npm run dev`
3. Login as admin user
4. Go to Settings → AI Configuration
5. Paste your Gemini API key
6. Click "Test Connection"

#### Option B: Environment Variable

Create a `.env` file in the `backend` directory:

```bash
GEMINI_API_KEY=AIza_your_actual_gemini_api_key_here
```

## Free Tier Limits

- **Rate Limit**: 15 requests per minute
- **Daily Limit**: 1,500 requests per day
- **Monthly Limit**: No monthly limit
- **Model**: Gemini 1.5 Flash (fast and efficient)

## Testing Your Setup

### 1. Test Connection

```bash
# In your browser, go to Settings → AI Configuration
# Click "Test Connection" button
```

### 2. Test AI Features

- **Review Suggestions**: Go to Reviews → Create Review → Click "Get AI Suggestion"
- **Self-Assessment Summary**: Complete a self-assessment → Click "Summarize"

## Troubleshooting

### Common Issues

#### "API key not configured"

- Make sure you've added the API key through the Settings UI or environment variable
- Restart the backend server after adding environment variables

#### "Request failed with status code 403"

- Check that your API key is correct
- Ensure you haven't exceeded rate limits
- Verify the API key has the necessary permissions

#### "Model not found"

- The free model is `gemini-1.5-flash`
- Make sure you're using the correct endpoint

### Rate Limit Handling

The application automatically falls back to OpenAI if Gemini fails, or provides a basic fallback for sentiment analysis.

## Production Considerations

For production use, consider:

- **Paid Tier**: Higher rate limits and priority access
- **Error Monitoring**: Set up alerts for API failures
- **Caching**: Cache AI responses to reduce API calls
- **Load Balancing**: Use multiple API keys if needed

## API Documentation

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Rate Limits](https://ai.google.dev/pricing)
- [Model Information](https://ai.google.dev/models/gemini)

---

✅ **Your AI integration is now ready to use with the free Gemini model!**
