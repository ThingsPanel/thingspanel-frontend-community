# Card 2.1 属性暴露系统（修正版）

## 系统概述

属性暴露系统是 Card 2.1 组件架构的核心功能，它让组件能够声明哪些属性可以被外部监听和访问，从而实现组件间的属性绑定和交互配置。该系统支持从 `settingConfig` 自动注册可绑定属性，大大简化了组件开发流程。

## 核心概念

### 可监听属性 (ListenableProperty)

可监听属性是组件向外暴露的、可以被其他组件或系统监听和绑定的属性：

```typescript
export interface ListenableProperty {
  name: string                    // 属性名称（用于程序访问）
  label: string                   // 显示标签（用于用户界面）
  description?: string           // 属性描述
  type: PropertyDataType        // 数据类型
  defaultValue?: any           // 默认值
  isCore?: boolean            // 是否是核心属性（优先显示）
  group?: string             // 属性分组
  example?: any             // 示例值
  enum?: { label: string; value: any }[]  // 枚举值选项
}
```

### 支持的属性数据类型

```typescript
export type PropertyDataType =
  | 'string'   // 字符串
  | 'number'   // 数字
  | 'boolean'  // 布尔值
  | 'object'   // 对象
  | 'array'    // 数组
  | 'date'     // 日期
  | 'color'    // 颜色
  | 'url'      // URL链接
```

## 属性暴露注册表

### 全局注册表单例

系统使用全局单例 `PropertyExposureRegistry` 管理所有组件的属性暴露配置：

```typescript
import { propertyExposureRegistry } from '@/card2.1/core/property-exposure'

// 获取组件的可监听属性
const properties = propertyExposureRegistry.getListenableProperties('my-widget')

// 获取组件的完整暴露配置
const exposure = propertyExposureRegistry.getComponentExposure('my-widget')

// 获取所有已注册的组件类型
const componentTypes = propertyExposureRegistry.getAllComponentTypes()

// 获取属性的显示信息
const displayInfo = propertyExposureRegistry.getPropertyDisplayInfo('my-widget', 'title')
```

### 按分组获取属性

```typescript
// 获取按分组整理的属性
const groupedProperties = propertyExposureRegistry.getPropertiesByGroup('my-widget')
// 返回结果示例:
// {
//   "基础属性": [...],
//   "样式属性": [...],
//   "数据属性": [...]
// }
```

## 自动注册机制

### 从 settingConfig 自动注册

最重要的功能是从组件的 `settingConfig` 自动注册可绑定属性：

```typescript
import { autoRegisterFromSettingConfig } from '@/card2.1/core/property-exposure'
import type { ComponentSettingConfig } from '@/card2.1/types/setting-config'

// 定义 settingConfig
const myWidgetSettingConfig: ComponentSettingConfig = {
  componentType: 'my-widget',
  settings: [
    {
      field: 'customize.title',
      label: '标题',
      component: 'input',
      defaultValue: '默认标题'
    },
    {
      field: 'customize.themeColor',
      label: '主题颜色',
      component: 'color-picker',
      defaultValue: '#1890ff'
    }
  ]
}

// 自动注册为可监听属性
autoRegisterFromSettingConfig(myWidgetSettingConfig)

// 这将自动创建以下可监听属性:
// - customize.title (string类型)
// - customize.themeColor (color类型)
```

### 增强的自动注册

`enhancedAutoRegister` 函数结合 `settingConfig` 和自动检测机制：

```typescript
import { enhancedAutoRegister } from '@/card2.1/core/property-exposure'

// 在组件注册时调用
enhancedAutoRegister(
  componentType,      // 组件类型
  componentDefinition, // 组件定义
  settingConfig       // 设置配置（可选）
)

// 该函数会:
// 1. 从 settingConfig 提取设置属性
// 2. 自动检测 componentDefinition.config 中的属性
// 3. 自动检测组件 props 中的属性
// 4. 添加通用属性（title, visibility 等）
// 5. 合并所有属性并注册
```

### 自动属性检测

系统能智能检测组件的可暴露属性：

```typescript
import { autoDetectComponentProperties } from '@/card2.1/core/property-exposure'

const detectedProperties = autoDetectComponentProperties(componentType, componentDefinition)

// 检测来源:
// 1. componentDefinition.config 中的属性
// 2. 组件的 Vue props 定义
// 3. 通用属性模板
```

## 在组件开发中的使用

### 方式一：自动注册（推荐）

