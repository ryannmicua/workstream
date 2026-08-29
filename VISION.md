# Vision

`workstream` exists so that any AI agent session can locate and load context about any related work from any project folder.
A workstream can be anything: a folder, a GitHub repo, a URL, a ticket, a system, a service.
It serves the operator who runs multiple repos, tickets, systems, and services, and it turns scattered references into a single queryable surface.
It owns exactly one thing: the workstream registry.

## Simplicity

The registry is a flat YAML file that agents can grep.
Complex schemas, nested trees, and machine-only formats are refused.
A flat list that agents can grep is better than a complex YAML tree that nobody maintains.
If a feature requires a parser, it is probably too complex for v1.
The router may provide a way to discover workstreams, but the operator adds the entry.

## Integration over duplication

The registry references existing data sources. It does not duplicate them.
Paseo's projects.json, the ssd-it-ops WORKBOARD, and per-repo AGENTS.md files are pointed to, not rewritten.
New entries reference these sources by path. They never restate their content.
When a data source moves, the registry entry updates its path. The data stays where it lives.

## Human writability

The registry is written to manually.
An operator can add, edit, or remove an entry by hand or by instructing an agent to do so.
Agent write-back requires explicit instructions from the operator.
The format is readable in a terminal and parseable by agents.
No entry requires a tool to create. No entry requires a tool to understand.

## Point, don't summarize

The router points to the entry file for each workstream. It does not summarize a repo's rules.
Each entry says where to find the relevant AGENTS.md, WORKBOARD, or runbook section.
The agent loads what it needs. The router decides nothing about what to load.

## Scope

The router is a pointer to any location, not scoped to a single directory tree.
The registry is local to the machine and not versioned.
This project is not a project manager, not a ticketing system, not a CI pipeline, not a search engine.
It does not store secrets, credentials, or private material.
It does not track staleness, health, or status of workstreams.
It does not maintain relationship edges between entries.
Each repo keeps its own conventions. The router points to them. It never overrides them.

A change aligns when it makes a workstream easier to locate, load, or reference from an agent session.
A change should be resisted when it duplicates data already stored in another source, adds schema complexity without a concrete use case, makes the registry harder to write by hand, introduces a dependency on external tooling, or turns the router into a management surface.
