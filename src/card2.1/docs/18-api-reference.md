# API 参考手册 - Card 2.1 完整API文档

本章提供Card 2.1系统的完整API参考，包括类型定义、接口规范和使用示例。

## 🎯 核心类型定义

### ComponentDefinition - 组件定义接口

```typescript
/**
 * 组件定义核心接口
 */
export interface ComponentDefinition {
  // ============ 基础信息 ============
  type: string                              // 组件唯一标识符
  name: string                              // 显示名称
  description?: string                      // 详细描述
  version?: string                          // 组件版本
  author?: string                           // 作者信息
  
  // ============ 分类信息 ============
  category?: string                         // 显示分类
  mainCategory: string                      // 主分类（对应文件夹名）
  subCategory?: string                      // 子分类
  
  // ============ UI信息 ============
  icon?: string                            // 组件图标（SVG字符串）
  thumbnail?: string                       // 组件缩略图
  tags?: string[]                          // 搜索标签
  
  // ============ 组件实现 ============
  component: any                           // Vue组件实现
  configComponent?: any                    // 配置面板组件
  
  // ============ 配置相关 ============
  config?: ComponentConfig                 // 默认配置
  settingConfig?: Setting[]                // 配置项定义
  
  // ============ 布局配置 ============
  defaultLayout?: {
    canvas?: CanvasLayoutConfig            // Canvas渲染器布局
    gridstack?: GridstackLayoutConfig      // Gridstack渲染器布局
  }
  layout?: LayoutConstraints               // 布局约束
  
  // ============ 数据源配置 ============
  dataSources?: DataSourceDefinition[]     // 数据源需求定义
  
  // ============ 交互配置 ============
  interaction?: InteractionCapability      // 交互能力声明
  
  // ============ 权限和特性 ============
  permission?: string                      // 使用权限
  features?: ComponentFeatures             // 功能特性
}
```

### DataSourceDefinition - 数据源定义

```typescript
/**
 * 数据源定义接口
 */
export interface DataSourceDefinition {
  key: string                              // 数据源唯一标识
  name: string                             // 显示名称
  description: string                      // 描述信息
  supportedTypes: DataSourceType[]         // 支持的数据源类型
  fieldMappings: Record<string, FieldMapping> // 字段映射规则
  required: boolean                        // 是否必填
  defaultConfig?: any                      // 默认配置
}

/**
 * 字段映射规则
 */
export interface FieldMapping {
  targetField: string                      // 目标字段名（组件props中的字段）
  type: 'value' | 'object' | 'array'      // 数据类型
  required: boolean                        // 是否必填
  defaultValue: any                        // 默认值
  transform?: string                       // 数据转换函数（JavaScript代码字符串）
  validation?: FieldValidation             // 字段验证规则
}

/**
 * 支持的数据源类型
 */
export type DataSourceType = 
  | 'static'                               // 静态数据
  | 'api'                                  // HTTP API
  | 'websocket'                           // WebSocket连接
  | 'mqtt'                                // MQTT消息队列
  | 'database'                            // 数据库查询
  | 'script'                              // 脚本生成
```

### InteractionCapability - 交互能力

```typescript
/**
 * 交互能力定义
 */
export interface InteractionCapability {
  capability: {
    supportedEvents: InteractionEventType[]   // 支持的事件类型
    supportedActions: InteractionActionType[] // 支持的动作类型
    defaultPermissions: {
      allowExternalControl: boolean           // 允许外部控制
      requirePermissionCheck: boolean         // 需要权限检查
    }
    listenableProperties: string[]            // 可监听属性列表
  }
  examples?: InteractionExample[]             // 交互示例
}

/**
 * 交互事件类型
 */
export type InteractionEventType =
  | 'click'                                 // 点击事件
  | 'doubleClick'                          // 双击事件
  | 'hover'                                // 悬停事件
  | 'dataChange'                           // 数据变化事件
  | 'statusChange'                         // 状态变化事件
  | 'customEvent'                          // 自定义事件

/**
 * 交互动作类型
 */
export type InteractionActionType =
  | 'jump'                                 // 页面跳转
  | 'modify'                               // 修改属性
  | 'notify'                               // 发送通知
  | 'refresh'                              // 刷新数据
  | 'toggle'                               // 切换状态
  | 'customAction'                         // 自定义动作
```

