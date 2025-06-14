#!/bin/bash

# Simple AI Features Test Script
echo "🚀 Testing AI Features"
echo "======================"

# Test health check
echo "🏥 Testing health check..."
curl -s http://localhost:5000/api/health

echo -e "\n\n🔌 Testing AI connection (requires auth)..."
# Note: You'll need to get a JWT token first by logging in

echo -e "\n\n💡 To test with authentication:"
echo "1. Login via frontend or API to get JWT token"
echo "2. Use token in Authorization header"
echo ""
echo "Example:"
echo 'curl -X POST http://localhost:5000/api/ai/review-suggestion \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN" \'
echo '  -d '"'"'{'
echo '    "revieweeName": "John Doe",'
echo '    "reviewType": "peer",'
echo '    "pastFeedback": "Great team player",'
echo '    "okrProgress": "Achieved 85% of goals"'
echo '  }'"'"

echo -e "\n\n📋 Available AI Endpoints:"
echo "- POST /api/ai/review-suggestion"
echo "- POST /api/ai/summarize-assessment" 
echo "- POST /api/ai/analyze-sentiment"
echo "- GET  /api/ai/score/:userId/:reviewCycleId"
echo "- GET  /api/ai/test-connection"
echo "- GET  /api/settings/ai (admin only)"
echo "- PUT  /api/settings/ai (admin only)" 