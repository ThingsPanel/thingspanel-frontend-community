# 动态参数绑定系统实施方案

## 项目背景

基于已有的 `DynamicParameterEditor.vue` 组件，实现一个完整的动态参数绑定系统。该系统允许组件属性与HTTP请求的动态参数进行绑定，当组件属性变化时，自动触发新的HTTP请求执行。

## 核心需求

1. **属性绑定机制**：组件属性可以绑定到HTTP动态参数（headers、query、path等）
2. **实时更新触发**：属性变化时自动更新配置并触发执行器重新执行
3. **多数据源支持**：按数据源和接口分类管理动态参数绑定
4. **默认值机制**：属性无值时使用默认值，有值时使用属性值
5. **配置持久化**：绑定配置需要保存和恢复

## 技术架构

### 1. 现有基础组件分析

**DynamicParameterEditor.vue** 已提供：
- 参数模板系统（手动输入、下拉选择、属性绑定）
- `ParameterTemplateType.PROPERTY` 模式支持
- `EnhancedParameter` 接口包含 `valueMode`、`variableName`、`description` 字段
- 属性绑定配置UI界面

### 2. 系统架构设计

```
动态参数绑定系统架构
├── DynamicParameterEditor.vue      # 参数编辑器（已有，需增强）
├── ParameterBindingManager.ts      # 核心绑定管理器（新增）
├── ComponentPropertyExposer.ts     # 组件属性暴露器（新增）
├── ConfigurationChangeNotifier.ts  # 配置变更通知器（新增）
├── DataItemFetcher.ts              # 执行器（需增强动态解析）
└── 集成点
    ├── HttpConfigForm.vue          # HTTP配置表单集成
    ├── Card2.1 属性系统           # 卡片属性暴露接口
    └── Visual Editor 集成         # 编辑器组件属性获取
```

## 详细实施方案

### 阶段1：增强现有 DynamicParameterEditor

#### 1.1 扩展 EnhancedParameter 接口

```typescript
// 在 DynamicParameterEditor.vue 中扩展接口
interface EnhancedParameter {
  key: string
  value: string | number | boolean
  enabled: boolean
  valueMode: ParameterTemplateType
  selectedTemplate?: string
  variableName?: string
  description?: string
  dataType: 'string' | 'number' | 'boolean' | 'json'
  
  // 新增：属性绑定相关字段
  bindingInfo?: {
    componentId?: string           // 绑定的组件ID
    propertyPath?: string          // 属性路径（如 'config.deviceId'）
    propertyType?: string          // 属性类型
    fallbackValue?: any           // 回退默认值
    isActive?: boolean            // 绑定是否激活
  }
}
```

#### 1.2 属性选择器组件

```typescript
// 新增组件属性选择逻辑
const availableProperties = computed(() => {
  if (!props.componentId) return []
  return getComponentProperties(props.componentId)
})

const onPropertyBinding = (param: EnhancedParameter, propertyPath: string) => {
  const updatedParam = { ...param }
  updatedParam.bindingInfo = {
    componentId: props.componentId,
    propertyPath,
    isActive: true,
    fallbackValue: param.value
  }
  // 注册绑定关系到 ParameterBindingManager
  parameterBindingManager.registerBinding(param.key, updatedParam.bindingInfo)
  updateParameter(updatedParam, index)
}
```

#### 1.3 UI界面增强

```vue
<!-- 属性绑定模式的UI增强 -->
<div v-if="param.valueMode === 'property'" class="property-binding-config">
  <n-space vertical size="small">
    <!-- 现有UI保持不变 -->
    <div class="binding-info">
      <n-tag size="small" type="info">属性绑定 - 运行时动态获取值</n-tag>
    </div>
    
    <!-- 新增：属性选择器 -->
    <n-space align="center" size="small">
      <n-text depth="3" style="font-size: 11px; width: 60px">绑定属性:</n-text>
      <n-select
        :value="param.bindingInfo?.propertyPath"
        :options="availableProperties"
        placeholder="选择要绑定的组件属性"
        size="small"
        style="flex: 1"
        @update:value="path => onPropertyBinding(param, path)"
      />
    </n-space>
    
    <!-- 新增：绑定状态显示 -->
    <n-space align="center" size="small" v-if="param.bindingInfo?.isActive">
      <n-text depth="3" style="font-size: 11px; width: 60px">当前值:</n-text>
      <n-tag size="small" :type="getBindingValueType(param)">
        {{ getCurrentBindingValue(param) || '使用默认值' }}
      </n-tag>
    </n-space>
  </n-space>
</div>
```

### 阶段2：核心绑定管理系统

#### 2.1 ParameterBindingManager.ts

