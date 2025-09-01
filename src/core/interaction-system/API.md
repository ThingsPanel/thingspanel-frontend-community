# 交互系统 API 文档

## 组件 API 参考

### InteractionSettingsForm

主交互配置表单组件，提供完整的可视化交互配置界面。

#### Props

| 属性名 | 类型 | 默认值 | 必需 | 描述 |
|--------|------|--------|------|------|
| `componentId` | `string` | - | ❌ | 组件唯一标识符 |
| `componentType` | `string` | - | ❌ | 组件类型，用于获取可监听属性 |
| `modelValue` | `InteractionConfig[]` | `[]` | ❌ | 当前交互配置列表 |
| `readonly` | `boolean` | `false` | ❌ | 是否为只读模式 |
| `showAdvanced` | `boolean` | `true` | ❌ | 是否显示高级功能选项 |

#### Events

| 事件名 | 参数类型 | 描述 |
|--------|----------|------|
| `update:modelValue` | `InteractionConfig[]` | 配置更新时触发 |
| `change` | `InteractionConfig[]` | 配置变化时触发 |
| `validate` | `{valid: boolean, errors: string[]}` | 验证结果变化时触发 |

#### 使用示例

```vue
<template>
  <InteractionSettingsForm
    v-model="interactions"
    :component-id="componentId"
    :component-type="componentType"
    :readonly="isReadonly"
    @change="handleInteractionChange"
    @validate="handleValidate"
  />
</template>

<script setup lang="ts">
import { InteractionSettingsForm } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

const interactions = ref<InteractionConfig[]>([])

const handleInteractionChange = (configs: InteractionConfig[]) => {
  console.log('交互配置变化:', configs)
}

const handleValidate = (result: {valid: boolean, errors: string[]}) => {
  if (!result.valid) {
    console.error('配置验证失败:', result.errors)
  }
}
</script>
```

---

### InteractionResponseEditor

响应动作编辑器组件，用于配置具体的交互响应动作及其参数。

#### Props

| 属性名 | 类型 | 默认值 | 必需 | 描述 |
|--------|------|--------|------|------|
| `modelValue` | `InteractionResponse` | - | ✅ | 当前响应动作配置 |
| `readonly` | `boolean` | `false` | ❌ | 是否为只读模式 |

#### Events

| 事件名 | 参数类型 | 描述 |
|--------|----------|------|
| `update:modelValue` | `InteractionResponse` | 响应配置更新时触发 |
| `update` | `InteractionResponse` | 响应配置变化时触发 |

#### 支持的响应动作类型

| 动作类型 | 值类型 | 描述 | 配置项 |
|----------|--------|------|--------|
| `navigateToUrl` | `string` | URL跳转 | `target`, `windowFeatures` |
| `updateComponentData` | `any` | 更新组件数据 | `targetComponentId`, `targetProperty`, `updateValue`, `updateMode` |
| `changeVisibility` | `'visible' \| 'hidden'` | 改变可见性 | - |
| `triggerAnimation` | `string` | 触发动画 | `duration`, `easing` |

#### 使用示例

```vue
<template>
  <InteractionResponseEditor
    v-model="response"
    :readonly="false"
    @update="handleResponseUpdate"
  />
</template>

<script setup lang="ts">
import { InteractionResponseEditor } from '@/core/interaction-system'
import type { InteractionResponse } from '@/card2.1/core/interaction-types'

const response = ref<InteractionResponse>({
  action: 'navigateToUrl',
  value: 'https://example.com',
  target: '_blank'
})

const handleResponseUpdate = (updatedResponse: InteractionResponse) => {
  console.log('响应配置更新:', updatedResponse)
}
</script>
```

---

### InteractionTemplateSelector

交互模板选择器组件，提供预设的交互模板供用户快速选择。

#### Props

无需传入Props，模板数据内置在组件中。

#### Events

| 事件名 | 参数类型 | 描述 |
|--------|----------|------|
| `select` | `InteractionConfig` | 选择模板时触发 |
| `cancel` | - | 取消选择时触发 |

#### 模板分类

| 分类 | 键值 | 描述 | 示例模板 |
|------|------|------|----------|
| 基础交互 | `basic` | 常用的基础交互效果 | 点击高亮、悬停缩放 |
| 视觉效果 | `visual` | 视觉样式变化效果 | 彩虹边框、透明度切换 |
| 动画效果 | `animation` | 动态动画效果 | 脉冲动画、震动提示 |
| 复合交互 | `complex` | 多事件组合的复杂交互 | 完整反馈循环 |
| 用户自定义 | `user` | 用户导入的自定义模板 | - |

