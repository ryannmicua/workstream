import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { getRegistryPath } from '../registry.mjs';
import { WorkstreamError } from '../errors.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const REGISTRY_TEMPLATE = `# Workstream Registry
# Each entry has a name (required), path (required), and optional context and description.
# Example:
# - name: heypogi
#   path: /home/user/repo/heypogi
#   context: AGENTS.md
#   description: Current project's agent instructions
`;

function getPackageVersion() {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require('../../package.json');
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

export async function setupCommand(args, flags) {
  const home = homedir();
  const results = [];

  // Preflight checks
  const nodeVersion = process.version;
  if (parseInt(nodeVersion.slice(1)) < 22) {
    throw new WorkstreamError(
      `Node.js 22+ required. Current: ${nodeVersion}`,
      'PREFLIGHT_FAILED',
      'Upgrade Node.js to version 22 or later.'
    );
  }

  // Check yaml dependency
  try {
    await import('yaml');
  } catch {
    throw new WorkstreamError(
      'yaml package not found.',
      'PREFLIGHT_FAILED',
      'Run: npm install'
    );
  }

  // 1. Create registry
  const registryPath = getRegistryPath();
  const registryDir = dirname(registryPath);

  if (!existsSync(registryDir)) {
    mkdirSync(registryDir, { recursive: true });
  }

  if (!existsSync(registryPath)) {
    writeFileSync(registryPath, REGISTRY_TEMPLATE, 'utf8');
    results.push({ artifact: 'registry', status: 'created', path: registryPath });
  } else {
    results.push({ artifact: 'registry', status: 'already present', path: registryPath });
  }

  // 2. Install agent skill
  const skillDir = join(home, '.claude', 'skills', 'workstream');
  const skillPath = join(skillDir, 'SKILL.md');

  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true });
  }

  const skillSource = join(SCRIPT_DIR, '..', '..', 'skill', 'SKILL.md');

  if (existsSync(skillSource)) {
    const sourceContent = readFileSync(skillSource, 'utf8');
    const versionStamp = `<!-- installed from workstream ${getPackageVersion()} -->\n`;
    writeFileSync(skillPath, versionStamp + sourceContent, 'utf8');
    results.push({ artifact: 'skill', status: 'created', path: skillPath });
  } else {
    results.push({ artifact: 'skill', status: 'skipped', path: skillPath, note: 'source not found' });
  }

  // 3. Install bash completion
  const completionDir = join(home, '.local', 'share', 'bash-completion', 'completions');
  const bashCompletionPath = join(completionDir, 'workstream');
  const bashSource = join(SCRIPT_DIR, '..', '..', 'completions', 'workstream.bash');

  if (existsSync(bashSource)) {
    if (!existsSync(completionDir)) {
      mkdirSync(completionDir, { recursive: true });
    }
    copyFileSync(bashSource, bashCompletionPath);
    results.push({ artifact: 'bash-completion', status: 'created', path: bashCompletionPath });
  }

  const ps1Source = join(SCRIPT_DIR, '..', '..', 'completions', 'workstream.ps1');
  if (existsSync(ps1Source)) {
    results.push({ artifact: 'powershell-completion', status: 'available', path: ps1Source, note: 'copy manually or run setup in PowerShell' });
  }

  // Summary
  const summary = results.map(r => {
    const line = `${r.artifact}: ${r.status}`;
    return r.note ? `${line} (${r.note})` : line;
  }).join('\n');

  return { message: summary };
}
