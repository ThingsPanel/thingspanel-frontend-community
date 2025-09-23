# Enum Control 组件 Card 2.1 迁移配置文档

## 组件概述

Enum Control 组件是一个枚举控制器卡片，提供多选项按钮控制功能。用户可以通过按钮组选择不同的枚举值来控制设备状态，支持属性、遥测和命令数据的发布。

## 当前实现分析

### 组件配置 (index.ts)
- **组件ID**: `chart-enumcontrol`
- **组件类型**: `chart`
- **标题**: `$t('card.enumControl')` (枚举控制)
- **数据源**: 设备来源，支持1个数据源
- **默认布局**: 3x2 (最小高度1)

### 组件实现 (component.vue)
- **按钮配置**: 支持自定义按钮选项 (label + value)
- **数据发布**: 支持属性、遥测、命令三种数据类型发布
- **数据类型**: 支持 string、number、boolean 类型转换
- **状态显示**: 当前选中值高亮显示
- **实时更新**: 支持 WebSocket 数据更新
- **默认选项**: 提供空调控制的默认按钮配置

## Card 2.1 迁移配置

### 组件定义
```typescript
export const enumControlCard: CardDefinition = {
  id: 'enum-control',
  name: '枚举控制器',
  category: 'control',
  description: '枚举值控制器，支持多选项按钮控制设备状态',
  version: '2.1.0',
  
  // 数据源配置
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes', 'telemetry', 'command'],
    description: '设备属性、遥测或命令数据源',
    capabilities: ['read', 'write'],
    dataTypes: ['string', 'number', 'boolean']
  },
  
  // 布局配置
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 6, height: 3 },
    resizable: true
  },
  
  // 配置选项
  configSchema: {
    btOptions: {
      type: 'array',
      title: '按钮选项',
      description: '枚举控制的按钮配置',
      required: true,
      default: [
        { label: '加热', value: 'heat' },
        { label: '制冷', value: 'cool' },
        { label: '通风', value: 'fan' },
        { label: '自动', value: 'auto' }
      ],
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            title: '显示文本',
            required: true
          },
          value: {
            type: 'string',
            title: '数据值',
            required: true
          }
        }
      },
      minItems: 1,
      maxItems: 8
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
    metricsType: 'attributes' | 'telemetry' | 'command';
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
      type: 'attribute' | 'telemetry' | 'command';
      dataType: 'string' | 'number' | 'boolean';
      access: 'read' | 'write' | 'readwrite';
      enumValues?: Array<{
        label: string;
        value: string | number | boolean;
      }>;
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
        type: deviceSource.metricsType === 'attributes' ? 'attribute' : 
              deviceSource.metricsType === 'telemetry' ? 'telemetry' : 'command',
        dataType: deviceSource.metricsDataType,
        access: 'readwrite'
      }]
    }
  };
}
```

### 实现要点

1. **按钮配置管理**
   - 支持动态配置按钮选项
   - 每个按钮包含显示文本和数据值
   - 支持最多8个按钮选项

2. **数据类型转换**
   - string: 直接使用字符串值
   - number: 使用 parseFloat 转换
   - boolean: 使用 Boolean 转换

3. **多种数据发布方式**
   - 属性数据：attributeDataPub
   - 遥测数据：telemetryDataPub
   - 命令数据：commandDataPub

4. **状态管理**
   - 当前选中值高亮显示
   - 支持 WebSocket 实时更新
   - 操作成功/失败反馈

5. **用户界面**
   - 响应式按钮布局
   - 选中状态视觉反馈
   - 悬停效果增强交互

## 迁移检查清单

- [ ] 验证数据源映射正确性
- [ ] 确认按钮配置功能
- [ ] 测试数据类型转换
- [ ] 验证多种数据发布方式
- [ ] 检查权限控制
- [ ] 测试状态显示
- [ ] 验证实时数据更新
- [ ] 确认操作反馈机制
- [ ] 测试响应式布局

## 迁移步骤

1. **创建 Card 2.1 组件定义**
   - 定义组件元数据和配置架构
   - 设置数据源要求和权限控制
   - 配置按钮选项验证规则

2. **实现数据源适配器**
   - 创建数据源映射函数
   - 处理多种数据类型支持
   - 适配不同发布方式

3. **迁移控制逻辑**
   - 保持按钮配置管理
   - 适配新的数据发布接口
   - 维护数据类型转换

4. **更新配置表单**
   - 适配 Card 2.1 配置架构
   - 优化按钮配置界面
   - 添加配置验证

5. **增强用户体验**
   - 改进按钮布局算法
   - 优化状态反馈
   - 添加操作确认

6. **测试验证**
   - 功能测试：按钮控制、状态显示
   - 配置测试：按钮选项管理
   - 权限测试：读写权限验证
   - 兼容性测试：不同数据类型、设备类型
   - 用户体验测试：交互响应、视觉反馈

## 配置验证规则

1. **按钮选项验证**
   - 至少配置1个按钮，最多8个
   - 每个按钮必须有显示文本和数据值
   - 数据值不能重复

2. **数据类型验证**
   - 确保数据值与指标数据类型匹配
   - 验证数值类型的有效性
   - 检查布尔值的正确性

3. **权限验证**
   - 验证用户控制权限
   - 检查设备写入权限
   - 确认操作安全性

## 使用场景

1. **空调控制**
   - 模式选择：制热、制冷、通风、自动
   - 状态显示：当前运行模式

2. **设备模式控制**
   - 工作模式：手动、自动、维护
   - 运行状态：启动、停止、暂停

3. **参数设置**
   - 档位选择：低、中、高
   - 优先级设置：紧急、正常、低优先级

## 相关文档

- [Card 2.1 架构文档](../architecture/card21-architecture.md)
- [数据源映射指南](../guides/data-source-mapping.md)
- [枚举控制安全指南](../guides/enum-control-security.md)
- [按钮配置规范](../guides/button-configuration.md)