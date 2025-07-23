# PanelV2 插件开发指南

## 概述

PanelV2 插件系统是一个强大而灵活的扩展机制，允许开发者为 PanelV2 看板系统创建自定义的卡片组件、配置器、工具栏动作等。本指南将帮助您了解如何开发和发布 PanelV2 插件。

## 插件架构

### 核心概念

1. **插件 (Plugin)**: 一个包含元数据、组件和生命周期钩子的对象
2. **插件管理器 (PluginManager)**: 负责插件的加载、安装、激活和管理
3. **插件上下文 (PluginContext)**: 插件运行时的 API 接口
4. **事件总线 (EventBus)**: 插件间通信机制

### 插件结构

```typescript
interface Plugin {
  meta: PluginMeta              // 插件元信息
  cards?: Record<string, Component>        // 卡片组件
  inspectors?: Record<string, Component>   // 配置器组件
  draggableItems?: DraggableItem[]         // 可拖拽项
  toolbarActions?: ToolbarAction[]         // 工具栏动作
  settings?: Record<string, ConfigItem<any>> // 插件设置
  
  // 生命周期钩子
  onInstall?: (context: PluginContext) => void | Promise<void>
  onUninstall?: (context: PluginContext) => void | Promise<void>
  onActivate?: (context: PluginContext) => void | Promise<void>
  onDeactivate?: (context: PluginContext) => void | Promise<void>
}
```

## 开发您的第一个插件

### 1. 创建插件文件

创建一个新的 TypeScript 文件，例如 `MyPlugin.ts`：

```typescript
// MyPlugin.ts
import { defineComponent, h } from 'vue'
import type { Plugin } from '@/components/panelv2/plugins'

// 定义卡片组件
const WeatherCard = defineComponent({
  name: 'WeatherCard',
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    return () => h('div', {
      style: {
        padding: '20px',
        background: '#f0f8ff',
        borderRadius: '8px',
        textAlign: 'center'
      }
    }, [
      h('h3', props.config.city?.value || '未知城市'),
      h('div', { 
        style: { fontSize: '24px', margin: '10px 0' } 
      }, `${props.config.temperature?.value || '--'}°C`),
      h('p', props.config.description?.value || '暂无描述')
    ])
  }
})

// 插件定义
export const MyWeatherPlugin: Plugin = {
  meta: {
    name: 'weather-plugin',
    version: '1.0.0',
    description: '天气信息显示插件',
    author: '您的名字'
  },

  cards: {
    'weather-card': WeatherCard
  },

  draggableItems: [
    {
      type: 'weather-card',
      label: '天气卡片',
      icon: 'fa fa-cloud',
      defaultData: {
        type: 'weather-plugin:weather-card',
        config: {
          city: { value: '北京', inspector: 'text-input' },
          temperature: { value: '22', inspector: 'number-input' },
          description: { value: '晴天', inspector: 'text-input' }
        }
      }
    }
  ],

  toolbarActions: [
    {
      id: 'refresh-weather',
      icon: 'fa fa-sync',
      tooltip: '刷新天气数据',
      action: (store) => {
        console.log('刷新天气数据')
        // 这里可以调用天气 API
      }
    }
  ],

  async onInstall(context) {
    console.log('天气插件已安装')
  },

  async onActivate(context) {
    console.log('天气插件已激活')
    
    // 可以在这里初始化定时器、API 连接等
    context.emit('weather-activated', { timestamp: Date.now() })
  }
}
```

### 2. 使用插件

在您的应用中使用插件：

```vue
<template>
  <PanelV2 :plugins="[MyWeatherPlugin]">
    <template #card="{ cardData }">
      <component 
        :is="getCardComponent(cardData.type)" 
        :config="cardData.config"
      />
    </template>
  </PanelV2>
</template>

<script setup>
import PanelV2 from '@/components/panelv2/PanelV2.vue'
import { MyWeatherPlugin } from './MyPlugin'

const getCardComponent = (type) => {
  // 组件解析逻辑
}
</script>
```

## 高级功能

