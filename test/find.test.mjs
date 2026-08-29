import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findCommand } from '../src/commands/find.mjs';
import { WorkstreamError } from '../src/errors.mjs';
import { createTmpDir, createTmpRegistry, cleanupTmpDir } from './helpers/tmpreg.mjs';

describe('find', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTmpDir();
  });

  after(() => {
    cleanupTmpDir(tmpDir);
  });

  it('finds local entry with context file', () => {
    const dir = createTmpDir();
    const workDir = join(dir, 'myproject');
    mkdirSync(workDir, { recursive: true });
    writeFileSync(join(workDir, 'AGENTS.md'), '# Project Agents', 'utf8');
    createTmpRegistry(dir, `- name: myproject\n  path: ${workDir}\n  context: AGENTS.md\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = findCommand(['myproject'], {});
    assert.equal(result.name, 'myproject');
    assert.equal(result.content, '# Project Agents');
    assert.equal(result.warnings.length, 0);
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('finds entry with missing context: warning, no error', () => {
    const dir = createTmpDir();
    const workDir = join(dir, 'myproject');
    mkdirSync(workDir, { recursive: true });
    createTmpRegistry(dir, `- name: myproject\n  path: ${workDir}\n  context: MISSING.md\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = findCommand(['myproject'], {});
    assert.equal(result.content, null);
    assert.ok(result.warnings.some(w => w.includes('not found')));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('finds entry with no context field: returns path only', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: simple\n  path: /tmp/simple\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = findCommand(['simple'], {});
    assert.equal(result.path, '/tmp/simple');
    assert.equal(result.context, null);
    assert.equal(result.content, null);
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('finds entry with URL path: returns reference with not-fetched note', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: remote\n  path: https://github.com/test/repo\n  context: README.md\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = findCommand(['remote'], {});
    assert.equal(result.path, 'https://github.com/test/repo');
    assert.ok(result.warnings.some(w => w.includes('non-local')));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('finds entry with ssh-style path: returns reference with not-fetched note', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: server\n  path: user@host:/dir\n  context: README.md\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = findCommand(['server'], {});
    assert.equal(result.path, 'user@host:/dir');
    assert.ok(result.warnings.some(w => w.includes('non-local')));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('unknown name: raises typed error with suggestions', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: project\n  path: /tmp/project\n`);
    process.env.WORKSTREAM_HOME = dir;
    assert.throws(
      () => findCommand(['projet'], {}),
      {
        name: 'WorkstreamError',
        code: 'NOT_FOUND'
      }
    );
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('missing name argument: raises error', () => {
    assert.throws(
      () => findCommand([], {}),
      {
        name: 'WorkstreamError',
        code: 'MISSING_ARGUMENT'
      }
    );
  });
});
