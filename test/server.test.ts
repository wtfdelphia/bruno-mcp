import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BrunoServer } from '../src/server.js';

test('BrunoServer uses the package version in MCP server metadata', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8'));
  const brunoServer = new BrunoServer();
  const server = await brunoServer.start();

  assert.equal(server['_serverInfo'].version, packageJson.version);
});
