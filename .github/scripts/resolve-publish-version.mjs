#!/usr/bin/env node
/**
 * Resolve a Maven publish version from conventional commits.
 *
 * Modes:
 *   pr <number>  -> <next>-PR<number>-SNAPSHOT
 *   dev          -> <next>-dev-SNAPSHOT
 *   rc           -> <next>-RC-SNAPSHOT
 *   next         -> <next>
 *
 * Only release-relevant Conventional Commits produce a version:
 *   <type>! or BREAKING CHANGE -> major
 *   feat                       -> minor
 *   fix, perf, hotfix, chore(deps) -> patch
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';

function run(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function tryRun(command) {
  try {
    return run(command);
  } catch {
    return '';
  }
}

function gradleFallbackVersion() {
  const buildFile = ['build.gradle.kts', 'build.gradle']
    .find((path) => fs.existsSync(path));

  if (!buildFile) {
    return '1.0.0';
  }

  const text = fs.readFileSync(buildFile, 'utf8');
  const match = text.match(/^\s*version\s*=\s*["']([^"']+)["']/m)
    || text.match(/^\s*(?:val\s+|def\s+)?publishVersion[\s\S]*?["'](\d+\.\d+\.\d+)["']/m);
  return match?.[1] || '1.0.0';
}

function parseSemver(version) {
  const match = String(version).trim().replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bump(version, level) {
  const parsed = parseSemver(version);
  if (!parsed) {
    throw new Error(`Invalid semver base: ${version}`);
  }

  if (level === 'major') {
    return formatSemver({ major: parsed.major + 1, minor: 0, patch: 0 });
  }
  if (level === 'minor') {
    return formatSemver({ major: parsed.major, minor: parsed.minor + 1, patch: 0 });
  }
  return formatSemver({ major: parsed.major, minor: parsed.minor, patch: parsed.patch + 1 });
}

function latestReleaseTag() {
  return tryRun('git describe --tags --abbrev=0 --match "v[0-9]*"');
}

function commitMessagesSince(ref) {
  const range = ref ? `${ref}..HEAD` : 'HEAD';
  const log = tryRun(`git log ${range} --pretty=%B%x1e`);
  return log
    ? log.split('\x1e').map((entry) => entry.trim()).filter(Boolean)
    : [];
}

function detectBump(messages) {
  let level = null;

  for (const message of messages) {
    const subject = message.split('\n')[0] || '';
    if (
      /^[a-z]+(?:\([^)]*\))?!:/.test(subject)
      || /^BREAKING CHANGE[:/]/im.test(message)
      || /^BREAKING-CHANGE[:/]/im.test(message)
    ) {
      return 'major';
    }
    if (/^feat(?:\([^)]*\))?:/.test(subject)) {
      level = 'minor';
      continue;
    }
    if (
      /^(fix|perf|hotfix)(?:\([^)]*\))?:/.test(subject)
      || /^chore\(deps(?:-[^)]+)?\):/.test(subject)
    ) {
      if (level === null) {
        level = 'patch';
      }
    }
  }

  return level;
}

function resolveNextVersion() {
  const tag = latestReleaseTag();
  const base = tag ? tag.replace(/^v/, '') : null;
  const detected = detectBump(commitMessagesSince(tag));

  if (!base) {
    return detected
      ? { base: null, tag: null, bump: detected, next: '1.0.0', release: true }
      : { base: null, tag: null, bump: 'none', next: '', release: false };
  }

  return detected
    ? { base, tag, bump: detected, next: bump(base, detected), release: true }
    : { base, tag, bump: 'none', next: '', release: false };
}

function usage() {
  console.error('Usage: node .github/scripts/resolve-publish-version.mjs <pr <n>|dev|rc|next>');
  process.exit(2);
}

const mode = process.argv[2];
if (!mode) {
  usage();
}

const resolved = resolveNextVersion();
let version = '';

if (!resolved.release) {
  version = '';
} else if (mode === 'next') {
  version = resolved.next;
} else if (mode === 'dev') {
  version = `${resolved.next}-dev-SNAPSHOT`;
} else if (mode === 'rc') {
  version = `${resolved.next}-RC-SNAPSHOT`;
} else if (mode === 'pr') {
  const pr = process.argv[3];
  if (!pr || !/^\d+$/.test(pr)) {
    usage();
  }
  version = `${resolved.next}-PR${pr}-SNAPSHOT`;
} else {
  usage();
}

process.stdout.write(`version=${version}\n`);
process.stdout.write(`next=${resolved.next}\n`);
process.stdout.write(`base=${resolved.base || gradleFallbackVersion()}\n`);
process.stdout.write(`bump=${resolved.bump}\n`);
process.stdout.write(`release=${resolved.release}\n`);
process.stdout.write(`tag=${resolved.tag || ''}\n`);