#### 使用示例

```vue
<template>
  <InteractionTemplateSelector
    @select="applyTemplate"
    @cancel="closeSelector"
  />
</template>

<script setup lang="ts">
import { InteractionTemplateSelector } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

const applyTemplate = (template: InteractionConfig) => {
  console.log('应用模板:', template)
  // 将模板配置应用到当前组件
  currentInteractions.value.push(template)
}

const closeSelector = () => {
  console.log('取消模板选择')
}
</script>
```

---

### InteractionTemplatePreview

交互模板预览组件，提供模板的详细信息展示和效果演示功能。

#### Props

| 属性名 | 类型 | 默认值 | 必需 | 描述 |
|--------|------|--------|------|------|
| `template` | `InteractionTemplate` | - | ✅ | 要预览的交互模板 |

#### Events

| 事件名 | 参数类型 | 描述 |
|--------|----------|------|
| `close` | - | 关闭预览时触发 |
| `select` | `InteractionTemplate` | 选择模板时触发 |

#### 核心功能

- 📋 **模板信息展示**：显示模板基本信息和统计数据
- 🎨 **配置详情**：展示模板包含的所有交互配置
- 🎮 **实时演示**：提供可交互的演示元素
- 💾 **模板导出**：支持导出模板为JSON文件

#### 使用示例

```vue
<template>
  <InteractionTemplatePreview
    :template="selectedTemplate"
    @select="handleTemplateSelect"
    @close="closePreview"
  />
</template>

<script setup lang="ts">
import { InteractionTemplatePreview } from '@/core/interaction-system'
import type { InteractionTemplate } from '@/core/interaction-system'

const selectedTemplate = ref<InteractionTemplate>({
  id: 'hover-scale',
  name: '悬停缩放效果',
  description: '鼠标悬停时元素缩放的交互效果',
  category: 'basic',
  icon: SettingsOutline,
  color: '#2080f0',
  config: [/* 交互配置 */]
})

const handleTemplateSelect = (template: InteractionTemplate) => {
  console.log('选择模板:', template)
}

const closePreview = () => {
  console.log('关闭预览')
}
</script>
```

---

### InteractionPreview

交互预览组件，提供实时的交互效果预览和测试功能。

#### Props

| 属性名 | 类型 | 默认值 | 必需 | 描述 |
|--------|------|--------|------|------|
| `interactions` | `InteractionConfig[]` | - | ✅ | 要预览的交互配置列表 |
| `componentId` | `string` | - | ❌ | 关联的组件ID |

#### Events

| 事件名 | 参数类型 | 描述 |
|--------|----------|------|
| `close` | - | 关闭预览时触发 |

#### 预览功能

- 🎮 **交互测试**：模拟点击、悬停等事件
- 📊 **执行日志**：详细记录交互执行过程
- 🎛️ **配置控制**：动态启用/禁用配置
- 🔄 **重置功能**：恢复预览元素初始状态

#### 使用示例

```vue
<template>
  <InteractionPreview
    :interactions="interactionConfigs"
    :component-id="currentComponentId"
    @close="closePreview"
  />
</template>

<script setup lang="ts">
import { InteractionPreview } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

const interactionConfigs = ref<InteractionConfig[]>([
  {
    event: 'click',
    responses: [{
      action: 'changeBackgroundColor',
      value: '#ff0000'
    }],
    enabled: true
  }
])

const closePreview = () => {
  console.log('关闭预览')
}
</script>
```

---

### InteractionCardWizard

简化交互配置向导，提供弹窗式的简洁配置界面。

#### Props

| 属性名 | 类型 | 默认值 | 必需 | 描述 |
|--------|------|--------|------|------|
| `modelValue` | `any[]` | `[]` | ❌ | 当前交互配置 |
| `componentId` | `string` | - | ❌ | 组件ID |
| `componentType` | `string` | - | ❌ | 组件类型 |

#### Events

| 事件名 | 参数类型 | 描述 |
|--------|----------|------|
| `update:modelValue` | `any[]` | 配置更新时触发 |

#### 支持的操作

- ➕ **添加交互**：通过弹窗快速添加新的交互配置
- ✏️ **编辑交互**：修改现有交互配置
- 🗑️ **删除交互**：移除不需要的交互配置
- 🔄 **切换状态**：启用/禁用特定交互

