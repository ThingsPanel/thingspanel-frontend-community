# ThingsPanel Visual Editor 开发者详细指南

**版本**: v2.0.0  
**更新时间**: 2025-08-31  
**目标读者**: 前端开发者、系统架构师、维护人员

---

## 📖 目录

- [1. 系统架构深入解析](#1-系统架构深入解析)
- [2. 核心API参考](#2-核心api参考)
- [3. 开发工作流程](#3-开发工作流程)
- [4. 组件开发指南](#4-组件开发指南)
- [5. 渲染器开发](#5-渲染器开发)
- [6. 数据流与状态管理](#6-数据流与状态管理)
- [7. 配置系统深入](#7-配置系统深入)
- [8. 性能优化策略](#8-性能优化策略)
- [9. 故障排除指南](#9-故障排除指南)
- [10. 最佳实践](#10-最佳实践)

---

## 1. 系统架构深入解析

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    PanelEditor.vue                          │
│                 (主入口组件 - 统一协调层)                     │
└─────┬──────────────┬─────────────────┬─────────────────────┘
      │              │                 │
      ▼              ▼                 ▼
┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐
│  工具栏系统  │ │   抽屉面板    │ │   轮询控制系统       │
│ Toolbar     │ │ WidgetLibrary│ │ PollingController   │
│             │ │ PropertyPanel│ │ GlobalPollingManager│
└─────────────┘ └──────────────┘ └─────────────────────┘
      │              │                 │
      ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   核心渲染层                                 │
│ ┌─────────────────┐    ┌─────────────────┐                │
│ │  Canvas渲染器    │    │ Gridstack渲染器  │                │
│ │  自由布局        │    │  网格布局        │                │
│ └─────────────────┘    └─────────────────┘                │
└─────┬─────────────────────────────────────┬─────────────────┘
      │                                     │
      ▼                                     ▼
┌─────────────────────┐              ┌─────────────────────┐
│   状态管理系统       │◄────────────►│   组件生态系统       │
│ • EditorStore      │              │ • Card2.1集成        │
│ • WidgetStore      │              │ • Widget注册表       │
│ • 响应式状态        │              │ • 组件定义           │
└─────────────────────┘              └─────────────────────┘
      │                                     │
      ▼                                     ▼
┌─────────────────────┐              ┌─────────────────────┐
│   配置管理系统       │              │   数据源管理系统     │
│ • ConfigManager    │              │ • EditorDataSource  │
│ • 分层配置架构      │◄────────────►│ • 多数据源支持       │
│ • 持久化存储        │              │ • 实时轮询调度       │
│ • 配置验证迁移      │              │ • WebSocket支持     │
└─────────────────────┘              └─────────────────────┘
      │                                     │
      ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 底层基础设施                                 │
│ • 事件总线 (ConfigEventBus)                                │
│ • 缓存系统 (SimpleDataBridge)                              │
│ • 主题系统 (ThemeStore)                                    │
│ • 国际化系统 (I18n)                                        │
│ • 工具函数库 (Utils)                                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心模块详解

#### A. 状态管理层 (`store/`)

**EditorStore** (`editor.ts`)
```typescript
interface EditorState {
  nodes: GraphData[]          // 画布上的所有组件节点
  viewport: Viewport          // 视口状态（缩放、平移）
  mode: EditorMode           // 编辑模式（design/preview）
}

// 核心方法
- addNode(...nodes: GraphData[])      // 添加节点
- removeNode(id: string)              // 删除节点  
- updateNode(id, updates)             // 更新节点
- setMode(mode: EditorMode)           // 设置模式
- reset()                             // 重置状态
```

**WidgetStore** (`store/widget.ts`)
- 管理组件定义注册表
- 处理组件选择状态
- 提供组件查询接口

#### B. 配置管理系统 (`configuration/`)

**ConfigurationManager** - 核心配置管理器
```typescript
class ConfigurationManager {
  // 配置存储结构
  private configurations: Map<string, WidgetConfiguration>
  
  // 核心方法
  getConfiguration(widgetId: string): WidgetConfiguration | null
  setConfiguration(widgetId: string, config: WidgetConfiguration): void
  updateConfiguration<K>(widgetId: string, section: K, config: any): void
  
  // 高级功能
  validateConfiguration(config: WidgetConfiguration): ValidationResult
  exportConfiguration(widgetId: string): string
  importConfiguration(widgetId: string, configData: string): boolean
  
  // 事件系统
  onConfigurationChange(widgetId: string, callback: Function): () => void
}
```

**配置结构设计**
```typescript
interface WidgetConfiguration {
  base: BaseConfiguration        // 基础配置（标题、样式等）
  component: ComponentConfiguration  // 组件特定配置
  dataSource: DataSourceConfiguration  // 数据源配置
  interaction: InteractionConfiguration  // 交互配置
  metadata: ConfigurationMetadata     // 元数据
}
```

#### C. 渲染器系统 (`renderers/`)

**渲染器架构模式**
```typescript
// 基础渲染器接口
interface IRenderer {
  render(data: GraphData[]): void
  destroy(): void
  updateNode(id: string, updates: Partial<GraphData>): void
  selectNode(id: string): void
}

// 渲染器注册模式
export const RendererManager = {
  register(type: string, renderer: IRenderer): void
  get(type: string): IRenderer | undefined
  unregister(type: string): void
}
```

### 1.3 数据流分析

```
用户操作
    ↓
工具栏事件处理
    ↓
EditorStore 状态更新
    ↓
配置管理器同步
    ↓
渲染器重新渲染
    ↓
组件更新显示
```

### 1.4 Card 2.1 集成架构

```typescript
// Card 2.1 集成桥接
useVisualEditorIntegration({
  autoInit: true,        // 自动初始化
  enableI18n: true      // 启用国际化
})

// 组件定义转换流程
Card2ComponentDefinition → WidgetDefinition → GraphData
```

---

## 2. 核心API参考

### 2.1 主要Composables

#### `useEditor()` - 编辑器核心Hook

```typescript
interface EditorContext {
  editorStore: EditorStore
  widgetStore: WidgetStore
  stateManager: EditorStore    // 别名
  
  // 核心操作方法
  addWidget(type: string, position?: {x: number, y: number}): Promise<void>
  selectNode(id: string): void
  updateNode(id: string, updates: Partial<GraphData>): void
  removeNode(id: string): void
  getNodeById(id: string): GraphData | undefined
  
  // Card 2.1 集成
  card2Integration: Card2Integration
  isCard2Component(type: string): boolean
}

// 使用示例
const editor = createEditor()
await editor.addWidget('comprehensive-data-test', { x: 100, y: 100 })
editor.selectNode('comprehensive-data-test_1234567890')
```

#### `useVisualEditorIntegration()` - Card 2.1 集成

```typescript
interface Card2Integration {
  isLoading: Ref<boolean>
  availableComponents: ComputedRef<ComponentInfo[]>
  availableWidgets: ComputedRef<Card2Widget[]>
  
  initialize(): Promise<void>
  getComponentDefinition(type: string): Card2Widget | undefined
  isCard2Component(type: string): boolean
}
```

### 2.2 配置管理API

#### ConfigurationManager 核心方法

```typescript
// 基础操作
const config = configurationManager.getConfiguration(widgetId)
configurationManager.setConfiguration(widgetId, newConfig)
configurationManager.updateConfiguration(widgetId, 'component', componentConfig)

// 监听配置变化
const unsubscribe = configurationManager.onConfigurationChange(widgetId, (config) => {
  console.log('配置已更新:', config)
})

// 配置验证
const result = configurationManager.validateConfiguration(config)
if (!result.valid) {
  console.error('配置验证失败:', result.errors)
}

// 批量操作
configurationManager.batchUpdateConfigurations([
  { widgetId: 'widget-1', config: { component: { title: '新标题' } } },
  { widgetId: 'widget-2', config: { dataSource: { type: 'api' } } }
])
```

### 2.3 数据源管理API

#### EditorDataSourceManager

```typescript
// 注册组件数据源
editorDataSourceManager.registerComponentDataSource(
  componentId,
  componentType,
  config,
  trigger
)

// 启动/停止数据源
editorDataSourceManager.startComponentDataSource(componentId)
editorDataSourceManager.stopComponentDataSource(componentId)

// 事件监听
editorDataSourceManager.on('data-updated', (eventData) => {
  const { componentId, result } = eventData
  // 处理数据更新
})
```

### 2.4 全局轮询管理API

#### GlobalPollingManager

```typescript
// 添加轮询任务
const taskId = pollingManager.addTask({
  componentId: 'widget-123',
  componentName: '温度传感器',
  interval: 30000,
  callback: async () => {
    // 轮询回调逻辑
  }
})

// 控制轮询
pollingManager.startTask(taskId)
pollingManager.stopTask(taskId)
pollingManager.enableGlobalPolling()
pollingManager.disableGlobalPolling()

// 获取统计信息
const stats = pollingManager.getStatistics()
// { totalTasks: 5, activeTasks: 3, errors: 0 }

// 组件级轮询控制
pollingManager.isComponentPollingActive(componentId)
pollingManager.startComponentTasks(componentId)
pollingManager.stopComponentTasks(componentId)
```

### 2.5 轮询控制器组件API

#### PollingController 组件

```typescript
interface PollingControllerProps {
  /** 控制模式：global-全局控制, card-卡片控制 */
  mode?: 'global' | 'card'
  /** 卡片模式下的组件ID */
  componentId?: string
  /** 控制器位置 */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** 是否显示统计信息 */
  showStats?: boolean
  /** 低调模式：仅显示小图标，悬停显示完整按钮 */
  lowProfile?: boolean
}

// 使用示例 - 全局轮询控制
<PollingController
  mode="global"
  position="bottom-right"
  :show-stats="true"
  :low-profile="true"
  @polling-toggle="handlePollingToggle"
  @polling-enabled="handlePollingEnabled"
  @polling-disabled="handlePollingDisabled"
/>

// 使用示例 - 单组件轮询控制
<PollingController
  mode="card"
  :component-id="widgetId"
  position="top-right"
  :show-stats="false"
  :low-profile="false"
  @polling-toggle="handleCardPollingToggle"
/>
```

---

## 3. 开发工作流程

### 3.1 项目启动流程

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 访问测试页面
# http://localhost:5002/test/editor-integration

# 4. 质量检查
pnpm quality-check
```

### 3.2 开发环境配置

#### 必要的开发工具

```json
{
  "devtools": [
    "Vue.js devtools",
    "Vite DevTools",
    "TypeScript",
    "ESLint",
    "Prettier"
  ],
  "vscode_extensions": [
    "Vue.volar",
    "TypeScript Vue Plugin",
    "ESLint",
    "Prettier"
  ]
}
```

#### 关键配置文件

- `vite.config.ts` - 构建配置，内存优化设置
- `eslint.config.js` - 代码质量规则
- `tsconfig.json` - TypeScript 配置
- `package.json` - 依赖和脚本定义

### 3.3 调试配置

#### 控制台调试标识符

```typescript
// 在控制台中查找这些标识符进行调试
console.log('🎯 [Editor]')        // 编辑器核心
console.log('🔍 [DEBUG-配置仓库]')  // 配置系统调试
console.log('🔄 [PanelEditor]')   // 面板编辑器
console.log('📊 [轮询管理器]')      // 轮询系统
console.log('🚀 [数据源管理器]')    // 数据源系统
```

#### 开发者工具集成

```typescript
// 在浏览器控制台中可用的调试方法
window.__VISUAL_EDITOR_DEBUG__ = {
  getEditorState: () => editorStore.$state,
  getConfigurations: () => configurationManager.getAllConfigurations(),
  getPollingStats: () => pollingManager.getStatistics(),
  clearCache: () => simpleDataBridge.clearAllCache(),
  
  // 新增实际可用的调试方法
  getComponentTree: () => stateManager.nodes,
  getCurrentRenderer: () => currentRenderer.value,
  getPollingManager: () => pollingManager,
  testPollingTask: (componentId) => pollingManager.isComponentPollingActive(componentId)
}
```

---

## 4. 组件开发指南

### 4.1 创建新的Widget组件

#### Step 1: 定义组件接口

```typescript
// types/my-widget.ts
export interface MyWidgetConfig {
  title: string
  backgroundColor: string
  dataSource?: DataSourceConfig
}

export interface MyWidgetProps {
  config: MyWidgetConfig
  data?: any
  readonly?: boolean
}
```

#### Step 2: 实现组件

```vue
<!-- MyWidget.vue -->
<script setup lang="ts">
import type { MyWidgetProps } from './types'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'

// Props 和基础设置
const props = withDefaults(defineProps<MyWidgetProps>(), {
  readonly: false
})

// 主题和国际化集成（强制要求）
const themeStore = useThemeStore()
const { t } = useI18n()

// 组件逻辑
const handleClick = () => {
  if (!props.readonly) {
    // 处理点击逻辑
  }
}
</script>

<template>
  <n-card class="my-widget" :bordered="false">
    <template #header>
      <span class="widget-title">{{ config.title || t('widgets.myWidget.defaultTitle') }}</span>
    </template>
    
    <div class="widget-content" :style="{ backgroundColor: config.backgroundColor }">
      <!-- 组件内容 -->
      <span>{{ t('widgets.myWidget.dataValue') }}: {{ data?.value || 'N/A' }}</span>
    </div>
  </n-card>
</template>

<style scoped>
.my-widget {
  width: 100%;
  height: 100%;
}

.widget-content {
  /* 使用主题变量，自动适配明暗主题 */
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 12px;
}
</style>
```

#### Step 3: 创建属性编辑器

```vue
<!-- MyWidgetPropertyEditor.vue -->
<script setup lang="ts">
import type { MyWidgetConfig } from './types'

const props = defineProps<{
  config: MyWidgetConfig
}>()

const emit = defineEmits<{
  'update:config': [config: MyWidgetConfig]
}>()

const handleConfigChange = (key: keyof MyWidgetConfig, value: any) => {
  emit('update:config', { ...props.config, [key]: value })
}
</script>

<template>
  <n-form label-placement="top">
    <n-form-item :label="$t('widgets.myWidget.titleLabel')">
      <n-input 
        :value="config.title"
        @update:value="(val) => handleConfigChange('title', val)"
        :placeholder="$t('widgets.myWidget.titlePlaceholder')"
      />
    </n-form-item>
    
    <n-form-item :label="$t('widgets.myWidget.backgroundColorLabel')">
      <n-color-picker 
        :value="config.backgroundColor"
        @update:value="(val) => handleConfigChange('backgroundColor', val)"
      />
    </n-form-item>
  </n-form>
</template>
```

#### Step 4: 注册组件

```typescript
// widgets/my-widget/index.ts
import MyWidget from './MyWidget.vue'
import MyWidgetPropertyEditor from './MyWidgetPropertyEditor.vue'
import type { WidgetDefinition } from '../types'

export const myWidgetDefinition: WidgetDefinition = {
  type: 'my-widget',
  name: 'My Widget',
  description: 'Custom widget example',
  icon: 'mdi:cube-outline',
  category: 'custom',
  version: '1.0.0',
  component: MyWidget,
  propertyEditor: MyWidgetPropertyEditor,
  defaultProperties: {
    title: 'My Widget',
    backgroundColor: '#ffffff'
  },
  defaultLayout: {
    canvas: { width: 300, height: 200 },
    gridstack: { w: 4, h: 3 }
  },
  metadata: {
    isCard2Component: false,
    author: 'Developer Name',
    tags: ['custom', 'example']
  }
}

// 注册到 widget store
import { useWidgetStore } from '@/components/visual-editor/store/widget'
const widgetStore = useWidgetStore()
widgetStore.register(myWidgetDefinition)
```

### 4.2 Card 2.1 组件集成

#### 组件定义结构

```typescript
// Card 2.1 组件定义
export const card2ComponentDefinition: ComponentDefinition = {
  type: 'dual-data-display',
  name: '双数据显示组件',
  description: '显示两个数据源的数据',
  icon: 'i-mdi:chart-line',
  category: 'data-display',
  version: '2.1.0',
  
  // 数据需求声明
  dataRequirements: {
    dataSource1: {
      type: 'object',
      required: true,
      properties: {
        temperature: { type: 'number' },
        unit: { type: 'string' }
      }
    },
    dataSource2: {
      type: 'object',
      required: false,
      properties: {
        humidity: { type: 'number' }
      }
    }
  },
  
  // 属性定义
  properties: {
    title: {
      type: 'string',
      default: '数据显示',
      description: '组件标题'
    },
    showBorder: {
      type: 'boolean',
      default: true,
      description: '显示边框'
    }
  },
  
  // 渲染组件
  component: DualDataDisplayWidget,
  
  // 配置组件
  configComponent: DualDataDisplayConfig
}
```

### 4.3 数据绑定最佳实践

#### 响应式数据处理

```vue
<script setup lang="ts">
import { computed, watch } from 'vue'

const props = defineProps<{
  data: Record<string, any>
  config: WidgetConfig
}>()

// 计算属性处理数据转换
const displayValue = computed(() => {
  if (!props.data) return 'N/A'
  
  const value = props.data.temperature || props.data.value
  const unit = props.data.unit || '°C'
  
  return `${value}${unit}`
})

// 监听数据变化，执行副作用
watch(() => props.data, (newData) => {
  if (newData?.alert && props.config.enableAlerts) {
    // 处理告警逻辑
  }
}, { deep: true })
</script>
```

---

## 5. 渲染器开发

### 5.1 渲染器架构

#### 基础渲染器类

```typescript
// BaseRenderer.ts
export abstract class BaseRenderer implements IRenderer {
  protected container: HTMLElement
  protected nodes: GraphData[] = []
  
  constructor(container: HTMLElement) {
    this.container = container
    this.initialize()
  }
  
  abstract initialize(): void
  abstract render(data: GraphData[]): void
  abstract updateNode(id: string, updates: Partial<GraphData>): void
  abstract destroy(): void
  
  // 通用方法
  protected findNode(id: string): GraphData | undefined {
    return this.nodes.find(node => node.id === id)
  }
  
  protected emitEvent(eventName: string, data: any): void {
    this.container.dispatchEvent(new CustomEvent(eventName, { detail: data }))
  }
}
```

### 5.2 创建自定义渲染器

#### Step 1: 实现渲染器类

```typescript
// CustomRenderer.ts
export class CustomRenderer extends BaseRenderer {
  private renderContext: CanvasRenderingContext2D | null = null
  
  initialize(): void {
    const canvas = document.createElement('canvas')
    canvas.width = this.container.clientWidth
    canvas.height = this.container.clientHeight
    
    this.renderContext = canvas.getContext('2d')
    this.container.appendChild(canvas)
    
    // 监听容器尺寸变化
    this.setupResizeObserver()
  }
  
  render(data: GraphData[]): void {
    this.nodes = data
    this.clearCanvas()
    
    data.forEach(node => {
      this.renderNode(node)
    })
  }
  
  updateNode(id: string, updates: Partial<GraphData>): void {
    const node = this.findNode(id)
    if (node) {
      Object.assign(node, updates)
      this.render(this.nodes) // 重新渲染
    }
  }
  
  private renderNode(node: GraphData): void {
    if (!this.renderContext) return
    
    const { x, y, width, height } = node.layout?.canvas || node
    
    // 绘制节点背景
    this.renderContext.fillStyle = '#ffffff'
    this.renderContext.fillRect(x, y, width, height)
    
    // 绘制边框
    this.renderContext.strokeStyle = '#cccccc'
    this.renderContext.strokeRect(x, y, width, height)
    
    // 绘制标签
    if (node.showLabel && node.label) {
      this.renderContext.fillStyle = '#333333'
      this.renderContext.font = '14px Arial'
      this.renderContext.fillText(node.label, x + 10, y + 25)
    }
  }
  
  private clearCanvas(): void {
    if (this.renderContext) {
      this.renderContext.clearRect(0, 0, this.container.clientWidth, this.container.clientHeight)
    }
  }
  
  destroy(): void {
    // 清理资源
    this.container.innerHTML = ''
  }
}
```

#### Step 2: 注册渲染器

```typescript
// renderers/index.ts
import { CustomRenderer } from './CustomRenderer'

export const rendererRegistry = new Map<string, typeof BaseRenderer>()

// 注册渲染器
rendererRegistry.set('custom', CustomRenderer)

// 工厂方法
export function createRenderer(type: string, container: HTMLElement): BaseRenderer | null {
  const RendererClass = rendererRegistry.get(type)
  if (RendererClass) {
    return new RendererClass(container)
  }
  return null
}
```

### 5.3 渲染器Vue组件包装

```vue
<!-- CustomRenderer.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CustomRenderer } from './CustomRenderer'

const props = defineProps<{
  nodes: GraphData[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'node-select': [id: string]
  'node-update': [id: string, updates: Partial<GraphData>]
}>()

const containerRef = ref<HTMLElement>()
let renderer: CustomRenderer | null = null

onMounted(() => {
  if (containerRef.value) {
    renderer = new CustomRenderer(containerRef.value)
    
    // 监听渲染器事件
    containerRef.value.addEventListener('node-select', (event: CustomEvent) => {
      emit('node-select', event.detail.nodeId)
    })
    
    // 初始渲染
    renderer.render(props.nodes)
  }
})

onUnmounted(() => {
  renderer?.destroy()
})

// 监听props变化
watch(() => props.nodes, (newNodes) => {
  renderer?.render(newNodes)
}, { deep: true })
</script>

<template>
  <div ref="containerRef" class="custom-renderer">
    <!-- 渲染器容器 -->
  </div>
</template>

<style scoped>
.custom-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
```

---

## 6. 数据流与状态管理

### 6.1 状态管理架构

#### Pinia Store 设计模式

```typescript
// 状态定义模式
interface StoreState {
  // 基础数据
  entities: Entity[]
  
  // UI状态
  loading: boolean
  error: string | null
  
  // 选择状态
  selectedIds: string[]
  
  // 配置状态
  preferences: UserPreferences
}

// Actions 模式
interface StoreActions {
  // 异步操作
  fetchData(): Promise<void>
  saveData(data: Entity): Promise<void>
  
  // 同步操作
  setLoading(loading: boolean): void
  setError(error: string | null): void
  
  // 批量操作
  batchUpdate(updates: EntityUpdate[]): void
}
```

#### 响应式数据同步

```typescript
// 自动同步模式
export const useDataSync = (storeKey: string) => {
  const store = useStore(storeKey)
  
  // 监听本地变化，同步到远程
  watchEffect(() => {
    const localData = store.$state
    syncToRemote(storeKey, localData)
  })
  
  // 监听远程变化，同步到本地
  onRemoteChange(storeKey, (remoteData) => {
    store.$patch(remoteData)
  })
}
```

### 6.2 配置数据流

#### 配置更新流程

```
用户输入
    ↓
属性编辑器
    ↓
ConfigurationManager.updateConfiguration()
    ↓
配置验证
    ↓
持久化存储（localStorage）
    ↓
事件通知系统
    ↓
组件重新渲染
```

#### 配置监听模式

```typescript
// 组件级配置监听
const useWidgetConfig = (widgetId: string) => {
  const config = ref<WidgetConfiguration>()
  
  const unsubscribe = configurationManager.onConfigurationChange(widgetId, (newConfig) => {
    config.value = newConfig
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
  
  return {
    config: readonly(config),
    updateConfig: (updates: Partial<WidgetConfiguration>) => {
      configurationManager.updateConfiguration(widgetId, updates)
    }
  }
}
```

### 6.3 数据源管理

#### 数据源注册和管理

```typescript
// 数据源配置类型
interface DataSourceConfig {
  type: 'static' | 'api' | 'websocket' | 'multi-source'
  config: Record<string, any>
  enabled: boolean
  triggers: DataSourceTrigger[]
}

// 数据源管理器
class DataSourceManager {
  private sources = new Map<string, DataSource>()
  private eventBus = new EventEmitter()
  
  registerDataSource(componentId: string, config: DataSourceConfig): void {
    const dataSource = this.createDataSource(config)
    this.sources.set(componentId, dataSource)
    
    // 设置数据更新监听
    dataSource.on('data-updated', (data) => {
      this.eventBus.emit('component-data-updated', {
        componentId,
        data,
        timestamp: Date.now()
      })
    })
  }
  
  private createDataSource(config: DataSourceConfig): DataSource {
    switch (config.type) {
      case 'api':
        return new ApiDataSource(config.config)
      case 'websocket':
        return new WebSocketDataSource(config.config)
      case 'static':
        return new StaticDataSource(config.config)
      default:
        throw new Error(`不支持的数据源类型: ${config.type}`)
    }
  }
}
```

---

## 7. 配置系统深入

### 7.1 配置层次结构

```typescript
interface WidgetConfiguration {
  // 基础层 - 通用属性（标题、样式、可见性等）
  base: {
    title?: string
    showTitle?: boolean
    opacity?: number
    zIndex?: number
    borderRadius?: number
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }
  
  // 组件层 - 组件特定配置
  component: {
    properties: Record<string, any>  // 组件属性
    validation?: {                   // 验证规则
      required: string[]
      constraints: Record<string, any>
    }
    polling?: {                      // 轮询配置
      enabled: boolean
      interval: number
      retryCount: number
    }
  }
  
  // 数据源层 - 数据绑定配置
  dataSource: {
    type: 'static' | 'api' | 'websocket' | 'multi-source' | 'data-mapping'
    enabled: boolean
    config: Record<string, any>
    metadata?: {
      lastUpdated: number
      version: string
    }
  }
  
  // 交互层 - 用户交互配置
  interaction: {
    onClick?: InteractionConfig
    onHover?: InteractionConfig
    onDoubleClick?: InteractionConfig
    [key: string]: InteractionConfig | undefined
  }
  
  // 元数据 - 配置版本和审计信息
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
    description?: string
    author?: string
    tags?: string[]
  }
}
```

### 7.2 配置验证系统

#### 验证规则定义

```typescript
interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  customValidator?: (value: any) => boolean | string
}

// 配置验证器
class ConfigurationValidator {
  private rules: Map<string, ValidationRule[]> = new Map()
  
  registerRules(componentType: string, rules: ValidationRule[]): void {
    this.rules.set(componentType, rules)
  }
  
  validate(componentType: string, config: WidgetConfiguration): ValidationResult {
    const rules = this.rules.get(componentType) || []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    for (const rule of rules) {
      const result = this.validateField(config, rule)
      if (result.type === 'error') {
        errors.push(result)
      } else if (result.type === 'warning') {
        warnings.push(result)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }
  
  private validateField(config: any, rule: ValidationRule): ValidationError | ValidationWarning | null {
    const value = this.getNestedValue(config, rule.field)
    
    // Required 检查
    if (rule.required && (value === undefined || value === null)) {
      return {
        type: 'error',
        field: rule.field,
        message: `字段 ${rule.field} 是必需的`,
        value
      }
    }
    
    // Type 检查
    if (value !== undefined && rule.type && typeof value !== rule.type) {
      return {
        type: 'error',
        field: rule.field,
        message: `字段 ${rule.field} 类型应为 ${rule.type}，实际为 ${typeof value}`,
        value
      }
    }
    
    // 自定义验证器
    if (rule.customValidator && value !== undefined) {
      const result = rule.customValidator(value)
      if (typeof result === 'string') {
        return {
          type: 'error',
          field: rule.field,
          message: result,
          value
        }
      } else if (result === false) {
        return {
          type: 'error',
          field: rule.field,
          message: `字段 ${rule.field} 验证失败`,
          value
        }
      }
    }
    
    return null
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}
```

### 7.3 配置迁移系统

```typescript
interface ConfigurationMigrator {
  fromVersion: string
  toVersion: string
  migrate(config: WidgetConfiguration): WidgetConfiguration
  description?: string
}

// 配置迁移示例
const migrationV1ToV2: ConfigurationMigrator = {
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '迁移到新的数据源配置格式',
  
  migrate(config: WidgetConfiguration): WidgetConfiguration {
    const newConfig = { ...config }
    
    // 迁移旧的dataSource格式到新格式
    if (newConfig.dataSource && typeof newConfig.dataSource.sources === 'object') {
      // 转换逻辑
      newConfig.dataSource = {
        type: 'multi-source',
        enabled: true,
        config: {
          sources: Object.entries(newConfig.dataSource.sources).map(([key, source]) => ({
            id: key,
            ...source as any
          }))
        }
      }
    }
    
    // 更新版本信息
    newConfig.metadata.version = '2.0.0'
    newConfig.metadata.migratedAt = Date.now()
    
    return newConfig
  }
}
```

---

## 8. 性能优化策略

### 8.1 渲染性能优化

#### 虚拟滚动实现

```typescript
class VirtualRenderer {
  private visibleNodes: GraphData[] = []
  private viewport: Viewport = { x: 0, y: 0, width: 0, height: 0 }
  
  updateVisibleNodes(allNodes: GraphData[], viewport: Viewport): void {
    this.viewport = viewport
    
    // 只渲染可见区域内的节点
    this.visibleNodes = allNodes.filter(node => 
      this.isNodeVisible(node, viewport)
    )
    
    // 添加缓冲区，提前渲染即将进入视口的节点
    const buffer = 100
    const extendedViewport = {
      x: viewport.x - buffer,
      y: viewport.y - buffer,
      width: viewport.width + buffer * 2,
      height: viewport.height + buffer * 2
    }
    
    this.visibleNodes = allNodes.filter(node => 
      this.isNodeVisible(node, extendedViewport)
    )
  }
  
  private isNodeVisible(node: GraphData, viewport: Viewport): boolean {
    const nodeRight = node.x + node.width
    const nodeBottom = node.y + node.height
    const viewportRight = viewport.x + viewport.width
    const viewportBottom = viewport.y + viewport.height
    
    return !(
      node.x > viewportRight ||
      nodeRight < viewport.x ||
      node.y > viewportBottom ||
      nodeBottom < viewport.y
    )
  }
}
```

#### 批量更新优化

```typescript
class BatchUpdateManager {
  private updateQueue: UpdateTask[] = []
  private updateTimer: number | null = null
  
  scheduleUpdate(task: UpdateTask): void {
    this.updateQueue.push(task)
    
    if (!this.updateTimer) {
      this.updateTimer = requestAnimationFrame(() => {
        this.flushUpdates()
      })
    }
  }
  
  private flushUpdates(): void {
    // 合并相同节点的更新
    const mergedUpdates = new Map<string, Partial<GraphData>>()
    
    for (const task of this.updateQueue) {
      if (mergedUpdates.has(task.nodeId)) {
        Object.assign(mergedUpdates.get(task.nodeId)!, task.updates)
      } else {
        mergedUpdates.set(task.nodeId, task.updates)
      }
    }
    
    // 批量应用更新
    for (const [nodeId, updates] of mergedUpdates) {
      this.applyUpdate(nodeId, updates)
    }
    
    // 清理
    this.updateQueue = []
    this.updateTimer = null
  }
}
```

### 8.2 内存管理

#### 组件清理模式

```typescript
export const useComponentCleanup = (componentId: string) => {
  const cleanupTasks: (() => void)[] = []
  
  const addCleanupTask = (task: () => void) => {
    cleanupTasks.push(task)
  }
  
  const cleanup = () => {
    cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.error(`清理任务失败:`, error)
      }
    })
    cleanupTasks.length = 0
  }
  
  onUnmounted(cleanup)
  
  return { addCleanupTask, cleanup }
}
```

#### 数据缓存策略

```typescript
class DataCache {
  private cache = new Map<string, CacheItem>()
  private maxSize = 100
  private ttl = 5 * 60 * 1000 // 5分钟
  
  set(key: string, value: any): void {
    // LRU 缓存实现
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // 检查TTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // 更新访问统计
    item.hits++
    
    // 移动到最后（LRU）
    this.cache.delete(key)
    this.cache.set(key, item)
    
    return item.value
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  getStats(): CacheStats {
    let totalHits = 0
    let oldestTimestamp = Date.now()
    
    for (const item of this.cache.values()) {
      totalHits += item.hits
      oldestTimestamp = Math.min(oldestTimestamp, item.timestamp)
    }
    
    return {
      size: this.cache.size,
      totalHits,
      oldestAge: Date.now() - oldestTimestamp
    }
  }
}
```

### 8.3 异步加载优化

#### 组件懒加载

```typescript
// 动态组件加载器
const ComponentLoader = {
  cache: new Map<string, Promise<Component>>(),
  
  async loadComponent(type: string): Promise<Component> {
    if (this.cache.has(type)) {
      return this.cache.get(type)!
    }
    
    const componentPromise = this.createComponentPromise(type)
    this.cache.set(type, componentPromise)
    
    return componentPromise
  },
  
  private createComponentPromise(type: string): Promise<Component> {
    return new Promise(async (resolve, reject) => {
      try {
        let component: Component
        
        // 根据类型动态导入组件
        switch (type) {
          case 'chart-widget':
            component = (await import('@/components/visual-editor/widgets/chart/ChartWidget.vue')).default
            break
          case 'text-widget':
            component = (await import('@/components/visual-editor/widgets/text/TextWidget.vue')).default
            break
          default:
            // Card 2.1 组件懒加载
            const card2Integration = useCard2Integration()
            component = await card2Integration.loadComponent(type)
        }
        
        resolve(component)
      } catch (error) {
        reject(error)
      }
    })
  }
}
```

---

## 9. 故障排除指南

### 9.1 常见问题诊断

#### 组件不显示问题

**症状**: 组件添加到画布后不显示或显示为空白

**诊断步骤**:
```javascript
// 1. 检查组件是否正确注册
const widgetStore = useWidgetStore()
console.log('已注册的组件:', widgetStore.getAllWidgets().map(w => w.type))

// 2. 检查节点数据
const editorStore = useEditorStore()
console.log('画布节点:', editorStore.nodes)

// 3. 检查组件定义
const widget = widgetStore.getWidget('your-widget-type')
console.log('组件定义:', widget)

// 4. 检查Card2.1集成状态
const card2Integration = useCard2Integration()
console.log('Card2.1状态:', {
  isLoading: card2Integration.isLoading.value,
  availableComponents: card2Integration.availableComponents.value.length
})

// 5. 检查渲染器状态
console.log('当前渲染器:', currentRenderer.value)
console.log('渲染器数据源状态:', multiDataSourceStore.value)

// 6. 检查组件是否在可见区域
const node = editorStore.nodes.find(n => n.type === 'your-widget-type')
console.log('组件位置和尺寸:', node && {
  x: node.x, y: node.y, width: node.width, height: node.height
})
```

**解决方案**:
- 确保组件已正确注册到 WidgetStore
- 检查 Card2.1 组件是否正确初始化  
- 验证组件的 defaultLayout 配置
- 检查组件的属性定义和默认值
- 确认组件在当前视口内可见
- 验证组件依赖的数据源是否正常

#### 配置不保存问题

**症状**: 组件配置修改后不保存或页面刷新后丢失

**诊断步骤**:
```javascript
// 1. 检查配置管理器状态
console.log('配置管理器:', configurationManager.getAllConfigurations())

// 2. 检查localStorage
console.log('本地存储:', localStorage.getItem('visual-editor-configurations'))

// 3. 检查面板保存状态
console.log('面板数据:', panelData.value)
console.log('编辑器配置:', editorConfig.value)
```

**解决方案**:
- 确保 ConfigurationManager 正确初始化
- 检查 localStorage 权限和空间
- 验证面板保存接口调用
- 检查配置验证是否通过
- 确认 `configurationIntegrationBridge` 正确设置
- 验证 `getState()` 和 `setState()` 方法正常工作

#### 轮询系统问题

**症状**: 组件数据不更新或轮询未启动

**诊断步骤**:
```javascript
// 1. 检查全局轮询状态
console.log('全局轮询状态:', pollingManager.isGlobalPollingEnabled())
console.log('轮询统计:', pollingManager.getStatistics())

// 2. 检查组件轮询配置
const componentConfig = configurationManager.getConfiguration(componentId)
console.log('组件轮询配置:', componentConfig?.component?.polling)

// 3. 检查轮询任务
console.log('所有任务:', pollingManager.getAllTasks())
console.log('组件任务:', pollingManager.getComponentTasks(componentId))

// 4. 检查数据源管理器
console.log('数据源管理器状态:', editorDataSourceManager.getStatistics())
```

**解决方案**:
- 确保在预览模式下启用全局轮询
- 检查组件是否配置了正确的数据源
- 验证 `initializePollingTasksAndEnable()` 被正确调用
- 检查轮询回调函数是否正确执行
- 确认 PollingController 组件事件绑定正确

#### 性能问题诊断

**症状**: 界面卡顿、响应缓慢

**诊断工具**:
```javascript
// 性能监控
const performanceMonitor = {
  startTime: 0,
  
  start(operation: string) {
    this.startTime = performance.now()
    console.time(operation)
  },
  
  end(operation: string) {
    const duration = performance.now() - this.startTime
    console.timeEnd(operation)
    console.log(`${operation} 耗时: ${duration.toFixed(2)}ms`)
  },
  
  memory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('内存使用:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      })
    }
  }
}

// 使用示例
performanceMonitor.start('组件渲染')
// ... 执行操作
performanceMonitor.end('组件渲染')
performanceMonitor.memory()
```

### 9.2 调试工具集

#### 开发者控制台扩展

```typescript
// 开发环境下可用的调试工具
if (process.env.NODE_ENV === 'development') {
  (window as any).__VISUAL_EDITOR_DEBUG__ = {
    // 状态检查
    getEditorState: () => ({
      nodes: editorStore.nodes,
      selectedIds: widgetStore.selectedNodeIds,
      configurations: Object.fromEntries(configurationManager.getAllConfigurations())
    }),
    
    // 性能分析
    getPerformanceStats: () => ({
      nodeCount: editorStore.nodes.length,
      configurationCount: configurationManager.getAllConfigurations().size,
      memoryUsage: (performance as any).memory
    }),
    
    // 调试操作
    clearAllConfigurations: () => {
      configurationManager.getAllConfigurations().clear()
    },
    
    forceRerender: () => {
      // 强制重新渲染
      const nodes = [...editorStore.nodes]
      editorStore.setNodes([])
      nextTick(() => {
        editorStore.setNodes(nodes)
      })
    },
    
    // 导出调试数据
    exportDebugData: () => {
      const debugData = {
        timestamp: Date.now(),
        version: '2.0.0',
        editorState: editorStore.$state,
        configurations: Object.fromEntries(configurationManager.getAllConfigurations()),
        performance: {
          memory: (performance as any).memory,
          timing: performance.timing
        }
      }
      
      const blob = new Blob([JSON.stringify(debugData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `visual-editor-debug-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
}
```

#### 日志系统

```typescript
// 分级日志系统
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO
  private prefix = '[Visual Editor]'
  
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`${this.prefix} 🔍`, message, ...args)
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`${this.prefix} ℹ️`, message, ...args)
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.prefix} ⚠️`, message, ...args)
    }
  }
  
  error(message: string, error?: Error, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.prefix} ❌`, message, error, ...args)
    }
  }
  
  setLevel(level: LogLevel): void {
    this.level = level
  }
}

export const logger = new Logger()
```

---

## 10. 最佳实践

### 10.1 代码组织规范

#### 目录结构规范

```
components/visual-editor/
├── components/           # UI组件
│   ├── common/          # 通用组件
│   ├── toolbar/         # 工具栏相关
│   ├── PropertyPanel/   # 属性面板
│   └── WidgetLibrary/   # 组件库面板
├── renderers/           # 渲染器实现
│   ├── base/           # 基础类和接口
│   ├── canvas/         # Canvas渲染器
│   └── gridstack/      # Gridstack渲染器
├── widgets/             # 组件实现
│   ├── base/           # 基础组件
│   ├── chart/          # 图表组件
│   └── custom/         # 自定义组件
├── configuration/       # 配置管理
│   ├── components/     # 配置UI组件
│   └── types.ts        # 配置类型定义
├── core/               # 核心逻辑
├── hooks/              # 组合式函数
├── store/              # 状态管理
├── types/              # TypeScript类型
└── utils/              # 工具函数
```

#### 命名规范

```typescript
// 文件命名：kebab-case
// my-widget-component.vue
// configuration-manager.ts

// 组件命名：PascalCase
export default defineComponent({
  name: 'MyWidgetComponent'
})

// 接口命名：PascalCase，I前缀
interface IWidgetRenderer {
  render(): void
}

// 类型命名：PascalCase
type WidgetConfiguration = {
  // ...
}

// 常量命名：SCREAMING_SNAKE_CASE
const DEFAULT_WIDGET_SIZE = { width: 300, height: 200 }

// 函数命名：camelCase
function createWidgetInstance(): Widget {
  // ...
}
```

### 10.2 开发工作流程

#### Git工作流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-widget-type

# 2. 开发和提交
git add .
git commit -m "feat: 添加新的数据显示组件

- 实现基础数据绑定功能
- 添加配置面板支持
- 集成主题系统
- 添加单元测试

🤝 Co-authored-by: Claude <noreply@anthropic.com>"

# 3. 代码质量检查
pnpm quality-check
pnpm typecheck
pnpm lint

# 4. 合并到主分支
git checkout master
git merge feature/new-widget-type
```

#### 代码审查清单

```markdown
## 代码审查清单

### 🎯 功能性
- [ ] 功能按需求正常工作
- [ ] 错误情况处理得当
- [ ] 边界条件考虑充分

### 🏗️ 架构性
- [ ] 符合现有架构模式
- [ ] 组件职责单一明确
- [ ] 依赖关系合理

### 🎨 代码质量
- [ ] 代码清晰易读
- [ ] 命名规范一致
- [ ] 注释充分有效
- [ ] 无重复代码

### 🚀 性能
- [ ] 无明显性能问题
- [ ] 适当使用缓存
- [ ] 避免不必要的重渲染

### 🧪 测试
- [ ] 单元测试覆盖充分
- [ ] 集成测试通过
- [ ] 手动测试验证

### 📱 兼容性
- [ ] 支持明暗主题
- [ ] 响应式设计适配
- [ ] 浏览器兼容性

### 🌐 国际化
- [ ] 所有用户可见文本使用i18n
- [ ] 中文注释完整
- [ ] 文档更新及时
```

### 10.3 性能最佳实践

#### 组件性能优化

```vue
<script setup lang="ts">
// ✅ 使用 defineProps 和 defineEmits
const props = defineProps<{
  data: WidgetData
  config: WidgetConfig
}>()

const emit = defineEmits<{
  update: [data: WidgetData]
}>()

// ✅ 使用 computed 进行数据转换
const displayValue = computed(() => {
  return props.data?.value?.toString() || 'N/A'
})

// ✅ 使用 watch 监听特定属性
watch(() => props.config.refreshRate, (newRate) => {
  setupRefreshInterval(newRate)
})

// ❌ 避免在模板中进行复杂计算
// <span>{{ formatComplexData(props.data) }}</span>

// ✅ 使用计算属性
const formattedData = computed(() => formatComplexData(props.data))
</script>

<template>
  <div class="widget">
    <!-- ✅ 使用计算属性 -->
    <span>{{ formattedData }}</span>
    
    <!-- ✅ 条件渲染优化 -->
    <div v-if="props.config.showDetails" class="details">
      <ExpensiveComponent :data="props.data" />
    </div>
  </div>
</template>
```

#### 数据处理优化

```typescript
// ✅ 使用对象冻结提升性能
const frozenConfig = Object.freeze({
  defaultOptions: {
    animation: true,
    responsive: true
  }
})

// ✅ 使用 Map 而不是 Object 进行频繁查找
const componentMap = new Map<string, ComponentDefinition>()
componentMap.set('widget-type', definition)

// ✅ 批量处理数据更新
const batchUpdateNodes = (updates: NodeUpdate[]) => {
  // 收集所有更新
  const nodeUpdates = new Map<string, Partial<GraphData>>()
  
  updates.forEach(update => {
    const existing = nodeUpdates.get(update.nodeId) || {}
    nodeUpdates.set(update.nodeId, { ...existing, ...update.changes })
  })
  
  // 批量应用
  nodeUpdates.forEach((changes, nodeId) => {
    updateNode(nodeId, changes)
  })
}

// ✅ 使用 WeakMap 避免内存泄漏
const componentInstances = new WeakMap<Element, ComponentInstance>()
```

### 10.4 错误处理最佳实践

#### 错误边界实现

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, provide, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

// 错误捕获
onErrorCaptured((err, instance, info) => {
  error.value = err
  errorInfo.value = info
  
  // 记录错误日志
  logger.error('组件错误捕获', err, {
    componentName: instance?.$options.name,
    errorInfo: info,
    timestamp: Date.now()
  })
  
  // 阻止错误继续传播
  return false
})

// 重试机制
const retry = () => {
  error.value = null
  errorInfo.value = ''
}

// 提供错误状态给子组件
provide('error-boundary', {
  hasError: computed(() => !!error.value),
  retry
})
</script>

<template>
  <div class="error-boundary">
    <!-- 错误状态显示 -->
    <div v-if="error" class="error-display">
      <n-result status="error" :title="$t('common.componentError')">
        <template #extra>
          <n-space>
            <n-button @click="retry">{{ $t('common.retry') }}</n-button>
            <n-button type="primary" @click="$emit('report-error', { error, errorInfo })">
              {{ $t('common.reportError') }}
            </n-button>
          </n-space>
        </template>
      </n-result>
    </div>
    
    <!-- 正常内容 -->
    <slot v-else />
  </div>
</template>
```

#### 异步错误处理

```typescript
// 统一异步错误处理
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      // 记录错误
      logger.error('异步操作失败', err, { args })
      
      // 自定义错误处理
      if (errorHandler) {
        errorHandler(err)
      } else {
        // 默认错误处理
        message.error(err.message || '操作失败')
      }
      
      // 重新抛出错误，让调用者决定如何处理
      throw err
    }
  }) as T
}

// 使用示例
const saveConfiguration = withErrorHandling(
  async (config: WidgetConfiguration) => {
    await configurationManager.setConfiguration(widgetId, config)
    message.success('配置保存成功')
  },
  (error) => {
    // 自定义错误处理
    message.error(`配置保存失败: ${error.message}`)
  }
)
```

---

## 🚀 快速开始指南

### 新手入门 5 分钟

#### 1. 启动开发环境
```bash
# 克隆项目并安装依赖
pnpm install
# 启动开发服务器
pnpm dev
# 访问测试页面
# http://localhost:5002/test/editor-integration
```

#### 2. 创建第一个组件
```vue
<!-- MyFirstWidget.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  data?: { temperature: number }
  config?: { title: string, unit: string }
}>()

const { t } = useI18n()
</script>

<template>
  <n-card>
    <template #header>{{ config?.title || t('widgets.temperature') }}</template>
    <n-statistic 
      :value="data?.temperature || 0" 
      :suffix="config?.unit || '°C'"
    />
  </n-card>
</template>
```

#### 3. 注册和测试组件
```typescript
// 在 Card 2.1 系统中注册
const temperatureWidget: ComponentDefinition = {
  type: 'temperature-sensor',
  name: '温度传感器',
  component: MyFirstWidget,
  properties: {
    title: { type: 'string', default: '温度' },
    unit: { type: 'string', default: '°C' }
  }
}

// 在编辑器中添加
const editor = createEditor()
await editor.addWidget('temperature-sensor')
```

#### 4. 配置数据源
```typescript
// 在组件配置面板中设置
{
  dataSource: {
    type: 'api',
    config: {
      url: '/api/sensors/temperature',
      method: 'GET',
      interval: 30000 // 30秒轮询
    }
  }
}
```

### 🎯 常用开发场景

#### 场景1：添加新的数据可视化组件
1. 创建组件 Vue 文件
2. 定义 Card 2.1 组件定义
3. 创建属性编辑器（可选）
4. 配置数据需求声明
5. 注册到组件注册表
6. 在测试页面验证功能

#### 场景2：扩展现有组件功能
1. 修改组件的 properties 定义
2. 更新组件渲染逻辑
3. 添加或修改属性编辑器
4. 运行质量检查确保兼容性
5. 测试新功能是否正常工作

#### 场景3：自定义渲染器开发
1. 继承 `BaseRenderer` 类
2. 实现必要的渲染方法
3. 创建 Vue 组件包装器
4. 注册到渲染器注册表
5. 在工具栏中添加切换选项

#### 场景4：轮询数据源集成
1. 在组件配置中声明轮询需求
2. 配置数据源（API/WebSocket/静态）
3. 使用 PollingController 控制轮询
4. 处理数据更新和错误情况
5. 在预览模式下测试轮询功能

### 🔧 开发技巧

#### 实时调试
```javascript
// 控制台快速调试
window.__VISUAL_EDITOR_DEBUG__.getEditorState()
window.__VISUAL_EDITOR_DEBUG__.getPollingStats()

// 手动触发轮询
pollingManager.enableGlobalPolling()

// 检查组件状态
const config = configurationManager.getConfiguration(componentId)
console.log('组件配置:', config)
```

#### 性能监控
```javascript
// 监控渲染性能
performance.mark('render-start')
// ... 执行渲染操作
performance.mark('render-end')
performance.measure('render-duration', 'render-start', 'render-end')
```

#### 错误恢复
```typescript
// 组件级错误恢复
const safeRenderComponent = (component: Component) => {
  try {
    return renderComponent(component)
  } catch (error) {
    console.error('组件渲染失败:', error)
    return renderErrorFallback(error)
  }
}
```

---

## 📄 总结

Visual Editor系统是一个复杂的可视化编辑平台，本文档详细介绍了：

1. **系统架构** - 深入解析多层架构设计和数据流
2. **API参考** - 完整的接口文档和使用示例
3. **开发指南** - 组件和渲染器开发的最佳实践
4. **配置系统** - 分层配置管理和验证机制
5. **性能优化** - 渲染优化、内存管理和异步加载策略
6. **故障排除** - 常见问题诊断和调试工具
7. **最佳实践** - 代码规范、工作流程和错误处理

遵循本文档的指导原则，开发者可以：
- 🚀 快速上手系统开发
- 🎯 创建高质量的组件和渲染器
- 🔧 有效诊断和解决问题
- 📈 优化系统性能和用户体验
- 🤝 维护代码质量和团队协作效率

---

**文档维护**: 请在系统重大更新时及时更新本文档  
**反馈渠道**: 如有问题或建议，请在项目仓库中提交Issue  
**版本历史**: 查看Git提交记录了解详细变更历史