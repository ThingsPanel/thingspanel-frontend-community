# Iteration Log

## Sub-task 0.1: Unified Message Logger
- **What was done**: Created `message-router.ts` in `embed/` directory — a non-intrusive message observer that logs all ThingsVis postMessage traffic with direction, type, payload summary, and timestamps.
- **What was tried & failed**: N/A — clean implementation.
- **What succeeded**: Used `console.groupCollapsed` for tidy DevTools output, exposed `__tvMessageLog` on window for runtime debugging.
- **How it was tested**: TypeScript compilation (no errors from this file).
- **Key decisions**: Phase 0 only does logging, no routing. Keeps existing `addEventListener` handlers intact.
- **Iteration count**: 1

## Sub-task 0.2: Lifecycle Logs in embed-mode.ts
- **What was done**: Imported `messageLogger` into `embed-mode.ts`, added `logInbound(event)` at the top of the message listener, and `logOutbound()` before `postMessage` calls in `requestSave()`.
- **What was tried & failed**: N/A.
- **What succeeded**: Clean integration — all inbound/outbound messages through embed-mode now get logged.
- **How it was tested**: TypeScript compilation verified.
- **Key decisions**: Only modified 2 injection points (inbound listener + outbound requestSave) to minimize risk.
- **Iteration count**: 1

## Sub-task 0.3: Manual Test Checklist
- **What was done**: Created `doc/manual_test_checklist.md` with all 4 tracks (Widget, App, Standalone, Viewer) + Architecture Fitness Functions.
- **How it was tested**: Content reviewed against architecture design doc v2.0 Step 6.
- **Iteration count**: 1

## Sub-task 1.1: EditorStrategy Interface
- **What was done**: Created `strategies/EditorStrategy.ts` defining `bootstrap()`, `save()`, `getUIVisibility()`, `setupListeners()`, and `dispose()` methods, plus `UIVisibilityConfig` type.
- **Key decisions**: Added `setupListeners()` as optional method for Widget's updateData/updateSchema — keeps the interface small while supporting both modes.
- **Iteration count**: 1

## Sub-task 1.2: AppModeStrategy
- **What was done**: Created `strategies/AppModeStrategy.ts` implementing the EditorStrategy interface. Handles cloud (API) and local (IndexedDB) bootstrap/save.
- **Key decisions**: Does NOT import any embed/postMessage modules. Uses injected `StorageAdapter` for flexibility.
- **Iteration count**: 1

## Sub-task 1.3: WidgetModeStrategy
- **What was done**: Created `strategies/WidgetModeStrategy.ts` implementing EditorStrategy. Handles init-from-host bootstrap (Promise-based with timeout), postMessage save, and real-time data/schema listeners.
- **Key decisions**: Does NOT import any Cloud API modules. Uses `onEmbedEvent` from embed-mode for message handling.
- **Iteration count**: 1

## Sub-task 1.4: EditorShell + useEditorStrategy
- **What was done**: Created `hooks/useEditorStrategy.ts` (strategy selector based on URL params + auth) and `components/EditorShell.tsx` (wraps existing Editor with StrategyContext).
- **Key decisions**: Instead of rewriting the 2199-line Editor.tsx UI, used a Context-based wrapper approach. EditorShell provides the strategy via React Context, allowing Editor.tsx to gradually adopt it. This is much safer than a one-shot rewrite.
- **Iteration count**: 1

## Sub-task 1.5: App.tsx Routing
- **What was done**: Updated `App.tsx` to import `EditorShell` instead of `Editor`, changed both `/editor` routes to use `<EditorShell />`.
- **How it was tested**: TypeScript compilation — no errors from any new files.
- **Key decisions**: Old `Editor.tsx` remains as the internal implementation used by EditorShell, not deleted.
- **Iteration count**: 1
