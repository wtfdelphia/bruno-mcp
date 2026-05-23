import test from 'node:test';
import assert from 'node:assert/strict';

import { withReportFile } from '../src/utils.js';

test('withReportFile gives concurrent callers distinct file paths', async () => {
  const originalNow = Date.now;
  Date.now = () => 12345;

  try {
    const paths = await Promise.all([
      withReportFile('bruno-run-', '.json', async (filePath) => filePath),
      withReportFile('bruno-run-', '.json', async (filePath) => filePath)
    ]);

    assert.notEqual(paths[0], paths[1]);
  } finally {
    Date.now = originalNow;
  }
});
