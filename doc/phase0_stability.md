# Phase 0: Stability & Observability (1-2 Days)

**Goal**: Do not change the architecture yet. Stop the bleeding and establish a safety net for subsequent changes.

## 0.1 Add Unified Message Logging

- [ ] Create `src/embed/message-router.ts` (New File)
    - **Implementation**:
        - Implement a `MessageRouter` class or singleton.
        - Add a `log(direction: 'IN' | 'OUT', type: string, payload: any)` function.
        - Use `console.groupCollapsed` to keep logs tidy but accessible.
    - **Verification**:
        - Import `message-router` in a temporary test file or existing component.
        - Call `log()` and verify output in Chrome DevTools Console.
    - **Risk**: Low (New file).

## 0.2 Add Lifecycle Logs to Editor.tsx

- [ ] Add Logging to `Editor.tsx`
    - **Implementation**:
        - Locate `Editor.tsx`.
        - Add `console.log('[Editor] mounted')` in the initial `useEffect`.
        - Add `console.log('[Editor] saving via path A')` in the subscription callback.
        - Add `console.log('[Editor] saving via path B')` in the event listener.
        - Log `isEmbedMode` value on init.
    - **Verification**:
        - Open Editor in Widget Mode (ThingsPanel Device Tab).
        - Open Editor in App Mode (ThingsPanel Visualization Tab).
        - Open Editor in Standalone Mode.
        - Observe console logs to confirm which code paths are actually running.
    - **Risk**: Low (Logging only).

## 0.3 Create Manual Test Checklist

- [ ] Create `doc/manual_test_checklist.md`
    - **Implementation**:
        - Copy the content from "Step 6.1 Manual Test Checklist" in the Architecture Design doc.
        - Format it as a markdown checklist for easy copying/pasting into Pull Requests.
    - **Verification**:
        - Review the generated file for completeness against the design doc.
    - **Risk**: None.
