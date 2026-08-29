---
name: workstream
last_updated: 2026-08-29
---

# workstream Strategy

See VISION.md for the project's principles; this document carries direction.

## Purpose

Developers working across multiple projects need to reference context from other repos, tickets, or systems without copying it into where they're working now. A central registry eliminates the need to remember paths.

## Positioning

One central registry so you never have to remember where things are — just look it up and load it.

## Users

**Primary:** Developers working across multiple projects - They're hiring the product to reference context from other repos, tickets, or systems without copying it into where they're working now.

## Boundaries

- No auto-discovery — the operator adds entries (agent-directed or tool-assisted)
- No relationship edges between workstreams
- No staleness tracking or health monitoring
- No complex schemas — flat YAML that agents can grep

_Resist a change when:_ it duplicates data already stored in another source, adds schema complexity without a concrete use case, makes the registry harder to write by hand, or introduces a dependency on external tooling.

## Key metrics

- **Lookup success** - Agent finds the workstream by name without hunting for paths
- **Registry coverage** - Workstreams are registered before they're needed, not looked up ad-hoc
- **Context load time** - From name to context loaded, no friction

## Tracks

### Build the skill

Implement the core skill: load, list, route, add, remove, and setup operations against a flat YAML registry.

_Why it serves the approach:_ The skill is the entire product — without it, the registry is just a file.
