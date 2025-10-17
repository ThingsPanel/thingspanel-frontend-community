# 架构重构最终方案

**版本: 2.0**
**日期: 2023-10-28**

## 1. 引言

本方案旨在结合 `detailed-architecture-review.md` 的深度分析和 `data.txt` 的宏观规划，制定一份统一、全面、可执行的最终重构路线图。方案融合了问题驱动的务实策略与目标驱动的架构远景，通过增量、安全的方式，系统性地解决当前代码库中存在的深层次架构问题。

## 2. 核心原则

*   **单向依赖**: 严格遵循 `应用层 -> 框架层 -> 核心层` 的单向依赖关系，严禁任何形式的反向依赖。
*   **依赖倒置 (DIP)**: 底层模块通过定义抽象接口（契约）来服务于上层，上层模块负责实现和适配，实现控制反转。
*   **单一职责 (SRP)**: 组件、模块和函数应保持功能单一、边界清晰。坚决分解“上帝对象”。
*   **增量重构**: 严禁“大爆炸式”的重写。每个阶段都应是小步、可验证、可回归的。

---

## 3. 详细重构计划

### **阶段一：奠定基础 - 打破循环依赖 (P0 - 关键)**

**目标**: 彻底消除 `core` 模块对上层模块的所有反向依赖，恢复正确的架构分层，为后续所有重构工作扫清障碍。

1.  **物理隔离UI组件**:
    *   **任务**: 将 `src/core/script-engine/components/InteractionCardWizard.vue` 文件移动到 `src/components/business/editor/` 目录下（如果目录不存在则创建）。
    *   **理由**: 这是最严重的架构分层错误。将UI组件从 `core` 层移出是纠正方向的第一步，也是最容易达成共识的一步。

2.  **应用依赖倒置原则 (DIP)**:
    *   **任务**: 在 `src/core/` 中建立契约层，创建 `src/core/interfaces/` 目录，并定义初始接口：
        *   `IExposableProperties.ts`: 定义组件如何暴露其可交互属性的契约。
        *   `IConfigurationAdapter.ts`: 定义上层配置如何适配为 `core` 层可理解结构的契约。
        *   `IEditorContext.ts`: 定义编辑器上下文（如获取当前模式）的契约。
    *   **理由**: 这是解耦的核心。`core` 从“依赖具体实现”转向“依赖抽象契约”。

3.  **创建适配器 (Adapter)**:
    *   **任务**: 在上层模块中实现 `core` 定义的接口。
        *   在 `src/card2.1/integration/` 中创建 `CorePropertyAdapter.ts`，实现 `IExposableProperties` 接口。此适配器将包装 `PropertyExposureManager` 的逻辑。
        *   在 `src/components/visual-editor/configuration/` 中，让 `ConfigurationIntegrationBridge` 实现 `IConfigurationAdapter` 接口。
    *   **理由**: 将适配逻辑放在正确的层级。由上层模块负责适配底层，而非底层去“桥接”上层。

4.  **移除“桥接”反模式**:
    *   **任务**: 彻底删除 `src/core/script-engine/visual-editor-bridge.ts` 文件。
    *   **理由**: 其功能已被上层的适配器和依赖注入所取代。移除它是打破循环依赖的决定性一步。

**验收标准**:
*   `src/core` 目录及其子目录下，不再有任何对 `@/card2.1` 或 `@/components/visual-editor` 的 `import` 语句。
*   `InteractionCardWizard.vue` 已移至新位置，功能可正常使用。
*   编译时不再出现循环依赖警告。

---

### **阶段二：核心重构 - 分解“上帝对象” (P0 - 关键)**

**目标**: 将集渲染、数据、配置、交互于一身的“上帝对象” `Card2Wrapper.vue` 彻底分解，使其职责单一化，并在此过程中践行第一阶段建立的契约。

1.  **提取数据逻辑 (Hook)**:
    *   **任务**: 创建 `src/components/visual-editor/hooks/useCardData.ts`。
    *   **职责**: 专门处理所有数据相关逻辑，包括调用 `executeComponentDataSource`、管理新旧双数据流、处理加载/错误状态、以及实现防抖/并发控制。
    *   **理由**: 将混乱的数据获取逻辑封装起来，与渲染和交互解耦。

2.  **提取交互逻辑 (Hook)**:
    *   **任务**: 创建 `src/components/visual-editor/hooks/useCardInteraction.ts`。
    *   **职责**: 负责所有事件处理和交互逻辑，包括注册DOM监听器、实现 `handleInteractionEvent`、管理交互执行等。
    *   **关键整改**: 在此Hook中，必须**彻底移除 `eval` (`new Function`) 的使用**，对于表达式判断，可暂时硬编码简单逻辑，或引入安全的表达式解析库（如 `expr-eval`）作为长期方案。

