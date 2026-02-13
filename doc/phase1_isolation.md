# Phase 1: Boundary Isolation & Extraction (3-5 Days)

**Goal**: Implement Strategy Pattern to reduce `Editor.tsx` from 2199 lines to ~800 lines. Physical isolation of App vs Widget logic.

## 1.1 Create EditorStrategy Interface

- [ ] Create `src/strategies/EditorStrategy.ts`
    - **Implementation**:
        - Define the `EditorStrategy` interface as specified in Arch Design 4.4.
        - Define `bootstrap(store: KernelStore, projectId: string): Promise<void>`.
        - Define `save(store: KernelStore): Promise<void>`.
        - Define `getUIVisibility(): UIVisibilityConfig`.
        - Define `dispose(): void`.
    - **Verification**:
        - TypeScript compiles without errors.
    - **Risk**: Low.

## 1.2 Extract AppModeStrategy

- [ ] Create `src/strategies/AppModeStrategy.ts`
    - **Implementation**:
        - Implement `EditorStrategy`.
        - Move Cloud API calls (get project, save project) from `Editor.tsx` to this class.
        - Ensure NO import of `embed-mode` or `postMessage` logic.
    - **Verification**:
        - Unit test (mocking API): Call `bootstrap`, verify API is called.
    - **Risk**: Medium (Moving logic).

## 1.3 Extract WidgetModeStrategy

- [ ] Create `src/strategies/WidgetModeStrategy.ts`
    - **Implementation**:
        - Implement `EditorStrategy`.
        - Move `postMessage` logic (init, save-response) from `Editor.tsx` / `embed-mode.ts` to this class.
        - Ensure NO import of Cloud API adapters.
    - **Verification**:
        - Unit test (mocking window.addEventListener): key `bootstrap`, simulate `tv:init` message, verify store update.
    - **Risk**: Medium (Moving logic).

## 1.4 Create EditorShell

- [ ] Create `src/components/EditorShell.tsx`
    - **Implementation**:
        - Copy UI parts from `Editor.tsx` (Toolbar, Canvas, Panels).
        - Remove all logic usage.
        - Add `useEditorStrategy()` hook to get the correct strategy instance based on URL/Route.
        - Connect UI actions (Save button) to `strategy.save()`.
    - **Verification**:
        - Storybook or stand-alone render test.
    - **Risk**: High (UI reconstruction).

## 1.5 Update Routing

- [ ] Update `src/App.tsx`
    - **Implementation**:
        - Change route `/editor/:id` to render `EditorShell` instead of `Editor`.
        - Keep `/editor-old/:id` pointing to old `Editor` as fallback.
    - **Verification**:
        - Click through the app. Verify new EditorShell loads.
        - Verify old link still works if manually accessed.
    - **Risk**: Low.