### Setting - 配置项定义

```typescript
/**
 * 配置项定义接口
 */
export interface Setting {
  type: SettingControlType                  // 控件类型
  label: string                            // 显示标签
  key: string                              // 配置键路径
  options: SettingOptions                  // 配置选项
  group?: string                           // 分组名称
  order?: number                           // 显示顺序
}

/**
 * 配置控件类型
 */
export enum SettingControlType {
  INPUT = 'input',                         // 文本输入
  TEXTAREA = 'textarea',                   // 多行文本
  INPUT_NUMBER = 'inputNumber',            // 数字输入
  SELECT = 'select',                       // 下拉选择
  RADIO_GROUP = 'radioGroup',              // 单选组
  CHECKBOX_GROUP = 'checkboxGroup',        // 多选组
  SWITCH = 'switch',                       // 开关
  SLIDER = 'slider',                       // 滑块
  COLOR_PICKER = 'colorPicker',            // 颜色选择器
  DYNAMIC_TAGS = 'dynamicTags',            // 动态标签
  CODE_EDITOR = 'codeEditor'               // 代码编辑器
}

/**
 * 配置项选项
 */
export interface SettingOptions {
  placeholder?: string                     // 占位符
  defaultValue?: any                       // 默认值
  options?: Array<{                        // 选项列表（用于select/radio/checkbox）
    label: string
    value: any
    disabled?: boolean
  }>
  min?: number                            // 最小值（数字/滑块）
  max?: number                            // 最大值（数字/滑块）
  step?: number                           // 步长（数字/滑块）
  rows?: number                           // 行数（textarea）
  maxLength?: number                      // 最大长度（文本输入）
  showAlpha?: boolean                     // 显示透明度（颜色选择器）
  language?: string                       // 编程语言（代码编辑器）
  validation?: ValidationRule             // 验证规则
  condition?: string                      // 显示条件（JavaScript表达式）
}
```

## 🛠️ 核心Hook API

### useComponentRegistry - 组件注册

```typescript
/**
 * 组件注册Hook
 */
export function useComponentRegistry() {
  /**
   * 注册组件
   * @param definition 组件定义
   */
  const register = (definition: ComponentDefinition): void => {
    // 实现逻辑...
  }
  
  /**
   * 获取组件定义
   * @param type 组件类型
   */
  const getComponentDefinition = (type: string): ComponentDefinition | undefined => {
    // 实现逻辑...
  }
  
  /**
   * 获取所有已注册组件
   */
  const getAllComponents = (): ComponentDefinition[] => {
    // 实现逻辑...
  }
  
  /**
   * 按分类获取组件
   * @param category 分类名称
   */
  const getComponentsByCategory = (category: string): ComponentDefinition[] => {
    // 实现逻辑...
  }
  
  /**
   * 搜索组件
   * @param query 搜索关键词
   */
  const searchComponents = (query: string): ComponentDefinition[] => {
    // 实现逻辑...
  }
  
  return {
    register,
    getComponentDefinition,
    getAllComponents,
    getComponentsByCategory,
    searchComponents
  }
}
```

### useInteractionEmitter - 交互事件发射

