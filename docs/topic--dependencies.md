---
protocol: along
protocol_version: "4.4.15"
slug: dependencies
title: Dependencies & Submodules AI Documentation and Rules
type: topic
created: 2026-10-16
updated: 2026-10-16
tags: [dependencies, ai-context, submodules, vendor, rules]
---

# Dependencies & Submodules AI Documentation and Rules

> [!NOTE]
> This document maintains a unified registry of internal subprojects, submodules, and external dependencies.
> Consult linked guidelines when developing, refactoring, or integrating components across the repository.

## Internal Subprojects, Modules & Submodules

Single-root project structure. No nested subprojects or Git submodules detected.

## Internal Monorepo Dependency Graph

No internal monorepo package inter-dependencies detected.

## Declared External Dependencies with AI Guidelines

| Package | Scope / Project | Ecosystem | Version | AI Guidelines / Instructions |
| :--- | :--- | :--- | :--- | :--- |
| **`@actdim/dynstruct`** | `[root]` | `npm` | `1.9.0` | [AGENTS.md](../../dynstruct/AGENTS.md) <br> [CLAUDE.md](../../dynstruct/CLAUDE.md) <br> [llms-full.txt](../../dynstruct/llms-full.txt) <br> [llms.txt](../../dynstruct/llms.txt) <br> [.along/](../node_modules/@actdim/dynstruct/.along) <br> [docs/](../node_modules/@actdim/dynstruct/docs) <br> manifest metadata (`ai`) |
| **`@actdim/dynstruct-mui`** | `[root]` | `npm` | `1.9.0` | [AGENTS.md](../../dynstruct-mui/AGENTS.md) <br> [CLAUDE.md](../../dynstruct-mui/CLAUDE.md) <br> [llms-full.txt](../../dynstruct-mui/llms-full.txt) <br> [llms.txt](../../dynstruct-mui/llms.txt) <br> [.along/](../node_modules/@actdim/dynstruct-mui/.along) <br> [docs/](../node_modules/@actdim/dynstruct-mui/docs) <br> manifest metadata (`ai`) |
| **`@actdim/msgmesh`** | `[root]` | `npm` | `1.9.0` | [AGENTS.md](../../msgmesh/AGENTS.md) <br> [CLAUDE.md](../../msgmesh/CLAUDE.md) <br> [llms-full.txt](../../msgmesh/llms-full.txt) <br> [llms.txt](../../msgmesh/llms.txt) <br> [.along/](../node_modules/@actdim/msgmesh/.along) <br> [docs/](../node_modules/@actdim/msgmesh/docs) <br> manifest metadata (`ai`) |

## Transitive Dependency Guidelines & Invariants

No exported invariants detected across repository dependencies.

## Custom Project Dependency Hooks (`.along/scripts/dep_scan.py`)

While Along natively auto-discovers dependencies across Node.js (`package.json`), Python (`pyproject.toml`, `requirements*.txt`), .NET NuGet (`*.csproj`), Rust (`Cargo.toml`), and Go (`go.mod`), repositories using other ecosystems or internal package managers can supply a custom discovery hook:

- **Hook Path**: `.along/scripts/dep_scan.py` (or `scan_deps.py`).
- **Invocation**: `/along-dep-scan` or `along dep-scan` executes the script passing `--json` with working directory set to the project root.
- **Output Schema**: The script must write a JSON list to stdout:
  ```json
  [
    {
      "package": "custom-package",
      "ecosystem": "hex",
      "version": "1.0.0",
      "files": [
        {
          "filename": "AGENTS.md",
          "path": "deps/custom-package/AGENTS.md"
        }
      ]
    }
  ]
  ```
- **Monorepo Localization**: In multi-package repositories or submodules, subproject-specific hooks placed in `packages/<subproject>/.along/scripts/dep_scan.py` are executed automatically when scanning that subproject.

## Usage in Agent Sessions
When working on features involving any of the modules or external libraries above:
1. **Internal Submodules**: Follow conventions in the nearest `AGENTS.md` or subproject `docs/`.
2. **Third-Party Libraries**: Read the linked instruction files directly for framework-specific patterns and best practices.