在 `ComponentRegistry.registerComponent` 时自动注册：

```typescript
// src/card2.1/components/my-widget/definition.ts
import { ComponentRegistry } from '@/card2.1/core/component-registry'
import { myWidgetDefinition } from './definition'
import { myWidgetSettingConfig } from './settingConfig'

// 注册组件时会自动调用 enhancedAutoRegister
ComponentRegistry.registerComponent(myWidgetDefinition, myWidgetSettingConfig)
```

### 方式二：手动注册

```typescript
// src/card2.1/components/my-widget/index.ts
import { propertyExposureRegistry, createProperty } from '@/card2.1/core/property-exposure'

// 手动定义可监听属性
const listenableProperties = [
  createProperty('title', '标题', 'string', {
    description: '组件标题文字',
    isCore: true,
    group: '内容',
    example: '设备状态'
  }),
  createProperty('value', '数值', 'number', {
    description: '显示的数值',
    isCore: true,
    group: '数据',
    example: 25.6
  }),
  createProperty('backgroundColor', '背景色', 'color', {
    description: '组件背景颜色',
    group: '样式',
    example: '#ffffff'
  })
]

// 注册属性暴露配置
propertyExposureRegistry.register({
  componentType: 'my-widget',
  componentName: '我的组件',
  listenableProperties,
  version: '1.0.0'
})
```

### 方式三：装饰器方式

```typescript
// src/card2.1/components/my-widget/index.ts
import { exposeProperties, createProperty } from '@/card2.1/core/property-exposure'

@exposeProperties({
  componentType: 'my-widget',
  componentName: '我的组件',
  listenableProperties: [
    createProperty('title', '标题', 'string'),
    createProperty('value', '数值', 'number')
  ]
})
class MyWidget {
  // 组件实现
}
```

## 常用属性模板

系统提供了预定义的通用属性模板：

```typescript
import { CommonProperties } from '@/card2.1/core/property-exposure'

// 使用预定义属性
const myProperties = [
  CommonProperties.title,        // 标题属性
  CommonProperties.content,      // 内容属性
  CommonProperties.value,        // 数值属性
  CommonProperties.status,       // 状态属性
  CommonProperties.isOnline,     // 在线状态属性
  CommonProperties.backgroundColor, // 背景色属性
  CommonProperties.textColor,    // 文字颜色属性
  CommonProperties.visibility,   // 可见性属性
  CommonProperties.timestamp,    // 时间戳属性
]
```

### 预定义属性列表

- **内容属性**：`title`、`content`
- **数据属性**：`value`、`count`
- **状态属性**：`status`、`isOnline`
- **样式属性**：`backgroundColor`、`textColor`、`visibility`
- **时间属性**：`timestamp`、`lastUpdateTime`

## 组件属性树结构

用于在配置界面中展示可绑定的组件属性：

```typescript
import { getComponentPropertyTree } from '@/card2.1/core/property-exposure'

// 获取组件属性树结构
const propertyTree = getComponentPropertyTree()

// 返回的树结构:
// [
//   {
//     key: "my-widget",
//     label: "我的组件",
//     type: "component",
//     children: [
//       {
//         key: "my-widget.title",
//         label: "标题 (string)",
//         type: "property",
//         componentId: "my-widget",
//         propertyName: "title",
//         propertyConfig: { /* 属性配置 */ },
//         isLeaf: true
//       }
//     ],
//     isLeaf: false
//   }
// ]
```

## 属性类型推断

系统提供智能的属性类型推断功能：

### 从值推断类型

```typescript
import { inferPropertyTypeFromValue } from '@/card2.1/core/property-exposure'

const type1 = inferPropertyTypeFromValue('#ff0000')     // -> 'color'
const type2 = inferPropertyTypeFromValue('https://...')  // -> 'url'
const type3 = inferPropertyTypeFromValue(true)          // -> 'boolean'
const type4 = inferPropertyTypeFromValue(42)            // -> 'number'
const type5 = inferPropertyTypeFromValue([1, 2, 3])     // -> 'array'
```

### 从 settingConfig 推断类型

```typescript
import { inferPropertyDataType } from '@/card2.1/types/setting-config'

const settingItem = {
  field: 'customize.color',
  label: '颜色',
  component: 'color-picker',
  defaultValue: '#1890ff'
}

const dataType = inferPropertyDataType(settingItem) // -> 'color'
```

## 在 HTTP 配置中的应用

