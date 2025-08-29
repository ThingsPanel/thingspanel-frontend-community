# ThingsPanel Visual Editor 架构文档

**文档日期**: 2025-08-29  
**版本**: v2.0.0  
**项目版本**: 0.1.0

## 📋 概述

ThingsPanel Visual Editor 是一个基于 Vue 3 的可视化编辑器系统，支持多种渲染器架构，为物联网仪表板提供拖拽式可视化组件编辑功能。

### 核心特性

- **多渲染器架构**: 支持 Canvas、Gridstack、GridLayoutPlus 等多种布局引擎
- **组件化设计**: 完全组件化的 Widget 系统
- **配置系统**: 统一的组件配置和数据绑定管理
- **主题集成**: 完全支持明暗主题切换
- **Card 2.1 集成**: 与新一代数据绑定系统深度集成

## 🏗️ 架构概览

```
visual-editor/
├── PanelEditor.vue              # 主入口组件
├── index.ts                     # 对外 API 导出
├── components/                  # UI 组件层
│   ├── Canvas/                  # Canvas 渲染相关组件
│   ├── PropertyPanel/           # 属性面板系统
│   ├── WidgetLibrary/           # 组件库面板
│   └── toolbar/                 # 工具栏组件
├── renderers/                   # 多渲染器系统
│   ├── base/                    # 渲染器基础类
│   ├── canvas/                  # Canvas 渲染器
│   ├── gridstack/               # Gridstack 渲染器
│   └── templates/               # 渲染器模板
├── configuration/               # 配置管理系统
├── core/                        # 核心业务逻辑
├── store/                       # 状态管理
├── types/                       # TypeScript 类型定义
└── widgets/                     # Widget 组件库
```

## 🎯 核心组件说明

### 1. 主入口组件
- **PanelEditor.vue**: 编辑器主组件，集成所有子系统

### 2. 渲染器系统 (`renderers/`)
多渲染器架构支持不同的布局引擎：

#### 基础渲染器 (`base/`)
- `BaseRenderer.ts`: 渲染器抽象基类
- `BaseRendererComponent.vue`: 渲染器组件基类
- `RendererManager.ts`: 渲染器管理器

#### Canvas 渲染器 (`canvas/`)
- `CanvasRenderer.vue`: 自由布局画布渲染器
- `Card2Wrapper.vue`: Card 2.1 组件包装器
- `ContextMenu.vue`: 右键上下文菜单

#### Gridstack 渲染器 (`gridstack/`)
- `GridstackRenderer.vue`: 基于 GridStack.js 的网格渲染器
- `GridLayoutPlusWrapper.vue`: 增强版网格布局包装器

### 3. 组件系统 (`components/`)

#### 属性面板 (`PropertyPanel/`)
- `PropertyPanel.vue`: 主属性面板
- `components/`: 各类型组件的属性编辑器
  - `BarChartPropertyEditor.vue`: 柱状图属性编辑器
  - `ImagePropertyEditor.vue`: 图片组件属性编辑器
  - `TextPropertyEditor.vue`: 文本组件属性编辑器

#### 组件库 (`WidgetLibrary/`)
- `WidgetLibrary.vue`: 左侧组件库面板，展示可用 Widget

#### 工具栏 (`toolbar/`)
- `VisualEditorToolbar.vue`: 主工具栏
- `CommonToolbar.vue`: 通用工具栏组件

### 4. 配置管理系统 (`configuration/`)
统一的组件配置和数据绑定管理：

- `ConfigurationManager.ts`: 配置管理器
- `ConfigurationStateManager.ts`: 配置状态管理
- `ConfigurationIntegrationBridge.ts`: 配置集成桥接器
- `ConfigurationPanel.vue`: 配置面板组件

#### 配置组件 (`components/`)
- `DataFieldMappingInput.vue`: 数据字段映射输入
- `DataFilterInput.vue`: 数据过滤器输入
- `ScriptDataSourceEditor.vue`: 脚本数据源编辑器
- `SimpleDataDisplay.vue`: 简单数据展示组件

### 5. 核心系统 (`core/`)
- `component-api-config.ts`: 组件 API 配置系统
- `component-data-requirements.ts`: 组件数据需求声明系统
- `EditorDataSourceManager.ts`: 编辑器数据源管理器
- `GlobalPollingManager.ts`: 全局轮询管理器
- `ConfigDiscovery.ts`: 配置发现系统

