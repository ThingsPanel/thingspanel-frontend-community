# Chart Switch 组件 Card 2.1 迁移配置文档

## 组件概述

Chart Switch 组件是一个设备状态控制器卡片，提供开关控制功能。用户可以通过开关组件控制设备的状态，支持属性和遥测数据的读取与发布。

## 当前实现分析

### 组件配置 (index.ts)
- **组件ID**: `chart-switch`
- **组件类型**: `chart`
- **标题**: `$t('card.deviceStateController')` (设备状态控制器)
- **数据源**: 设备来源，支持1个数据源
- **默认布局**: 3x2 (最小高度1)

### 组件实现 (component.vue)
- **数据获取**: 支持从设备属性或遥测数据中获取开关状态
- **状态控制**: 通过 API 发布属性或遥测数据来控制设备
- **状态计算**: 根据配置的激活值判断开关状态
- **数据类型**: 支持 string、number、boolean 类型的开关值
- **实时更新**: 支持 WebSocket 数据更新

## Card 2.1 迁移配置

### 组件定义
```typescript
export const chartSwitchCard: CardDefinition = {
  id: 'chart-switch',
  name: '开关控制',
  category: 'control',
  description: '设备状态控制器，支持开关控制和状态显示',
  version: '2.1.0',
  
  // 数据源配置
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes', 'telemetry'],
    description: '设备属性或遥测数据源',
    capabilities: ['read', 'write']
  },
  
  // 布局配置
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 3 },
    resizable: true
  },
  
  // 配置选项
  configSchema: {
    active0: {
      type: 'string',
      title: '开启值',
      description: '开关开启时对应的数据值',
      placeholder: '例如: 1, true, on'
    },
    active1: {
      type: 'string',
      title: '关闭值',
      description: '开关关闭时对应的数据值',
      placeholder: '例如: 0, false, off'
    }
  },
  
  // 权限要求
  permissions: {
    read: true,
    write: true,
    control: true
  }
}
```

### 数据源映射
```typescript
// 原始数据源结构
interface OriginalDataSource {
  deviceSource: [{
    deviceId: string;
    metricsId: string;
    metricsName: string;
    metricsType: 'attributes' | 'telemetry';
    metricsDataType: 'string' | 'number' | 'boolean';
  }];
}

// Card 2.1 数据源结构
interface Card21DataSource {
  device: {
    id: string;
    metrics: [{
      id: string;
      name: string;
      type: 'attribute' | 'telemetry';
      dataType: 'string' | 'number' | 'boolean';
      access: 'read' | 'write' | 'readwrite';
    }];
  };
}

// 映射函数
function mapDataSource(original: OriginalDataSource): Card21DataSource {
  const deviceSource = original.deviceSource[0];
  return {
    device: {
      id: deviceSource.deviceId,
      metrics: [{
        id: deviceSource.metricsId,
        name: deviceSource.metricsName,
        type: deviceSource.metricsType === 'attributes' ? 'attribute' : 'telemetry',
        dataType: deviceSource.metricsDataType,
        access: 'readwrite'
      }]
    }
  };
}
```

### 实现要点

1. **开关状态计算**
   - 支持自定义开启/关闭值配置
   - 根据数据类型进行值转换
   - 默认非零值为开启状态

2. **设备控制功能**
   - 支持属性数据发布 (attributeDataPub)
   - 支持遥测数据发布 (telemetryDataPub)
   - 根据数据源类型选择发布方式

3. **数据类型处理**
   - string: 支持自定义字符串值
   - number: 支持数值转换
   - boolean: 支持布尔值转换

4. **实时数据更新**
   - 监听 WebSocket 数据更新
   - 自动计算开关状态
   - 支持配置变化响应

## 迁移检查清单

- [ ] 验证数据源映射正确性
- [ ] 确认开关状态计算逻辑
- [ ] 测试设备控制功能
- [ ] 验证数据类型转换
- [ ] 检查权限控制
- [ ] 测试实时数据更新
- [ ] 验证配置表单功能
- [ ] 确认错误处理机制

## 迁移步骤

1. **创建 Card 2.1 组件定义**
   - 定义组件元数据和配置架构
   - 设置数据源要求和权限控制
   - 配置布局约束

2. **实现数据源适配器**
   - 创建数据源映射函数
   - 处理读写权限验证
   - 适配不同数据类型

3. **迁移控制逻辑**
   - 保持开关状态计算逻辑
   - 适配新的数据发布接口
   - 维护数据类型转换

4. **更新配置表单**
   - 适配 Card 2.1 配置架构
   - 保持现有配置选项
   - 添加数据类型提示

5. **安全性增强**
   - 添加权限验证
   - 实现操作日志记录
   - 增强错误处理

6. **测试验证**
   - 功能测试：开关控制、状态显示
   - 权限测试：读写权限验证
   - 兼容性测试：不同数据类型、设备类型
   - 安全测试：权限控制、异常处理

## 安全考虑

1. **权限控制**
   - 验证用户是否有设备控制权限
   - 检查设备是否支持写入操作
   - 记录控制操作日志

2. **数据验证**
   - 验证控制值的有效性
   - 检查数据类型匹配
   - 防止无效数据发送

3. **错误处理**
   - 网络异常处理
   - 设备离线处理
   - 权限不足提示

## 相关文档

- [Card 2.1 架构文档](../architecture/card21-architecture.md)
- [数据源映射指南](../guides/data-source-mapping.md)
- [设备控制安全指南](../guides/device-control-security.md)
- [权限管理文档](../guides/permission-management.md)