# PanelV2 插件系统

PanelV2 插件系统是一个强大而灵活的扩展机制，允许开发者为 PanelV2 看板创建自定义组件和功能。

## 快速开始

### 基本使用

```vue
<template>
  <PanelV2 
    :plugins="plugins"
    :enablePluginSystem="true"
  >
    <template #card="{ cardData }">
      <component 
        :is="getCardComponent(cardData.type)" 
        :config="cardData.config"
      />
    </template>
  </PanelV2>
</template>

<script setup>
import PanelV2 from './PanelV2.vue'
import { ChartPlugin } from './plugins'

const plugins = [ChartPlugin]

const getCardComponent = (type) => {
  // 组件解析逻辑
}
</script>
```

### 访问插件管理器

```vue
<script setup>
import { usePluginManager } from './plugins'

const { 
  installedPlugins,
  installPlugin,
  uninstallPlugin,
  activatePlugin,
  deactivatePlugin 
} = usePluginManager()

// 动态安装插件
const installNewPlugin = async () => {
  await installPlugin(MyCustomPlugin)
}
</script>
```

## 核心特性

- 🔌 **动态插件加载**: 支持运行时安装、卸载插件
- 🎨 **自定义组件**: 注册卡片组件和配置器
- 🛠️ **工具栏扩展**: 添加自定义工具栏动作
- 📡 **插件间通信**: 基于事件的通信机制
- 🔄 **生命周期管理**: 完整的插件生命周期钩子
- ⚙️ **配置系统**: 插件配置和用户界面
- 📦 **多种加载方式**: 支持 ES模块、JSON配置等

## 目录结构

```
plugins/
├── index.ts                    # 插件系统入口
├── types.ts                    # 类型定义
├── PluginManager.ts            # 插件管理器
├── EventBus.ts                 # 事件总线
├── PluginConfig.vue            # 插件配置组件
├── composables/
│   └── usePlugin.ts            # 组合式API
├── loaders/
│   ├── ModuleLoader.ts         # ES模块加载器
│   └── JsonLoader.ts           # JSON配置加载器
├── examples/
│   └── ChartPlugin.ts          # 示例插件
└── demo/
    └── PluginDemo.vue          # 演示页面
```

## 插件开发

### 创建简单插件

```typescript
import { defineComponent, h } from 'vue'
import type { Plugin } from './types'

const MyCard = defineComponent({
  name: 'MyCard',
  props: { config: Object },
  setup(props) {
    return () => h('div', {
      style: { padding: '20px', background: '#f0f0f0' }
    }, [
      h('h3', props.config.title?.value || '默认标题'),
      h('p', props.config.content?.value || '默认内容')
    ])
  }
})

export const MyPlugin: Plugin = {
  meta: {
    name: 'my-plugin',
    version: '1.0.0',
    description: '我的第一个插件'
  },
  
  cards: {
    'my-card': MyCard
  },
  
  draggableItems: [{
    type: 'my-card',
    label: '我的卡片',
    icon: 'fa fa-star',
    defaultData: {
      type: 'my-plugin:my-card',
      config: {
        title: { value: '标题', inspector: 'text-input' },
        content: { value: '内容', inspector: 'textarea' }
      }
    }
  }],
  
  async onActivate(context) {
    console.log('插件激活!')
  }
}
```

### 使用插件

```typescript
import { MyPlugin } from './MyPlugin'

// 在 PanelV2 中使用
const plugins = [MyPlugin]
```

## API 文档

### PluginManager

插件管理器提供以下主要方法：

- `install(plugin)` - 安装插件
- `uninstall(name)` - 卸载插件
- `activate(name)` - 激活插件
- `deactivate(name)` - 停用插件
- `loadPlugin(source)` - 从源加载插件

### Plugin 接口