### 6. 状态管理 (`store/`)
- `editor.ts`: 编辑器主状态管理（画布、视口、模式等）
- `widget.ts`: Widget 状态管理（组件定义、实例管理等）

### 7. Widget 组件库 (`widgets/`)

#### 基础 Widget
- `ImageWidget.vue`: 图片组件
- `TextWidget.vue`: 文本组件
- `base-widgets.ts`: 基础 Widget 定义

#### 图表 Widget (`chart/`)
- `BarChartChartWidget/`: 柱状图组件
- `DigitIndicatorChartWidget/`: 数字指示器组件

#### 自定义 Widget (`custom/`)
- `BarChartWidget/`: 自定义柱状图
- `DigitIndicatorWidget/`: 自定义数字指示器
- `ImageWidget/`: 自定义图片组件
- `TextWidget/`: 自定义文本组件

### 8. 类型系统 (`types/`)
完整的 TypeScript 类型定义：

- `base-types.ts`: 基础类型定义
- `editor.ts`: 编辑器相关类型
- `renderer.ts`: 渲染器类型
- `widget.ts`: Widget 组件类型
- `layout.ts`: 布局相关类型
- `plugin.ts`: 插件系统类型

## 🔧 使用方式

### 基础用法

```vue
<script setup lang="ts">
import { PanelEditor } from '@/components/visual-editor'
import { useVisualEditor } from '@/store/modules/visual-editor'

// 使用新统一架构
const editor = useVisualEditor()
</script>

<template>
  <PanelEditor />
</template>
```

### 类型导入

```typescript
import type {
  GraphData,
  WidgetType,
  RendererType,
  EditorConfig
} from '@/components/visual-editor'
```

## 🎨 渲染器系统

### 渲染器注册

```typescript
import { RendererManager } from '@/components/visual-editor/renderers'

// 注册新渲染器
RendererManager.register('custom', CustomRenderer)
```

### 渲染器开发

继承 `BaseRenderer` 类：

```typescript
import { BaseRenderer } from '@/components/visual-editor/renderers/base'

export class CustomRenderer extends BaseRenderer {
  render(data: GraphData) {
    // 自定义渲染逻辑
  }
}
```

## 📊 Widget 开发

### Widget 定义

```typescript
interface CustomWidget {
  type: string
  name: string
  icon: string
  defaultProperties: Record<string, any>
  defaultLayout: {
    canvas: { width: number; height: number }
    gridstack: { w: number; h: number }
  }
}
```

### Widget 组件

```vue
<script setup lang="ts">
// Widget 组件实现
defineProps<{
  config: CustomWidgetConfig
  data: any
}>()
</script>

<template>
  <div class="custom-widget">
    <!-- Widget 内容 -->
  </div>
</template>
```

## 🔌 配置系统

### 组件配置

使用配置管理器管理组件配置：

```typescript
import { configurationManager } from '@/components/visual-editor/configuration'

// 获取组件配置
const config = configurationManager.getConfig(componentId)

// 更新组件配置
configurationManager.updateConfig(componentId, newConfig)
```

### 数据绑定

与 Card 2.1 数据绑定系统集成：

```typescript
import { componentDataRequirementsRegistry } from '@/components/visual-editor/core'

// 声明组件数据需求
componentDataRequirementsRegistry.registerRequirement(
  'custom-widget',
  {
    dataFields: ['temperature', 'humidity'],
    updateTriggers: ['timer', 'websocket']
  }
)
```

## 🎯 集成说明

### Card 2.1 集成

编辑器与 Card 2.1 数据绑定系统深度集成，支持：

- 组件数据需求声明
- 响应式数据绑定  
- 多种数据源（API、WebSocket、脚本等）
- 实时数据更新

### 主题系统集成

所有组件完全支持主题切换：

```vue
<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme'
const themeStore = useThemeStore()
</script>

<style scoped>
.editor-component {
  color: var(--text-color);
  background: var(--card-color);
}
</style>
```