### 插件间通信

插件可以通过事件系统进行通信：

```typescript
export const PluginA: Plugin = {
  // ...
  async onActivate(context) {
    // 发送事件
    context.emit('data-updated', { value: 100 })
    
    // 监听其他插件的事件
    context.on('external-event', (data) => {
      console.log('收到外部事件:', data)
    })
  }
}

export const PluginB: Plugin = {
  // ...
  async onActivate(context) {
    // 监听 PluginA 的事件
    context.on('pluginA:data-updated', (data) => {
      console.log('PluginA 数据更新:', data)
    })
  }
}
```

### 配置器组件

创建自定义配置器：

```typescript
const NumberInputInspector = defineComponent({
  name: 'NumberInputInspector',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div class="number-input-inspector">
      <input 
        type="number" 
        :value="modelValue"
        @input="$emit('update:modelValue', Number($event.target.value))"
        class="form-control"
      />
    </div>
  `
})

export const MyPlugin: Plugin = {
  // ...
  inspectors: {
    'number-input': NumberInputInspector
  }
}
```

### 异步组件加载

对于大型插件，可以使用异步组件：

```typescript
import { defineAsyncComponent } from 'vue'

export const MyPlugin: Plugin = {
  // ...
  cards: {
    'heavy-chart': defineAsyncComponent(() => 
      import('./components/HeavyChartCard.vue')
    )
  }
}
```

### 插件设置

插件可以有自己的配置：

```typescript
export const MyPlugin: Plugin = {
  // ...
  settings: {
    apiKey: { 
      value: '', 
      inspector: 'text-input',
      label: 'API密钥',
      description: '用于访问天气服务的API密钥'
    },
    updateInterval: { 
      value: 60000, 
      inspector: 'number-input',
      label: '更新间隔(ms)',
      description: '数据更新间隔时间'
    }
  },

  async onActivate(context) {
    const store = context.getStore()
    const settings = this.settings
    
    // 使用设置
    const apiKey = settings.apiKey.value
    const interval = settings.updateInterval.value
    
    // 启动定时更新
    setInterval(() => {
      this.updateWeatherData(apiKey)
    }, interval)
  }
}
```

## 插件生命周期

### 生命周期钩子

1. **onInstall**: 插件安装时调用
2. **onUninstall**: 插件卸载时调用
3. **onActivate**: 插件激活时调用
4. **onDeactivate**: 插件停用时调用

```typescript
export const MyPlugin: Plugin = {
  // ...
  async onInstall(context) {
    // 安装时的初始化工作
    console.log('插件安装中...')
    
    // 可以在这里创建数据库表、检查依赖等
    await this.checkDependencies()
  },

  async onUninstall(context) {
    // 卸载时的清理工作
    console.log('插件卸载中...')
    
    // 清理资源、删除数据等
    await this.cleanup()
  },

  async onActivate(context) {
    // 激活时启动服务
    console.log('插件激活中...')
    
    this.startServices()
  },

  async onDeactivate(context) {
    // 停用时停止服务
    console.log('插件停用中...')
    
    this.stopServices()
  }
}
```

## 插件加载方式

### 1. 直接导入

```typescript
import { MyPlugin } from './plugins/MyPlugin'

const plugins = [MyPlugin]
```

### 2. 动态加载

```typescript
// 从 URL 加载
await pluginManager.loadPlugin('https://example.com/my-plugin.js')

