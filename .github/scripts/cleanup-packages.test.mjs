import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { containerChannels, fetchAllPackageVersions, mavenChannel, selectVersions } from './cleanup-packages.mjs';

const version = (id, createdAt, name = `1.0.${id}`, tags = []) => ({
  id, name, created_at: createdAt, metadata: { container: { tags } },
});

test('classifies Maven channels and protects unknown versions', () => {
  assert.equal(mavenChannel('1.2.3'), 'main');
  assert.equal(mavenChannel('1.2.3-dev-SNAPSHOT'), 'dev');
  assert.equal(mavenChannel('1.2.3-RC-SNAPSHOT'), 'test');
  assert.equal(mavenChannel('1.2.3-PR4-SNAPSHOT'), null);
  assert.equal(mavenChannel('latest'), null);
});

test('keeps the newest three versions per Maven channel', () => {
  const versions = [1, 2, 3, 4].map((id) => version(id, `2026-01-0${id}T00:00:00Z`));
  const selected = selectVersions(versions, (item) => [mavenChannel(item.name)]);
  assert.deepEqual(selected.retainedByChannel.main.map((item) => item.id), [4, 3, 2]);
  assert.deepEqual(selected.deleteIds, [1]);
});

test('does not delete a channel with fewer than three versions', () => {
  const versions = [version(1, '2026-01-01T00:00:00Z'), version(2, '2026-01-02T00:00:00Z')];
  const selected = selectVersions(versions, (item) => [mavenChannel(item.name)]);
  assert.deepEqual(selected.retainedByChannel.main.map((item) => item.id), [2, 1]);
  assert.deepEqual(selected.deleteIds, []);
});

test('does not delete an overlapping GHCR version kept by another channel', () => {
  const versions = [
    version(1, '2026-01-01T00:00:00Z', 'sha256:1', ['dev-sha-a']),
    version(2, '2026-01-02T00:00:00Z', 'sha256:2', ['dev-sha-b']),
    version(3, '2026-01-03T00:00:00Z', 'sha256:3', ['dev-sha-c']),
    version(4, '2026-01-04T00:00:00Z', 'sha256:4', ['dev-sha-d', 'main-sha-d']),
    version(5, '2026-01-05T00:00:00Z', 'sha256:5', ['main-sha-e']),
  ];
  const selected = selectVersions(versions, containerChannels);
  assert.deepEqual(selected.deleteIds, [1]);
  assert.deepEqual(selected.retainedByChannel.dev.map((item) => item.id), [4, 3, 2]);
});

test('keeps untagged and legacy GHCR images outside cleanup candidates', () => {
  const selected = selectVersions([version(1, '2026-01-01T00:00:00Z', 'sha256:1', ['sha-a']), version(2, '2026-01-02T00:00:00Z', 'sha256:2')], containerChannels);
  assert.deepEqual(selected.deleteIds, []);
});

test('loads every paginated API response', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const pageTwo = url.includes('page=2');
    return { ok: true, json: async () => [version(pageTwo ? 2 : 1, '2026-01-01T00:00:00Z')], headers: { get: () => pageTwo ? null : '<https://api.github.com/example?page=2>; rel="next"' } };
  };
  const versions = await fetchAllPackageVersions(fetchImpl, 'https://api.github.com/example?page=1', {});
  assert.deepEqual(versions.map((item) => item.id), [1, 2]);
  assert.equal(calls.length, 2);
});

test('surfaces GitHub API failures', async () => {
  await assert.rejects(
    fetchAllPackageVersions(async () => ({ ok: false, status: 403, text: async () => 'forbidden', headers: { get: () => null } }), 'https://api.github.com/example', {}),
    /403.*forbidden/,
  );
});

test('GHCR build adds channel SHA tags only for main, dev, and test', async () => {
  const workflow = await readFile(new URL('../workflows/ghcr-build.yml', import.meta.url), 'utf8');
  assert.match(workflow, /case "\$GITHUB_REF_NAME" in\s+main\|dev\|test\)/s);
  assert.match(workflow, /value=%s-sha-%s/);
  assert.doesNotMatch(workflow, /\*\)\s+printf 'definition=/s);
});