```typescript
/**
 * 参数绑定管理器
 * 负责管理组件属性与HTTP参数的绑定关系
 */
export class ParameterBindingManager {
  private bindingRegistry = new Map<string, BindingConfiguration>()
  private propertyWatchers = new Map<string, WatchStopHandle>()
  private configurationNotifier: ConfigurationChangeNotifier
  
  constructor() {
    this.configurationNotifier = new ConfigurationChangeNotifier()
  }
  
  /**
   * 注册参数绑定
   */
  registerBinding(
    parameterId: string, 
    componentId: string, 
    propertyPath: string,
    fallbackValue: any
  ): void {
    const binding: BindingConfiguration = {
      parameterId,
      componentId,
      propertyPath,
      fallbackValue,
      isActive: true
    }
    
    this.bindingRegistry.set(parameterId, binding)
    this.setupPropertyWatch(binding)
  }
  
  /**
   * 设置属性监听
   */
  private setupPropertyWatch(binding: BindingConfiguration): void {
    const component = this.getComponentInstance(binding.componentId)
    if (!component) return
    
    const stopWatcher = watch(
      () => this.getNestedProperty(component, binding.propertyPath),
      (newValue) => {
        this.onPropertyChange(binding.parameterId, newValue)
      },
      { immediate: true, deep: true }
    )
    
    this.propertyWatchers.set(binding.parameterId, stopWatcher)
  }
  
  /**
   * 属性变化处理
   */
  private onPropertyChange(parameterId: string, newValue: any): void {
    const binding = this.bindingRegistry.get(parameterId)
    if (!binding) return
    
    const effectiveValue = newValue !== undefined ? newValue : binding.fallbackValue
    
    // 通知配置变更
    this.configurationNotifier.notifyParameterChange(parameterId, effectiveValue)
  }
  
  /**
   * 获取当前绑定值
   */
  getCurrentBindingValue(parameterId: string): any {
    const binding = this.bindingRegistry.get(parameterId)
    if (!binding) return undefined
    
    const component = this.getComponentInstance(binding.componentId)
    if (!component) return binding.fallbackValue
    
    const propertyValue = this.getNestedProperty(component, binding.propertyPath)
    return propertyValue !== undefined ? propertyValue : binding.fallbackValue
  }
  
  /**
   * 解除绑定
   */
  unregisterBinding(parameterId: string): void {
    const watcher = this.propertyWatchers.get(parameterId)
    if (watcher) {
      watcher()
      this.propertyWatchers.delete(parameterId)
    }
    this.bindingRegistry.delete(parameterId)
  }
  
  /**
   * 获取组件实例（需要与Card2.1系统集成）
   */
  private getComponentInstance(componentId: string): any {
    // TODO: 与Card2.1系统集成，获取组件实例
    return getCard2ComponentInstance(componentId)
  }
  
  /**
   * 获取嵌套属性值
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}

// 全局实例
export const parameterBindingManager = new ParameterBindingManager()
```

#### 2.2 ConfigurationChangeNotifier.ts

```typescript
/**
 * 配置变更通知器
 * 负责通知相关系统配置已变更，触发重新执行
 */
export class ConfigurationChangeNotifier {
  private changeListeners = new Map<string, Set<(value: any) => void>>()
  
  /**
   * 注册配置变更监听
   */
  onParameterChange(parameterId: string, callback: (value: any) => void): void {
    if (!this.changeListeners.has(parameterId)) {
      this.changeListeners.set(parameterId, new Set())
    }
    this.changeListeners.get(parameterId)!.add(callback)
  }
  
  /**
   * 通知参数变更
   */
  notifyParameterChange(parameterId: string, newValue: any): void {
    const listeners = this.changeListeners.get(parameterId)
    if (listeners) {
      listeners.forEach(callback => callback(newValue))
    }
    
    // 触发全局配置重新执行
    this.triggerConfigurationReexecution(parameterId, newValue)
  }
  
  /**
   * 触发配置重新执行
   */
  private triggerConfigurationReexecution(parameterId: string, newValue: any): void {
    // 找到包含此参数的所有HTTP配置
    const affectedConfigurations = this.findAffectedConfigurations(parameterId)
    
    affectedConfigurations.forEach(config => {
      // 更新配置中的参数值
      this.updateConfigurationParameter(config, parameterId, newValue)
      
      // 触发DataItemFetcher重新执行
      this.triggerDataItemRefetch(config)
    })
  }
  
  /**
   * 查找受影响的配置
   */
  private findAffectedConfigurations(parameterId: string): HttpConfig[] {
    // TODO: 实现配置查找逻辑
    // 需要维护参数ID到配置的映射关系
    return []
  }
  
  /**
   * 更新配置参数值
   */
  private updateConfigurationParameter(
    config: HttpConfig, 
    parameterId: string, 
    newValue: any
  ): void {
    // 更新headers中的参数
    if (config.headers) {
      Object.keys(config.headers).forEach(key => {
        if (this.isParameterReference(config.headers![key], parameterId)) {
          config.headers![key] = String(newValue)
        }
      })
    }
    
    // 更新query参数
    if (config.params) {
      config.params.forEach(param => {
        if (param.variableName === parameterId) {
          param.value = newValue
        }
      })
    }
    
    // 更新路径参数
    if (config.pathParameter?.variableName === parameterId) {
      config.pathParameter.value = newValue
    }
  }
  
  /**
   * 触发数据项重新获取
   */
  private triggerDataItemRefetch(config: HttpConfig): void {
    // TODO: 与DataItemFetcher集成，触发重新执行
    console.log('🔄 配置变更触发重新执行:', config)
  }
  
  /**
   * 检查是否为参数引用
   */
  private isParameterReference(value: string, parameterId: string): boolean {
    // 简单的参数引用检查逻辑
    return value.includes(`{${parameterId}}`)
  }
}
```

