// Simple test script to verify PUT endpoint for time entries
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testTimeEntryUpdate() {
  try {
    // First, let's test if the server is running
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log('Health check:', await healthResponse.json());

    // Test the OPTIONS request to see what methods are allowed
    const optionsResponse = await fetch(`${API_BASE}/time-entries/test`, {
      method: 'OPTIONS'
    });

    console.log('OPTIONS response status:', optionsResponse.status);
    console.log('Allowed methods:', optionsResponse.headers.get('allow'));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTimeEntryUpdate();
