#!/usr/bin/env node

/**
 * AI Features Test Script
 * Quick way to test all AI endpoints
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
let authToken = "";

// Test data
const testData = {
  reviewSuggestion: {
    revieweeName: "John Doe",
    reviewType: "peer",
    pastFeedback: "Great team player, always helpful and collaborative",
    okrProgress:
      "Achieved 85% of quarterly goals, exceeded expectations in project delivery",
  },
  selfAssessment: {
    responses: [
      {
        question: "What are your key achievements this quarter?",
        response:
          "I successfully led the new product launch, improved team efficiency by 20%, and mentored 2 junior developers",
      },
      {
        question: "What areas would you like to improve?",
        response:
          "I want to enhance my public speaking skills and learn more about data analysis and machine learning",
      },
      {
        question: "How did you contribute to team goals?",
        response:
          "I facilitated daily standups, resolved technical blockers, and helped establish better code review processes",
      },
    ],
  },
  sentimentText:
    "This employee consistently delivers excellent work and is a valuable team member who goes above and beyond",
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      ...(data && { data }),
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log("\n🏥 Testing Health Check...");
  const result = await makeRequest("GET", "/health");

  if (result.success) {
    console.log("✅ Health check passed");
    return true;
  } else {
    console.log("❌ Health check failed:", result.error);
    return false;
  }
}

async function testLogin() {
  console.log("\n🔐 Testing Login...");

  // Try to login with test credentials
  const loginData = {
    email: "admin@test.com",
    password: "password123",
  };

  const result = await makeRequest("POST", "/auth/login", loginData);

  if (result.success && result.data.accessToken) {
    authToken = result.data.accessToken;
    console.log("✅ Login successful");
    return true;
  } else {
    console.log("❌ Login failed:", result.error);
    console.log("💡 Make sure you have test users created");
    return false;
  }
}

async function testAIConnection() {
  console.log("\n🔌 Testing AI Connection...");
  const result = await makeRequest("GET", "/ai/test-connection");

  if (result.success) {
    console.log("✅ AI connection test passed");
    console.log("📊 Results:", JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log("❌ AI connection test failed:", result.error);
    return false;
  }
}

async function testReviewSuggestion() {
  console.log("\n💡 Testing Review Suggestion...");
  const result = await makeRequest(
    "POST",
    "/ai/review-suggestion",
    testData.reviewSuggestion
  );

  if (result.success) {
    console.log("✅ Review suggestion generated");
    console.log(
      "📝 Suggestion:",
      result.data.suggestion.substring(0, 200) + "..."
    );
    console.log("🤖 Provider:", result.data.provider);
    return true;
  } else {
    console.log("❌ Review suggestion failed:", result.error);
    return false;
  }
}

async function testSelfAssessmentSummary() {
  console.log("\n📋 Testing Self-Assessment Summary...");
  const result = await makeRequest(
    "POST",
    "/ai/summarize-assessment",
    testData.selfAssessment
  );

  if (result.success) {
    console.log("✅ Self-assessment summary generated");
    console.log("📝 Summary:", result.data.summary.substring(0, 200) + "...");
    console.log("🤖 Provider:", result.data.provider);
    return true;
  } else {
    console.log("❌ Self-assessment summary failed:", result.error);
    return false;
  }
}

async function testSentimentAnalysis() {
  console.log("\n😊 Testing Sentiment Analysis...");
  const result = await makeRequest("POST", "/ai/analyze-sentiment", {
    text: testData.sentimentText,
  });

  if (result.success) {
    console.log("✅ Sentiment analysis completed");
    console.log("📊 Sentiment:", result.data.sentiment);
    console.log("🚩 Quality flags:", result.data.qualityFlags);
    console.log("🤖 Provider:", result.data.provider);
    return true;
  } else {
    console.log("❌ Sentiment analysis failed:", result.error);
    return false;
  }
}

async function testAIScoring() {
  console.log("\n🎯 Testing AI Scoring...");

  // This requires actual user and review cycle IDs
  // For now, we'll test with placeholder IDs
  const result = await makeRequest(
    "GET",
    "/ai/score/test-user-id/test-cycle-id"
  );

  if (result.success) {
    console.log("✅ AI scoring completed");
    console.log("📊 Score:", result.data.aiScore);
    return true;
  } else {
    console.log(
      "❌ AI scoring failed (expected if no test data):",
      result.error
    );
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log("🚀 Starting AI Features Test Suite");
  console.log("=====================================");

  const results = {
    healthCheck: await testHealthCheck(),
    login: await testLogin(),
    aiConnection: false,
    reviewSuggestion: false,
    selfAssessmentSummary: false,
    sentimentAnalysis: false,
    aiScoring: false,
  };

  // Only run AI tests if login was successful
  if (results.login) {
    results.aiConnection = await testAIConnection();
    results.reviewSuggestion = await testReviewSuggestion();
    results.selfAssessmentSummary = await testSelfAssessmentSummary();
    results.sentimentAnalysis = await testSentimentAnalysis();
    results.aiScoring = await testAIScoring();
  }

  // Summary
  console.log("\n📊 Test Results Summary");
  console.log("========================");

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? "✅" : "❌"} ${test}`);
  });

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 All AI features are working correctly!");
  } else {
    console.log("⚠️  Some tests failed. Check the logs above for details.");
    console.log("\n💡 Common issues:");
    console.log("   - Backend server not running (port 5000)");
    console.log("   - Missing AI API keys in environment");
    console.log("   - No test user accounts created");
    console.log("   - Network connectivity issues");
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testData };
