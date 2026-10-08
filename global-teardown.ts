import { FullConfig } from '@playwright/test';
import { entityRegistry, TestEntityRecord } from './src/api/CountApiClient';

/**
 * Global teardown runs once after all tests.
 * - Logs summary information
 * - Performs any necessary cleanup
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   COUNT Automation Framework — Global Teardown      ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Completed  : ${new Date().toISOString().padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const entities = entityRegistry.getAll();
  if (entities.length > 0) {
    console.log(`📋 Test Entities Created in this run (${entities.length}):`);
    entities.forEach((e: TestEntityRecord) => {
      console.log(`   - [${e.type.toUpperCase()}] ${e.reference} (at ${e.createdAt})`);
    });
    console.log('   All entities use identifiable test prefixes for tracking and auditing.\n');
    entityRegistry.clear();
  }

  console.log('📊 Reports available:');
  console.log('   HTML Report  → npx playwright show-report');
  console.log('   Allure Report → npm run report:generate && npm run report:open\n');
}

export default globalTeardown;
