# Visual Editor 架构指南

## 🎯 概述

Visual Editor 是 ThingsPanel 的核心可视化编辑器系统，支持拖拽式组件配置、多渲染器支持、数据源管理和实时预览。该系统集成了 Card 2.1 架构，提供完整的可视化编辑体验。

## 📁 核心架构

### 目录结构

```
src/components/visual-editor/
├── 📁 core/                           # 核心逻辑层
│   ├── universal-data-source-manager.ts  # 通用数据源管理器
│   ├── data-source-registry.ts           # 数据源注册表  
│   ├── component-api-config.ts           # 组件API配置系统
│   ├── ConfigDiscovery.ts                # 配置发现器
│   └── index.ts                          # 核心模块统一导出
├── 📁 components/                     # UI组件层
│   ├── PanelLayout.vue                   # 主布局组件
│   ├── EditorCanvas.vue                  # 编辑器画布  
│   ├── WidgetLibrary/                    # 组件库面板
│   └── PropertyPanel/                    # 属性配置面板
├── 📁 hooks/                          # Vue组合式函数
│   ├── useEditor.ts                      # 编辑器核心Hook
│   ├── usePreviewMode.ts                 # 预览模式管理
│   └── index.ts                          # Hook统一导出
├── 📁 renderers/                      # 渲染器系统
│   ├── base/                            # 基础渲染器抽象
│   ├── canvas/                          # Canvas渲染器
│   └── gridstack/                       # GridStack网格渲染器
├── 📁 store/                          # Pinia状态管理
│   ├── editor.ts                        # 编辑器状态管理
│   └── widget.ts                        # 组件注册表状态
├── 📁 settings/                       # 设置面板系统
│   ├── ConfigRegistry.ts                # 设置配置注册表
│   ├── SettingsPanel.vue                # 主设置面板
│   └── components/                      # 设置组件
├── 📁 data-sources/                   # 数据源配置
│   ├── StaticDataSourceConfig.vue       # 静态数据源配置
│   ├── DeviceDataSourceConfigNew.vue    # 设备数据源配置
│   └── HttpDataSourceConfig.vue         # HTTP数据源配置
├── 📁 widgets/                        # 内置组件库
│   ├── TextWidget.vue                   # 文本组件
│   └── ImageWidget.vue                  # 图片组件
└── PanelEditor.vue                    # 主编辑器入口组件
```

## 🔄 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户交互层                                 │
│  拖拽操作、属性编辑、工具栏操作、键盘快捷键                    │
└─────────────────┬───────────────────────────────────────────┘
                 │
┌─────────────────▼───────────────────────────────────────────┐
│                   UI 组件层                                 │
│  PanelEditor → WidgetLibrary → PropertyPanel → Canvas       │
└─────────────────┬───────────────────────────────────────────┘
                 │
┌─────────────────▼───────────────────────────────────────────┐
│                   Hooks 层                                  │
│  useEditor → usePreviewMode → EditorContext                 │
└─────────────────┬───────────────────────────────────────────┘
                 │
┌─────────────────▼───────────────────────────────────────────┐
│                  核心逻辑层                                  │
│  DataSourceManager → WidgetRegistry → ConfigRegistry        │
└─────────────────┬───────────────────────────────────────────┘
                 │
┌─────────────────▼───────────────────────────────────────────┐
│                  状态管理层                                  │
│  EditorStore (Pinia) → WidgetStore (Pinia)                 │
└─────────────────┬───────────────────────────────────────────┘
                 │