```typescript
/**
 * 交互事件发射Hook
 */
export function useInteractionEmitter(componentId?: string) {
  /**
   * 发射通用事件
   * @param eventType 事件类型
   * @param eventData 事件数据
   */
  const emitEvent = (
    eventType: InteractionEventType, 
    eventData: any
  ): void => {
    // 实现逻辑...
  }
  
  /**
   * 发射数据变化事件
   * @param data 变化的数据
   */
  const emitDataChange = (data: any): void => {
    emitEvent('dataChange', {
      data,
      timestamp: new Date(),
      source: componentId
    })
  }
  
  /**
   * 发射状态变化事件
   * @param property 属性名
   * @param newValue 新值
   * @param oldValue 旧值
   */
  const emitStatusChange = (
    property: string, 
    newValue: any, 
    oldValue?: any
  ): void => {
    emitEvent('statusChange', {
      property,
      newValue,
      oldValue,
      timestamp: new Date(),
      source: componentId
    })
  }
  
  /**
   * 发射自定义事件
   * @param eventName 自定义事件名
   * @param eventData 事件数据
   */
  const emitCustomEvent = (eventName: string, eventData: any): void => {
    emitEvent('customEvent', {
      eventName,
      data: eventData,
      timestamp: new Date(),
      source: componentId
    })
  }
  
  return {
    emitEvent,
    emitDataChange,
    emitStatusChange,
    emitCustomEvent
  }
}
```

### useInteractionListener - 交互事件监听

```typescript
/**
 * 交互事件监听Hook
 */
export function useInteractionListener() {
  /**
   * 监听交互事件
   * @param sourceComponentId 源组件ID
   * @param eventType 事件类型
   * @param handler 处理函数
   */
  const onInteractionEvent = (
    sourceComponentId: string,
    eventType: InteractionEventType,
    handler: (eventData: any) => void
  ): () => void => {
    // 实现逻辑...
    // 返回取消监听函数
  }
  
  /**
   * 监听数据变化
   * @param sourceComponentId 源组件ID
   * @param handler 处理函数
   */
  const onDataChange = (
    sourceComponentId: string,
    handler: (data: any) => void
  ): () => void => {
    return onInteractionEvent(sourceComponentId, 'dataChange', handler)
  }
  
  /**
   * 监听状态变化
   * @param sourceComponentId 源组件ID
   * @param property 属性名
   * @param handler 处理函数
   */
  const onStatusChange = (
    sourceComponentId: string,
    property: string,
    handler: (newValue: any, oldValue?: any) => void
  ): () => void => {
    return onInteractionEvent(sourceComponentId, 'statusChange', (eventData) => {
      if (eventData.property === property) {
        handler(eventData.newValue, eventData.oldValue)
      }
    })
  }
  
  return {
    onInteractionEvent,
    onDataChange,
    onStatusChange
  }
}
```

### usePropertyExposure - 属性暴露

```typescript
/**
 * 属性暴露Hook
 */
export function usePropertyExposure(componentType: string, componentId?: string) {
  /**
   * 暴露属性
   * @param properties 属性映射对象
   */
  const exposeProperties = (properties: Record<string, any>): void => {
    // 实现逻辑...
  }
  
  /**
   * 获取暴露的属性
   * @param propertyName 属性名
   */
  const getExposedProperty = (propertyName: string): any => {
    // 实现逻辑...
  }
  
  /**
   * 获取所有暴露的属性
   */
  const getAllExposedProperties = (): Record<string, any> => {
    // 实现逻辑...
  }
  
  /**
   * 监听属性变化
   * @param propertyName 属性名
   * @param handler 处理函数
   */
  const watchProperty = (
    propertyName: string, 
    handler: (newValue: any, oldValue?: any) => void
  ): () => void => {
    // 实现逻辑...
    // 返回取消监听函数
  }
  
  return {
    exposeProperties,
    getExposedProperty,
    getAllExposedProperties,
    watchProperty
  }
}
```

## 🔧 工具函数API

### createSetting - 创建配置项

