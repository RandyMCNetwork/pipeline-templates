/** Keep a fixed number of GitHub Package versions for each release channel. */

import { pathToFileURL } from 'node:url';

const CHANNELS = ['main', 'dev', 'test'];
const KEEP_COUNT = 3;
const API_VERSION = '2026-03-10';

export function mavenChannel(version) {
  if (/^\d+\.\d+\.\d+$/.test(version)) return 'main';
  if (/^\d+\.\d+\.\d+(?:[-.][0-9A-Za-z]+)*-dev-SNAPSHOT$/.test(version)) return 'dev';
  if (/^\d+\.\d+\.\d+(?:[-.][0-9A-Za-z]+)*-RC-SNAPSHOT$/.test(version)) return 'test';
  return null;
}

export function containerChannels(version) {
  const tags = version.metadata?.container?.tags ?? [];
  const channels = new Set();
  for (const tag of tags) {
    const match = /^(main|dev|test)-sha-[0-9a-f]+$/i.exec(tag);
    if (match) channels.add(match[1].toLowerCase());
  }
  return [...channels];
}

export function newestFirst(versions) {
  return [...versions].sort((left, right) => {
    const byDate = Date.parse(right.created_at) - Date.parse(left.created_at);
    return byDate || Number(right.id) - Number(left.id);
  });
}

/** A multi-channel container version survives if retained in any one channel. */
export function selectVersions(versions, channelsForVersion, keepCount = KEEP_COUNT) {
  const grouped = Object.fromEntries(CHANNELS.map((channel) => [channel, []]));
  for (const version of versions) {
    for (const channel of channelsForVersion(version)) {
      if (grouped[channel]) grouped[channel].push(version);
    }
  }

  const retained = new Set();
  const candidates = new Set();
  const retainedByChannel = {};
  for (const channel of CHANNELS) {
    const sorted = newestFirst(grouped[channel]);
    const kept = sorted.slice(0, keepCount);
    retainedByChannel[channel] = kept;
    for (const version of sorted) candidates.add(version.id);
    for (const version of kept) retained.add(version.id);
  }
  return { retainedByChannel, deleteIds: [...candidates].filter((id) => !retained.has(id)) };
}

function nextLink(linkHeader) {
  if (!linkHeader) return null;
  const next = linkHeader.split(',').find((entry) => /rel="?next"?/.test(entry));
  return next?.match(/<([^>]+)>/)?.[1] ?? null;
}

export async function fetchAllPackageVersions(fetchImpl, url, headers) {
  const versions = [];
  let pageUrl = url;
  while (pageUrl) {
    const response = await fetchImpl(pageUrl, { headers });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`GitHub Packages API request failed (${response.status}): ${detail.slice(0, 500)}`);
    }
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('GitHub Packages API returned a non-array version list.');
    versions.push(...page);
    pageUrl = nextLink(response.headers.get('link'));
  }
  return versions;
}

function packageUrl(owner, packageType, packageName) {
  return `https://api.github.com/orgs/${encodeURIComponent(owner)}/packages/${packageType}/${encodeURIComponent(packageName)}/versions`;
}

function describe(version) {
  const tags = version.metadata?.container?.tags;
  return tags?.length ? `${version.id} (${tags.join(', ')})` : `${version.id} (${version.name})`;
}

export async function runCleanup({ type, owner, packageName, token, fetchImpl = fetch, logger = console }) {
  if (!['maven', 'container'].includes(type)) throw new Error(`Unsupported package type: ${type}`);
  if (!owner || !packageName || !token) throw new Error('type, owner, packageName, and token are required.');

  const baseUrl = packageUrl(owner, type, packageName);
  const headers = {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'x-github-api-version': API_VERSION,
  };
  const versions = await fetchAllPackageVersions(fetchImpl, `${baseUrl}?per_page=100`, headers);
  const selected = selectVersions(
    versions,
    type === 'maven'
      ? (version) => { const channel = mavenChannel(version.name); return channel ? [channel] : []; }
      : containerChannels,
  );

  for (const channel of CHANNELS) {
    logger.log(`Keep ${channel}: ${selected.retainedByChannel[channel].map(describe).join(', ') || '(none)'}`);
  }
  if (!selected.deleteIds.length) {
    logger.log('No old package versions to delete.');
    return selected;
  }
  const indexed = new Map(versions.map((version) => [version.id, version]));
  for (const id of selected.deleteIds) {
    const response = await fetchImpl(`${baseUrl}/${id}`, { method: 'DELETE', headers });
    if (!response.ok && response.status !== 404) {
      const detail = await response.text();
      throw new Error(`Could not delete package version ${id} (${response.status}): ${detail.slice(0, 500)}`);
    }
    logger.log(response.status === 404 ? `Already deleted: ${describe(indexed.get(id))}` : `Deleted: ${describe(indexed.get(id))}`);
  }
  return selected;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [type, packageName, owner = process.env.GITHUB_REPOSITORY_OWNER] = process.argv.slice(2);
  runCleanup({ type, owner, packageName, token: process.env.GITHUB_TOKEN }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
