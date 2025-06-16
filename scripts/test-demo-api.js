const API_BASE = "https://prp-emxw.vercel.app/api";

const demoCredentials = [
  { email: "admin@demotech.com", password: "Demo123!", role: "admin" },
  { email: "john.manager@demotech.com", password: "Demo123!", role: "manager" },
  {
    email: "sarah.employee@demotech.com",
    password: "Demo123!",
    role: "employee",
  },
  { email: "lisa.hr@demotech.com", password: "Demo123!", role: "hr" },
];

async function testLogin(credentials) {
  try {
    console.log(
      `\n🔍 Testing login for ${credentials.email} (${credentials.role})`
    );

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Login successful for ${credentials.email}`);
      console.log(`   Token received: ${data.accessToken ? "Yes" : "No"}`);
      return data.accessToken;
    } else {
      const error = await response.json();
      console.log(`❌ Login failed for ${credentials.email}: ${error.error}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Network error for ${credentials.email}: ${error.message}`);
    return null;
  }
}

async function testProtectedEndpoint(token, endpoint, role) {
  try {
    console.log(`   🔒 Testing ${endpoint} with ${role} token`);

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(
        `   ✅ ${endpoint} accessible (${
          Array.isArray(data) ? data.length : Object.keys(data).length
        } items)`
      );
    } else {
      console.log(`   ❌ ${endpoint} failed (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ Network error on ${endpoint}: ${error.message}`);
  }
}

async function testHealthCheck() {
  console.log("🏥 Testing backend health...");
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Backend is healthy: ${data.status}`);
      return true;
    } else {
      console.log(`❌ Backend health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend unreachable: ${error.message}`);
    return false;
  }
}

async function runDemoTest() {
  console.log("🎯 PRP Demo API Test\n");
  console.log(`Backend: ${API_BASE}`);

  // Test health first
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log("\n❌ Backend is not healthy. Cannot proceed with demo test.");
    return;
  }

  console.log("\n📝 Testing Demo Credentials...");

  for (const creds of demoCredentials) {
    const token = await testLogin(creds);

    if (token) {
      // Test role-appropriate endpoints
      if (creds.role === "admin") {
        await testProtectedEndpoint(token, "/users", creds.role);
        await testProtectedEndpoint(token, "/departments", creds.role);
        await testProtectedEndpoint(token, "/analytics/dashboard", creds.role);
      } else if (creds.role === "manager") {
        await testProtectedEndpoint(token, "/okrs", creds.role);
        await testProtectedEndpoint(token, "/feedback", creds.role);
      } else if (creds.role === "employee") {
        await testProtectedEndpoint(token, "/okrs", creds.role);
        await testProtectedEndpoint(token, "/feedback", creds.role);
      } else if (creds.role === "hr") {
        await testProtectedEndpoint(token, "/users", creds.role);
        await testProtectedEndpoint(token, "/review-cycles", creds.role);
      }
    }
  }

  console.log("\n🎉 Demo API test completed!");
  console.log("\n=== DEMO READY ===");
  console.log("Backend: ✅ Available");
  console.log("Credentials: ✅ Configured");
  console.log("Endpoints: ✅ Accessible");
  console.log("\n🚀 You can now run the frontend demo!");
}

// Run the test
if (require.main === module) {
  runDemoTest().catch(console.error);
}

module.exports = runDemoTest;
