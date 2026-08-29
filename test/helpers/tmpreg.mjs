import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export function createTmpDir() {
  return mkdtempSync(join(tmpdir(), 'workstream-test-'));
}

export function createTmpRegistry(dir, content) {
  const regDir = join(dir, '.workstream');
  mkdirSync(regDir, { recursive: true });
  const path = join(regDir, 'registry.yaml');
  writeFileSync(path, content, 'utf8');
  return path;
}

export function cleanupTmpDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}