### 阶段3：组件属性暴露系统

#### 3.1 ComponentPropertyExposer.ts

```typescript
/**
 * 组件属性暴露器
 * 负责从Card2.1组件中暴露可绑定的属性
 */
export class ComponentPropertyExposer {
  /**
   * 获取组件可绑定属性
   */
  getComponentProperties(componentId: string): PropertyDescriptor[] {
    const component = this.getComponentInstance(componentId)
    if (!component) return []
    
    const definition = this.getComponentDefinition(componentId)
    if (!definition) return []
    
    // 方案1：基于组件定义的properties声明
    if (definition.properties) {
      return this.extractFromProperties(definition.properties)
    }
    
    // 方案2：基于组件实际属性（运行时反射）
    return this.extractFromInstance(component)
  }
  
  /**
   * 从properties定义提取属性
   */
  private extractFromProperties(properties: Record<string, any>): PropertyDescriptor[] {
    return Object.entries(properties).map(([key, prop]) => ({
      path: key,
      label: prop.label || key,
      type: prop.type,
      description: prop.description,
      category: 'config'
    }))
  }
  
  /**
   * 从组件实例提取属性
   */
  private extractFromInstance(component: any): PropertyDescriptor[] {
    const properties: PropertyDescriptor[] = []
    
    // 提取config属性
    if (component.config) {
      Object.keys(component.config).forEach(key => {
        properties.push({
          path: `config.${key}`,
          label: key,
          type: typeof component.config[key],
          category: 'config'
        })
      })
    }
    
    // 提取其他可用属性
    const excludeKeys = ['config', '$el', '$parent', '$root']
    Object.keys(component).forEach(key => {
      if (!excludeKeys.includes(key) && !key.startsWith('_')) {
        properties.push({
          path: key,
          label: key,
          type: typeof component[key],
          category: 'runtime'
        })
      }
    })
    
    return properties
  }
  
  private getComponentInstance(componentId: string): any {
    // TODO: 与Card2.1系统集成
    return null
  }
  
  private getComponentDefinition(componentId: string): any {
    // TODO: 与Card2.1系统集成
    return null
  }
}

interface PropertyDescriptor {
  path: string
  label: string
  type: string
  description?: string
  category: 'config' | 'runtime'
}

export const componentPropertyExposer = new ComponentPropertyExposer()
```

### 阶段4：DataItemFetcher增强

#### 4.1 动态参数解析增强

```typescript
// 在 DataItemFetcher.ts 中增强
private async fetchHttpData(config: HttpDataItemConfig): Promise<any> {
  try {
    // 现有逻辑保持不变...
    
    // 新增：动态参数解析步骤
    const resolvedConfig = await this.resolveDynamicParameters(config)
    
    // 使用解析后的配置继续执行...
    // ... 现有请求逻辑
    
  } catch (error) {
    console.error('DataItemFetcher: HTTP数据获取失败', error)
    return {}
  }
}

/**
 * 解析动态参数
 */
private async resolveDynamicParameters(config: HttpDataItemConfig): Promise<HttpDataItemConfig> {
  const resolvedConfig = { ...config }
  
  // 解析路径参数
  if (resolvedConfig.pathParameter?.variableName) {
    const bindingValue = parameterBindingManager.getCurrentBindingValue(
      resolvedConfig.pathParameter.variableName
    )
    if (bindingValue !== undefined) {
      resolvedConfig.pathParameter.value = bindingValue
    }
  }
  
  // 解析headers中的动态参数
  if (resolvedConfig.headers) {
    Object.keys(resolvedConfig.headers).forEach(key => {
      const headerValue = resolvedConfig.headers![key]
      if (typeof headerValue === 'string' && headerValue.includes('{')) {
        resolvedConfig.headers![key] = this.interpolateValue(headerValue)
      }
    })
  }
  
  // 解析query参数
  if (resolvedConfig.params) {
    resolvedConfig.params = resolvedConfig.params.map(param => {
      if (param.variableName) {
        const bindingValue = parameterBindingManager.getCurrentBindingValue(param.variableName)
        if (bindingValue !== undefined) {
          return { ...param, value: bindingValue }
        }
      }
      return param
    })
  }
  
  console.log('🔧 [HTTP请求器] 动态参数解析完成:', {
    原始配置: config,
    解析后配置: resolvedConfig
  })
  
  return resolvedConfig
}

/**
 * 插值解析
 */
private interpolateValue(template: string): string {
  return template.replace(/\{(\w+)\}/g, (match, variableName) => {
    const bindingValue = parameterBindingManager.getCurrentBindingValue(variableName)
    return bindingValue !== undefined ? String(bindingValue) : match
  })
}
```

