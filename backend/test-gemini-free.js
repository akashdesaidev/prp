import axios from 'axios';

// Test Gemini 1.5 Flash (Free Model) directly
async function testGeminiFree() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY not found in environment variables');
    console.log('💡 To test Gemini:');
    console.log('   1. Get free API key from: https://aistudio.google.com/');
    console.log('   2. Set GEMINI_API_KEY environment variable');
    console.log('   3. Or add it through the Settings UI');
    return;
  }

  console.log('🧪 Testing Gemini 1.5 Flash (Free Model)...');
  console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 10) + '...');

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: 'Hello! Please respond with "Gemini 1.5 Flash is working!" to confirm the connection.'
              }
            ]
          }
        ]
      },
      {
        params: {
          key: GEMINI_API_KEY
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Gemini Response Status:', response.status);
    console.log('📝 Gemini Response:', response.data.candidates[0].content.parts[0].text);
    console.log('🎉 Gemini 1.5 Flash (Free Model) is working correctly!');
  } catch (error) {
    console.error('❌ Gemini Test Failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);

    if (error.response?.status === 403) {
      console.log('💡 This might be due to:');
      console.log('   - Invalid API key');
      console.log("   - API key doesn't have necessary permissions");
      console.log('   - Rate limit exceeded');
    }
  }
}

testGeminiFree();
