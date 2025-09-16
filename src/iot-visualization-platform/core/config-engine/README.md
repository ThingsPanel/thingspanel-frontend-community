# ThingsPanel Config Engine 配置引擎系统

## 🎯 系统概述

ThingsPanel Config Engine 是一个企业级的统一配置管理系统，专为 ThingsPanel IoT 平台设计。它提供了完整的配置生命周期管理，包括配置的创建、验证、版本控制、导入导出、模板管理和可视化编辑器集成。

### 核心特性

- 🎯 **统一配置管理** - 整合所有分散的配置系统
- ✅ **智能配置验证** - 实时验证和错误检测
- 📚 **完整版本控制** - Git式的配置版本管理
- 🎨 **丰富模板系统** - 可参数化的配置模板
- 🔄 **多格式导入导出** - 支持 JSON、YAML、XML 等格式
- 🎮 **Visual Editor 集成** - 无缝的可视化编辑体验
- 🚀 **高性能架构** - 事件驱动和智能缓存
- 🛡️ **企业级安全** - 权限控制和审计日志

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Config Engine 架构图                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Visual Editor│  │  Component   │  │    API       │      │
│  │ Integration  │  │    System    │  │  Clients     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│  ┌────────────────────────┴────────────────────────┐       │
│  │              Unified API Manager                │       │
│  │   (统一 API 接口层，提供 CRUD 和高级操作)         │       │
│  └─────────────────────┬───────────────────────────┘       │
│                        │                                   │
│  ┌─────────────────────┴───────────────────────────┐       │
│  │               Core Config Engine                │       │
│  │     (核心配置引擎，事件驱动架构)                   │       │
│  └─┬─────────┬─────────┬─────────┬─────────┬───────┘       │
│    │         │         │         │         │               │
│ ┌──▼──┐   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐          │
│ │验证器│   │版本 │   │模板 │   │导入 │   │事件 │          │
│ │     │   │管理 │   │系统 │   │导出 │   │总线 │          │
│ │     │   │器   │   │     │   │     │   │     │          │
│ └─────┘   └─────┘   └─────┘   └─────┘   └─────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 模块组成

### 1. 核心模块 (Core Engine)
- **文件**: `index.ts`
- **功能**: 配置引擎核心，提供基础的配置 CRUD 操作
- **特性**: 事件驱动架构、多级索引、依赖管理

### 2. 配置验证器 (Configuration Validator)
- **文件**: `config-validator.ts`
- **功能**: 配置数据的验证和规范检查
- **特性**: JSON Schema、自定义规则、批量验证、缓存优化

### 3. API 管理器 (API Manager)
- **文件**: `config-api-manager.ts`
- **功能**: 统一的配置操作接口
- **特性**: 中间件支持、权限控制、性能监控、批量操作

### 4. 版本管理器 (Version Manager)
- **文件**: `config-version-manager.ts`
- **功能**: 配置版本控制和历史管理
- **特性**: 版本回滚、变更追踪、版本比较、自动清理

### 5. 模板管理器 (Template Manager)
- **文件**: `config-template-manager.ts`
- **功能**: 配置模板和导入导出
- **特性**: 参数化模板、多格式支持、模板市场、格式转换

### 6. Visual Editor 集成 (Visual Editor Integration)
- **文件**: `visual-editor-integration.ts`
- **功能**: 与可视化编辑器的深度集成
- **特性**: 响应式状态、实时验证、自动保存、历史记录

### 7. 类型定义 (Types)
- **文件**: `types.ts`
- **功能**: 完整的 TypeScript 类型定义
- **特性**: 类型安全、泛型支持、工具类型

## 🚀 快速开始

### 1. 安装和初始化

```typescript
import {
  initializeConfigEngine,
  configEngine,
  configurationAPIManager
} from '@/iot-visualization-platform/core/config-engine'

// 初始化配置引擎
const result = await initializeConfigEngine({
  enableVisualEditorIntegration: true,
  enableRealtimeValidation: true,
  enableAutoSave: true
})

if (result.success) {
  console.log('配置引擎初始化成功')
}
```

### 2. 基础配置操作

```typescript
import { configurationAPIManager, ConfigurationType } from '@/iot-visualization-platform/core/config-engine'

// 创建新配置
const createResult = await configurationAPIManager.createConfiguration({
  id: 'my-device-config',
  name: '我的设备配置',
  type: ConfigurationType.DEVICE_TEMPLATE,
  version: '1.0.0',
  status: 'active',
  priority: 5,
  tags: ['设备', '传感器'],
  target: ['production'],
  data: {
    protocol: 'mqtt',
    endpoint: 'broker.example.com',
    port: 1883
  },
  metadata: {
    creator: '用户',
    source: 'api',
    isSystemConfig: false
  },
  createdAt: new Date(),
  updatedAt: new Date()
})

// 查询配置
const queryResult = await configurationAPIManager.queryConfigurations({
  type: ConfigurationType.DEVICE_TEMPLATE,
  status: 'active',
  tags: ['设备']
})

// 更新配置
const updateResult = await configurationAPIManager.updateConfiguration(
  'my-device-config',
  {
    data: {
      ...existingData,
      timeout: 10000
    }
  }
)
```

