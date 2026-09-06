import { createRequire } from 'node:module';
import { formatOutput } from './output.mjs';
import { WorkstreamError } from './errors.mjs';
import { listCommand } from './commands/list.mjs';
import { findCommand } from './commands/find.mjs';
import { addCommand } from './commands/add.mjs';
import { removeCommand } from './commands/remove.mjs';

const USAGE = `workstream <command> [args]

Commands:
  list                  List registered workstreams
  find <name>           Load a workstream's context
  add <name> --path <path> [--context <file>] [--desc <text>]
  remove <name> [-q]    Remove a workstream entry
  setup                 Install skill, create registry, configure completion
  help                  Show this help message

Options:
  --help                Show this help message
  --version             Show version`;

export function parseArgs(argv) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--version' || arg === '-v') {
      flags.version = true;
    } else if (arg === '--names') {
      flags.names = true;
    } else if (arg === '--full') {
      flags.full = true;
    } else if (arg === '--match' || arg === '-m') {
      if (i + 1 >= argv.length) throw new WorkstreamError('Missing value for --match', 'MISSING_ARGUMENT');
      flags.match = argv[++i];
    } else if (arg === '--path') {
      if (i + 1 >= argv.length) throw new WorkstreamError('Missing value for --path', 'MISSING_ARGUMENT');
      flags.path = argv[++i];
    } else if (arg === '--context') {
      if (i + 1 >= argv.length) throw new WorkstreamError('Missing value for --context', 'MISSING_ARGUMENT');
      flags.context = argv[++i];
    } else if (arg === '--desc') {
      if (i + 1 >= argv.length) throw new WorkstreamError('Missing value for --desc', 'MISSING_ARGUMENT');
      flags.desc = argv[++i];
    } else if (arg === '-q') {
      flags.quiet = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg.startsWith('-')) {
      throw new WorkstreamError(`Unknown option: ${arg}`, 'UNKNOWN_OPTION');
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

export async function run(argv) {
  const { positional, flags } = parseArgs(argv);

  if (flags.help) {
    console.log(USAGE);
    process.exit(0);
  }

  if (flags.version) {
    const require = createRequire(import.meta.url);
    const pkg = require('../package.json');
    console.log(pkg.version);
    process.exit(0);
  }

  const command = positional[0];
  const args = positional.slice(1);

  if (!command) {
    console.error(USAGE);
    process.exit(1);
  }

  try {
    let result;

    switch (command) {
      case 'list':
        result = listCommand(args, flags);
        break;
      case 'find':
        result = findCommand(args, flags);
        break;
      case 'add':
        result = addCommand(args, flags);
        break;
      case 'remove':
        result = await removeCommand(args, flags);
        break;
      case 'setup': {
        const { setupCommand } = await import('./commands/setup.mjs');
        result = await setupCommand(args, flags);
        break;
      }
      case 'help': {
        console.log(USAGE);
        process.exit(0);
      }
      case '--completion-names': {
        const { entries } = listCommand([], { names: true });
        console.log(entries.map(e => e.name).join('\n'));
        process.exit(0);
      }
      default:
        console.error(`Unknown command: ${command}`);
        console.error(USAGE);
        process.exit(1);
    }

    if (result) {
      const output = formatOutput(result, flags);
      if (result.warnings && result.warnings.length > 0 && !flags.json) {
        for (const warn of result.warnings) {
          console.error(`Warning: ${warn}`);
        }
      }
      console.log(output);
    }

    process.exit(0);
  } catch (err) {
    if (err instanceof WorkstreamError) {
      console.error(err.message);
      if (err.action) {
        console.error(err.action);
      }
      process.exit(1);
    }
    throw err;
  }
}
