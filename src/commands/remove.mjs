import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { loadRegistry, getRegistryPath } from '../registry.mjs';
import { WorkstreamError } from '../errors.mjs';

export function removeCommand(args, flags) {
  const name = args[0];
  if (!name) {
    throw new WorkstreamError(
      'Missing workstream name.',
      'MISSING_ARGUMENT',
      'Usage: workstream remove <name> [-q]'
    );
  }

  const { entries, document } = loadRegistry();
  const index = entries.findIndex(e => e.name === name);

  if (index === -1) {
    throw new WorkstreamError(
      `Workstream "${name}" not found.`,
      'NOT_FOUND',
      'Use `workstream list` to see available workstreams.'
    );
  }

  if (!flags.quiet) {
    if (!process.stdin.isTTY) {
      throw new WorkstreamError(
        'Cannot prompt for confirmation on non-TTY input.',
        'NON_TTY_PROMPT',
        'Use -q to skip confirmation: workstream remove <name> -q'
      );
    }

    process.stdout.write(`Remove "${name}"? [y/N] `);
    const answer = readFileSync(process.stdin.fd, 'utf8').trim().toLowerCase();
    if (answer !== 'y' && answer !== 'yes') {
      return { message: 'Cancelled.' };
    }
  }

  const registryPath = getRegistryPath();
  const items = document.contents?.items;

  if (items) {
    for (let i = 0; i < items.length; i++) {
      const nameProp = items[i].items.find(p => p.key?.value === 'name');
      if (nameProp && nameProp.value?.value === name) {
        const removed = items[i];
        if (removed.commentBefore && i > 0) {
          const prev = items[i - 1];
          prev.commentBefore = prev.commentBefore
            ? prev.commentBefore + '\n' + removed.commentBefore
            : removed.commentBefore;
        }
        items.splice(i, 1);
        break;
      }
    }
  }

  if (!items || items.length === 0) {
    writeFileSync(registryPath, '', 'utf8');
  } else {
    writeFileSync(registryPath, document.toString(), 'utf8');
  }

  return { message: `Removed ${name}` };
}
