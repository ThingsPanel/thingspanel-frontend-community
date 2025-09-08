# Card 2.1 组件开发指南

> **🎯 目标**：看了这个指南就能开发出合适的组件！

## 📋 目录

- [快速入门](#快速入门)
- [三文件架构标准](#三文件架构标准)
- [数据源系统](#数据源系统)
- [交互系统](#交互系统)
- [属性暴露机制](#属性暴露机制)
- [配置表单系统](#配置表单系统)
- [权限配置](#权限配置)
- [最佳实践](#最佳实践)

## 🚀 快速入门

### 第一步：理解 Card 2.1 系统

Card 2.1 是一个完全重构的组件系统，具备以下核心特性：

- **三文件架构**：清晰分离组件逻辑、配置定义和设置界面
- **类型安全**：完整的 TypeScript 类型定义
- **数据驱动**：支持多种数据源和响应式数据绑定
- **交互丰富**：内置交互系统，支持组件间联动
- **属性暴露**：组件属性可被其他组件监听和绑定
- **权限控制**：基于用户角色的组件访问控制

### 第二步：创建你的第一个组件

```bash
# 创建组件目录
mkdir -p src/card2.1/components/my-widget

# 创建三个核心文件
touch src/card2.1/components/my-widget/index.vue        # 主组件
touch src/card2.1/components/my-widget/definition.ts   # 组件定义
touch src/card2.1/components/my-widget/settingConfig.ts # 配置定义
touch src/card2.1/components/my-widget/setting.vue     # 设置界面
touch src/card2.1/components/my-widget/index.ts        # 导出文件
```

## 🏗️ 三文件架构标准

### 文件结构概览

```
my-widget/
├── index.vue          # 主组件 - 负责UI渲染和业务逻辑
├── definition.ts      # 组件定义 - 注册信息、布局、数据需求
├── settingConfig.ts   # 配置定义 - 设置项和类型定义
├── setting.vue        # 设置界面 - 组件配置面板
└── index.ts          # 导出文件 - 统一对外接口
```

### 1. index.vue - 主组件

```vue
<script setup lang="ts">
/**
 * my-widget 主组件
 * 基于新的三文件结构标准
 */

import { computed, reactive } from 'vue'
import type { MyWidgetConfig, MyWidgetCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  lastUpdate: string
}

// 组件props
interface Props {
  /** CustomConfig结构配置 */
  customConfig?: MyWidgetConfig
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  previewMode: false
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  lastUpdate: new Date().toISOString()
})

/**
 * 获取组件配置
 */
const currentCustomize = computed((): MyWidgetCustomize => {
  return props.customConfig?.customize || {
    title: '默认标题',
    content: '默认内容',
    themeColor: '#2080f0'
  }
})

/**
 * 获取变换配置
 */
const currentTransform = computed(() => {
  return props.customConfig?.root?.transform || { rotate: 0, scale: 1 }
})

// 事件处理
const handleClick = () => {
  emit('click', {
    componentId: props.componentId || '',
    timestamp: new Date().toISOString()
  })
}

// 暴露方法给父组件
defineExpose({
  componentState,
  currentCustomize
})
</script>

<template>
  <div
    class="my-widget"
    :style="{
      '--theme-color': currentCustomize.themeColor,
      transform: `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`
    }"
    :data-component-id="componentId"
    @click="handleClick"
  >
    <h3>{{ currentCustomize.title }}</h3>
    <p>{{ currentCustomize.content }}</p>
    
    <!-- 组件特定的UI内容 -->
    <div class="widget-content">
      <!-- 在这里实现你的组件UI -->
    </div>
  </div>
</template>

<style scoped>
.my-widget {
  padding: 20px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.my-widget:hover {
  border-color: var(--theme-color);
  transform: translateY(-2px);
}

.my-widget h3 {
  margin: 0 0 16px 0;
  color: var(--text-color);
  font-size: 18px;
}

.my-widget p {
  margin: 0 0 16px 0;
  color: var(--text-color-2);
  line-height: 1.6;
}

.widget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
```

### 2. settingConfig.ts - 配置定义

```typescript
/**
 * my-widget 组件设置配置
 * 定义组件的设置项和默认配置
 */

import type { ComponentSettingConfig, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

/**
 * my-widget 组件特有的 customize 类型
 */
export interface MyWidgetCustomize {
  /** 组件标题 */
  title: string
  /** 展示内容 */
  content: string
  /** 主题颜色 */
  themeColor: string
  /** 显示模式 */
  displayMode: 'simple' | 'detailed' | 'compact'
  /** 是否显示边框 */
  showBorder: boolean
}

/**
 * my-widget 组件设置配置
 */
export const myWidgetSettingConfig: ComponentSettingConfig<MyWidgetCustomize> = {
  componentType: 'my-widget',

  // 设置项定义
  settings: [
    // 🔥 通用设备字段配置
    createSetting(SettingControlType.INPUT, '设备ID', 'deviceId', {
      group: '设备配置',
      placeholder: '请输入设备ID',
      defaultValue: ''
    }),

    createSetting(SettingControlType.DYNAMIC_TAGS, '指标列表', 'metricsList', {
      group: '设备配置',
      placeholder: '请输入指标名称',
      defaultValue: []
    }),

    // 组件特定设置
    createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
      group: '内容设置',
      placeholder: '请输入组件标题',
      defaultValue: '我的组件'
    }),

    createSetting(SettingControlType.TEXTAREA, '展示内容', 'customize.content', {
      group: '内容设置',
      placeholder: '请输入展示内容',
      defaultValue: '这是一个自定义组件'
    }),

    createSetting(SettingControlType.COLOR_PICKER, '主题颜色', 'customize.themeColor', {
      group: '样式设置',
      defaultValue: '#2080f0'
    }),

    createSetting(SettingControlType.SELECT, '显示模式', 'customize.displayMode', {
      group: '显示设置',
      options: [
        { label: '简单', value: 'simple' },
        { label: '详细', value: 'detailed' },
        { label: '紧凑', value: 'compact' }
      ],
      defaultValue: 'simple'
    }),

    createSetting(SettingControlType.SWITCH, '显示边框', 'customize.showBorder', {
      group: '样式设置',
      defaultValue: true
    })
  ],

  // 默认自定义配置
  customConfig: createCustomConfig<MyWidgetCustomize>('my-widget', {
    title: '我的组件',
    content: '这是一个自定义组件',
    themeColor: '#2080f0',
    displayMode: 'simple',
    showBorder: true
  })
}

/**
 * 导出类型定义供外部使用
 */
export type MyWidgetConfig = CustomConfig<MyWidgetCustomize>
```

### 3. definition.ts - 组件定义

```typescript
/**
 * my-widget 组件定义
 * 新三文件结构 - 标准组件模板
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import MyWidgetComponent from './index.vue'
import MyWidgetSetting from './setting.vue'
import { myWidgetSettingConfig } from './settingConfig'
import { componentRegistry } from '@/card2.1/core/component-registry'

/**
 * my-widget 组件定义
 */
const myWidgetDefinition: ComponentDefinition = {
  // 基础信息
  type: 'my-widget',
  name: '我的组件',
  description: '这是一个示例组件，展示Card 2.1的基本功能',
  category: '数据展示',
  mainCategory: '自定义',
  subCategory: '展示组件',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/></svg>`,
  version: '2.1.0',
  author: '开发者',

  // 组件实现
  component: MyWidgetComponent,

  // 配置组件
  configComponent: MyWidgetSetting,

  // 默认配置
  defaultConfig: myWidgetSettingConfig.customConfig,

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 300,
      height: 200,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 2,
      h: 2,
      x: 0,
      y: 0,
      minW: 2,
      minH: 1,
      maxW: 4,
      maxH: 3
    }
  },

  // 权限配置 - 谁可以使用这个组件
  permission: '不限', // '不限' | 'TENANT_ADMIN' | 'TENANT_USER' | 'SYS_ADMIN'

  // 标签
  tags: ['custom', 'display', 'example'],

  // 特性标记
  features: {
    realtime: true,      // 支持实时数据
    dataBinding: true,   // 支持数据绑定
    themeable: true,     // 支持主题定制
    responsive: true,    // 支持响应式
    configurable: true   // 支持配置定制
  }
}

// 注册组件到组件注册中心
componentRegistry.registerComponent(myWidgetDefinition)
componentRegistry.registerSettingConfig(myWidgetSettingConfig)

export default myWidgetDefinition
```

### 4. setting.vue - 设置界面

```vue
<template>
  <div class="my-widget-setting">
    <AutoFormGenerator
      :setting-config="settingConfig"
      :model-value="localConfig"
      @update:model-value="handleConfigChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * my-widget 组件设置面板
 * 基于 settingConfig 自动生成设置界面
 */

import { reactive, watch, nextTick } from 'vue'
import { myWidgetSettingConfig } from './settingConfig'
import type { MyWidgetConfig } from './settingConfig'
import AutoFormGenerator from '@/card2.1/core/AutoFormGenerator.vue'

// Props接口
interface Props {
  modelValue?: MyWidgetConfig
  config?: MyWidgetConfig
  widget?: any
  readonly?: boolean
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', config: MyWidgetConfig): void
  (e: 'update:config', config: MyWidgetConfig): void
  (e: 'change', value: MyWidgetConfig, oldValue: MyWidgetConfig): void
  (e: 'update', config: MyWidgetConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 设置配置
const settingConfig = myWidgetSettingConfig

// 获取默认配置
const getDefaultConfig = (): MyWidgetConfig => ({
  ...settingConfig.customConfig
})

// 本地配置状态
const localConfig = reactive<MyWidgetConfig>(props.modelValue || props.config || getDefaultConfig())

// 防循环更新标志
let isUpdatingFromProps = false

/**
 * 配置变更处理
 */
const handleConfigChange = (newConfig: MyWidgetConfig) => {
  if (isUpdatingFromProps) return

  Object.assign(localConfig, newConfig)

  // 发送更新事件
  emit('update:modelValue', { ...localConfig })
  emit('update:config', { ...localConfig })
  emit('change', { ...localConfig }, { ...localConfig })
  emit('update', { ...localConfig })
}

/**
 * 监听props配置变化
 */
watch(
  [() => props.modelValue, () => props.config],
  ([newModelValue, newConfig]) => {
    if (isUpdatingFromProps) return

    const sourceConfig = newModelValue || newConfig
    if (sourceConfig) {
      isUpdatingFromProps = true
      try {
        const mergedConfig = {
          ...getDefaultConfig(),
          ...sourceConfig,
          customize: {
            ...getDefaultConfig().customize,
            ...sourceConfig.customize
          }
        }
        Object.assign(localConfig, mergedConfig)
      } finally {
        nextTick(() => {
          setTimeout(() => {
            isUpdatingFromProps = false
          }, 10)
        })
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.my-widget-setting {
  padding: 16px;
}
</style>
```

### 5. index.ts - 导出文件

```typescript
/**
 * my-widget 组件导出
 * 新三文件结构 - 标准组件模板
 */

// 导出主定义（包含注册逻辑）
export { default } from './definition'

// 导出组件类型定义
export { myWidgetSettingConfig } from './settingConfig'
export type { MyWidgetCustomize, MyWidgetConfig } from './settingConfig'
```

## 📊 数据源系统

Card 2.1 支持多种数据源类型，每种都有不同的使用场景：

### 静态数据源

适用于：固定数据展示、测试数据、配置数据

```typescript
// 在 definition.ts 中配置
const staticDataSourceConfig = {
  type: 'static',
  data: {
    temperature: 25.6,
    humidity: 68.2,
    status: 'online',
    readings: [
      { time: '14:00', value: 24.5 },
      { time: '14:30', value: 25.1 },
      { time: '15:00', value: 25.6 }
    ]
  }
}
```

### API 数据源

适用于：从后端 API 获取数据，支持参数绑定

```typescript
// API 数据源配置
const apiDataSourceConfig = {
  type: 'api',
  url: 'https://api.example.com/device/{{deviceId}}/metrics',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer {{authToken}}',
    'Content-Type': 'application/json'
  },
  // 支持属性绑定 - 从其他组件获取参数值
  params: {
    deviceId: 'comp-123.customize.deviceId', // 绑定到其他组件的属性
    startTime: '{{startTime}}',
    endTime: '{{endTime}}'
  },
  refreshInterval: 5000 // 自动刷新间隔
}
```

### WebSocket 数据源

适用于：实时数据流、推送通知

```typescript
// WebSocket 数据源配置
const websocketDataSourceConfig = {
  type: 'websocket',
  url: 'wss://api.example.com/realtime/{{deviceId}}',
  reconnectInterval: 5000,
  heartbeatMessage: '{"type":"ping"}'
}
```

### 脚本数据源

适用于：数据处理、模拟数据生成、复杂计算

```typescript
// 脚本数据源配置
const scriptDataSourceConfig = {
  type: 'script',
  script: `
    return {
      value: mockData.randomNumber(0, 100),
      title: '实时数据',
      unit: '%',
      timestamp: new Date().toISOString(),
      trend: mockData.randomBoolean() ? 'up' : 'down'
    };
  `
}
```

### 数据源在组件中的使用

```typescript
// 在 definition.ts 中配置数据源需求
const myWidgetDefinition: ComponentDefinition = {
  // ... 其他配置
  
  // 数据源需求声明
  dataSources: [
    {
      key: 'deviceData',
      name: '设备数据',
      description: '设备的实时监测数据',
      supportedTypes: ['api', 'websocket'],
      fieldMappings: {
        temperature: {
          targetField: 'temperature',
          type: 'value',
          required: true,
          defaultValue: 0
        },
        status: {
          targetField: 'deviceStatus',
          type: 'value',
          required: true,
          defaultValue: 'offline'
        }
      }
    }
  ]
}
```

## 🎭 交互系统

交互系统让组件能够响应用户操作并与其他组件联动。

### 支持的交互事件

- **click** - 点击事件
- **hover** - 悬停事件  
- **dataChange** - 数据变化事件（属性变化时）

### 支持的响应动作

- **jump** - URL跳转（外部URL或内部菜单）
- **modify** - 修改目标组件属性

### 交互配置示例

```typescript
// 在 definition.ts 中配置交互能力
const myWidgetDefinition: ComponentDefinition = {
  // ... 其他配置
  
  // 交互能力定义
  interaction: {
    capability: {
      supportedEvents: ['click', 'hover', 'dataChange'],
      supportedActions: ['jump', 'modify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['title', 'content', 'themeColor', 'displayMode']
    },
    
    examples: [
      {
        name: '点击跳转示例',
        description: '点击组件时跳转到外部URL',
        scenario: 'click-jump',
        config: {
          event: 'click',
          responses: [{
            action: 'jump',
            jumpConfig: {
              jumpType: 'external',
              url: 'https://example.com',
              target: '_blank'
            }
          }],
          enabled: true,
          priority: 1
        }
      },
      
      {
        name: '悬停修改属性',
        description: '悬停时修改其他组件的背景色',
        scenario: 'hover-modify',
        config: {
          event: 'hover',
          responses: [{
            action: 'modify',
            modifyConfig: {
              targetComponentId: 'comp-456',
              targetProperty: 'backgroundColor',
              updateValue: '#ff6b6b',
              updateMode: 'replace'
            }
          }],
          enabled: true
        }
      },
      
      {
        name: '属性变化响应',
        description: '当标题改变时触发其他动作',
        scenario: 'data-change-action',
        config: {
          event: 'dataChange',
          watchedProperty: 'title',
          condition: {
            operator: 'contains',
            value: '警告'
          },
          responses: [{
            action: 'modify',
            modifyConfig: {
              targetComponentId: 'comp-789',
              targetProperty: 'visibility',
              updateValue: 'visible'
            }
          }]
        }
      }
    ],
    
    propertyExposure: {
      componentType: 'my-widget',
      componentName: '我的组件',
      listenableProperties: [
        {
          name: 'title',
          label: '标题',
          type: 'string',
          description: '组件的标题文字',
          group: '内容'
        },
        {
          name: 'themeColor',
          label: '主题颜色',
          type: 'color',
          description: '组件的主题颜色',
          group: '样式'
        }
      ]
    }
  }
}
```

## 🎯 属性暴露机制

属性暴露让组件的属性可以被其他组件监听和绑定，实现组件间的数据联动。

### 自动属性暴露

系统会自动从 `settingConfig.ts` 中提取可监听属性：

```typescript
// settingConfig.ts 中的设置项会自动成为可监听属性
const myWidgetSettingConfig: ComponentSettingConfig<MyWidgetCustomize> = {
  settings: [
    createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
      // 这个设置项会自动成为可监听属性
      defaultValue: '我的组件'
    })
  ]
}

// 系统会自动注册以下可监听属性：
// - customize.title (string类型)
// - customize.content (string类型)  
// - customize.themeColor (color类型)
// 等等...
```

### 手动属性暴露

如果需要暴露更多属性，可以手动配置：

```typescript
import { propertyExposureRegistry, createProperty } from '@/card2.1/core/property-exposure'

// 手动注册额外的可监听属性
propertyExposureRegistry.register({
  componentType: 'my-widget',
  componentName: '我的组件',
  listenableProperties: [
    createProperty('isActive', '激活状态', 'boolean', {
      description: '组件是否处于激活状态',
      group: '状态',
      defaultValue: true
    }),
    
    createProperty('lastUpdate', '最后更新时间', 'date', {
      description: '组件最后一次更新的时间',
      group: '状态',
      example: new Date()
    })
  ]
})
```

### 属性绑定的使用

在其他组件中可以绑定到这些属性：

```typescript
// 在 API 数据源中使用属性绑定
const apiConfig = {
  type: 'api',
  url: '/api/device/{{comp-123.customize.deviceId}}/data',
  params: {
    // 绑定到 my-widget 组件的 title 属性
    title: 'comp-456.customize.title',
    // 绑定到颜色属性
    color: 'comp-456.customize.themeColor'
  }
}

// 在交互配置中使用属性绑定
const interactionConfig = {
  event: 'dataChange',
  condition: {
    // 监听特定属性的变化
    property: 'customize.title',
    operator: 'equals',
    value: '告警'
  },
  responses: [{
    action: 'modify',
    modifyConfig: {
      targetComponentId: 'comp-789',
      targetProperty: 'backgroundColor',
      updateValue: '#ff4757' // 变红色表示告警
    }
  }]
}
```

## 🛠️ 配置表单系统

> **⚠️ 注意**：配置表单系统将来会升级，这里标记相关部分，为未来修改做准备。

### AutoFormGenerator 组件

系统提供了 `AutoFormGenerator` 组件，能够根据 `settingConfig` 自动生成配置界面：

```vue
<template>
  <AutoFormGenerator
    :setting-config="myWidgetSettingConfig"
    :model-value="currentConfig"
    @update:model-value="handleConfigUpdate"
  />
</template>
```

### 支持的控件类型

```typescript
// 在 settingConfig.ts 中定义支持的控件类型
export enum SettingControlType {
  INPUT = 'input',              // 文本输入框
  TEXTAREA = 'textarea',        // 文本域
  INPUT_NUMBER = 'input-number',// 数字输入框
  COLOR_PICKER = 'color-picker',// 颜色选择器
  SLIDER = 'slider',            // 滑块
  SWITCH = 'switch',            // 开关
  SELECT = 'select',            // 下拉选择
  CHECKBOX = 'checkbox',        // 复选框
  RADIO_GROUP = 'radio-group',  // 单选框组
  DATE_PICKER = 'date-picker',  // 日期选择器
  DYNAMIC_TAGS = 'dynamic-tags' // 动态标签
}
```

### 🏷️ [TODO: 配置表单升级] 高级控件类型

```typescript
// 🏷️ [配置表单升级] 将来支持的高级控件类型
export enum AdvancedControlType {
  FILE_UPLOAD = 'file-upload',     // 文件上传
  IMAGE_PICKER = 'image-picker',   // 图片选择器
  CODE_EDITOR = 'code-editor',     // 代码编辑器
  JSON_EDITOR = 'json-editor',     // JSON编辑器
  TREE_SELECT = 'tree-select',     // 树形选择
  TABLE_EDITOR = 'table-editor',   // 表格编辑器
  FORM_BUILDER = 'form-builder'    // 表单构建器
}
```

### 🏷️ [TODO: 配置表单升级] 表单验证增强

```typescript
// 🏷️ [配置表单升级] 增强的验证规则
interface EnhancedValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  // 🏷️ [配置表单升级] 新增异步验证
  asyncValidator?: (value: any) => Promise<boolean | string>
  // 🏷️ [配置表单升级] 新增条件验证
  conditionalRequired?: (formData: any) => boolean
}
```

### 表单分组和布局

```typescript
// 在设置项中定义分组
const settings = [
  createSetting(SettingControlType.INPUT, '设备ID', 'deviceId', {
    group: '设备配置', // 分组名称
    placeholder: '请输入设备ID'
  }),
  
  createSetting(SettingControlType.COLOR_PICKER, '主题颜色', 'customize.themeColor', {
    group: '样式设置', // 不同的分组
    defaultValue: '#2080f0'
  })
]

// AutoFormGenerator 会自动按分组显示
// 设备配置
// ├── 设备ID
// └── 指标列表
// 
// 样式设置  
// ├── 主题颜色
// └── 字体大小
```

## 🔐 权限配置

Card 2.1 支持基于用户角色的组件访问控制。

### 权限级别

```typescript
// 权限等级定义（从高到低）
export type ComponentPermission = 
  | '不限'          // 所有用户都可以使用
  | 'SYS_ADMIN'    // 系统管理员
  | 'TENANT_ADMIN' // 租户管理员  
  | 'TENANT_USER'  // 租户用户
```

### 在组件中配置权限

```typescript
// 在 definition.ts 中设置权限
const myWidgetDefinition: ComponentDefinition = {
  // ... 其他配置
  
  // 权限字段 - 控制谁可以使用这个组件
  permission: 'TENANT_ADMIN', // 只有租户管理员及以上才能使用
  
  // 是否注册字段 - 控制是否在组件库中显示
  isRegistered: true // false表示不在组件库中显示
}
```

### 权限验证工具

```typescript
import { hasComponentPermission, getUserAuthorityFromStorage } from '@/card2.1/core/permission-utils'

// 检查用户是否有权限使用组件
const userAuthority = getUserAuthorityFromStorage()
const canUse = hasComponentPermission('TENANT_ADMIN', userAuthority)

if (canUse) {
  // 用户可以使用该组件
  console.log('用户有权限使用此组件')
} else {
  // 用户无权限
  console.log('用户无权限使用此组件')
}
```

### 权限过滤

```typescript
import { filterComponentsByPermission } from '@/card2.1/core/permission-utils'

// 过滤组件列表，只显示用户有权限的组件
const allComponents = [...] // 所有组件
const availableComponents = filterComponentsByPermission(allComponents)

// availableComponents 只包含当前用户有权限使用的组件
```

## 💡 最佳实践

### 1. 组件命名规范

```typescript
// 文件名和组件名保持一致
// 文件夹：device-status-display
// 类型：DeviceStatusDisplay
// 组件type：'device-status-display'

export interface DeviceStatusDisplayCustomize {
  // ...
}

export const deviceStatusDisplaySettingConfig: ComponentSettingConfig<DeviceStatusDisplayCustomize> = {
  componentType: 'device-status-display',
  // ...
}
```

### 2. 类型定义最佳实践

```typescript
// ✅ 好的做法 - 明确的类型定义
export interface MyWidgetCustomize {
  /** 组件标题 - 用于显示在组件顶部 */
  title: string
  /** 展示内容 - 支持HTML格式 */
  content: string
  /** 主题颜色 - 影响边框和图标颜色 */
  themeColor: string
  /** 显示模式 */
  displayMode: 'simple' | 'detailed' | 'compact'
}

// ❌ 避免的做法 - 不明确的类型
export interface BadCustomize {
  data: any // 太宽泛
  config: object // 不明确
  options?: unknown // 不安全
}
```

### 3. 数据源配置最佳实践

```typescript
// ✅ 好的做法 - 明确的数据源需求
dataSources: [
  {
    key: 'deviceMetrics',
    name: '设备指标数据',
    description: '从设备API获取的实时指标数据，包括温度、湿度等',
    supportedTypes: ['api', 'websocket'],
    fieldMappings: {
      'data.temperature': {
        targetField: 'temperature',
        type: 'value',
        required: true,
        defaultValue: 0,
        transform: 'value => Math.round(value * 100) / 100' // 保留2位小数
      }
    },
    required: true
  }
]

// ❌ 避免的做法 - 模糊的数据需求
dataSources: [
  {
    key: 'data',
    name: 'data',
    description: 'data',
    supportedTypes: ['api'],
    fieldMappings: {}
  }
]
```

### 4. 样式最佳实践

```vue
<style scoped>
/* ✅ 好的做法 - 使用CSS变量和主题系统 */
.my-widget {
  background: var(--card-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  
  /* 使用自定义CSS变量 */
  border-left: 4px solid var(--theme-color);
}

.my-widget:hover {
  border-color: var(--theme-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ❌ 避免的做法 - 硬编码颜色值 */
.bad-widget {
  background: #ffffff;      /* 不支持主题切换 */
  color: #333333;          /* 不支持主题切换 */
  border: 1px solid #eee;  /* 不支持主题切换 */
}
</style>
```

### 5. 事件处理最佳实践

```vue
<script setup lang="ts">
// ✅ 好的做法 - 明确的事件类型和数据结构
interface ComponentEvents {
  click: { componentId: string; timestamp: string; data?: any }
  hover: { componentId: string; type: 'enter' | 'leave' }
  dataChange: { property: string; oldValue: any; newValue: any }
}

const emit = defineEmits<{
  (e: 'click', data: ComponentEvents['click']): void
  (e: 'hover', data: ComponentEvents['hover']): void
  (e: 'dataChange', data: ComponentEvents['dataChange']): void
}>()

const handleClick = () => {
  emit('click', {
    componentId: props.componentId,
    timestamp: new Date().toISOString(),
    data: { /* 相关数据 */ }
  })
}

// ❌ 避免的做法 - 模糊的事件参数
const emit = defineEmits(['click', 'update', 'change']) // 没有类型约束

const badHandleClick = () => {
  emit('click', 'something') // 不明确的数据格式
}
</script>
```

### 6. 性能优化建议

```vue
<script setup lang="ts">
import { computed, shallowRef, markRaw } from 'vue'

// ✅ 使用计算属性缓存复杂计算
const computedStyles = computed(() => {
  return {
    '--theme-color': props.customConfig?.customize.themeColor,
    '--font-size': `${props.customConfig?.customize.fontSize || 16}px`,
    transform: `rotate(${transform.value.rotate}deg) scale(${transform.value.scale})`
  }
})

// ✅ 对于大型对象使用 shallowRef
const largeData = shallowRef({})

// ✅ 对于不需要响应式的数据使用 markRaw
const staticConfig = markRaw({
  icons: { /* 大量图标数据 */ }
})

// ❌ 避免在模板中进行复杂计算
// <div :style="{ color: getColor(props.data, props.theme, props.mode) }">
</script>

<template>
  <!-- ✅ 使用计算属性 -->
  <div :style="computedStyles">
    <!-- 组件内容 -->
  </div>
</template>
```

### 7. 错误处理最佳实践

```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

// 错误状态管理
const error = ref<string | null>(null)
const loading = ref(false)

// 捕获子组件错误
onErrorCaptured((err, instance, info) => {
  console.error('组件错误:', err, info)
  error.value = `组件渲染错误: ${err.message}`
  return false // 阻止错误继续传播
})

// API调用错误处理
const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.getData()
    return response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : '数据加载失败'
    throw err
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="my-widget">
    <!-- 错误状态显示 -->
    <div v-if="error" class="error-message">
      <n-alert type="error" :title="error" />
    </div>
    
    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <n-spin size="large" />
    </div>
    
    <!-- 正常内容 -->
    <div v-else class="content">
      <!-- 组件内容 -->
    </div>
  </div>
</template>
```

## 📚 相关文档

- [数据源系统详解](./data-sources.md)
- [交互系统配置](./interaction-system.md)  
- [属性暴露机制](./property-exposure.md)
- [权限配置系统](./permission-system.md)
- [API 参考手册](./api-reference.md)

---

**🎉 恭喜！** 现在你已经掌握了 Card 2.1 组件开发的所有要点。开始创建你的第一个组件吧！

如有问题，请参考项目中的示例组件：
- `simple-display` - 简单静态展示组件
- `triple-data-display` - 复杂数据展示组件
- `dual-data-display` - 双数据源组件

记住：**看了这个指南就能开发出合适的组件！** 🚀