# 组件定义详解 - definition.ts 核心配置

`definition.ts` 是Card 2.1组件的核心配置文件，它定义了组件的所有元数据、行为和集成方式。

## 🎯 文件作用

`definition.ts` 文件告诉Card 2.1系统：
- 这个组件是什么（基础信息）
- 如何显示和分类（UI集成）
- 支持哪些功能（能力声明）
- 如何配置和交互（系统集成）

## 📋 完整结构解析

### 1. 文件导入部分

```typescript
import type { ComponentDefinition } from '../../../core/types'
import MyComponentVue from './index.vue'           // Vue组件实现
import MyComponentSetting from './setting.vue'    // 配置面板
import { 
  myComponentSettingConfig,                        // 配置项定义
  customConfig, 
  type MyComponentConfig 
} from './settingConfig'
```

### 2. 基础信息配置

```typescript
const definition: ComponentDefinition = {
  // ============ 基础标识 ============
  type: 'my-component',                    // 🔑 组件唯一标识符（必填）
  name: '我的组件',                        // 显示名称
  description: '组件功能描述，用于帮助用户理解', // 详细描述
  version: '1.0.0',                       // 组件版本
  author: 'ThingsPanel',                  // 作者信息
  
  // ============ 分类与显示 ============
  category: '数据展示',                    // 功能分类
  mainCategory: '测试',                   // 🔑 主分类（对应文件夹名）
  subCategory: '演示组件',                 // 子分类（可选）
  
  // SVG图标字符串（显示在组件库中）
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
  </svg>`,
}
```

**🚨 关键注意事项：**
- `type`: 必须唯一，建议使用kebab-case格式
- `mainCategory`: 必须与文件夹路径匹配
- `icon`: 使用SVG字符串，确保在不同主题下都清晰

### 3. 组件实现引用

```typescript
{
  // ============ 组件实现 ============
  component: MyComponentVue,              // 🔑 Vue组件实现
  configComponent: MyComponentSetting,   // 🔑 配置面板组件
  
  // ============ 默认配置 ============
  defaultConfig: customConfig,           // 默认配置对象
  config: {                             // 结构化配置
    type: 'my-component',               // 重复type用于验证
    root: {
      transform: {                      // 变换配置
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig             // 自定义配置
  },
}
```

### 4. 布局系统配置

```typescript
{
  // ============ 布局配置 ============
  defaultLayout: {
    canvas: {                           // Canvas渲染器布局
      width: 300,                       // 默认宽度（像素）
      height: 200,                      // 默认高度（像素）
      x: 0,                            // 初始X坐标
      y: 0                             // 初始Y坐标
    },
    gridstack: {                        // Gridstack渲染器布局
      w: 4,                            // 网格宽度（格数）
      h: 3,                            // 网格高度（格数）
      x: 0,                            // 初始列位置
      y: 0,                            // 初始行位置
      minW: 2,                         // 最小宽度
      minH: 2,                         // 最小高度
      maxW: 8,                         // 最大宽度
      maxH: 6                          // 最大高度
    }
  },
  
  layout: {                             // 布局约束
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 8, height: 6 },
    resizable: true                     // 是否可调整大小
  },
}
```

**📐 布局配置说明：**
- Canvas: 使用像素单位，适合自由布局
- Gridstack: 使用网格单位，一般1格 ≈ 80-100像素
- 合理设置min/max约束，确保组件在不同尺寸下都能正常显示

### 5. 权限与特性

```typescript
{
  // ============ 权限控制 ============
  permission: '不限',                    // 使用权限：'不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'
  
  // ============ 标签系统 ============
  tags: ['数据', '图表', '实时', '监控'],  // 搜索标签
  
  // ============ 特性声明 ============
  features: {
    realtime: true,                     // 是否支持实时数据
    dataBinding: true,                  // 是否支持数据绑定
    themeable: true,                    // 是否支持主题定制
    responsive: true,                   // 是否支持响应式
    configurable: true                  // 是否支持配置
  },
}
```

### 6. 数据源配置（多数据源组件）

```typescript
{
  // ============ 数据源需求 ============
  dataSources: [
    {
      key: 'dataSource1',               // 🔑 数据源标识
      name: '主数据源',                  // 显示名称
      description: '主要的数据输入源',    // 描述信息
      supportedTypes: ['static', 'api', 'websocket'], // 支持的数据源类型
      fieldMappings: {                  // 字段映射规则
        'value': {
          targetField: 'primaryValue',  // 目标字段名
          type: 'value',               // 数据类型：'value' | 'object' | 'array'
          required: true,              // 是否必填
          defaultValue: 0              // 默认值
        },
        'label': {
          targetField: 'primaryLabel',
          type: 'value',
          required: false,
          defaultValue: '主数据'
        }
      },
      required: false                   // 数据源是否必填
    },
    // 可以定义多个数据源...
  ],
}
```

**🔌 数据源配置要点：**
- 每个`dataSources`数组项对应一个数据源插槽
- `fieldMappings`定义数据如何传递给组件props
- 合理设置`required`和`defaultValue`确保组件稳定运行

### 7. 交互系统配置

```typescript
{
  // ============ 交互能力 ============
  interaction: {
    capability: {
      supportedEvents: ['click', 'hover', 'dataChange'], // 支持的事件类型
      supportedActions: ['jump', 'modify'],              // 支持的动作类型
      defaultPermissions: {
        allowExternalControl: true,                       // 允许外部控制
        requirePermissionCheck: false                     // 是否需要权限检查
      },
      listenableProperties: [                            // 可监听的属性列表
        'title', 'value', 'color', 'visible'
      ]
    },

    examples: [                                          // 交互示例（用于文档和测试）
      {
        name: '数据变化响应',
        description: '当数据变化时触发其他组件更新',
        scenario: 'data-sync',
        config: {
          event: 'dataChange',
          responses: [{
            action: 'modify',
            modifyConfig: {
              targetComponentId: 'target-comp-123',
              targetProperty: 'value',
              updateValue: '{{newValue}}',
              updateMode: 'replace'
            }
          }],
          enabled: true,
          priority: 1
        }
      }
    ]
  },
}
```

### 8. 配置系统集成

```typescript
{
  // ============ 配置面板 ============
  settingConfig: myComponentSettingConfig,  // 🔑 配置项定义数组
}
```

## 🎯 完整示例

这里是一个包含所有要素的完整组件定义：

```typescript
/**
 * 数据监控组件定义
 */
import type { ComponentDefinition } from '../../../core/types'
import DataMonitorComponent from './index.vue'
import DataMonitorSetting from './setting.vue'
import { dataMonitorSettingConfig, customConfig } from './settingConfig'

const dataMonitorDefinition: ComponentDefinition = {
  // 基础信息
  type: 'data-monitor',
  name: '数据监控面板',
  description: '实时监控多个数据源的状态和数值变化，支持阈值报警',
  version: '2.1.0',
  author: 'ThingsPanel',

  // 分类显示
  category: '数据监控',
  mainCategory: '监控',
  subCategory: '数据面板',
  icon: `<svg viewBox="0 0 24 24">...</svg>`,

  // 组件实现
  component: DataMonitorComponent,
  configComponent: DataMonitorSetting,

  // 默认配置
  defaultConfig: customConfig,
  config: {
    type: 'data-monitor',
    root: { transform: { rotate: 0, scale: 1 } },
    customize: customConfig
  },

  // 布局配置
  defaultLayout: {
    canvas: { width: 400, height: 300, x: 0, y: 0 },
    gridstack: { w: 6, h: 4, x: 0, y: 0, minW: 4, minH: 3, maxW: 12, maxH: 8 }
  },
  layout: {
    defaultSize: { width: 6, height: 4 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 8 },
    resizable: true
  },

  // 权限和特性
  permission: '不限',
  tags: ['监控', '数据', '实时', '报警', '多源'],
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true
  },

  // 数据源配置
  dataSources: [
    {
      key: 'primaryData',
      name: '主数据源',
      description: '主要监控数据',
      supportedTypes: ['api', 'websocket'],
      fieldMappings: {
        'value': { targetField: 'primaryValue', type: 'value', required: true, defaultValue: 0 },
        'status': { targetField: 'primaryStatus', type: 'value', required: false, defaultValue: 'normal' }
      },
      required: false
    },
    {
      key: 'secondaryData',
      name: '辅助数据源',
      description: '辅助监控数据',
      supportedTypes: ['api', 'websocket'],
      fieldMappings: {
        'value': { targetField: 'secondaryValue', type: 'value', required: true, defaultValue: 0 }
      },
      required: false
    }
  ],

  // 交互配置
  interaction: {
    capability: {
      supportedEvents: ['click', 'dataChange', 'alarm'],
      supportedActions: ['jump', 'modify', 'notify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['primaryValue', 'secondaryValue', 'alarmStatus', 'themeColor']
    },
    examples: [
      {
        name: '报警响应',
        description: '当数据超过阈值时触发报警通知',
        scenario: 'alarm-notify',
        config: {
          event: 'alarm',
          responses: [{
            action: 'notify',
            notifyConfig: {
              type: 'warning',
              message: '数据异常：{{alarmMessage}}',
              duration: 5000
            }
          }],
          enabled: true
        }
      }
    ]
  },

  // 配置面板
  settingConfig: dataMonitorSettingConfig
}

export default dataMonitorDefinition
```

## ✅ 最佳实践

### 1. 命名规范
- `type`: 使用kebab-case，如 `data-chart`、`status-monitor`
- 文件名与`type`保持一致
- 类名使用PascalCase，如 `DataChartDefinition`

### 2. 配置合理性
- 设置合适的默认尺寸，确保内容完整显示
- `minSize`不要太小，避免内容重叠
- `maxSize`考虑性能限制

### 3. 数据源设计
- 每个数据源有明确的用途和描述
- 合理设置`fieldMappings`，避免数据冲突
- 考虑数据源的可选性，增强组件灵活性

### 4. 交互设计
- 只声明组件真正支持的事件和动作
- 提供有意义的交互示例
- 合理设置属性监听，避免性能问题

## 🚨 常见陷阱

1. **type不唯一**: 导致组件注册冲突
2. **mainCategory不匹配**: 组件不显示在组件库中
3. **缺少dataSources**: 多数据源组件只显示一个插槽
4. **缺少settingConfig**: 配置面板空白
5. **defaultLayout不合理**: 组件显示异常

## 🔗 相关文档

- [组件配置系统](./05-component-configuration.md)
- [数据源系统](./06-data-sources.md)
- [交互系统](./08-interaction-system.md)
- [API参考](./18-api-reference.md)

---

**掌握组件定义是Card 2.1开发的核心技能！** 🎯