```typescript
/**
 * 创建配置项
 * @param type 控件类型
 * @param label 显示标签
 * @param key 配置键路径
 * @param options 配置选项
 */
export function createSetting(
  type: SettingControlType,
  label: string,
  key: string,
  options: SettingOptions = {}
): Setting {
  return {
    type,
    label,
    key,
    options,
    group: options.group,
    order: options.order
  }
}

// 使用示例
const titleSetting = createSetting(SettingControlType.INPUT, '标题', 'customize.title', {
  placeholder: '请输入标题',
  defaultValue: '默认标题',
  group: '基础设置',
  maxLength: 100
})
```

### createCustomConfig - 创建自定义配置

```typescript
/**
 * 创建自定义配置对象
 * @param config 配置对象
 */
export function createCustomConfig<T extends Record<string, any>>(config: T): T {
  return { ...config }
}

// 使用示例
export interface MyComponentCustomize {
  title: string
  color: string
  size: number
}

export const customConfig = createCustomConfig<MyComponentCustomize>({
  title: '默认标题',
  color: '#2080f0',
  size: 14
})
```

### CategoryMapping - 分类映射工具

```typescript
/**
 * 根据文件夹名获取显示分类
 * @param folderName 文件夹名称
 */
export function getFolderDisplayName(folderName: string): string {
  // 实现逻辑...
}

/**
 * 根据显示分类获取文件夹名
 * @param displayName 显示分类名
 */
export function getDisplayNameFolder(displayName: string): string {
  // 实现逻辑...
}

/**
 * 获取分类图标
 * @param folderName 文件夹名称
 */
export function getCategoryIcon(folderName: string): string {
  // 实现逻辑...
}

/**
 * 获取所有分类列表
 */
export function getAllCategories(): CategoryMapping[] {
  // 实现逻辑...
}
```

## 📊 数据绑定API

### DataSourceManager - 数据源管理器

```typescript
/**
 * 数据源管理器类
 */
export class DataSourceManager {
  /**
   * 注册数据源
   * @param componentId 组件ID
   * @param dataSources 数据源定义数组
   */
  static registerDataSources(
    componentId: string, 
    dataSources: DataSourceDefinition[]
  ): void {
    // 实现逻辑...
  }
  
  /**
   * 获取组件数据源
   * @param componentId 组件ID
   */
  static getComponentDataSources(componentId: string): DataSourceDefinition[] {
    // 实现逻辑...
  }
  
  /**
   * 绑定数据源
   * @param componentId 组件ID
   * @param dataSourceKey 数据源键
   * @param dataSourceConfig 数据源配置
   */
  static bindDataSource(
    componentId: string,
    dataSourceKey: string,
    dataSourceConfig: any
  ): void {
    // 实现逻辑...
  }
  
  /**
   * 解绑数据源
   * @param componentId 组件ID
   * @param dataSourceKey 数据源键
   */
  static unbindDataSource(componentId: string, dataSourceKey: string): void {
    // 实现逻辑...
  }
  
  /**
   * 获取数据源数据
   * @param componentId 组件ID
   * @param dataSourceKey 数据源键
   */
  static getDataSourceData(componentId: string, dataSourceKey: string): any {
    // 实现逻辑...
  }
}
```

### useDataBinding - 数据绑定Hook

```typescript
/**
 * 数据绑定Hook
 */
export function useDataBinding(componentId: string) {
  /**
   * 绑定数据源
   * @param dataSourceKey 数据源键
   * @param config 数据源配置
   */
  const bindDataSource = (dataSourceKey: string, config: any): void => {
    DataSourceManager.bindDataSource(componentId, dataSourceKey, config)
  }
  
  /**
   * 获取绑定的数据
   * @param dataSourceKey 数据源键
   */
  const getBindingData = (dataSourceKey: string): Ref<any> => {
    // 返回响应式数据引用
  }
  
  /**
   * 监听数据变化
   * @param dataSourceKey 数据源键
   * @param handler 处理函数
   */
  const watchDataSource = (
    dataSourceKey: string,
    handler: (newData: any, oldData?: any) => void
  ): () => void => {
    // 实现逻辑...
    // 返回取消监听函数
  }
  
  /**
   * 刷新数据源
   * @param dataSourceKey 数据源键
   */
  const refreshDataSource = (dataSourceKey: string): Promise<void> => {
    // 实现逻辑...
  }
  
  return {
    bindDataSource,
    getBindingData,
    watchDataSource,
    refreshDataSource
  }
}
```

