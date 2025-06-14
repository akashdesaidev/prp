import E2ETestSuite from './test-e2e-complete.js';

async function main() {
  const testSuite = new E2ETestSuite();
  await testSuite.runAllTests();
}

main().catch(console.error);
