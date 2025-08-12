# Visual Editor 渲染器系统

本目录包含了可视化编辑器的渲染器系统，提供多种布局方式来展示和编辑组件。

## 📁 目录结构

```
renderers/
├── base/                           # 基础架构
│   ├── BaseRenderer.ts             # 抽象基类
│   ├── BaseRendererComponent.vue   # Vue 组件基类
│   └── RendererManager.ts          # 渲染器管理器
├── canvas/                         # 自由画布渲染器
│   ├── CanvasRenderer.vue          # 主组件
│   ├── Card2Wrapper.vue            # 卡片包装器
│   └── ContextMenu.vue             # 右键菜单
├── gridstack/                      # 网格布局渲染器
│   ├── GridstackRenderer.vue       # 主组件
│   └── GridLayoutPlusWrapper.vue   # 网格包装器
├── templates/                      # 开发模板
│   ├── BasicRenderer.vue           # 基础模板
│   ├── FlowRenderer.vue            # 流式布局模板
│   ├── CustomGridRenderer.vue      # 自定义网格模板
│   └── README.md                   # 模板使用指南
├── RENDERER_DEVELOPMENT_GUIDE.md   # 开发指南
├── BEST_PRACTICES.md               # 最佳实践
└── index.ts                        # 统一导出
```

## 🎨 可用渲染器

### 1. Canvas 渲染器 (默认)
- **特点**: 自由布局，支持拖拽和调整大小
- **适用场景**: 仪表板设计、自由排版
- **组件**: `CanvasRenderer`

### 2. GridStack 渲染器
- **特点**: 基于 GridLayoutPlus 的响应式网格布局
- **适用场景**: 结构化布局、响应式设计
- **组件**: `GridstackRenderer`

### 3. 自定义渲染器
- **特点**: 基于模板快速开发
- **适用场景**: 特殊布局需求
- **模板**: `templates/` 目录下的模板文件

## 🚀 快速开始

### 选择现有渲染器

```vue
<template>
  <!-- 使用 Canvas 渲染器 -->
  <CanvasRenderer 
    :readonly="false"
    :show-widget-titles="true"
    @ready="onRendererReady"
    @node-select="onNodeSelect"
  />
  
  <!-- 使用 GridStack 渲染器 -->
  <GridstackRenderer
    :readonly="false"
    :show-widget-titles="true"
    @ready="onRendererReady"
    @node-select="onNodeSelect"
  />
</template>

<script setup lang="ts">
import { CanvasRenderer, GridstackRenderer } from '@/components/visual-editor/renderers'

const onRendererReady = () => {
  console.log('Renderer is ready')
}

const onNodeSelect = (nodeId: string) => {
  console.log('Node selected:', nodeId)
}
</script>
```

### 开发新渲染器

1. **选择模板**: 从 `templates/` 目录选择合适的模板
2. **阅读指南**: 查看 [开发指南](./RENDERER_DEVELOPMENT_GUIDE.md)
3. **参考最佳实践**: 遵循 [最佳实践](./BEST_PRACTICES.md)

```bash
# 复制模板
cp templates/BasicRenderer.vue my-renderer/MyRenderer.vue

# 根据需要修改
# - 组件名称和样式
# - 布局算法
# - 配置选项
# - 交互逻辑
```

## 🔧 渲染器接口

所有渲染器都遵循统一的接口规范：

### Props
```typescript
interface RendererProps {
  readonly?: boolean          // 只读模式
  config?: RendererConfig    // 渲染器配置
  showWidgetTitles?: boolean // 显示组件标题
}
```

### Emits
```typescript
interface RendererEmits {
  (e: 'ready'): void                           // 渲染器就绪
  (e: 'error', error: Error): void             // 错误事件
  (e: 'node-select', nodeId: string): void     // 节点选择
  (e: 'canvas-click', event?: MouseEvent): void // 画布点击
}
```

