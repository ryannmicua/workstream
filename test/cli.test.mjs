import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli.mjs';

describe('cli', () => {
  it('each command dispatches with parsed arguments', () => {
    const { positional, flags } = parseArgs(['find', 'myproject', '--json']);
    assert.deepEqual(positional, ['find', 'myproject']);
    assert.equal(flags.json, true);
  });

  it('unknown subcommand prints usage', () => {
    const { positional, flags } = parseArgs(['bogus']);
    assert.deepEqual(positional, ['bogus']);
  });

  it('--help sets help flag', () => {
    const { flags } = parseArgs(['--help']);
    assert.equal(flags.help, true);
  });

  it('--version sets version flag', () => {
    const { flags } = parseArgs(['--version']);
    assert.equal(flags.version, true);
  });

  it('add parses positional and flags', () => {
    const { positional, flags } = parseArgs(['add', 'new', '--path', '/tmp/new', '--desc', 'test']);
    assert.deepEqual(positional, ['add', 'new']);
    assert.equal(flags.path, '/tmp/new');
    assert.equal(flags.desc, 'test');
  });

  it('remove parses -q flag', () => {
    const { positional, flags } = parseArgs(['remove', 'old', '-q']);
    assert.deepEqual(positional, ['remove', 'old']);
    assert.equal(flags.quiet, true);
  });

  it('list parses --names and --match', () => {
    const { positional, flags } = parseArgs(['list', '--names', '--match', 'proj']);
    assert.deepEqual(positional, ['list']);
    assert.equal(flags.names, true);
    assert.equal(flags.match, 'proj');
  });

  it('unknown option throws', () => {
    assert.throws(
      () => parseArgs(['--bogus']),
      {
        name: 'WorkstreamError',
        code: 'UNKNOWN_OPTION'
      }
    );
  });
});
