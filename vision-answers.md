# Vision Review - Answers (workstream-router)

## Round 1 Verdicts

| Card | Title | Verdict | Notes |
|------|-------|---------|-------|
| H-1 | Skill vs global file | In vision | |
| H-2 | Auto-discovery vs manual registry | In vision | |
| H-3 | Schema versioning from day one | Off mission | |
| H-4 | Relationship edges between workstreams | Off mission | |
| H-5 | Agent write-back to the registry | In vision | |
| H-6 | Credential paths in entries | In vision | |
| H-7 | Cross-repo keyword search | Off mission | |
| H-8 | Paseo lifecycle integration | Off mission | |
| H-9 | Format: Markdown vs YAML vs JSON | In vision | |
| H-10 | Staleness tracking | Off mission | |

## Round 2 Verdicts

| Card | Title | Verdict | Notes |
|------|-------|---------|-------|
| H-1 | Skill vs global file | In vision | |
| H-2 | Auto-discovery vs manual registry | Conditional | the router may provide a way to discover workstreams. but it is still up to the human operator to add the entry. |
| H-3 | Schema versioning from day one | Off mission | |
| H-4 | Relationship edges between workstreams | Off mission | |
| H-5 | Agent write-back to the registry | Conditional | write-back requires explicit instructions from operator. |
| H-6 | Credential paths in entries | In vision | |
| H-7 | Cross-repo keyword search | Off mission | |
| H-8 | Paseo lifecycle integration | Off mission | |
| H-9 | Format: Markdown vs YAML vs JSON | Conditional | we'll go with yaml |
| H-10 | Staleness tracking | Off mission | |

## Freeform Edits

1. **Identity opener**: "router is a pointer to any location, not just ~/repo/" - removed directory scope from identity.
2. **Human writability**: "the registry is written to manually - whether it is through the operator telling an agent to add/edit/delete or the operator hand editing the registry" - clarified that agent-directed edits count as manual.
3. **Workstream types**: "no workstream types for now" - removed the entire Workstream types section.
4. **Scope - registry location**: "the registry does not need to explicitly stay in the repo. In fact, the registry is not versioned. This project provides the capability to register workstreams. This information is local to the machine." - removed "The registry stays in the repo" and added "The registry is local to the machine and not versioned."
5. **Identity opener (round 2)**: "workstream can be anything. a folder, a github repo, a url." - broadened what a workstream is.
6. **H-2 Conditional**: "the router may provide a way to discover workstreams. but it is still up to the human operator to add the entry."
7. **H-5 Conditional**: "write-back requires explicit instructions from operator."
8. **H-9 Conditional**: "we'll go with yaml" - format decision: YAML, not Markdown.

## Principles Distilled

- **Universal pointer**: The router points anywhere, not just ~/repo/.
- **Manual means human-directed**: Hand-editing includes instructing an agent to edit on the operator's behalf.
- **Minimal v1**: No workstream types, no schema versioning, no relationship edges.
- **No management surface**: No staleness tracking, no health indicators, no status fields.
- **No external dependencies**: No Paseo lifecycle hooks, no cross-repo indexing.
- **Flat and grep-able**: Markdown format, no parsing complexity.
- **Security boundary**: Credential paths allowed, secrets never stored.

## Changelog

- H-1 no change (In vision)
- H-2 no change (In vision)
- H-3 Off mission -> simplicity section strengthened: "If a feature requires a parser, it is probably too complex for v1"
- H-4 Off mission -> scope section now explicitly refuses relationship edges
- H-5 no change (In vision) - agent write-back is allowed as operator-directed
- H-6 no change (In vision) - credential paths are references, not secrets
- H-7 Off mission -> scope section now explicitly refuses search engine behavior
- H-8 Off mission -> scope section now explicitly refuses external tooling dependencies
- H-9 no change (In vision) - Markdown is the format
- H-10 Off mission -> scope section now explicitly refuses staleness tracking
- Freeform 1 -> identity opener now says "any location" instead of "across ~/repo/"
- Freeform 2 -> human writability section rewritten to clarify manual includes agent-directed
- Freeform 3 -> Workstream types section removed entirely