## 🎨 布局系统API

### LayoutManager - 布局管理器

```typescript
/**
 * 布局管理器类
 */
export class LayoutManager {
  /**
   * 设置组件布局
   * @param componentId 组件ID
   * @param rendererType 渲染器类型
   * @param layout 布局配置
   */
  static setComponentLayout(
    componentId: string,
    rendererType: 'canvas' | 'gridstack',
    layout: CanvasLayoutConfig | GridstackLayoutConfig
  ): void {
    // 实现逻辑...
  }
  
  /**
   * 获取组件布局
   * @param componentId 组件ID
   * @param rendererType 渲染器类型
   */
  static getComponentLayout(
    componentId: string,
    rendererType: 'canvas' | 'gridstack'
  ): CanvasLayoutConfig | GridstackLayoutConfig | undefined {
    // 实现逻辑...
  }
  
  /**
   * 验证布局约束
   * @param layout 布局配置
   * @param constraints 约束条件
   */
  static validateLayoutConstraints(
    layout: any,
    constraints: LayoutConstraints
  ): { valid: boolean; errors: string[] } {
    // 实现逻辑...
  }
}

/**
 * Canvas渲染器布局配置
 */
export interface CanvasLayoutConfig {
  x: number                                // X坐标
  y: number                                // Y坐标
  width: number                            // 宽度
  height: number                           // 高度
  rotation?: number                        // 旋转角度
  zIndex?: number                          // 层级
}

/**
 * Gridstack渲染器布局配置
 */
export interface GridstackLayoutConfig {
  x: number                                // 列位置
  y: number                                // 行位置
  w: number                                // 宽度（格数）
  h: number                                // 高度（格数）
  minW?: number                            // 最小宽度
  minH?: number                            // 最小高度
  maxW?: number                            // 最大宽度
  maxH?: number                            // 最大高度
}

/**
 * 布局约束条件
 */
export interface LayoutConstraints {
  minSize: { width: number; height: number }  // 最小尺寸
  maxSize: { width: number; height: number }  // 最大尺寸
  aspectRatio?: number                        // 宽高比约束
  resizable: boolean                          // 是否可调整大小
  draggable?: boolean                         // 是否可拖拽
}
```

## 🔍 验证工具API

### ComponentValidator - 组件验证器

```typescript
/**
 * 组件验证器类
 */
export class ComponentValidator {
  /**
   * 验证组件定义
   * @param definition 组件定义
   */
  static validateDefinition(definition: ComponentDefinition): ValidationResult {
    // 实现逻辑...
  }
  
  /**
   * 验证配置项
   * @param settingConfig 配置项数组
   */
  static validateSettingConfig(settingConfig: Setting[]): ValidationResult {
    // 实现逻辑...
  }
  
  /**
   * 验证数据源定义
   * @param dataSources 数据源定义数组
   */
  static validateDataSources(dataSources: DataSourceDefinition[]): ValidationResult {
    // 实现逻辑...
  }
  
  /**
   * 验证交互配置
   * @param interaction 交互配置
   */
  static validateInteraction(interaction: InteractionCapability): ValidationResult {
    // 实现逻辑...
  }
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean                           // 是否有效
  errors: ValidationError[]                // 错误列表
  warnings: ValidationWarning[]            // 警告列表
}

/**
 * 验证错误
 */
export interface ValidationError {
  code: string                             // 错误代码
  message: string                          // 错误信息
  path?: string                            // 错误路径
  value?: any                              // 错误值
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  code: string                             // 警告代码
  message: string                          // 警告信息
  path?: string                            // 警告路径
  suggestion?: string                      // 改进建议
}
```

