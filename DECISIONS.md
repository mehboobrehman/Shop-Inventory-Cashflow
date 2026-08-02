# DECISIONS.md - Architectural Decision Records

---

## [2026-06-20] Standardized Local Codebase Paths

### Context

The codebase had hardcoded absolute paths across 21+ `.cmd` launcher scripts referencing inconsistent directory structures:
- `C:\Users\mehboob.rehman\OneDrive - National Foods Limited\AI\autodesk` (correct OneDrive path)
- `C:\Users\mehboob.rehman\OneDrive - National Files Limited\AI\autodesk` (typo - "Files" instead of "Foods")

This caused confusion and broken scripts when switching between OneDrive-synced and mapped-drive environments.

### Decision

Standardize on two supported local paths:

1. **Primary - Mapped drive**: `M:\autodesk\Autodeskprojects\agentdesk-fork`
2. **Secondary - OneDrive sync**: `C:\Users\mehboob.rehman\OneDrive - National Foods Limited\AI\autodesk\Autodeskprojects\agentdesk-fork`

All .cmd launcher scripts now default to the M: drive path.

### Rationale

- **M: drive (primary)**: Provides faster local disk I/O without OneDrive sync overhead. Ideal for active development, builds, and running the Electrobun dev server. Avoids file-locking issues from OneDrive sync during `bun install` and build operations.
- **OneDrive (secondary)**: Provides automatic cloud backup and multi-device synchronization. Useful for disaster recovery and working across machines. Not recommended for active development due to sync-induced file locking and performance overhead.

### Impact

- All 19 root .cmd files updated to use `M:\autodesk\Autodeskprojects\agentdesk-fork`
- README.md updated with "Local Development Setup" section documenting both paths
- Future path references should use these standard locations exclusively

---

## [2026-06-21] Updated Local Codebase Paths

### Context

Previous standardization used `agentdesk-fork` as the canonical directory name, but the actual on-disk directory was `autodesk-fork` (without g), and the project workspace config pointed to the wrong path.

### Decision

Standardize definitively on these two paths:

1. **Primary - Mapped drive**: `M:\autodesk\Autodeskprojects\agentdesk-fork`
2. **Secondary - OneDrive sync**: `C:\Users\mehboob.rehman\OneDrive - National Foods Limited\AI\autodesk\Autodeskprojects\agentdesk-fork`

### Rationale

- Resolves the directory name mismatch (`autodesk-fork` -> `agentdesk-fork`)
- M: drive remains primary for performance; OneDrive for backup/sync
- All scripts, documentation, and config now consistently reference the same paths

### Impact

- All .cmd launcher scripts use `M:\autodesk\Autodeskprojects\agentdesk-fork`
- README.md "Local Development Setup" updated
- Project workspace config needs to be updated to match
