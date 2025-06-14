# 🤖 AI Features Testing Guide

## Overview

This guide will help you test all the AI features implemented in the Performance Review Platform.

## 🔧 Prerequisites

### 1. Environment Setup

Make sure you have the following environment variables set in your `backend/.env` file:

```bash
# AI Service Keys (at least one is required)
OPENAI_API_KEY=sk-your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 2. Start the Backend Server

```bash
cd backend
npm start
```

### 3. Start the Frontend Server

```bash
cd frontend
npm run dev
```

## 🧪 Testing Methods

### Method 1: Frontend UI Testing (Recommended)

Test AI features through the actual user interface.

### Method 2: Direct API Testing

Test AI endpoints directly using curl or Postman.

---

## 🎯 AI Feature #1: Review Suggestion Generator

### Frontend Testing:

1. **Login as Manager/HR**
2. **Navigate to Reviews** → Create or join a review cycle
3. **Start a Peer/Manager Review**
4. **Look for "AI Suggest" button** in the review form
5. **Click the button** to generate AI suggestions

### API Testing:

```bash
# Test review suggestion endpoint
curl -X POST http://localhost:5000/api/ai/review-suggestion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "revieweeName": "John Doe",
    "reviewType": "peer",
    "pastFeedback": "Great team player, always helpful",
    "okrProgress": "Achieved 85% of quarterly goals"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "suggestion": "AI-generated review text...",
  "provider": "openai"
}
```

---

## 🎯 AI Feature #2: Self-Assessment Summarizer

### Frontend Testing:

1. **Login as Employee**
2. **Complete a Self-Assessment** in an active review cycle
3. **After submission**, look for "Summarize" button
4. **Click to generate summary** of your responses

### API Testing:

```bash
# Test self-assessment summarizer
curl -X POST http://localhost:5000/api/ai/summarize-assessment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "responses": [
      {
        "question": "What are your key achievements this quarter?",
        "response": "I successfully led the new product launch and improved team efficiency by 20%"
      },
      {
        "question": "What areas would you like to improve?",
        "response": "I want to enhance my public speaking skills and learn more about data analysis"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "summary": "Key Themes:\n1. Leadership and product management\n2. Process improvement...",
  "provider": "openai"
}
```

---

## 🎯 AI Feature #3: Sentiment Analysis

### Frontend Testing:

- **Sentiment analysis runs automatically** when feedback is submitted
- **Check feedback entries** for sentiment indicators (positive/neutral/negative badges)

### API Testing:

```bash
# Test sentiment analysis
curl -X POST http://localhost:5000/api/ai/analyze-sentiment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "This employee consistently delivers excellent work and is a valuable team member"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "sentiment": "positive",
  "qualityFlags": [],
  "provider": "openai"
}
```

---

## 🎯 AI Feature #4: AI Scoring Algorithm

### Frontend Testing:

- **AI scores are calculated automatically** during review cycles
- **Check user profiles** or review results for AI-generated scores

### API Testing:

```bash
# Test AI scoring calculation
curl -X GET http://localhost:5000/api/ai/score/USER_ID/REVIEW_CYCLE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "aiScore": {
    "recentFeedbackScore": 8.5,
    "okrScore": 7.8,
    "peerFeedbackScore": 8.2,
    "managerFeedbackScore": 8.0,
    "selfAssessmentScore": 7.5,
    "tenureAdjustmentScore": 1.2,
    "finalScore": 8.1
  }
}
```

---

## 🎯 AI Feature #5: Connection Testing

### Frontend Testing:

1. **Login as Admin**
2. **Navigate to Settings** → AI Configuration
3. **Enter API keys** and click "Test Connection"
4. **Verify connection status** indicators

### API Testing:

```bash
# Test AI service connectivity
curl -X GET http://localhost:5000/api/ai/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "openai": {
    "status": "connected",
    "model": "gpt-3.5-turbo"
  },
  "gemini": {
    "status": "connected",
    "model": "gemini-pro"
  }
}
```

---

## 🔍 Troubleshooting

### Common Issues:

1. **"AI services temporarily unavailable"**

   - Check if API keys are set correctly
   - Verify internet connection
   - Check API key quotas/billing

2. **"Authentication failed"**

   - Ensure you're logged in with valid JWT token
   - Check token expiration

3. **"Insufficient permissions"**
   - Verify user role has access to AI features
   - Admin/HR roles needed for settings

### Debug Steps:

1. **Check Backend Logs:**

   ```bash
   # Backend logs will show AI service calls
   tail -f backend/logs/app.log
   ```

2. **Test API Keys Manually:**

   ```bash
   # Test OpenAI directly
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_OPENAI_KEY"
   ```

3. **Check Environment Variables:**
   ```bash
   cd backend
   node -e "console.log('OpenAI:', !!process.env.OPENAI_API_KEY)"
   ```

---

## 📊 Expected AI Behavior

### Review Suggestions:

- **Length:** 2-3 paragraphs
- **Tone:** Professional, constructive
- **Content:** Specific, actionable feedback
- **Fallback:** Gemini if OpenAI fails

### Self-Assessment Summaries:

- **Structure:** Key themes, strengths, improvements, impact
- **Length:** 4-6 bullet points per section
- **Focus:** Extract main points from responses

### Sentiment Analysis:

- **Output:** positive/neutral/negative
- **Quality Flags:** vague_response, too_short
- **Accuracy:** ~85% for clear text

### AI Scoring:

- **Range:** 1-10 scale
- **Weights:** Recent feedback (35%), OKRs (25%), Peer (15%), Manager (15%), Self (5%), Tenure (5%)
- **Precision:** 2 decimal places

---

## 🎉 Success Criteria

✅ **All AI endpoints respond without errors**  
✅ **Frontend AI buttons appear and function**  
✅ **AI suggestions are relevant and professional**  
✅ **Sentiment analysis provides accurate results**  
✅ **AI scoring follows the specified formula**  
✅ **Fallback mechanisms work when primary AI fails**  
✅ **Admin can configure and test AI settings**

---

## 📝 Test Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000/3001
- [ ] AI API keys configured in environment
- [ ] Test user accounts created (admin, manager, employee)
- [ ] Review cycle created for testing
- [ ] All AI endpoints tested via API
- [ ] All AI features tested via frontend
- [ ] Error handling and fallbacks verified
- [ ] Admin AI settings interface tested

---

**Happy Testing! 🚀**