### 基础功能
- ✅ 节点渲染和布局
- ✅ 节点选择和多选
- ✅ 预览模式支持
- ✅ 主题适配 (亮色/暗色)
- ✅ 栅格背景显示
- ✅ 错误处理和恢复
- ✅ 响应式设计

## 📖 详细文档

### 开发相关
- [📘 开发指南](./RENDERER_DEVELOPMENT_GUIDE.md) - 详细的开发步骤和示例
- [📋 最佳实践](./BEST_PRACTICES.md) - 性能优化和常见问题
- [📝 模板使用](./templates/README.md) - 模板使用和自定义指南

### API 文档
- [BaseRenderer](./base/BaseRenderer.ts) - 基础渲染器抽象类
- [BaseRendererComponent](./base/BaseRendererComponent.vue) - Vue 组件基类

## 🎯 渲染器特性对比

| 特性 | Canvas | GridStack | 自定义 |
|------|--------|-----------|--------|
| 自由布局 | ✅ | ❌ | 📝 |
| 网格布局 | ❌ | ✅ | 📝 |
| 拖拽调整 | ✅ | ✅ | 📝 |
| 响应式 | ⚠️ | ✅ | 📝 |
| 自动排列 | ❌ | ✅ | 📝 |
| 碰撞检测 | ⚠️ | ✅ | 📝 |
| 性能 | 高 | 中 | 📝 |
| 复杂度 | 低 | 中 | 📝 |

**图例**: ✅ 支持 | ❌ 不支持 | ⚠️ 部分支持 | 📝 取决于实现

## 🛠️ 开发工具

### 调试工具
```typescript
// 开发环境下可在控制台使用
window.__debugRenderer = {
  getNodes: () => [...],
  getState: () => {...},
  selectNode: (id) => {...},
  clearSelection: () => {...}
}
```

### 性能监控
```typescript
// 内置性能监控
const monitor = usePerformanceMonitor()
monitor.start('layout-update')
// ... 操作
monitor.end('layout-update')
```

## 🔧 配置示例

### Canvas 渲染器配置
```typescript
const canvasConfig = {
  showGrid: true,
  backgroundColor: '#f5f5f5',
  snapToGrid: true,
  gridSize: 20
}
```

### GridStack 渲染器配置
```typescript
const gridstackConfig = {
  showGrid: true,
  colNum: 12,
  rowHeight: 100,
  margin: [10, 10],
  responsive: true
}
```

## 🧪 测试指南

### 单元测试
```typescript
import { mount } from '@vue/test-utils'
import { CanvasRenderer } from '../'

describe('CanvasRenderer', () => {
  it('should render nodes correctly', () => {
    const wrapper = mount(CanvasRenderer, {
      props: { readonly: false }
    })
    expect(wrapper.find('.canvas').exists()).toBe(true)
  })
})
```

### 集成测试
```typescript
// 测试渲染器之间的切换
const testRendererSwitch = async () => {
  const canvas = mount(CanvasRenderer)
  await canvas.vm.$nextTick()
  
  const gridstack = mount(GridstackRenderer, {
    props: { nodes: canvas.vm.nodes }
  })
  
  expect(gridstack.vm.nodes).toEqual(canvas.vm.nodes)
}
```

## 🤝 贡献指南

### 添加新渲染器
1. 在对应目录创建渲染器文件
2. 实现必需的接口
3. 添加类型定义
4. 编写单元测试
5. 更新文档
6. 在 `index.ts` 中导出

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 Vue 3 组合式 API 规范
- 添加详细的 JSDoc 注释
- 确保 ESLint 检查通过

### 提交要求
- 功能完整且经过测试
- 包含使用示例
- 更新相关文档
- 通过代码审查

---

## 📚 相关资源

- [Vue 3 官方文档](https://v3.vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Naive UI 组件库](https://www.naiveui.com/)
- [GridLayoutPlus 文档](https://github.com/1715173329/grid-layout-plus)

---

**开始构建您的渲染器吧！** 🎨

如需帮助，请查看详细文档或在项目中提交 Issue。