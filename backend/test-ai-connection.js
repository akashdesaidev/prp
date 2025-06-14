import jwt from 'jsonwebtoken';
import axios from 'axios';

// Generate a test JWT token for admin user
const testToken = jwt.sign(
  {
    id: '675699999999999999999999',
    role: 'admin'
  },
  'your-super-secret-jwt-key-min-32-chars-for-development',
  { expiresIn: '1h' }
);

console.log('Generated test token:', testToken);

// Test the AI connection endpoint
async function testAIConnection() {
  try {
    console.log('\n🧪 Testing AI Connection Endpoint...');

    const response = await axios.post(
      'http://localhost:5000/api/settings/ai/test',
      {},
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testAIConnection();
