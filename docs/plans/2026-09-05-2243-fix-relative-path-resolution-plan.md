---
title: Fix Relative Path Resolution in Add Command - Plan
type: fix
date: 2026-09-05
topic: fix-relative-path-resolution
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Fix Relative Path Resolution in Add Command - Plan

## Goal Capsule

**Objective:** When an operator runs `workstream add <name> --path .` or any relative path, the registry stores an absolute path so that `find` and `resolveContext` can resolve context files and enforce path traversal guards.

**Product Authority:** VISION.md, then README.md's schema, then this plan.

**Open Blockers:** None.

---

## Product Contract

### Summary

Resolve `--path` values to absolute paths in the `add` command before writing to the registry, using `path.resolve(process.cwd(), flags.path)`. This ensures `resolveContext` in `registry.mjs` can correctly resolve relative `--context` values and enforce path traversal guards.

### Problem Frame

Currently `add.mjs:58` stores the literal `flags.path` value. When a relative path like `.` is stored, `resolveContext()` in `registry.mjs` fails to resolve it because `isAbsolute('.')` returns `false`. This breaks two things: relative `--context` values can't be resolved against the path (line 104-105), and the path traversal guard (lines 108-113) never fires because it requires both `path` and `ref` to be absolute. Any entry added with `--path .` or `--path ./subdir` silently loses context resolution.

### Key Decisions

- Resolve all relative paths, not just `.` — `path.resolve()` handles `.`, `..`, `./subdir`, and trailing slashes uniformly. There is no reason to special-case one relative form. (Governs R1)
- Do not validate path existence at add time. The `find` command already handles missing paths gracefully via the `missing-context` note. Existence validation at add time would add coupling and produce confusing errors for entries added before their target directories exist. (Governs R1)
- Apply resolution only to `--path`, not to `--context`. The `--context` field is intentionally a relative reference that `resolveContext` resolves against the stored path. Resolving `--context` at add time would break the traversal guard and change the meaning of the field. (Governs R2)
- No change to `registry.mjs` or `resolveContext`. The fix is entirely at the write boundary in `add.mjs`. The registry consumer already expects absolute paths. (Governs R1)

### Requirements

R1. `add` resolves `--path` to an absolute path using `path.resolve(process.cwd(), flags.path)` before writing to the registry. All relative forms (`.` `..` `./subdir` `../other`, trailing slashes) resolve correctly. Already-absolute paths pass through unchanged.

R2. `--context` values remain relative. They are resolved by `resolveContext` at read time, not at write time.

R3. The path stored in the registry is the resolved absolute path, not the original user input.

### Acceptance Examples

AE1. `workstream add current --path .` stores the absolute path of `process.cwd()` in the registry, not `.`.

AE2. `workstream add current --path ./subdir` stores the absolute path to `subdir` relative to `process.cwd()`.

AE3. `workstream add current --path /absolute/path` stores `/absolute/path` unchanged.

AE4. `workstream add current --path ../other` stores the resolved absolute path to `../other`.

AE5. After adding with a relative path, `workstream find current --context AGENTS.md` correctly resolves the context file relative to the stored absolute path.

### Scope Boundaries

- No change to `resolveContext` or any other function in `registry.mjs`
- No path existence validation at add time
- No change to `--context` handling
- No change to other commands (`find`, `list`, `remove`)
