# 可视化编辑器最小闭环实现计划 (MVP)

## 🎯 核心原则

**最小闭环优于局部完美**  
本计划严格遵循最小闭环原则，构建一个功能完整但最简化的可视化编辑器MVP版本。

## 📋 MVP 功能范围定义

### ✅ 包含功能
1. **基础编辑界面** - 左侧组件库、中间画布、右侧属性面板
2. **看板渲染器** - 优先实现看板模式（复用现有PanelV2布局）
3. **基础组件** - 2-3个核心组件（文本、图片、基础图表）
4. **基本交互** - 拖拽添加、选择、属性编辑
5. **配置保存** - 简单的配置序列化和反序列化

### ❌ 暂不包含功能
- 多渲染器切换（后续扩展）
- 复杂图表组件
- 实时协同编辑
- 插件系统
- 撤销重做

## 🏗️ 架构实现计划

### Phase 1: 核心架构搭建 (1-2天)

#### 1.1 目录结构初始化
```
src/components/visual-editor/           # 新建可视化编辑器目录
├── index.ts                           # 对外API入口
├── VisualEditor.vue                   # 主编辑器组件
├── core/                              # 核心引擎（最简版）
│   ├── state-manager.ts               # 状态管理（基于reactive）
│   └── types.ts                       # 基础类型定义
├── renderers/                         # 渲染器（仅看板）
│   └── kanban/
│       ├── KanbanRenderer.vue         # 看板渲染器
│       └── index.ts
├── components/                        # 编辑器UI组件
│   ├── ComponentLibrary.vue           # 左侧组件库
│   ├── Canvas.vue                     # 中间画布
│   └── PropertyPanel.vue              # 右侧属性面板
└── widgets/                           # 基础组件库
    ├── TextWidget.vue                 # 文本组件
    ├── ImageWidget.vue                # 图片组件
    └── index.ts
```

#### 1.2 核心类型定义
```typescript
// core/types.ts
export interface WidgetNode {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  properties: Record<string, any>
}

export interface EditorState {
  widgets: WidgetNode[]
  selectedId: string | null
}

export type RendererType = 'kanban'  // 暂时只支持看板
```

### Phase 2: 基础功能实现 (2-3天)

#### 2.1 状态管理器
```typescript
// core/state-manager.ts
import { reactive } from 'vue'
import type { EditorState, WidgetNode } from './types'

export const createStateManager = () => {
  const state = reactive<EditorState>({
    widgets: [],
    selectedId: null
  })

  const actions = {
    addWidget: (widget: WidgetNode) => {
      state.widgets.push(widget)
    },
    selectWidget: (id: string) => {
      state.selectedId = id
    },
    updateWidget: (id: string, updates: Partial<WidgetNode>) => {
      const widget = state.widgets.find(w => w.id === id)
      if (widget) Object.assign(widget, updates)
    }
  }

  return { state, actions }
}
```

#### 2.2 主编辑器组件
```vue
<!-- VisualEditor.vue -->
<template>
  <div class="visual-editor">
    <!-- 使用 PanelV2 验证过的布局 -->
    <PanelLayout>
      <template #left>
        <ComponentLibrary @add-widget="handleAddWidget" />
      </template>
      <template #center>
        <Canvas 
          :widgets="state.widgets"
          :selected-id="state.selectedId"
          @select="actions.selectWidget"
        />
      </template>
      <template #right>
        <PropertyPanel 
          :widget="selectedWidget"
          @update="handleUpdateWidget"
        />
      </template>
    </PanelLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PanelLayout } from '@/components/panelv2/layout'
import { createStateManager } from './core/state-manager'

const { state, actions } = createStateManager()

const selectedWidget = computed(() => 
  state.widgets.find(w => w.id === state.selectedId)
)

// 事件处理
const handleAddWidget = (type: string) => {
  // 简单的组件添加逻辑
}

const handleUpdateWidget = (updates: any) => {
  if (state.selectedId) {
    actions.updateWidget(state.selectedId, updates)
  }
}
</script>
```

#### 2.3 基础组件实现

**左侧组件库**
```vue
<!-- components/ComponentLibrary.vue -->
<template>
  <div class="component-library">
    <n-card title="组件库" size="small">
      <n-space vertical>
        <n-button 
          v-for="widget in widgets" 
          :key="widget.type"
          block 
          @click="$emit('add-widget', widget.type)"
        >
          {{ widget.name }}
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
// 使用 NaiveUI 组件，确保主题切换支持
const widgets = [
  { type: 'text', name: '文本' },
  { type: 'image', name: '图片' }
]

defineEmits<{
  'add-widget': [type: string]
}>()
</script>
```

**画布组件**
```vue
<!-- components/Canvas.vue -->
<template>
  <div class="canvas" @click="$emit('select', null)">
    <div 
      v-for="widget in widgets"
      :key="widget.id"
      class="widget-container"
      :class="{ selected: widget.id === selectedId }"
      :style="{
        left: widget.x + 'px',
        top: widget.y + 'px',
        width: widget.width + 'px',
        height: widget.height + 'px'
      }"
      @click.stop="$emit('select', widget.id)"
    >
      <component 
        :is="getWidgetComponent(widget.type)"
        v-bind="widget.properties"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { TextWidget, ImageWidget } from '../widgets'

const widgetComponents = {
  text: TextWidget,
  image: ImageWidget
}

const getWidgetComponent = (type: string) => widgetComponents[type]

defineProps<{
  widgets: any[]
  selectedId: string | null
}>()

defineEmits<{
  select: [id: string | null]
}>()
</script>

<style scoped>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--n-color); /* 使用 NaiveUI 主题变量 */
}

.widget-container {
  position: absolute;
  border: 2px solid transparent;
}

.widget-container.selected {
  border-color: var(--n-primary-color);
}
</style>
```

