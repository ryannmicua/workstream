# Fix: EAGAIN on synchronous stdin read in CLI tools

## Problem
`workstream remove <name>` crashes with `Error: EAGAIN: resource temporarily unavailable, read` when prompting for `[y/N]` confirmation.

The root cause is `readFileSync(process.stdin.fd, 'utf8')` — a blocking read on stdin's file descriptor, which can be in non-blocking mode on some systems.

## Solution
Replace `readFileSync(process.stdin.fd)` with Node's `readline` module:

```js
import { createInterface } from 'node:readline';

// Before (broken):
const answer = readFileSync(process.stdin.fd, 'utf8').trim().toLowerCase();

// After (correct):
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await new Promise(resolve => {
  rl.on('line', line => {
    rl.close();
    resolve(line.trim().toLowerCase());
  });
  rl.on('close', () => resolve(''));
});
```

If the calling function was sync, make it async and update callers to `await` it.

## Why This Works
`readline` reads stdin via the Node event loop rather than a blocking fd read, avoiding the EAGAIN condition entirely. This is the idiomatic Node.js approach for interactive prompts.

## Files Changed
- `src/commands/remove.mjs` — replaced sync read with readline, made function async
- `src/cli.mjs` — added `await` to `removeCommand` call
- `test/remove.test.mjs` — updated tests to async/await and `assert.rejects`

## Applicability
Any Node.js CLI tool that reads from stdin interactively. Never use `readFileSync(process.stdin.fd)` — always use `readline.createInterface`.