3.  **重写 `Card2Wrapper.vue`**:
    *   **任务**: 创建 `NewCard2Wrapper.vue`（或在原文件上重构），使其成为一个纯粹的“渲染”组件。
    *   **职责**:
        *   接收 `unifiedConfig` 作为 prop。
        *   调用 `useCardData` 获取渲染数据。
        *   调用 `useCardInteraction` 获取事件处理器并绑定到模板上。
        *   模板部分应极其简洁，只负责将数据和事件传递给最终的动态组件。
    *   **理由**: 使组件回归其UI本质，变得清晰、可预测且易于维护。

**验收标准**:
*   `Card2Wrapper.vue` 的代码行数显著减少（目标 < 300行）。
*   `useCardData.ts` 和 `useCardInteraction.ts` 包含原组件中的大部分复杂逻辑，并拥有独立的单元测试。
*   可视化编辑器中，组件的渲染、数据更新和交互功能与重构前完全一致。
*   代码库中不再有业务逻辑相关的 `eval` (`new Function`) 调用。

---

### **阶段三：规范通信与职责分离 (P1 - 重要)**

**目标**: 废除混乱的跨模块通信方式（如直接操作DOM、`window` 事件），建立清晰、可预测的通信机制，并进一步明确模块职责。

1.  **引入应用级事件总线 (Event Bus)**:
    *   **任务**: 在 `src/utils/` 中引入轻量级事件总线库（如 `mitt`），并封装为全局单例 `appEventBus`。
    *   **理由**: 为跨模块、非父子组件的通信提供统一、解耦的发布/订阅方案。

2.  **重构交互动作为事件**:
    *   **任务**: 重构 `useCardInteraction` 中的 `executeInteractionResponse` 函数。
        *   对于 `navigateToUrl`, `jump` 等动作，改为通过 `appEventBus.emit('interaction:navigateToUrl', payload)` 发布事件。
        *   移除所有直接的 DOM 操作（如 `changeVisibility`），改为更新组件状态，让 Vue 的响应式系统驱动视图变化。
    *   **理由**: 遵循“状态驱动视图”和“发布-订阅”模式，使交互的发起方和处理方彻底解耦。

3.  **重构配置发现机制**:
    *   **任务**: 改造 `ConfigDiscovery.ts` 的逻辑。不再由它主动扫描全局，而是建立一个注册机制。各模块（如 `builtin-card`）在启动时，主动将自己的组件配置注册到统一的 `ComponentRegistry` 服务中。
    *   **理由**: 变“主动拉取”为“被动接收”，职责更清晰，扩展性更强。

**验收标准**:
*   代码中不再有用于业务逻辑通信的 `window.dispatchEvent` 或直接的DOM操作。
*   交互动作通过事件总线触发，并由相应的监听器处理，功能正常。
*   组件的注册和发现机制更加清晰、被动。

---

### **阶段四：优化结构 - 文件重组 (P2 - 改进)**

**目标**: 在解决了核心的耦合和职责问题后，对项目文件结构进行一次全面的整理，使之能反映出新的、清晰的架构。

*   **任务**:
    1.  **清理 `core` 层**: 确保 `core` 目录下只包含纯粹的、与UI无关的TypeScript文件，如 `interfaces`, `services`, `types`, `utils`。
    2.  **建立 `integration` 层**: 创建 `src/integration/` 目录，用于存放所有连接不同模块的“适配器”代码，例如 `card2-core-adapter.ts`。
    3.  **重组 `components` 层**: 将从 `core` 移出的UI组件，以及其他业务组件，按功能或业务领域进行组织，例如 `src/components/business/editor/`。

*   **理由**: 使文件结构与逻辑架构保持一致，降低新成员的认知负荷，提高代码的可发现性。

**验收标准**:
*   项目的文件结构清晰地反映了分层和模块化思想。

---

### **阶段五：质量保证 - 测试与验证 (P1 - 重要)**

**目标**: 确保重构不仅在架构上是正确的，在功能上也是稳定和可靠的，并建立长效机制防止架构腐化。

*   **任务**:
    1.  **建立架构合规性测试**: 编写 ESLint 规则，自动检测并禁止任何试图在 `core` 层导入上层模块的行为。将其集成到 CI/CD 流程中。
    2.  **更新单元与集成测试**: 为所有新建的 Hooks (`useCardData`, `useCardInteraction`) 和服务编写单元测试。更新受重构影响的集成测试。
    3.  **全面的功能回归测试**: 在每个阶段完成后，对可视化编辑器的所有核心功能进行一轮完整的手动回归测试。

*   **理由**: 测试是保证重构质量的唯一客观标准。自动化检查可以有效防止架构再次腐化。

## 4. 成功指标

1.  ✅ **Core 层零反向依赖**: `core` 模块完全独立，可在任何项目中复用。
2.  ✅ **上帝对象被分解**: `Card2Wrapper.vue` 变得轻量且清晰。
3.  ✅ **通信机制规范化**: 模块间通过接口和事件总线进行通信。
4.  ✅ **循环依赖警告清零**: 项目编译纯净。
5.  ✅ **现有功能完整保留**: 所有用户可见的功能表现与重构前一致。