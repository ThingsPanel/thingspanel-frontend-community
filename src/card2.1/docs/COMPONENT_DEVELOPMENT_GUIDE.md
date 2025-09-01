# Card 2.1 组件开发规范

## 📋 概述

本文档为 Card 2.1 系统的组件开发规范，规定了所有新组件必须遵循的开发标准和通用属性要求。

## 🚨 通用属性要求 (新组件必填)

**重要说明**: 类型定义中这两个属性是可选的(`?`)，是为了保持现有组件的兼容性。但**所有新开发的组件必须明确包含这两个属性**。

### 1. deviceId (string)
**用途**: 设备关联和模板配置
- 用于将组件与具体设备进行关联
- 支持设备模板功能，通过设备ID反查模板配置
- 可通过表单手动配置或通过设备模板自动赋值
- **新组件必须初始化为空字符串**: `deviceId: ''`

### 2. metricsList (MetricItem[])
**用途**: 存储指标配置信息
- 从设备模板配置中获取的指标列表
- 支持组件根据指标信息动态渲染数据
- 包含指标ID、名称、键值、单位等完整信息
- **新组件必须初始化为空数组**: `metricsList: []`

## 📝 MetricItem 类型定义

```typescript
export interface MetricItem {
  /** 指标唯一ID */
  id: string
  /** 指标名称 */
  name: string
  /** 指标字段键 */
  key: string
  /** 指标单位 */
  unit?: string
  /** 指标描述 */
  description?: string
  /** 数据类型 */
  dataType?: 'number' | 'string' | 'boolean' | 'object'
}
```

## 🔧 组件开发模板

### 基础组件定义结构

```typescript
/**
 * [组件名称]组件定义
 * [组件功能描述]
 */

import type { ComponentDefinition } from '@/card2.1/core/types'
import MyComponent from './MyComponent.vue'
import MyComponentConfig from './MyComponentConfig.vue'

const myComponentDefinition: ComponentDefinition = {
  // 基础信息
  type: 'my-component',
  name: '我的组件',
  description: '组件功能描述',
  category: '组件分类',
  version: '1.0.0',
  author: 'ThingsPanel',

  // 🚨 必填通用属性
  deviceId: '', // 设备ID，初始为空
  metricsList: [], // 指标列表，初始为空数组

  // 组件实现
  component: MyComponent,
  configComponent: MyComponentConfig,

  // 默认配置
  defaultConfig: {
    title: '默认标题',
    // ... 其他配置项
  },

  // 默认布局
  defaultLayout: {
    canvas: {
      width: 400,
      height: 300,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 3,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2
    }
  },

  // 静态参数配置
  staticParams: {
    // 通用属性会在配置界面中自动显示
    title: {
      type: 'string',
      title: '组件标题',
      description: '显示在组件顶部的标题',
      defaultValue: '默认标题',
      required: false
    },
    // ... 其他静态参数
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'api', 'websocket'],

  // 标签
  tags: ['custom', 'display'],

  // 特性标记
  features: {
    realtime: true,
    dataBinding: true,
    themeable: true,
    responsive: true,
    configurable: true
  }
}

export default myComponentDefinition
```

## 💡 使用场景说明

### 场景1: 设备模板自动配置
1. **模板配置阶段**: 管理员在设备模板中配置图表模板，选择卡片组件并记录到后台列表
2. **模板应用阶段**: 设备模板挂载ID后，编辑器通过设备ID反查模板ID
3. **组件筛选阶段**: 根据模板ID筛选出对应的卡片组件
4. **属性赋值阶段**: 拖拽组件时，deviceId自动赋值为当前设备ID，metricsList获取模板配置的指标

### 场景2: 手动表单配置
1. **设备选择**: 在组件配置界面选择目标设备，设置deviceId
2. **指标配置**: 手动添加或选择相关指标，填充metricsList
3. **数据绑定**: 组件根据deviceId和metricsList自动建立数据连接

## 📋 开发检查清单

在开发新组件时，请确保：

- [ ] ✅ 组件定义中包含 `deviceId: string` 属性
- [ ] ✅ 组件定义中包含 `metricsList: MetricItem[]` 属性
- [ ] ✅ 初始值设置正确（deviceId: '', metricsList: []）
- [ ] ✅ 组件配置界面支持编辑这两个属性
- [ ] ✅ 组件内部正确使用这两个属性进行数据处理
- [ ] ✅ 添加适当的注释说明属性用途
- [ ] ✅ 遵循 TypeScript 严格类型检查

## 🔗 配置界面集成

Card 2.1 的配置系统会自动识别通用属性：

### AutoFormGenerator 自动支持
```vue
<!-- 配置表单会自动为 deviceId 和 metricsList 生成编辑控件 -->
<template>
  <auto-form-generator 
    :definition="componentDefinition"
    v-model:values="configValues"
  />
</template>
```

### 自定义配置组件
如果需要特殊的编辑界面，可以在配置组件中自定义：

```vue
<template>
  <n-form>
    <!-- 设备选择器 -->
    <n-form-item label="关联设备">
      <device-selector v-model:value="localConfig.deviceId" />
    </n-form-item>
    
    <!-- 指标配置 -->
    <n-form-item label="指标配置">
      <metrics-editor v-model:value="localConfig.metricsList" />
    </n-form-item>
    
    <!-- 其他配置项... -->
  </n-form>
</template>
```

## 📚 示例参考

可以参考现有组件的实现：
- `src/card2.1/components/simple-display/definition.ts` - 基础组件示例
- `src/card2.1/components/dual-data-display/definition.ts` - 复杂数据组件示例

## ⚠️ 注意事项

1. **向后兼容**: 现有组件暂时不需要强制更新，类型系统会处理兼容性
2. **初始值**: 新建组件时通用属性为空，等待后续配置或模板赋值
3. **数据验证**: 组件应该正确处理deviceId为空和metricsList为空数组的情况
4. **性能考虑**: 大量指标时应考虑虚拟化或分页显示

## 🎯 未来功能预留

通过这两个通用属性，为以下功能预留了标准接口：
- 设备模板系统的完整集成
- 批量设备配置和管理
- 指标数据的自动绑定和更新
- 设备故障时的组件状态联动

---

**最后更新**: 2025年8月31日  
**文档版本**: 1.0.0