## 📚 使用示例

### 完整组件开发示例

```typescript
// definition.ts
import type { ComponentDefinition } from '../../../core/types'
import MyComponent from './index.vue'
import MySetting from './setting.vue'
import { mySettingConfig, customConfig } from './settingConfig'

const definition: ComponentDefinition = {
  type: 'my-awesome-component',
  name: '我的组件',
  description: '一个功能强大的示例组件',
  version: '1.0.0',
  author: 'ThingsPanel',
  
  // 分类信息
  mainCategory: 'test',
  subCategory: '演示组件',
  category: '测试',
  
  // UI信息
  icon: `<svg>...</svg>`,
  tags: ['示例', '测试', '演示'],
  
  // 组件实现
  component: MyComponent,
  configComponent: MySetting,
  
  // 配置
  config: {
    type: 'my-awesome-component',
    customize: customConfig
  },
  settingConfig: mySettingConfig,
  
  // 布局
  defaultLayout: {
    canvas: { width: 300, height: 200, x: 0, y: 0 },
    gridstack: { w: 4, h: 3, x: 0, y: 0, minW: 2, minH: 2 }
  },
  
  // 数据源
  dataSources: [{
    key: 'mainData',
    name: '主数据源',
    description: '组件主要数据',
    supportedTypes: ['static', 'api'],
    fieldMappings: {
      'value': {
        targetField: 'dataValue',
        type: 'value',
        required: true,
        defaultValue: 0
      }
    },
    required: false
  }],
  
  // 交互
  interaction: {
    capability: {
      supportedEvents: ['click', 'dataChange'],
      supportedActions: ['jump', 'modify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['dataValue', 'status']
    }
  },
  
  // 权限和特性
  permission: '不限',
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true
  }
}

export default definition
```

### Vue组件集成示例

```vue
<template>
  <div class="my-awesome-component">
    <h3 @click="handleTitleClick">{{ title }}</h3>
    <div class="value-display">{{ dataValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useInteractionEmitter, usePropertyExposure } from '@/card2.1/hooks'

// Props接口
interface Props {
  title?: string
  dataValue?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  dataValue: 0,
  color: '#2080f0'
})

// 交互系统
const { emitEvent, emitDataChange } = useInteractionEmitter()

// 属性暴露
const { exposeProperties } = usePropertyExposure('my-awesome-component')

// 内部状态
const status = ref('normal')
const clickCount = ref(0)

// 计算属性
const displayValue = computed(() => {
  return `${props.dataValue} (${clickCount.value})`
})

// 暴露属性给交互系统
exposeProperties({
  dataValue: computed(() => props.dataValue),
  status: status,
  clickCount: clickCount,
  displayValue: displayValue
})

// 事件处理
const handleTitleClick = () => {
  clickCount.value++
  
  // 触发交互事件
  emitEvent('click', {
    target: 'title',
    clickCount: clickCount.value,
    timestamp: new Date()
  })
}

// 监听数据变化
watch(() => props.dataValue, (newValue, oldValue) => {
  // 触发数据变化事件
  emitDataChange({
    property: 'dataValue',
    newValue,
    oldValue,
    timestamp: new Date()
  })
})
</script>

<style scoped>
.my-awesome-component {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--card-color);
}

.my-awesome-component h3 {
  margin: 0 0 12px 0;
  color: v-bind(color);
  cursor: pointer;
}

.value-display {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-color);
}
</style>
```

## 🔗 相关资源

- [快速开始](./01-quick-start.md)
- [组件定义详解](./04-component-definition.md)
- [数据源系统](./06-data-sources.md)
- [交互系统](./08-interaction-system.md)
- [示例库](./19-examples.md)

---

**完整的API参考让开发更加高效！** 📖