### 3. 使用配置模板

```typescript
import { configurationTemplateManager } from '@/iot-visualization-platform/core/config-engine'

// 获取可用模板
const templates = configurationTemplateManager.getAvailableTemplates(
  ConfigurationType.DEVICE_TEMPLATE
)

// 使用模板创建配置
const configFromTemplate = await configurationTemplateManager.createConfigurationFromTemplate(
  'builtin-device-template',
  {
    parameters: {
      deviceName: '温度传感器01',
      deviceType: 'temperature',
      protocol: 'mqtt',
      address: 'sensor-01.local',
      port: 1883
    },
    environment: 'production',
    timestamp: new Date()
  }
)
```

### 4. Visual Editor 集成

```vue
<template>
  <div class="config-editor">
    <!-- 配置面板 -->
    <div v-if="panelState.visible" class="config-panel">
      <n-tabs v-model:value="panelState.activeTab">
        <n-tab-pane name="basic" tab="基础配置">
          <!-- 基础配置表单 -->
        </n-tab-pane>
        <n-tab-pane name="validation" tab="验证结果">
          <div v-if="validationState">
            <n-alert
              v-if="!validationState.isValid"
              type="error"
              title="配置验证失败"
            >
              <ul>
                <li v-for="error in validationState.errors" :key="error.code">
                  {{ error.message }}
                </li>
              </ul>
            </n-alert>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 操作按钮 -->
    <div class="toolbar">
      <n-button
        @click="actions.saveConfiguration"
        :disabled="!canSave"
        :loading="state.saveState === 'saving'"
      >
        保存配置
      </n-button>
      <n-button @click="undo" :disabled="!history.canUndo">
        撤销
      </n-button>
      <n-button @click="redo" :disabled="!history.canRedo">
        重做
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorConfigurationIntegration } from '@/iot-visualization-platform/core/config-engine'

const {
  state,
  panelState,
  history,
  actions,
  canSave,
  undo,
  redo
} = useEditorConfigurationIntegration()

// 监听配置变更
watch(() => state.currentConfig, (newConfig) => {
  if (newConfig) {
    console.log('当前配置已更新:', newConfig.id)
  }
})
</script>
```

## 📚 详细功能说明

### 配置验证系统

配置验证器提供多层次的验证机制：

```typescript
import { validateConfiguration, configurationValidator } from '@/iot-visualization-platform/core/config-engine'

// 单个配置验证
const validation = await validateConfiguration(configItem, {
  level: 'strict',
  environment: 'production'
})

if (!validation.isValid) {
  console.log('验证失败:', validation.errors)
}

// 批量验证
const bulkValidation = await configurationValidator.validateConfigurations(
  [config1, config2, config3]
)

// 自定义验证规则
configurationValidator.registerValidationRule({
  name: 'custom-device-rule',
  description: '自定义设备配置验证',
  validate: async (item, context) => {
    const errors = []
    if (item.type === 'device-template' && !item.data.deviceId) {
      errors.push({
        code: 'MISSING_DEVICE_ID',
        message: '设备配置必须包含设备ID',
        path: 'data.deviceId',
        severity: 'error'
      })
    }
    return errors
  }
})
```

### 版本管理系统

完整的 Git 式版本控制：

```typescript
import { configurationVersionManager } from '@/iot-visualization-platform/core/config-engine'

// 创建版本
await configurationVersionManager.createVersion(
  configItem,
  '更新设备超时配置',
  'minor',
  '开发者'
)

// 获取版本历史
const history = configurationVersionManager.getVersionHistory('config-id', {
  limit: 10,
  sortOrder: 'desc'
})

// 版本回滚
await configurationVersionManager.rollbackToVersion(
  'config-id',
  '1.2.0',
  {
    createBackup: true,
    reason: '回滚到稳定版本',
    operator: '管理员',
    validate: true,
    force: false,
    triggerEvents: true
  }
)

// 版本比较
const comparison = configurationVersionManager.compareVersions(
  'config-id',
  '1.2.0',
  '1.3.0'
)

if (comparison?.hasChanges) {
  console.log('版本差异:', comparison.changes)
}
```

### 配置导入导出

支持多种格式的配置数据交换：