#### 使用示例

```vue
<template>
  <InteractionCardWizard
    v-model="interactions"
    :component-id="componentId"
    :component-type="componentType"
  />
</template>

<script setup lang="ts">
import { InteractionCardWizard } from '@/core/interaction-system'

const interactions = ref([])
const componentId = ref('component-001')
const componentType = ref('chart-component')
</script>
```

---

## 管理器 API

### ConfigRegistry

配置组件注册表管理器，用于管理Card 2.1组件的自定义配置面板。

#### 方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `register` | `(componentId: string, configComponent: IConfigComponent)` | `void` | 注册配置组件 |
| `get` | `(componentId: string)` | `IConfigComponent \| undefined` | 获取配置组件 |
| `has` | `(componentId: string)` | `boolean` | 检查是否有自定义配置组件 |
| `getAll` | `()` | `ConfigComponentRegistration[]` | 获取所有注册的配置组件 |
| `clear` | `()` | `void` | 清除所有注册 |
| `unregister` | `(componentId: string)` | `boolean` | 移除指定组件的配置 |

#### 使用示例

```typescript
import { configRegistry } from '@/core/interaction-system'

// 注册自定义配置组件
configRegistry.register('my-component', {
  component: MyCustomConfigPanel,
  props: { /* 配置属性 */ },
  validators: { /* 验证规则 */ }
})

// 检查是否有自定义配置
if (configRegistry.has('my-component')) {
  const config = configRegistry.get('my-component')
  // 使用自定义配置组件
}

// 获取所有注册的配置
const allConfigs = configRegistry.getAll()
console.log('已注册的配置组件:', allConfigs)
```

---

## 类型定义

### 核心接口

```typescript
// 交互配置主接口
interface InteractionConfig {
  event: InteractionEventType           // 触发事件类型
  responses: InteractionResponse[]      // 响应动作列表
  enabled: boolean                      // 是否启用
  priority?: number                     // 执行优先级
  name?: string                         // 配置名称
  
  // 条件执行
  condition?: ConditionConfig           
  watchedProperty?: string              
  sourceComponentType?: string          
  
  // 跨组件交互
  targetComponentId?: string            
}

// 响应动作接口
interface InteractionResponse {
  action: InteractionActionType         // 动作类型
  value: any                           // 动作值
  delay?: number                       // 延迟执行时间(ms)
  duration?: number                    // 持续时间(ms)
  easing?: string                      // 缓动函数
  
  // URL跳转相关
  target?: string                      // 跳转目标
  windowFeatures?: string              // 新窗口特性
  
  // 组件数据更新相关
  targetComponentId?: string           // 目标组件ID
  targetProperty?: string              // 目标属性
  updateValue?: any                    // 更新值
  updateMode?: 'replace' | 'append' | 'prepend'
}

// 条件配置接口
interface ConditionConfig {
  type: 'comparison' | 'range' | 'expression'
  operator?: ComparisonOperator
  value?: any
  minValue?: any
  maxValue?: any
  expression?: string
}
```

### 枚举类型

