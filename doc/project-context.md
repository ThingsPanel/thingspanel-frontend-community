# Project Context

## Architecture Overview

ThingsPanel (Vue 3 IoT platform) embeds ThingsVis (React visualization editor) via iframe + postMessage.

**New Architecture (Phase 1 implemented):**
```
App.tsx
  └── /editor → EditorShell.tsx
                  ├── useEditorStrategy() → picks strategy
                  ├── EditorStrategyContext.Provider
                  └── Editor.tsx (existing UI, ~2199 lines)
                        └── useStrategy() → reads from context (gradual adoption)

strategies/
  ├── EditorStrategy.ts      — interface
  ├── AppModeStrategy.ts      — cloud/local load+save (NO postMessage)
  └── WidgetModeStrategy.ts   — host init/save/data (NO cloud API)

embed/
  ├── message-router.ts       — unified message logging
  ├── embed-mode.ts           — existing comms (now with logging)
  └── embed-init.ts           — existing init helpers
```

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Context-based wrapper, not full rewrite | 2199-line Editor.tsx is too risky to rewrite in one shot. EditorShell wraps it with strategy via Context. |
| Strategies must not cross-import | AppModeStrategy cannot import embed modules; WidgetModeStrategy cannot import cloud API. Physical isolation. |
| Phase 0 is logging-only | message-router.ts is observer-only; does not intercept or modify existing message flow. |

## Current State

- **Phase 0**: ✅ Complete — message logging, lifecycle logs, test checklist
- **Phase 1**: ✅ Complete — strategy interface, both implementations, hook, shell, routing
- **Phase 2**: Not started — message protocol unification, state deduplication
- **Phase 3**: Not started — dead code cleanup

## Known Issues / Risks

1. **Editor.tsx not yet using strategy from context** — it still has its own inline mode logic. Gradual migration needed.
2. **Pre-existing tsc errors** in `@leafer/interface` — not related to our changes.
3. **WidgetModeStrategy listener setup** — the `request-save` handler needs access to `getProjectState()` which is in Editor.tsx. Currently handled by existing Editor code; needs wiring to strategy in future.

## Domain Knowledge

- `saveTarget=host` → Widget Mode (ThingsPanel manages data)
- `saveTarget=self` → App Mode (ThingsVis stores via its own API)
- `isEmbedMode()` checks: iframe context, URL params `mode=embedded` or `embedded=1`
- Project IDs can be: CUID (cloud), UUID (local), or `widget`/`embed-*` (host-managed)
