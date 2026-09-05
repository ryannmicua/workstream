---
lorespec: "0.1"
id: "2026083001"
date: "2026-08-30"
source: "opencode"
topic: "Fix EAGAIN error in workstream remove command by replacing synchronous stdin read with readline module"
tags: [node.js, readline, stdin, synchronous-io, bugfix, cli]
classification:
  type: technical
  domains: [node.js, cli-tools]
  value: medium
trails: [workstream]
---

## Session Arc

### Started
User reported an EAGAIN crash when running `workstream remove atlas` — the command prompts for confirmation, then crashes with `Error: EAGAIN: resource temporarily unavailable, read` at `readFileSync(process.stdin.fd)`.

### Pivots
- Diagnosis: `readFileSync(process.stdin.fd)` performs a blocking read on a file descriptor that can be in non-blocking mode, causing EAGAIN on some systems (especially piped or TTY-muxed stdin).
- Decision: Replace synchronous stdin read with Node's `readline` module, which properly handles event-driven stdin. Since `run()` in cli.mjs is already async, making `removeCommand` async is a safe, minimal change.

### Ended
All 50 tests pass. The fix is clean and contained to 3 files.

## DECISIONS

### D1: Use readline instead of readFileSync on stdin
- **Decision**: Replace `readFileSync(process.stdin.fd, 'utf8')` with `createInterface` from `node:readline` and an async Promise-based line reader.
- **Issue**: `readFileSync` on stdin's file descriptor fails with EAGAIN on certain system configurations.
- **Positions**: (a) Keep sync read and add retry/error handling. (b) Switch to readline module. (c) Use `fs.readFileSync('/dev/stdin')` as a workaround.
- **Arguments**: readline is the idiomatic Node.js approach for interactive stdin; avoids file-descriptor-level issues; `run()` is already async so no API breakage.
- **Warrant**: Node.js stdin is an event stream, not a regular file — treating it as a file descriptor for sync reads is fragile.
- **Qualifier**: in this case
- **Status**: settled

## PATTERNS

### P1: Synchronous stdin reads are unsafe in Node.js CLI tools
- **Pattern**: Never use `readFileSync(process.stdin.fd)` for interactive prompts. Use `readline.createInterface` with async/await instead.
- **Scope**: local (Node.js CLI tools)
- **Why**: stdin file descriptors can be in non-blocking mode, causing EAGAIN. `readline` handles this correctly via the event loop.

## SOLUTIONS

### S1: EAGAIN on workstream remove confirmation prompt
- **What was broken**: `workstream remove <name>` crashed with EAGAIN when prompting for `[y/N]` confirmation.
- **What fixed it**: Replaced `readFileSync(process.stdin.fd)` (line 36 of remove.mjs) with `readline.createInterface` + async Promise. Made `removeCommand` async. Updated `cli.mjs` to `await` it. Updated tests to use `async`/`await` and `assert.rejects`.
- **Why it works**: `readline` reads stdin via the Node event loop rather than a blocking fd read, avoiding the EAGAIN condition entirely.
- **Caveats**: None — this is the correct idiomatic approach.
- **Files**: `src/commands/remove.mjs`, `src/cli.mjs`, `test/remove.test.mjs`

## CONNECTIONS
- S1 —[instance_of]→ P1
- D1 —[led_to]→ S1

## NEXT STEPS
- None — fix is complete, all tests pass.