## 🚀 开发指南

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 质量检查
pnpm quality-check
```

### 测试页面

- **编辑器集成测试**: `/test/editor-integration`
- **配置系统测试**: `/test/new-config-system`

## 🧹 清理记录 (v2.0.0)

### 已清理的文件和目录

#### 1. 测试和示例文件
- ✅ `components/config/ConfigWrapperTest.vue` - 配置包装器测试组件
- ✅ `components/Layout/example.vue` - 布局示例文件
- ✅ `core/ConfigDiscoveryTest.ts` - 配置发现测试文件

#### 2. 完全删除的文档目录
- ✅ `docs/` 整个目录及其所有子文件
  - `docs/ARCHITECTURE.md` - 旧架构文档
  - `docs/CONFIGURATION.md` - 配置系统文档
  - `docs/STATE_MANAGEMENT.md` - 状态管理文档
  - `docs/WIDGET_REGISTRY_GUIDE.md` - Widget 注册指南
  - `docs/components/Layout.md` - 布局组件文档
  - `docs/renderers/` - 渲染器开发文档目录
  - `docs/review/` - 代码审查文档目录
  - `docs/xiugaidfangan/` - 修改方案文档目录

#### 3. 根目录文档文件
- ✅ `ARCHITECTURE_GUIDE.md` - 架构指南
- ✅ `COMPONENT_ANALYSIS.md` - 组件分析报告
- ✅ `COMPONENT_SUMMARY.md` - 组件总结文档
- ✅ `CLEANUP_SUMMARY.md` - 清理总结报告
- ✅ `COMPONENT_API_CONFIG_IMPLEMENTATION.md` - API配置实现文档
- ✅ `README.md` - 旧版主文档 (已重写)

#### 4. 子模块文档文件
- ✅ `configuration/README.md` - 配置系统文档
- ✅ `configuration/CONFIGURATION_ARCHITECTURE.md` - 配置架构文档
- ✅ `configuration/test-integration.html` - 配置测试HTML
- ✅ `renderers/RENDERER_SYSTEM_GUIDE.md` - 渲染器系统指南
- ✅ `renderers/canvas/README.md` - Canvas渲染器文档
- ✅ `core/component-api-config.test.md` - API配置测试文档

### 待进一步评估的文件

#### 1. 重复的属性编辑器 (暂保留)
- `components/property-editors/ImagePropertyEditor.vue`
- `components/property-editors/TextPropertyEditor.vue`
- **说明**: 与 `PropertyPanel/components/` 中文件重复，需确认使用情况后清理

#### 2. 重复的 Widget 文件 (暂保留)
- `widgets/ImageWidget.vue` 
- `widgets/TextWidget.vue`
- **说明**: 与 `widgets/custom/` 目录下同名文件重复，需确认功能差异

#### 3. 疑似未使用的组件 (暂保留)
- `components/EditorCanvas.vue` - 仅在已删除文档中提及
- `components/PanelLayout.vue` - 仅在类型定义中引用
- `components/DataSourceTriggerPanel.vue` - 已导入但未实际使用

### 清理效果

#### 数量统计
- **删除文档文件**: 约 20+ 个 `.md` 文件
- **删除测试文件**: 3 个测试相关文件
- **删除HTML文件**: 1 个集成测试页面
- **保留核心文件**: ~100 个核心功能文件

#### 目录结构优化
- 移除了 `docs/` 冗余文档目录
- 清理了根目录的临时分析文档
- 统一为单一 `README.md` 架构文档
- 保持了完整的功能模块结构

#### 维护效益
- 🎯 **简化维护**: 减少文档维护负担，统一信息源
- 🚀 **提升性能**: 减少不必要的文件扫描和构建时间  
- 📖 **改善体验**: 统一、清晰的架构文档替代分散的文件
- 🔍 **便于导航**: 清晰的目录结构，便于开发者定位功能

## 📝 更新日志

### v2.0.0 (2025-08-29)
- 🧹 **重大清理**: 删除 20+ 冗余文档文件和测试文件
- 📋 **文档重构**: 创建统一的架构文档，替代分散的文档系统
- 🏗️ **结构优化**: 简化目录结构，提高项目可维护性
- ✨ **功能保持**: 保留所有核心功能模块，仅清理文档和测试文件
- 🎯 **开发体验**: 提供清晰的使用指南和开发规范

### 历史版本
- v1.x: 初始多渲染器架构实现
- v0.x: 原型和概念验证阶段

## 🤝 贡献指南

1. 遵循项目 TypeScript 和 Vue 3 规范
2. 新增 Widget 需要完整的类型定义
3. 渲染器开发需要继承基础类
4. 所有组件必须支持主题系统
5. 使用中文注释说明关键业务逻辑

---

**维护者**: ThingsPanel 开发团队  
**最后更新**: 2025-08-29