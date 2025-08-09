# Visual Editor 组件库分析与重构建议

## 1. 总体评价

`visual-editor` 是一个功能强大且复杂的组件，它为低代码仪表盘开发提供了核心支持。该组件在架构设计上考虑了可扩展性，通过引入注册表模式（`widgetRegistry`, `dataSourceRegistry`）和自动发现机制（`ConfigDiscovery`），为未来的功能扩展奠定了良好基础。然而，随着功能的不断迭代，也暴露出一些问题，主要集中在代码组织、状态管理、数据处理和组件通信等方面。

本文档旨在全面分析 `visual-editor` 的现状，识别其中的问题，并提出具体的重构建议，以提升其可维护性、性能和开发体验。

## 2. 存在的问题

### 2.1. 架构与代码组织

- **模块边界模糊与强耦合**: `core` 目录下的文件职责划分不清，导致 `visual-editor` 与外部模块（特别是 `card2.1`）产生了强耦合。这使得 `visual-editor` 难以作为一个独立的通用组件被复用。
  - **代码证据**: `core/card2-integration.ts` 文件是这种强耦合的直接体现。它直接从 `@/card2.1/hooks/useVisualEditorIntegration` 导入功能，并负责将 `card2.1` 的组件定义转换为 `visual-editor` 内部的 `WidgetDefinition`。这种设计意味着 `visual-editor` 的核心逻辑依赖于 `card2.1` 的存在。
- **命名不一致**: 文件和目录的命名规范不统一，存在驼峰式（`ConfigDiscovery.ts`）和中划线式（`card2-integration.ts`）混用的情况，增加了代码理解的难度。
- **配置与代码耦合**: `core/component-api-config.ts` 文件中通过一个巨大的 `COMPONENT_API_CONFIG` 对象，硬编码了所有组件的 API 配置信息。这种做法违反了开闭原则，扩展性和维护性极差。
  - **代码证据**: 在 `core/component-api-config.ts` 中，`COMPONENT_API_CONFIG` 对象为每个组件类型（如 `'digit-indicator'`, `'curve'`）都指定了 `apiType`、`dataSourceType` 等具体实现细节。当需要新增或修改组件的数据获取逻辑时，必须直接修改这个庞大的中心化配置文件，极易引发错误。

### 2.2. 状态管理

- **中心化状态管理滥用**: `core/state-manager.ts` 实现了一个全局单例的状态管理器，将所有画布相关的状态都集中处理。这种设计过度使用了中心化状态，导致许多本应属于局部组件的状态被不必要地全局化。
  - **代码证据**: 在 `core/state-manager.ts` 中，`CanvasState` 接口包含了 `nodes`、`selectedIds`、`viewport` 和 `mode`。其中，`selectedIds`（当前选中的节点）和 `viewport`（画布的缩放和平移）等状态与用户的实时交互紧密相关，更适合作为编辑器UI组件的内部状态进行管理，将其提升为全局状态增加了数据流的复杂性。
- **状态更新逻辑分散**: 状态的更新逻辑散落在各个组件中，缺乏统一的管理和封装。这使得追踪状态变化变得困难，也容易引发不可预期的副作用。

### 2.3. 数据源处理

- **数据源管理器功能冗余**: 项目中同时存在 `core/data-source-manager.ts` 和 `core/universal-data-source-manager.ts` 两个功能高度重叠的数据源管理器，造成了严重的代码冗余和维护困境。
  - **代码证据**: `data-source-manager.ts` 提供了一个基于定时器、WebSocket 和 MQTT 的轮询管理器。而 `universal-data-source-manager.ts` 则提供了一个更通用、支持多种数据源（静态、设备、HTTP 等）和数据路径映射的管理器。两者都处理数据获取和订阅，但实现方式和支持的功能范围不同，导致开发者难以选择，也增加了理解成本。
- **数据请求逻辑与数据管理逻辑耦合**: `universal-data-source-manager.ts` 不仅负责数据源的订阅和管理，还直接包含了对具体业务 API (`@/service/api/device`) 的调用。这违反了单一职责和分层设计的原则。
  - **代码证据**: 在 `core/universal-data-source-manager.ts` 的 `getDeviceValue` 方法中，直接 `import` 并调用了 `telemetryDataCurrentKeys`、`telemetryDataHistoryList` 等函数。理想情况下，数据源管理器应该只依赖一个通用的数据获取服务，而不是关心具体的 API 端点。

### 2.4. 组件化与配置

- **配置组件发现机制过于复杂**: `ConfigDiscovery.ts` 通过 `import.meta.glob` 实现了配置组件的自动发现，虽然功能强大，但也引入了较高的复杂性。对于大多数项目而言，一个更简单的显式注册机制可能更易于维护。
- **Card 2.1 集成逻辑耦合**: `card2-integration.ts` 将 Card 2.1 组件与 `visual-editor` 紧密地绑定在一起。理想情况下，`visual-editor` 应该只关心通用的 `WidgetDefinition`，而不应该感知到 Card 2.1 的存在。集成逻辑应该由更高层次的适配器来完成。

## 3. 整改建议

### 3.1. 统一命名规范

- **文件和目录**: 全部采用中划线命名法（kebab-case），例如 `config-discovery.ts`。
- **类和类型**: 采用大驼峰命名法（PascalCase），例如 `ConfigDiscovery`。
- **变量和函数**: 采用小驼峰命名法（camelCase），例如 `discoverConfigs`。

### 3.2. 优化目录结构

- **按功能组织**: 将相关的功能（如 `widget`, `dataSource`, `renderer`）分别组织到独立的目录中，每个目录包含自己的类型定义、Hooks 和工具函数。
- **提取通用模块**: 将可复用的逻辑（如 `state-manager`）提取到独立的 `common` 或 `shared` 目录中，以便在其他地方复用。

### 3.3. 重构状态管理

- **引入 Pinia**: 推荐使用 Pinia 替代现有的 `state-manager.ts`。Pinia 提供了更简洁的 API 和更好的 TypeScript 支持，能够有效解决状态更新逻辑分散的问题。
- **划分 Store**: 根据功能将全局状态划分为多个独立的 Store，例如 `useEditorStore`、`useWidgetStore` 等，以降低单个 Store 的复杂性。

### 3.4. 简化数据源处理

- **合并数据源管理器**: 移除 `data-source-manager.ts`，将所有数据源处理逻辑统一到 `universal-data-source-manager.ts` 中。
- **抽象数据请求**: 创建一个通用的数据请求服务，将 `telemetryDataCurrentKeys` 等具体的 API 调用从数据源管理器中移除。数据源管理器只负责调用这个服务，而不关心其具体实现。

### 3.5. 解耦组件配置

- **引入适配器模式**: 创建一个 `Card2Adapter`，专门负责将 Card 2.1 的组件定义转换为 `visual-editor` 所需的 `WidgetDefinition`。这样一来，`visual-editor` 就不再需要直接依赖 Card 2.1。
- **简化配置发现**: 考虑移除 `ConfigDiscovery.ts` 中的自动发现机制，改为在应用入口处显式地注册所有组件和配置。虽然这会增加一些手动配置的工作，但能够显著降低系统的复杂性，提高可维护性。

## 4. 结论

`visual-editor` 是一个具有巨大潜力的组件，通过上述重构建议，我们可以进一步提升其代码质量和可维护性，为未来的功能迭代打下坚实的基础。建议团队投入时间进行一次集中的重构，以确保项目的长期健康发展。