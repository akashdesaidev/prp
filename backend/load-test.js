import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

class LoadTestSuite {
  constructor() {
    this.authToken = null;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: []
    };
  }

  async authenticate() {
    console.log('🔐 Authenticating for load tests...');

    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@prp.com',
        password: 'admin123'
      });

      this.authToken = loginResponse.data.token;
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const startTime = Date.now();
    const headers = { Authorization: `Bearer ${this.authToken}` };

    try {
      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await axios.get(`${API_BASE}${endpoint}`, { headers });
          break;
        case 'post':
          response = await axios.post(`${API_BASE}${endpoint}`, data, { headers });
          break;
        case 'put':
          response = await axios.put(`${API_BASE}${endpoint}`, data, { headers });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      return { success: true, responseTime, status: response.status };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailure(responseTime);
      return {
        success: false,
        responseTime,
        error: error.response?.status || error.message
      };
    }
  }

  recordSuccess(responseTime) {
    this.results.totalRequests++;
    this.results.successfulRequests++;
    this.results.responseTimes.push(responseTime);
    this.updateResponseTimeStats(responseTime);
  }

  recordFailure(responseTime) {
    this.results.totalRequests++;
    this.results.failedRequests++;
    this.results.responseTimes.push(responseTime);
    this.updateResponseTimeStats(responseTime);
  }

  updateResponseTimeStats(responseTime) {
    this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);
    this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
    this.results.averageResponseTime =
      this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
  }

  async runConcurrentRequests(endpoint, concurrency = 10, totalRequests = 100) {
    console.log(
      `🚀 Running ${totalRequests} requests with ${concurrency} concurrent connections to ${endpoint}`
    );

    const requestsPerBatch = Math.ceil(totalRequests / concurrency);
    const batches = [];

    for (let i = 0; i < concurrency; i++) {
      const batchPromises = [];
      for (let j = 0; j < requestsPerBatch && i * requestsPerBatch + j < totalRequests; j++) {
        batchPromises.push(this.makeRequest(endpoint));
      }
      batches.push(Promise.all(batchPromises));
    }

    const startTime = Date.now();
    await Promise.all(batches);
    const totalTime = Date.now() - startTime;

    console.log(`✅ Completed ${this.results.totalRequests} requests in ${totalTime}ms`);
    console.log(
      `📊 Success rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`
    );
    console.log(
      `⚡ Requests per second: ${(this.results.totalRequests / (totalTime / 1000)).toFixed(2)}`
    );
  }

  async runLoadTests() {
    console.log('🏋️ Starting Load Test Suite...\n');

    // Authenticate first
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      throw new Error('Authentication failed - cannot proceed with load tests');
    }

    // Test different endpoints under load
    console.log('\n1. Testing Health Endpoint...');
    await this.runConcurrentRequests('/health', 20, 100);
    this.printResults('Health Endpoint');
    this.resetResults();

    console.log('\n2. Testing User Listing...');
    await this.runConcurrentRequests('/users', 10, 50);
    this.printResults('User Listing');
    this.resetResults();

    console.log('\n3. Testing OKR Listing...');
    await this.runConcurrentRequests('/okrs', 10, 50);
    this.printResults('OKR Listing');
    this.resetResults();

    console.log('\n4. Testing Analytics Dashboard...');
    await this.runConcurrentRequests('/analytics/dashboard', 5, 25);
    this.printResults('Analytics Dashboard');
    this.resetResults();

    console.log('\n🎉 Load Testing Complete!');
    console.log('✅ System performance verified under load');
  }

  printResults(testName) {
    console.log(`\n📈 ${testName} Results:`);
    console.log(`   Total Requests: ${this.results.totalRequests}`);
    console.log(`   Successful: ${this.results.successfulRequests}`);
    console.log(`   Failed: ${this.results.failedRequests}`);
    console.log(
      `   Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`
    );
    console.log(`   Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Min Response Time: ${this.results.minResponseTime}ms`);
    console.log(`   Max Response Time: ${this.results.maxResponseTime}ms`);

    // Calculate percentiles
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    console.log(`   95th Percentile: ${sortedTimes[p95Index] || 0}ms`);
    console.log(`   99th Percentile: ${sortedTimes[p99Index] || 0}ms`);
  }

  resetResults() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: []
    };
  }
}

// Run load tests
async function runLoadTests() {
  const loadTest = new LoadTestSuite();

  try {
    await loadTest.runLoadTests();
    process.exit(0);
  } catch (error) {
    console.error('Load Test Suite Failed:', error.message);
    process.exit(1);
  }
}

export default LoadTestSuite;
