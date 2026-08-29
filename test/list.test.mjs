import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { listCommand } from '../src/commands/list.mjs';
import { createTmpDir, createTmpRegistry, cleanupTmpDir } from './helpers/tmpreg.mjs';

describe('list', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTmpDir();
  });

  after(() => {
    cleanupTmpDir(tmpDir);
  });

  it('names-only mode: emits one name per entry', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: project-a\n  path: /a\n- name: project-b\n  path: /b\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = listCommand([], { names: true });
    assert.equal(result.entries.length, 2);
    assert.equal(result.entries[0].name, 'project-a');
    assert.equal(result.entries[1].name, 'project-b');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('default mode: emits name and path', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: test\n  path: /tmp/test\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = listCommand([], {});
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].name, 'test');
    assert.equal(result.entries[0].path, '/tmp/test');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('full mode: includes all fields', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: test\n  path: /tmp/test\n  context: README.md\n  description: A test\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = listCommand([], { full: true });
    assert.equal(result.entries[0].context, 'README.md');
    assert.equal(result.entries[0].description, 'A test');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('--match is case-insensitive substring', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: ProjectA\n  path: /a\n- name: ProjectB\n  path: /b\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = listCommand([], { match: 'project' });
    assert.equal(result.entries.length, 2);
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('--match with pattern matching subset', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: alpha\n  path: /a\n- name: beta\n  path: /b\n- name: gamma\n  path: /g\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = listCommand([], { match: 'alpha' });
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].name, 'alpha');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('--match with pattern matching nothing: empty result', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, `- name: alpha\n  path: /a\n`);
    process.env.WORKSTREAM_HOME = dir;
    const result = listCommand([], { match: 'zzz' });
    assert.equal(result.entries.length, 0);
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('empty registry: reports emptiness', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, '');
    process.env.WORKSTREAM_HOME = dir;
    const result = listCommand([], {});
    assert.equal(result.entries.length, 0);
    assert.ok(result.message.includes('No workstreams'));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });
});