```typescript
import { configurationTemplateManager } from '@/iot-visualization-platform/core/config-engine'

// 导出配置
const exportResult = await configurationTemplateManager.exportConfigurations(
  configurations,
  {
    format: 'json',
    includeMetadata: true,
    includeHistory: false,
    compress: true,
    scope: {
      type: ConfigurationType.DEVICE_TEMPLATE
    }
  }
)

// 导入配置
const importResult = await configurationTemplateManager.importConfigurations(
  jsonData,
  {
    format: 'json',
    conflictResolution: 'merge',
    validate: true,
    createBackup: true,
    scope: {
      includeTypes: [ConfigurationType.DEVICE_TEMPLATE]
    }
  }
)

console.log(`导入结果: ${importResult.successCount}/${importResult.totalCount} 成功`)
```

## 🔧 高级配置

### 中间件系统

```typescript
import { configurationAPIManager } from '@/iot-visualization-platform/core/config-engine'

// 注册自定义中间件
configurationAPIManager.registerMiddleware({
  name: 'audit-middleware',
  description: '审计日志中间件',
  priority: 150,
  execute: async (hook, data, options) => {
    if (hook === 'before-create' || hook === 'before-update') {
      // 记录审计日志
      console.log(`配置操作审计: ${hook}`, {
        configId: data.id,
        operator: options.context?.userId,
        timestamp: new Date()
      })
    }
    return data
  }
})

// 设置权限管理器
configurationAPIManager.setPermissionManager(async (operation, configId, userId) => {
  // 实现自定义权限检查逻辑
  return await checkUserPermission(userId, operation, configId)
})
```

### 事件监听

```typescript
import { configEngine, visualEditorConfigurationIntegration } from '@/iot-visualization-platform/core/config-engine'

// 监听配置引擎事件
configEngine.on('configuration-created', (event) => {
  console.log('配置已创建:', event.item.id)
})

configEngine.on('configuration-updated', (event) => {
  console.log('配置已更新:', event.id)
})

// 监听编辑器集成事件
visualEditorConfigurationIntegration.on('configuration-saved', (event) => {
  console.log('编辑器配置已保存:', event.config.id)
})

visualEditorConfigurationIntegration.on('external-configuration-change', (event) => {
  // 处理外部配置变更
  console.warn('配置被外部修改:', event.configId)
})
```

## 📊 性能优化

### 缓存配置

```typescript
// API 管理器缓存配置
configurationAPIManager.clearAPICache() // 清除所有缓存
configurationAPIManager.clearAPICache('device-') // 清除特定模式的缓存

// 验证器缓存配置
configurationValidator.clearValidationCache() // 清除所有验证缓存
configurationValidator.clearValidationCache('config-id') // 清除特定配置的缓存
```

### 批量操作

```typescript
// 批量配置操作
const bulkOperations = [
  {
    operation: 'create',
    configurationId: 'config-1',
    data: config1Data
  },
  {
    operation: 'update',
    configurationId: 'config-2',
    data: updateData
  },
  {
    operation: 'delete',
    configurationId: 'config-3'
  }
]

const bulkResult = await configurationAPIManager.bulkOperations(bulkOperations)
```

## 🔍 故障排查

### 调试模式

在浏览器控制台中可以访问以下调试对象：

```javascript
// 查看系统状态
window.getConfigEngineSystemStatus()

// 直接访问各个组件
window.configEngine
window.configurationValidator
window.configurationAPIManager
window.configurationVersionManager
window.configurationTemplateManager
window.visualEditorConfigurationIntegration

// 手动初始化
window.initializeConfigEngine({
  enableVisualEditorIntegration: true,
  enableRealtimeValidation: true,
  enableAutoSave: false
})
```

### 常见问题

1. **配置验证失败**
   - 检查配置数据格式是否正确
   - 查看验证错误详情，根据建议修复
   - 确认自定义验证规则是否正确

2. **版本回滚失败**
   - 确认目标版本存在
   - 检查是否有权限执行回滚操作
   - 验证回滚后的配置是否有效

3. **Visual Editor 集成问题**
   - 确保正确导入和使用 `useEditorConfigurationIntegration`
   - 检查响应式数据的监听是否正确设置
   - 确认事件监听器的注册和清理

## 🤝 贡献指南

### 开发环境

1. 确保使用 TypeScript 严格模式
2. 所有代码必须包含详细的中文注释
3. 遵循现有的代码风格和命名约定
4. 新增功能需要包含相应的类型定义

### 提交规范

- feat: 新功能
- fix: 修复问题
- docs: 文档更新
- style: 代码风格调整
- refactor: 重构
- test: 测试相关
- chore: 构建和工具相关

## 📄 许可证

本项目遵循 ThingsPanel 开源项目的许可证协议。

---

更多详细信息请参考各个模块的内部文档和代码注释。如有问题，请在 ThingsPanel 社区中提出。