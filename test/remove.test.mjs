import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { removeCommand } from '../src/commands/remove.mjs';
import { loadRegistry } from '../src/registry.mjs';
import { WorkstreamError } from '../src/errors.mjs';
import { createTmpDir, cleanupTmpDir } from './helpers/tmpreg.mjs';

describe('remove', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTmpDir();
  });

  after(() => {
    cleanupTmpDir(tmpDir);
  });

  it('removes existing entry with -q', async () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'),
      '- name: toremove\n  path: /tmp/remove\n', 'utf8');
    const result = await removeCommand(['toremove'], { quiet: true });
    assert.ok(result.message.includes('Removed toremove'));
    const { entries } = loadRegistry(dir);
    assert.equal(entries.length, 0);
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('removes only entry: file stays valid empty list', async () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'),
      '- name: only\n  path: /tmp/only\n', 'utf8');
    await removeCommand(['only'], { quiet: true });
    const raw = readFileSync(join(dir, '.workstream', 'registry.yaml'), 'utf8');
    assert.ok(!raw.includes('[]'));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('non-TTY stdin without -q: exits with error', async () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'),
      '- name: test\n  path: /tmp/test\n', 'utf8');
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    await assert.rejects(
      () => removeCommand(['test'], {}),
      {
        name: 'WorkstreamError',
        code: 'NON_TTY_PROMPT'
      }
    );
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('unknown name: raises typed error', async () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'),
      '- name: existing\n  path: /tmp/existing\n', 'utf8');
    await assert.rejects(
      () => removeCommand(['nonexistent'], { quiet: true }),
      {
        name: 'WorkstreamError',
        code: 'NOT_FOUND'
      }
    );
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('prints confirmation', async () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'),
      '- name: printtest\n  path: /tmp/print\n', 'utf8');
    const result = await removeCommand(['printtest'], { quiet: true });
    assert.equal(result.message, 'Removed printtest');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('preserves surrounding comments', async () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'),
      '# Header\n- name: keep\n  path: /tmp/keep\n# Middle comment\n- name: remove\n  path: /tmp/remove\n# Footer\n', 'utf8');
    await removeCommand(['remove'], { quiet: true });
    const raw = readFileSync(join(dir, '.workstream', 'registry.yaml'), 'utf8');
    assert.ok(raw.includes('# Header'));
    assert.ok(raw.includes('# Middle comment'));
    assert.ok(raw.includes('# Footer'));
    assert.ok(!raw.includes('remove'));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('missing name raises error', async () => {
    await assert.rejects(
      () => removeCommand([], { quiet: true }),
      {
        name: 'WorkstreamError',
        code: 'MISSING_ARGUMENT'
      }
    );
  });
});