属性暴露系统与 HTTP 配置紧密结合，支持参数绑定：

```typescript
// HTTP 配置中使用属性绑定
const httpConfig = {
  url: 'https://api.example.com/data',
  method: 'GET',
  params: {
    // 绑定到设备选择器组件的选中设备ID
    deviceId: 'device-selector-123.customize.selectedDeviceId',
    // 绑定到时间选择器组件的开始时间
    startTime: 'time-picker-456.customize.startTime'
  }
}

// 当被绑定的属性值改变时，HTTP 参数会自动更新并重新请求
```

## 调试和监控

### 获取注册信息

```typescript
// 获取所有已注册的组件类型
const componentTypes = propertyExposureRegistry.getAllComponentTypes()
console.log('已注册组件:', componentTypes)

// 获取特定组件的属性
const properties = propertyExposureRegistry.getListenableProperties('my-widget')
console.log('可监听属性:', properties)

// 获取属性显示信息
const displayInfo = propertyExposureRegistry.getPropertyDisplayInfo('my-widget', 'title')
console.log('属性显示信息:', displayInfo)
```

### 开发时日志

系统在自动注册时会输出详细的调试日志：

```
🎯 [PropertyExposure] 自动注册属性暴露配置 {
  componentType: 'my-widget',
  propertiesCount: 5,
  properties: ['title', 'value', 'themeColor', 'backgroundColor', 'visibility']
}

🎯 [EnhancedAutoRegister] 增强属性注册完成 {
  componentType: 'my-widget',
  totalProperties: 8,
  settingProperties: 3,
  detectedProperties: 2,
  properties: [
    { name: 'title', group: '设置属性' },
    { name: 'themeColor', group: '设置属性' },
    { name: 'backgroundColor', group: '样式' }
  ]
}
```

## 最佳实践

### 1. 优先使用自动注册

```typescript
// ✅ 推荐：使用 ComponentRegistry.registerComponent 自动注册
ComponentRegistry.registerComponent(definition, settingConfig)

// ❌ 不推荐：手动管理属性暴露
propertyExposureRegistry.register(manualConfig)
```

### 2. 合理设置属性分组

```typescript
const properties = [
  createProperty('title', '标题', 'string', { 
    group: '内容',     // 内容相关
    isCore: true 
  }),
  createProperty('themeColor', '主题色', 'color', { 
    group: '样式'      // 样式相关
  }),
  createProperty('deviceId', '设备ID', 'string', { 
    group: '数据',     // 数据相关
    isCore: true 
  })
]
```

### 3. 标记核心属性

```typescript
const properties = [
  createProperty('title', '标题', 'string', { 
    isCore: true      // 核心属性，优先显示
  }),
  createProperty('borderRadius', '圆角', 'string', { 
    isCore: false     // 非核心属性，次要显示
  })
]
```

### 4. 提供有意义的示例值

```typescript
const properties = [
  createProperty('temperature', '温度', 'number', {
    example: 25.6,
    description: '当前环境温度，单位摄氏度'
  }),
  createProperty('status', '设备状态', 'string', {
    enum: [
      { label: '在线', value: 'online' },
      { label: '离线', value: 'offline' },
      { label: '故障', value: 'error' }
    ],
    example: 'online'
  })
]
```

## 与交互系统的集成

属性暴露系统与交互系统紧密配合，实现属性绑定和响应式更新：

```typescript
// 交互配置中使用暴露的属性
const interactionConfig = {
  event: 'dataChange',
  watchedProperty: 'customize.value',  // 监听暴露的属性
  condition: {
    operator: 'greaterThan',
    value: 100
  },
  responses: [{
    action: 'modify',
    modifyConfig: {
      targetComponentId: 'indicator-123',
      targetProperty: 'customize.backgroundColor',  // 修改目标组件的暴露属性
      updateValue: '#ff0000'
    }
  }]
}
```

## 总结

Card 2.1 属性暴露系统提供了完整的组件属性管理解决方案：

1. **自动化**：从 `settingConfig` 自动注册，减少手动配置
2. **类型安全**：完整的 TypeScript 类型支持
3. **智能推断**：自动推断属性类型和特征
4. **灵活配置**：支持分组、枚举、示例值等丰富配置
5. **无缝集成**：与交互系统、HTTP 配置等深度集成
6. **调试友好**：详细的日志和监控信息

通过合理使用属性暴露系统，可以构建出功能强大、易于配置的组件生态系统。