### 阶段5：HttpConfigForm集成

#### 5.1 传入组件ID

```vue
<!-- HttpConfigForm.vue 增强 -->
<script setup lang="ts">
interface Props {
  modelValue: HttpConfig
  // 新增：组件ID用于属性绑定
  componentId?: string
}

const props = withDefaults(defineProps<Props>(), {
  componentId: undefined
})
</script>

<template>
  <!-- 在DynamicParameterEditor中传入componentId -->
  <DynamicParameterEditor
    v-model="httpConfig.params"
    parameter-type="query"
    title="查询参数"
    :component-id="props.componentId"
    @parameter-binding-change="onParameterBindingChange"
  />
  
  <DynamicParameterEditor
    v-model="httpConfig.headers"
    parameter-type="header"
    title="请求头"
    :component-id="props.componentId"
    @parameter-binding-change="onParameterBindingChange"
  />
</template>
```

#### 5.2 绑定变更处理

```typescript
/**
 * 处理参数绑定变更
 */
const onParameterBindingChange = (parameterId: string, bindingInfo: any) => {
  console.log('参数绑定变更:', { parameterId, bindingInfo })
  
  // 可以在这里添加额外的处理逻辑
  // 例如：保存配置、验证绑定等
}
```

### 阶段6：Card2.1系统集成

#### 6.1 组件属性声明规范

```typescript
// Card2.1组件需要声明可绑定属性
export const MyCard2Component: ComponentDefinition = {
  type: 'my-component',
  name: '我的组件',
  // ... 其他定义
  
  // 新增：可绑定属性声明
  bindableProperties: {
    deviceId: {
      type: 'string',
      label: '设备ID',
      description: '当前选中的设备ID',
      category: 'config'
    },
    selectedMetric: {
      type: 'string',
      label: '选中指标',
      description: '用户选择的指标名称',
      category: 'runtime'
    }
  }
}
```

## 实施时序

### Phase 1: 基础增强 (1-2天)
- [ ] 增强 `DynamicParameterEditor.vue` 的UI和接口
- [ ] 实现 `ParameterBindingManager` 核心类
- [ ] 基础的属性绑定注册和监听机制

### Phase 2: 核心系统 (2-3天)  
- [ ] 完善 `ConfigurationChangeNotifier` 
- [ ] 实现 `ComponentPropertyExposer`
- [ ] DataItemFetcher动态参数解析集成

### Phase 3: 集成测试 (1-2天)
- [ ] HttpConfigForm集成测试
- [ ] 端到端绑定流程测试
- [ ] Card2.1系统集成验证

### Phase 4: 优化和文档 (1天)
- [ ] 性能优化和错误处理
- [ ] 用户文档和示例代码
- [ ] 单元测试补充

## 技术细节和考虑事项

### 1. 内存管理
- 组件销毁时需要清理属性监听器
- 避免循环引用导致内存泄漏

### 2. 性能优化
- 属性监听的节流/防抖处理
- 批量配置更新避免频繁触发

### 3. 错误处理
- 绑定失败的降级机制
- 组件属性不存在时的处理

### 4. 类型安全
- 严格的TypeScript类型定义
- 属性类型匹配验证

### 5. 向后兼容
- 现有配置格式的兼容性保证
- 渐进式升级路径

## 总结

本方案基于现有的 `DynamicParameterEditor.vue` 组件，通过最小化的架构变更实现完整的动态参数绑定系统。核心思路是：

1. **以DynamicParameterEditor为中心**：利用现有的属性绑定UI和数据结构
2. **管理器模式**：使用ParameterBindingManager统一管理所有绑定关系
3. **响应式触发**：通过Vue的watch机制实现属性变更的实时响应
4. **配置驱动**：保持现有的配置文件结构，通过动态解析实现参数替换

该系统实现后，用户可以在HTTP配置界面直接将组件属性绑定到请求参数，实现真正的动态数据获取能力。