# ThingsVis Integration Change Log

This document tracks all changes made to the `thingspanel-frontend-community` and `thingsvis` repositories as part of the v1.0 Integration Refactor.

## Version 1.0 (Integration Refactor)

### Phase 1: Foundation & Architecture (Done)
- [x] **[Doc] Integration Whitepaper**: Created `ThingsPanel_ThingsVis_Integration_Whitepaper_v1.0.md` detailing the dual-track architecture (Host Managed vs Self Managed).
- [x] **[Component] ThingsVisWidget.vue**: Implemented the standardized widget component for "Host Managed" scenarios (Web/App Chart Config).
- [x] **[Component] ThingsVisAppFrame.vue**: Implemented the app frame component for "Self Managed" scenarios (Visualization Editor).
- [x] **[SDK] ThingsVisClient.ts**: Created a unified SDK to manage Iframe lifecycle and PostMessage communication, strictly adhering to `embed-mode` protocol.

### Phase 2: Implementation (Done)
- [x] **[Refactor] Web Chart Config**: Migrated `src/views/device/template/components/step/web-chart-config.vue` to use `ThingsVisWidget`.
- [x] **[Refactor] App Chart Config**: Migrated `src/views/device/template/components/step/app-chart-config.vue` to use `ThingsVisWidget`.
- [x] **[Refactor] Telemetry Chart**: Migrated `src/views/device/details/modules/telemetry-chart.vue` to use `ThingsVisWidget` with real-time data push.
- [x] **[Refactor] Device Details App**: Migrated `src/views/device-details-app/index.vue` to use `ThingsVisWidget` with real-time data push.
- [x] **[Refactor] Visualization Editor**: Migrated `src/views/visualization/thingsvis-editor/index.vue` to use `ThingsVisAppFrame`.

### Phase 3: Cleanup & Optimization (Done)
- [x] **[Feature] Consolidate Iframe URL to Absolute Path**: Changed all Iframe URLs to `http://localhost:3000/main` to resolve 404 errors (ThingsVis Studio uses `/main` base path).
- [x] **[Fix] Iframe Communication Race Condition**: Updated SDK to wait for explicit `READY` signal from Guest before sending initialization data, ensuring the embedded app is fully hydrated.
- [x] **[Refactor] Standardize ThingsVisClient Protocol**: Rewrote the SDK Client to strictly follow `embed-mode` protocol (`thingsvis:editor-init`, `thingsvis:host-save`, `thingsvis:editor-event` for updates).
- [x] **[Fix] Solve DataCloneError**: Implemented JSON deep clone in `ThingsVisWidget` to unwrap Vue Proxy objects before passing to `postMessage`, preventing serialization errors.
- [x] **[Feature] Real-time Data Push**: Added `updateData` event listener in ThingsVis Studio (`Editor.tsx`) to support real-time Widget Mode data updates based on thing model bindings.
- [x] **[Cleanup] Remove Legacy Code**: Removed deprecated logic from `embed-mode.ts` and renamed `ThingsVisEditor.vue` to `ThingsVisEditor.deprecated.vue`.
- [x] **[Chore] Linting & Typing**: Fixed lint errors in `client.ts` and TypeScript type mismatches in `Editor.tsx`.
- [x] **[Legacy] Deprecate ThingsVisEditor.vue**: Renamed to `ThingsVisEditor.deprecated.vue` to prevent accidental usage.
