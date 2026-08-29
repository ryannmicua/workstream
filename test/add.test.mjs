import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { addCommand } from '../src/commands/add.mjs';
import { loadRegistry } from '../src/registry.mjs';
import { WorkstreamError } from '../src/errors.mjs';
import { createTmpDir, createTmpRegistry, cleanupTmpDir } from './helpers/tmpreg.mjs';

describe('add', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTmpDir();
  });

  after(() => {
    cleanupTmpDir(tmpDir);
  });

  it('adds entry with required fields only', () => {
    const dir = createTmpDir();
    createTmpRegistry(dir, '');
    process.env.WORKSTREAM_HOME = dir;
    const result = addCommand(['newproject'], { path: '/tmp/newproject' });
    assert.ok(result.message.includes('Added newproject'));
    const { entries } = loadRegistry(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].name, 'newproject');
    assert.equal(entries[0].path, '/tmp/newproject');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('adds entry with all flags', () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    addCommand(['full'], {
      path: '/tmp/full',
      context: 'AGENTS.md',
      desc: 'Full entry'
    });
    const { entries } = loadRegistry(dir);
    assert.equal(entries[0].context, 'AGENTS.md');
    assert.equal(entries[0].description, 'Full entry');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('rejects duplicate name', () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    addCommand(['dup'], { path: '/tmp/a' });
    assert.throws(
      () => addCommand(['dup'], { path: '/tmp/b' }),
      {
        name: 'WorkstreamError',
        code: 'DUPLICATE_NAME'
      }
    );
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('missing --path raises error', () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    assert.throws(
      () => addCommand(['test'], {}),
      {
        name: 'WorkstreamError',
        code: 'MISSING_ARGUMENT'
      }
    );
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('missing name raises error', () => {
    assert.throws(
      () => addCommand([], { path: '/tmp' }),
      {
        name: 'WorkstreamError',
        code: 'MISSING_ARGUMENT'
      }
    );
  });

  it('prints confirmation', () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    const result = addCommand(['confirm'], { path: '/tmp/confirm' });
    assert.equal(result.message, 'Added confirm');
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('preserves header comment on add', () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'), '# Header comment\n', 'utf8');
    addCommand(['aftercomment'], { path: '/tmp/after' });
    const raw = readFileSync(join(dir, '.workstream', 'registry.yaml'), 'utf8');
    assert.ok(raw.startsWith('# Header comment'));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });

  it('preserves inline comment on other entry', () => {
    const dir = createTmpDir();
    process.env.WORKSTREAM_HOME = dir;
    mkdirSync(join(dir, '.workstream'), { recursive: true });
    writeFileSync(join(dir, '.workstream', 'registry.yaml'),
      '- name: existing\n  path: /tmp/existing # inline comment\n', 'utf8');
    addCommand(['newone'], { path: '/tmp/new' });
    const raw = readFileSync(join(dir, '.workstream', 'registry.yaml'), 'utf8');
    assert.ok(raw.includes('# inline comment'));
    delete process.env.WORKSTREAM_HOME;
    cleanupTmpDir(dir);
  });
});
