import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadRegistry, resolveContext } from '../src/registry.mjs';
import { WorkstreamError } from '../src/errors.mjs';
import { createTmpDir, createTmpRegistry, cleanupTmpDir } from './helpers/tmpreg.mjs';

describe('registry', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTmpDir();
  });

  after(() => {
    cleanupTmpDir(tmpDir);
  });

  it('raises typed error when registry file absent', () => {
    assert.throws(
      () => loadRegistry('/nonexistent/path'),
      {
        name: 'WorkstreamError',
        code: 'REGISTRY_NOT_FOUND'
      }
    );
  });

  it('parses empty registry to empty entry list', () => {
    createTmpRegistry(tmpDir, '');
    const { entries } = loadRegistry(tmpDir);
    assert.deepEqual(entries, []);
  });

  it('parses comment-only registry to empty entry list', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, '# This is a comment\n# Another comment\n');
    const { entries } = loadRegistry(dir);
    assert.deepEqual(entries, []);
    cleanupTmpDir(dir);
  });

  it('raises typed error for malformed YAML', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, '  invalid: [\n    yaml: missing');
    assert.throws(
      () => loadRegistry(dir),
      {
        name: 'WorkstreamError',
        code: 'PARSE_ERROR'
      }
    );
    cleanupTmpDir(dir);
  });

  it('raises typed error for top-level mapping', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, 'name: test\npath: /tmp\n');
    assert.throws(
      () => loadRegistry(dir),
      {
        name: 'WorkstreamError',
        code: 'INVALID_SCHEMA'
      }
    );
    cleanupTmpDir(dir);
  });

  it('raises validation error for entry missing name', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, '- path: /tmp/test\n');
    assert.throws(
      () => loadRegistry(dir),
      {
        name: 'WorkstreamError',
        code: 'VALIDATION_ERROR',
        message: /missing required field "name"/
      }
    );
    cleanupTmpDir(dir);
  });

  it('raises validation error for entry missing path', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, '- name: test\n');
    assert.throws(
      () => loadRegistry(dir),
      {
        name: 'WorkstreamError',
        code: 'VALIDATION_ERROR',
        message: /missing required field "path"/
      }
    );
    cleanupTmpDir(dir);
  });

  it('validates entry with only required fields', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, '- name: test\n  path: /tmp/test\n');
    const { entries } = loadRegistry(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].name, 'test');
    assert.equal(entries[0].path, '/tmp/test');
    assert.equal(entries[0].context, undefined);
    assert.equal(entries[0].description, undefined);
    cleanupTmpDir(dir);
  });

  it('returns all entries with fields intact from well-formed registry', () => {
    const dir = createTmpDir();
    const yaml = `# My workstreams
- name: project-a
  path: /home/user/project-a
  context: AGENTS.md
  description: Main project

- name: project-b
  path: /home/user/project-b
`;
    createTmpRegistry(dir, yaml);
    const { entries } = loadRegistry(dir);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].name, 'project-a');
    assert.equal(entries[0].context, 'AGENTS.md');
    assert.equal(entries[0].description, 'Main project');
    assert.equal(entries[1].name, 'project-b');
    cleanupTmpDir(dir);
  });
});

describe('resolveContext', () => {
  it('returns null reference when no context field', () => {
    const result = resolveContext({ name: 'test', path: '/tmp' });
    assert.equal(result.reference, null);
    assert.equal(result.contents, null);
  });

  it('returns non-local note for URL paths', () => {
    const result = resolveContext({
      name: 'test',
      path: 'https://example.com/repo',
      context: 'README.md'
    });
    assert.equal(result.note, 'non-local-path');
    assert.equal(result.contents, null);
  });

  it('returns missing-context warning for absent local file', () => {
    const result = resolveContext({
      name: 'test',
      path: '/tmp/nonexistent',
      context: 'AGENTS.md'
    });
    assert.equal(result.note, 'missing-context');
    assert.equal(result.contents, null);
  });

  it('returns contents for readable local file', () => {
    const tmpDir = createTmpDir();
    const testDir = join(tmpDir, 'readtest');
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'AGENTS.md'), '# Test Content', 'utf8');
    const result = resolveContext({
      name: 'test',
      path: testDir,
      context: 'AGENTS.md'
    });
    assert.equal(result.contents, '# Test Content');
    assert.equal(result.note, null);
    cleanupTmpDir(tmpDir);
  });
});
