import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
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

  // 1. Link CLI binary globally
  const repoDir = join(SCRIPT_DIR, '..', '..');
  const linked = await new Promise(resolve => {
    execFile('npm', ['link'], { cwd: repoDir }, err => resolve(!err));
  });
  if (linked) {
    const globalPrefix = await new Promise(resolve => {
      execFile('npm', ['prefix', '-g'], (err, stdout) => resolve(err ? '' : stdout.trim()));
    });
    const linkPath = globalPrefix ? join(globalPrefix, 'bin', 'workstream') : 'workstream (in global PATH)';
    results.push({ artifact: 'cli', status: 'linked', path: linkPath });
  } else {
    results.push({ artifact: 'cli', status: 'manual', path: repoDir, note: 'run: sudo npm link' });
  }

  // 2. Create registry
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

  // 3. Install agent skill
  const skillSource = join(SCRIPT_DIR, '..', '..', 'skill', 'SKILL.md');
  const versionStamp = `<!-- installed from workstream ${getPackageVersion()} -->\n`;

  const installSkill = (targetDir) => {
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    const skillPath = join(targetDir, 'SKILL.md');
    if (existsSync(skillSource)) {
      writeFileSync(skillPath, versionStamp + readFileSync(skillSource, 'utf8'), 'utf8');
      return { artifact: 'skill', status: 'created', path: skillPath };
    }
    return { artifact: 'skill', status: 'skipped', path: skillPath, note: 'source not found' };
  };

  results.push(installSkill(join(home, '.agents', 'skills', 'workstream')));

  const claudePresent = existsSync(join(home, '.claude'));
  if (claudePresent) {
    results.push(installSkill(join(home, '.claude', 'skills', 'workstream')));
  }

  // 4. Install bash completion
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
  const lines = [];
  const pad = 22;
  for (const r of results) {
    const label = r.artifact.padEnd(pad);
    switch (r.status) {
      case 'linked':
        lines.push(`${label} ${r.path}`);
        break;
      case 'manual':
        lines.push(`${label} ${r.note}`);
        lines.push(`${''.padEnd(pad)} from ${r.path}`);
        break;
      case 'created':
        lines.push(`${label} ${r.path}`);
        break;
      case 'already present':
        lines.push(`${label} ${r.path} (already exists)`);
        break;
      case 'available':
        lines.push(`${label} ${r.path}`);
        lines.push(`${''.padEnd(pad)} ${r.note}`);
        break;
      case 'skipped':
        lines.push(`${label} skipped — ${r.note}`);
        break;
      default:
        lines.push(`${label} ${r.status}`);
    }
  }

  return { message: lines.join('\n') };
}