```typescript
/**
 * 交互事件类型枚举
 * 定义了所有支持的用户交互和系统事件类型
 */
type InteractionEventType = 
  | 'click'              // 鼠标点击事件 (MouseEvent)
  | 'hover'              // 鼠标悬停事件 (MouseEvent: mouseenter/mouseleave)
  | 'focus'              // 元素获得焦点事件 (FocusEvent)
  | 'blur'               // 元素失去焦点事件 (FocusEvent)
  | 'visibility'         // 元素可见性状态变化事件 (IntersectionObserver)
  | 'dataChange'         // 组件数据属性值变化事件 (Vue Watcher)
  | 'conditional'        // 条件表达式满足时触发的事件
  | 'crossComponent'     // 跨组件通信事件 (CustomEvent)
  | 'custom'             // 用户自定义事件类型

/**
 * 交互响应动作类型枚举
 * 定义了交互触发后可执行的所有动作类型
 */
type InteractionActionType = 
  // 导航动作
  | 'navigateToUrl'            // URL跳转 (支持内部路由和外部链接)
  | 'jumpToPage'               // 页面跳转 (内部路由专用)
  
  // 数据操作动作
  | 'updateComponentData'      // 更新目标组件数据
  | 'modifyProperty'           // 修改组件属性 (新格式)
  
  // 视觉样式动作  
  | 'changeVisibility'         // 改变元素可见性 (visible/hidden)
  | 'changeBackgroundColor'    // 改变背景颜色
  | 'changeTextColor'          // 改变文字颜色
  | 'changeBorderColor'        // 改变边框颜色
  | 'changeSize'               // 改变尺寸 (width/height)
  | 'changeOpacity'            // 改变透明度 (0-1)
  | 'changeTransform'          // CSS变换操作 (scale/rotate/translate)
  | 'changeContent'            // 改变文本内容
  
  // 动画效果动作
  | 'triggerAnimation'         // 触发CSS动画或关键帧动画
  | 'flashColor'               // 颜色闪烁效果
  | 'pulseEffect'              // 脉冲动画效果
  | 'shakeEffect'              // 震动动画效果
  
  // 高级功能动作
  | 'conditionalStyle'         // 基于条件的样式应用
  | 'callFunction'             // 调用JavaScript函数
  | 'emitEvent'                // 发送自定义事件
  | 'playSound'                // 播放音效 (Web Audio API)
  | 'showNotification'         // 显示通知消息
  
  // 扩展动作
  | 'custom'                   // 用户自定义动作处理器

/**
 * 条件比较运算符枚举
 * 用于数据变化事件的条件判断
 */
type ComparisonOperator = 
  // 数值比较
  | 'equals'                   // 等于 (===)
  | 'notEquals'                // 不等于 (!==)
  | 'greaterThan'              // 大于 (>)
  | 'greaterThanOrEqual'       // 大于等于 (>=)
  | 'lessThan'                 // 小于 (<)
  | 'lessThanOrEqual'          // 小于等于 (<=)
  
  // 字符串比较
  | 'contains'                 // 包含 (includes)
  | 'startsWith'               // 开始于 (startsWith)
  | 'endsWith'                 // 结束于 (endsWith)
  | 'matches'                  // 正则表达式匹配
  
  // 集合比较
  | 'in'                       // 存在于数组中
  | 'notIn'                    // 不存在于数组中
  
  // 类型检查
  | 'isEmpty'                  // 为空值 (null/undefined/'')
  | 'isNotEmpty'               // 非空值

/**
 * 条件类型枚举
 * 定义了条件执行的判断方式
 */
type ConditionType = 
  | 'always'                   // 总是执行
  | 'never'                    // 从不执行  
  | 'comparison'               // 比较判断 (使用ComparisonOperator)
  | 'range'                    // 数值范围判断 (min-max)
  | 'expression'               // JavaScript表达式判断
  | 'function'                 // 自定义函数判断

/**
 * 更新模式枚举
 * 定义了数据更新的方式
 */
type UpdateMode = 
  | 'replace'                  // 替换现有值
  | 'append'                   // 追加到现有值后
  | 'prepend'                  // 添加到现有值前
  | 'merge'                    // 对象合并 (Object.assign)
  | 'deepMerge'                // 深度对象合并
```

---

## 错误处理

### 常见错误码

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| `INTERACTION_CONFIG_INVALID` | 交互配置格式无效 | 检查配置对象结构 |
| `COMPONENT_NOT_FOUND` | 目标组件未找到 | 确认组件ID是否正确 |
| `PROPERTY_NOT_EXPOSED` | 属性未暴露 | 检查属性暴露配置 |
| `TEMPLATE_FORMAT_ERROR` | 模板格式错误 | 验证模板JSON结构 |
| `EXECUTION_TIMEOUT` | 交互执行超时 | 检查响应动作配置 |

### 错误处理示例

```typescript
try {
  await interactionManager.executeInteraction(config)
} catch (error) {
  switch (error.code) {
    case 'INTERACTION_CONFIG_INVALID':
      console.error('交互配置无效:', error.message)
      // 显示配置错误提示
      break
    case 'COMPONENT_NOT_FOUND':
      console.error('目标组件未找到:', error.componentId)
      // 提示用户选择有效组件
      break
    default:
      console.error('未知错误:', error)
  }
}
```

---

## 版本兼容性

| API版本 | 交互系统版本 | 向后兼容 | 主要变更 |
|---------|--------------|----------|----------|
| v1.0 | 1.0.0 | - | 初始版本 |
| v1.1 | 1.1.0 | ✅ | 新增条件执行功能 |
| v1.2 | 1.2.0 | ✅ | 新增模板系统 |
| v1.3 | 1.3.0 | ✅ | 新增实时预览 |

---

*API文档版本：v1.3 | 最后更新：2024年*