┌─────────────────▼───────────────────────────────────────────┐
│                  渲染输出层                                  │
│  Canvas渲染器 → GridStack渲染器 → 自定义渲染器               │
└─────────────────────────────────────────────────────────────┘
```

## 🧩 核心组件详解

### 1. PanelEditor.vue (主编辑器)
**功能**: 可视化编辑器的入口组件，约1000行代码的核心控制器
- ✅ 支持编辑/预览模式切换
- ✅ 集成组件库和属性面板  
- ✅ 支持全屏编辑
- ✅ 数据源配置和管理
- ✅ Card 2.1 系统集成
- ✅ 配置持久化和状态管理
- ✅ 拖拽操作和抽屉管理

**UI结构**:
```vue
<div class="panel-editor">
  <!-- 工具栏 -->
  <VisualEditorToolbar 
    @toggle-edit-mode="handleToggleEditMode"
    @save="handleSave"
    @full-screen="handleFullScreen"
  />
  
  <!-- 主要内容区域 -->
  <div class="main-container" :class="{ dragging: isDragging }">
    <!-- 画布区域 -->
    <div class="canvas-container">
      <component :is="rendererComponent" />
    </div>
    
    <!-- 左侧组件库抽屉 -->
    <NDrawer v-model:show="showLeftDrawer" placement="left" :width="350">
      <WidgetLibrary @add-widget="handleAddWidget" />
    </NDrawer>
    
    <!-- 右侧属性面板抽屉 -->
    <NDrawer v-model:show="showRightDrawer" placement="right" :width="450">
      <SettingsPanel :selected-widget="selectedWidget" />
    </NDrawer>
  </div>
</div>
```

**核心状态管理**:
```typescript
// 编辑器状态
const isEditing = ref(false)          // 编辑/预览模式
const currentRenderer = ref('gridstack') // 当前渲染器
const selectedNodeId = ref<string>()   // 选中的组件ID
const hasChanges = ref(false)         // 是否有未保存的更改

// 抽屉状态
const showLeftDrawer = ref(false)     // 左侧组件库
const showRightDrawer = ref(false)    // 右侧属性面板

// 配置管理
const editorConfig = ref<any>({})     // 当前编辑器配置
const preEditorConfig = ref<any>({})  // 备份配置（用于取消操作）
```

### 2. useEditor.ts (核心Hook)
**功能**: 编辑器状态和操作的统一管理
- ✅ 组件拖拽和添加
- ✅ 节点选择和更新
- ✅ Card 2.1 集成管理
- ✅ 组件注册表同步

**关键接口**:
```typescript
interface EditorContext {
  editorStore: ReturnType<typeof useEditorStore>
  widgetStore: ReturnType<typeof useWidgetStore>  
  addWidget: (type: string, position?: { x: number; y: number }) => Promise<void>
  selectNode: (id: string) => void
  updateNode: (id: string, updates: Partial<GraphData>) => void
  removeNode: (id: string) => void
  card2Integration: ReturnType<typeof useCard2Integration>
  isCard2Component: (type: string) => boolean
}
```

### 3. 数据源管理系统
**UniversalDataSourceManager 类**:
- ✅ 支持多种数据源：Static、Device、HTTP、WebSocket
- ✅ 响应式数据订阅和更新
- ✅ 数据路径映射和解析
- ✅ 轮询和实时更新机制

**数据源注册**:
```typescript
// 静态数据源
dataSourceRegistry.register(DataSourceType.STATIC, {
  type: DataSourceType.STATIC,
  name: '静态数据',
  component: StaticDataSourceConfig,
  defaultConfig: { /* ... */ }
})

// 设备数据源  
dataSourceRegistry.register(DataSourceType.DEVICE, {
  type: DataSourceType.DEVICE,
  name: '设备数据',
  component: DeviceDataSourceConfigNew,
  defaultConfig: { /* ... */ }
})
```

## 🔧 渲染器架构

### 多渲染器支持
1. **Canvas 渲染器**: 自由拖拽布局
2. **GridStack 渲染器**: 网格化响应式布局
3. **自定义渲染器**: 可扩展的渲染方式

### Card2Wrapper 组件
**功能**: Card 2.1 组件的统一包装器
- ✅ 动态组件加载
- ✅ 数据源绑定
- ✅ 错误处理和降级
- ✅ 生命周期管理

## 📊 状态管理

### EditorStore (editor.ts)
```typescript
interface EditorState {
  nodes: GraphData[]          // 画布上的所有组件节点
  viewport: Viewport          // 视口位置和缩放
  mode: EditorMode           // 编辑模式：design | preview
}
```

**核心操作**:
- `addNode()`: 添加组件到画布
- `removeNode()`: 删除组件
- `updateNode()`: 更新组件属性
- `setMode()`: 切换编辑/预览模式

### WidgetStore (widget.ts)
```typescript
interface WidgetState {
  selectedIds: string[]                    // 当前选中的组件ID
  widgetRegistry: Map<WidgetType, WidgetDefinition>  // 组件注册表
}
```

## 🌐 Card 2.1 集成

### 集成流程
```typescript
// 1. 初始化 Card 2.1 集成
useVisualEditorIntegration({
  autoInit: true,
  enableI18n: true
})