**属性面板**
```vue
<!-- components/PropertyPanel.vue -->
<template>
  <div class="property-panel">
    <n-card title="属性设置" size="small">
      <template v-if="widget">
        <n-form>
          <n-form-item label="X坐标">
            <n-input-number 
              :value="widget.x" 
              @update:value="updateProperty('x', $event)"
            />
          </n-form-item>
          <n-form-item label="Y坐标">
            <n-input-number 
              :value="widget.y" 
              @update:value="updateProperty('y', $event)"
            />
          </n-form-item>
          <n-form-item label="宽度">
            <n-input-number 
              :value="widget.width" 
              @update:value="updateProperty('width', $event)"
            />
          </n-form-item>
        </n-form>
      </template>
      <n-empty v-else description="请选择一个组件" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  widget?: any
}>()

const emit = defineEmits<{
  update: [updates: any]
}>()

const updateProperty = (key: string, value: any) => {
  emit('update', { [key]: value })
}
</script>
```

### Phase 3: 基础组件开发 (1天)

#### 3.1 文本组件
```vue
<!-- widgets/TextWidget.vue -->
<template>
  <div 
    class="text-widget"
    :style="{
      fontSize: fontSize + 'px',
      color: color,
      textAlign: textAlign
    }"
  >
    {{ content }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  content?: string
  fontSize?: number
  color?: string  
  textAlign?: 'left' | 'center' | 'right'
}

withDefaults(defineProps<Props>(), {
  content: '文本内容',
  fontSize: 14,
  color: 'var(--n-text-color)', // 使用主题变量
  textAlign: 'left'
})
</script>
```

#### 3.2 图片组件
```vue
<!-- widgets/ImageWidget.vue -->
<template>
  <div class="image-widget">
    <n-image 
      :src="src || '/default-image.png'"
      :alt="alt"
      :style="{ width: '100%', height: '100%' }"
      object-fit="cover"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  src?: string
  alt?: string
}

withDefaults(defineProps<Props>(), {
  src: '',
  alt: '图片'
})
</script>
```

### Phase 4: 看板渲染器集成 (1天)

#### 4.1 看板渲染器
```vue
<!-- renderers/kanban/KanbanRenderer.vue -->
<template>
  <div class="kanban-renderer">
    <!-- 直接复用 PanelV2 的布局系统 -->
    <div 
      v-for="widget in widgets"
      :key="widget.id"
      class="kanban-widget"
      :style="getWidgetStyle(widget)"
    >
      <component 
        :is="getWidgetComponent(widget.type)"
        v-bind="widget.properties"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { TextWidget, ImageWidget } from '../../widgets'

const props = defineProps<{
  widgets: any[]
}>()

const widgetComponents = {
  text: TextWidget,
  image: ImageWidget
}

const getWidgetComponent = (type: string) => widgetComponents[type]

const getWidgetStyle = (widget: any) => ({
  position: 'absolute',
  left: widget.x + 'px',
  top: widget.y + 'px',
  width: widget.width + 'px',
  height: widget.height + 'px'
})
</script>

<style scoped>
.kanban-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  /* 使用主题变量确保颜色适配 */
  background: var(--n-body-color);
}
</style>
```

### Phase 5: 集成和对外API (1天)

#### 5.1 主入口文件
```typescript
// index.ts
export { default as VisualEditor } from './VisualEditor.vue'
export type { WidgetNode, EditorState, RendererType } from './core/types'
export { createStateManager } from './core/state-manager'

// 简单的使用示例
export const createEditorInstance = () => {
  return createStateManager()
}
```

#### 5.2 在页面中使用
```vue
<!-- src/views/visualization/editor-demo/index.vue -->
<template>
  <div class="editor-demo-page">
    <VisualEditor />
  </div>
</template>

<script setup lang="ts">
import { VisualEditor } from '@/components/visual-editor'
</script>
```

## 🚀 实施顺序

1. **Day 1-2**: 搭建目录结构和核心架构
2. **Day 3-4**: 实现基础UI组件（组件库、画布、属性面板）
3. **Day 5**: 开发基础widget组件（文本、图片）
4. **Day 6**: 集成看板渲染器，复用PanelV2布局
5. **Day 7**: 完善对外API和使用示例

## 🎯 验收标准

**MVP完成标准：**
- [ ] 能正常显示编辑器界面（三栏布局）
- [ ] 能从左侧拖拽添加文本和图片组件
- [ ] 能选择组件并在右侧编辑属性
- [ ] 组件能正常显示在画布上
- [ ] 配置能序列化保存和加载
- [ ] 支持主题切换（使用NaiveUI变量）

## 🔄 后续扩展计划

1. **Phase 2**: 添加更多基础组件（图表、按钮等）
2. **Phase 3**: 实现拖拽移动和缩放功能
3. **Phase 4**: 添加更多渲染器（大屏、报表）
4. **Phase 5**: 引入插件系统和高级功能

## 📝 技术约束

1. **严格使用NaiveUI组件** - 确保UI一致性和主题支持
2. **复用PanelV2布局** - 利用已验证的布局组件
3. **类型安全** - 所有API使用TypeScript严格类型
4. **主题适配** - 使用CSS变量，避免硬编码颜色
5. **模块化设计** - 每个功能模块独立，便于后续扩展

---

**🚨 关键提醒：严格按照最小闭环原则实施，克制过度设计的冲动，优先保证基础功能的完整性。**