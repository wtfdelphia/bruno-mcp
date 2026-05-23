import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { BrunoRunner } from '../src/runner.js';

test('runCollection executes the local Bruno CLI without shell parsing user input', async () => {
  const tempRoot = join(tmpdir(), `bruno-mcp-test-${Date.now()}`);
  const collectionDir = join(tempRoot, 'collections with spaces');
  const collectionPath = join(collectionDir, 'request with spaces.bru');
  const cliBin = join(tempRoot, 'bin');
  const bruPath = join(cliBin, 'bru');
  const invocationPath = join(tempRoot, 'invocation.json');

  await mkdir(collectionDir, { recursive: true });
  await mkdir(cliBin, { recursive: true });
  await writeFile(collectionPath, '');
  await writeFile(
    bruPath,
    `#!/usr/bin/env node
const { writeFileSync } = require('node:fs');
const invocationPath = process.env.BRU_INVOCATION_PATH;
writeFileSync(invocationPath, JSON.stringify({
  cwd: process.cwd(),
  argv: process.argv.slice(2)
}, null, 2));
const outputIndex = process.argv.indexOf('--reporter-json');
writeFileSync(process.argv[outputIndex + 1], JSON.stringify([{
  summary: { totalRequests: 1, failedRequests: 0, passedRequests: 1 },
  results: []
}]));
`,
    { mode: 0o755 }
  );

  const runner = new BrunoRunner({ bruPath });
  const previousInvocationPath = process.env.BRU_INVOCATION_PATH;
  process.env.BRU_INVOCATION_PATH = invocationPath;
  const result = await runner.runCollection({
    collection: collectionPath,
    environment: 'local env',
    variables: ['secret=value with spaces; echo injected']
  });
  if (previousInvocationPath === undefined) {
    delete process.env.BRU_INVOCATION_PATH;
  } else {
    process.env.BRU_INVOCATION_PATH = previousInvocationPath;
  }

  const invocation = JSON.parse(await readFile(invocationPath, 'utf-8'));

  assert.equal(result.success, true);
  assert.deepEqual(result.summary, { total: 1, failed: 0, passed: 1 });
  assert.equal(invocation.cwd, await realpath(collectionDir));
  assert.deepEqual(invocation.argv.slice(0, 7), [
    'run',
    'request with spaces.bru',
    '--env',
    'local env',
    '--env-var',
    'secret=value with spaces; echo injected',
    '--reporter-json'
  ]);
  assert.equal(invocation.argv.at(-1), '--reporter-skip-all-headers');
  assert.equal(existsSync(invocation.argv.at(-2)), false);
});

test('runCollection reports malformed Bruno JSON output clearly', async () => {
  const tempRoot = join(tmpdir(), `bruno-mcp-test-${Date.now()}`);
  const collectionDir = join(tempRoot, 'collection');
  const collectionPath = join(collectionDir, 'request.bru');
  const cliBin = join(tempRoot, 'bin');
  const bruPath = join(cliBin, 'bru');

  await mkdir(collectionDir, { recursive: true });
  await mkdir(cliBin, { recursive: true });
  await writeFile(collectionPath, '');
  await writeFile(
    bruPath,
    `#!/usr/bin/env node
const { writeFileSync } = require('node:fs');
const outputIndex = process.argv.indexOf('--reporter-json');
writeFileSync(process.argv[outputIndex + 1], JSON.stringify({ unexpected: true }));
`,
    { mode: 0o755 }
  );

  const runner = new BrunoRunner({ bruPath });

  await assert.rejects(
    runner.runCollection({ collection: collectionPath }),
    /Unexpected Bruno JSON report format/
  );
});

test('runCollection accepts variables as key-value pairs', async () => {
  const tempRoot = join(tmpdir(), `bruno-mcp-test-${Date.now()}`);
  const collectionDir = join(tempRoot, 'collection');
  const collectionPath = join(collectionDir, 'request.bru');
  const cliBin = join(tempRoot, 'bin');
  const bruPath = join(cliBin, 'bru');
  const invocationPath = join(tempRoot, 'invocation.json');

  await mkdir(collectionDir, { recursive: true });
  await mkdir(cliBin, { recursive: true });
  await writeFile(collectionPath, '');
  await writeFile(
    bruPath,
    `#!/usr/bin/env node
const { writeFileSync } = require('node:fs');
writeFileSync(process.env.BRU_INVOCATION_PATH, JSON.stringify(process.argv.slice(2)));
const outputIndex = process.argv.indexOf('--reporter-json');
writeFileSync(process.argv[outputIndex + 1], JSON.stringify([{
  summary: { totalRequests: 1, failedRequests: 0, passedRequests: 1 },
  results: []
}]));
`,
    { mode: 0o755 }
  );

  const runner = new BrunoRunner({ bruPath });
  const previousInvocationPath = process.env.BRU_INVOCATION_PATH;
  process.env.BRU_INVOCATION_PATH = invocationPath;
  await runner.runCollection({
    collection: collectionPath,
    variables: {
      token: 'abc123',
      baseUrl: 'https://example.test'
    }
  });
  if (previousInvocationPath === undefined) {
    delete process.env.BRU_INVOCATION_PATH;
  } else {
    process.env.BRU_INVOCATION_PATH = previousInvocationPath;
  }

  const invocation = JSON.parse(await readFile(invocationPath, 'utf-8'));

  assert.deepEqual(invocation.slice(2, 6), [
    '--env-var',
    'token=abc123',
    '--env-var',
    'baseUrl=https://example.test'
  ]);
});