// 从本地文件加载
await pluginManager.loadPlugin('./plugins/my-plugin.js')
```

### 3. JSON 配置加载

创建插件配置文件 `my-plugin.json`：

```json
{
  "meta": {
    "name": "my-plugin",
    "version": "1.0.0",
    "description": "我的插件"
  },
  "cards": {
    "my-card": "./components/MyCard.vue"
  },
  "draggableItems": [
    {
      "type": "my-card",
      "label": "我的卡片",
      "icon": "fa fa-star",
      "defaultData": {
        "type": "my-plugin:my-card",
        "config": {
          "title": { "value": "默认标题", "inspector": "text-input" }
        }
      }
    }
  ]
}
```

然后加载：

```typescript
await pluginManager.loadPlugin('./plugins/my-plugin.json')
```

## 最佳实践

### 1. 错误处理

```typescript
export const MyPlugin: Plugin = {
  // ...
  async onActivate(context) {
    try {
      await this.initializeService()
    } catch (error) {
      console.error('插件激活失败:', error)
      // 可以通过事件通知用户
      context.emit('error', { 
        code: 'ACTIVATION_FAILED',
        message: error.message 
      })
    }
  }
}
```

### 2. 资源清理

```typescript
export const MyPlugin: Plugin = {
  private timers: Set<number> = new Set()
  private listeners: Function[] = []

  async onActivate(context) {
    // 创建定时器
    const timer = setInterval(() => {
      // 定时任务
    }, 1000)
    this.timers.add(timer)

    // 添加事件监听
    const listener = (data) => { /* 处理事件 */ }
    context.on('some-event', listener)
    this.listeners.push(listener)
  },

  async onDeactivate(context) {
    // 清理定时器
    this.timers.forEach(timer => clearInterval(timer))
    this.timers.clear()

    // 清理事件监听
    this.listeners.forEach(listener => {
      context.off('some-event', listener)
    })
    this.listeners.length = 0
  }
}
```

### 3. 类型安全

使用 TypeScript 确保类型安全：

```typescript
interface WeatherConfig {
  city: ConfigItem<string>
  temperature: ConfigItem<number>
  description: ConfigItem<string>
}

const WeatherCard = defineComponent<{ config: WeatherConfig }>({
  // 组件实现
})
```

### 4. 版本兼容性

```typescript
export const MyPlugin: Plugin = {
  meta: {
    name: 'my-plugin',
    version: '1.2.0',
    dependencies: ['core-plugin@^1.0.0']
  },
  // ...
}
```

## 调试和测试

### 1. 开发模式

```typescript
const pluginManager = new PluginManager({
  logLevel: 'debug',  // 启用详细日志
  allowDuplicates: true  // 允许重复加载（开发时有用）
})
```

### 2. 插件事件监听

```typescript
pluginManager.on('plugin:error', (event) => {
  console.error('插件错误:', event)
})

pluginManager.on('plugin:after-install', (event) => {
  console.log('插件安装完成:', event.plugin.meta.name)
})
```

### 3. 单元测试

```typescript
import { describe, it, expect } from 'vitest'
import { MyPlugin } from './MyPlugin'

describe('MyPlugin', () => {
  it('should have correct meta information', () => {
    expect(MyPlugin.meta.name).toBe('my-plugin')
    expect(MyPlugin.meta.version).toBe('1.0.0')
  })

  it('should provide weather card', () => {
    expect(MyPlugin.cards).toHaveProperty('weather-card')
  })
})
```

## 发布插件

### 1. 构建插件

```bash
# 使用 Vite 构建
npm run build

# 或使用 Rollup
rollup -c rollup.config.js
```

### 2. 发布到 NPM

```bash
npm publish
```

### 3. 插件市场

将来我们会提供插件市场，您可以在那里发布和分发插件。

## 示例插件

查看 `src/components/panelv2/plugins/examples/` 目录中的示例插件，了解更多实现细节。

## 故障排除

### 常见问题

1. **插件无法加载**
   - 检查插件格式是否正确
   - 确认所有依赖项都已安装
   - 查看控制台错误信息

2. **组件无法渲染**
   - 确认组件已正确注册
   - 检查组件 props 是否匹配
   - 验证配置结构

3. **事件通信失败**
   - 确认事件名称正确
   - 检查监听器是否已正确注册
   - 验证插件是否已激活

### 获取帮助

- 查看 [架构文档](./ARCHITECTURE.md)
- 提交 Issue 到项目仓库
- 参与社区讨论

---

通过本指南，您应该能够开发出功能丰富的 PanelV2 插件。插件系统的设计目标是提供最大的灵活性，同时保持简单易用。祝您开发愉快！