// 2. 组件定义转换
function convertCard2ToWidgetDefinition(card2Definition: ComponentDefinition): WidgetDefinition {
  // 转换 Card 2.1 组件定义为 Widget 格式
}

// 3. 动态注册组件
card2Integration.availableComponents?.value?.forEach(componentDef => {
  const widgetDef = convertCard2ToWidgetDefinition(componentDef.definition)
  widgetStore.register(widgetDef)
})
```

## 🔄 开发工作流

### 1. 添加新组件
```typescript
// 1. 在 Card 2.1 系统中定义组件
const myComponent = defineComponent({ /* ... */ })

// 2. 注册到 Card 2.1 注册表
card2Registry.register('my-component', {
  component: myComponent,
  /* ... */
})

// 3. 自动同步到 Visual Editor
// (通过 useEditor.ts 中的 watchEffect 自动完成)
```

### 2. 添加新数据源类型
```typescript
// 1. 实现数据源配置组件
const MyDataSourceConfig = defineComponent({ /* ... */ })

// 2. 注册到数据源注册表
dataSourceRegistry.register('my-datasource', {
  type: 'my-datasource',
  name: '自定义数据源',
  component: MyDataSourceConfig,
  defaultConfig: { /* ... */ }
})
```

### 3. 扩展渲染器
```typescript
// 1. 继承基础渲染器
class MyRenderer extends BaseRenderer {
  render() { /* 自定义渲染逻辑 */ }
}

// 2. 注册渲染器
rendererRegistry.register('my-renderer', MyRenderer)
```

## 🚨 常见问题和解决方案

### 1. `universalDataSourceManager is not defined`
**原因**: 导出变量未正确定义  
**解决**: 确保正确实例化和导出
```typescript
export const universalDataSourceManager = new DataSourceManager()
export default universalDataSourceManager
```

### 2. `Cannot read properties of undefined (reading 'value')`
**原因**: Card 2.1 集成中响应式对象未初始化
**解决**: 添加安全检查
```typescript
const availableComponents = card2Integration.availableComponents?.value || []
```

### 3. `Cannot read properties of undefined (reading 'canvasState')`
**原因**: PanelEditor.vue 假设 stateManager 有嵌套的 canvasState 属性
**解决**: 直接访问 stateManager 的属性，或确保正确的状态结构
```typescript
// 错误的访问方式
const nodes = stateManager.canvasState.value.nodes

// 正确的访问方式  
const nodes = stateManager.nodes
```

### 4. `Cannot read properties of undefined (reading 'nodes')`
**原因**: EditorContext 中缺少 stateManager 属性
**解决**: 在 createEditor() 中添加 stateManager 别名
```typescript
editorInstance = {
  editorStore,
  widgetStore,
  stateManager: editorStore, // 添加别名
  // ... 其他属性
}
```

### 5. 组件注册冲突
**原因**: 组件名称重复或注册时机不当
**解决**: 检查组件名称唯一性，确保按顺序注册

## 📈 性能优化建议

1. **懒加载**: 组件和渲染器按需加载
2. **虚拟化**: 大量组件时使用虚拟滚动
3. **缓存**: 数据源结果缓存
4. **防抖**: 属性更新使用防抖处理
5. **内存管理**: 及时清理订阅和监听器

## 🎯 未来发展方向

1. **更多渲染器**: 支持 Three.js、Canvas 等
2. **协同编辑**: 多人实时编辑
3. **模板系统**: 预定义模板和主题
4. **插件化**: 完全插件化的组件和功能扩展
5. **性能监控**: 编辑器性能分析和优化工具

---

**生成时间**: 2025年1月17日  
**版本**: v1.0.0  
**维护者**: ThingsPanel 开发团队