```typescript
interface Plugin {
  meta: PluginMeta                          // 插件元信息
  cards?: Record<string, Component>         // 卡片组件
  inspectors?: Record<string, Component>    // 配置器组件
  draggableItems?: DraggableItem[]          // 可拖拽项
  toolbarActions?: ToolbarAction[]          // 工具栏动作
  settings?: Record<string, ConfigItem<any>> // 插件设置
  
  // 生命周期钩子
  onInstall?: (context: PluginContext) => void | Promise<void>
  onUninstall?: (context: PluginContext) => void | Promise<void>
  onActivate?: (context: PluginContext) => void | Promise<void>
  onDeactivate?: (context: PluginContext) => void | Promise<void>
}
```

### PluginContext

插件上下文提供以下 API：

- `registerCard(type, component)` - 注册卡片组件
- `registerInspector(type, component)` - 注册配置器
- `registerDraggableItem(item)` - 注册拖拽项
- `registerToolbarAction(action)` - 注册工具栏动作
- `getStore()` - 获取状态管理器
- `emit(event, data)` - 发送事件
- `on(event, handler)` - 监听事件
- `off(event, handler)` - 取消监听

## 示例插件

### ChartPlugin

提供数字图表和饼图组件：

```typescript
import { ChartPlugin } from './plugins'

// 包含两个卡片类型：
// - number-chart: 数字显示卡片
// - pie-chart: 饼图卡片
```

### 自定义天气插件

```typescript
export const WeatherPlugin: Plugin = {
  meta: {
    name: 'weather-plugin',
    version: '1.0.0',
    description: '天气信息显示插件'
  },
  
  cards: {
    'weather-card': WeatherCard
  },
  
  draggableItems: [{
    type: 'weather-card',
    label: '天气卡片',
    icon: 'fa fa-cloud',
    defaultData: {
      type: 'weather-plugin:weather-card',
      config: {
        city: { value: '北京', inspector: 'text-input' },
        temperature: { value: '22', inspector: 'number-input' }
      }
    }
  }],
  
  async onActivate(context) {
    // 启动天气数据获取
    this.startWeatherService()
  }
}
```

## 高级功能

### 插件间通信

```typescript
// 插件A发送事件
context.emit('data-changed', { value: 100 })

// 插件B监听事件
context.on('pluginA:data-changed', (data) => {
  console.log('收到数据更新:', data)
})
```

### 动态加载

```typescript
// 从URL加载
await pluginManager.loadPlugin('https://example.com/plugin.js')

// 从JSON配置加载
await pluginManager.loadPlugin('./config/plugin.json')
```

### 插件配置

```typescript
export const MyPlugin: Plugin = {
  settings: {
    apiKey: { 
      value: '', 
      inspector: 'text-input',
      label: 'API密钥'
    },
    refreshInterval: { 
      value: 60000, 
      inspector: 'number-input',
      label: '刷新间隔(ms)'
    }
  }
}
```

## 演示和测试

### 查看演示

运行项目并访问 PanelV2 演示页面，查看插件系统的实际效果。

### 插件管理界面

演示中包含一个完整的插件管理界面，支持：

- 查看已安装插件
- 激活/停用插件
- 卸载插件
- 从URL或本地文件安装新插件

## 开发指南

详细的插件开发指南请参考：[插件开发文档](./PLUGIN_DEVELOPMENT.md)

## 最佳实践

1. **遵循命名约定**: 使用清晰的插件和组件名称
2. **处理错误**: 在生命周期钩子中妥善处理异常
3. **清理资源**: 在插件停用时清理定时器、事件监听器等
4. **版本兼容**: 明确插件的依赖关系
5. **文档完善**: 为插件提供详细的使用说明

## 故障排除

- 插件无法加载：检查插件格式和依赖
- 组件不显示：确认组件已正确注册和解析
- 事件不生效：验证事件名称和监听器注册

## 贡献

欢迎为 PanelV2 插件系统贡献代码、文档或示例插件！

---

更多信息请参考完整的开发文档和 API 参考。