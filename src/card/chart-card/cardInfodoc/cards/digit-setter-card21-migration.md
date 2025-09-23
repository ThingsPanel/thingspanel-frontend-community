# Digit Setter 组件 Card 2.1 迁移配置文档

## 组件概述

Digit Setter 组件是一个数值控制器卡片，提供滑块控制功能。用户可以通过滑块调整设备的数值参数，支持属性和遥测数据的读取与设置。

## 当前实现分析

### 组件配置 (index.ts)
- **组件ID**: `chart-digitsetter`
- **组件类型**: `chart`
- **标题**: `$t('card.numControl')` (数值控制)
- **数据源**: 设备来源，支持1个数据源
- **默认布局**: 2x2 (最小1x1)

### 组件实现 (component.vue)
- **数据获取**: 支持从设备属性或遥测数据中获取当前值
- **数值控制**: 通过滑块组件调整数值，支持 API 发布
- **配置选项**: 支持最小值、最大值、步长、小数位数配置
- **单位显示**: 自动获取并显示数据单位
- **响应式**: 使用 ResizeObserver 动态调整字体大小
- **实时更新**: 支持 WebSocket 数据更新

## Card 2.1 迁移配置

### 组件定义
```typescript
export const digitSetterCard: CardDefinition = {
  id: 'digit-setter',
  name: '数值设置器',
  category: 'control',
  description: '数值控制器，支持滑块调整设备参数值',
  version: '2.1.0',
  
  // 数据源配置
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes', 'telemetry'],
    description: '设备属性或遥测数据源',
    capabilities: ['read', 'write'],
    dataTypes: ['number']
  },
  
  // 布局配置
  layout: {
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 3 },
    resizable: true
  },
  
  // 配置选项
  configSchema: {
    min: {
      type: 'number',
      default: 0,
      title: '最小值',
      description: '滑块的最小值',
      required: true
    },
    max: {
      type: 'number',
      default: 100,
      title: '最大值',
      description: '滑块的最大值',
      required: true,
      validation: {
        min: 'min'
      }
    },
    step: {
      type: 'number',
      default: 0.1,
      title: '步长',
      description: '滑块调整的步长',
      min: 0.001,
      max: 100
    },
    decimals: {
      type: 'integer',
      default: 1,
      title: '小数位数',
      description: '显示的小数位数',
      min: 0,
      max: 6
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
    metricsDataType: 'number';
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
      dataType: 'number';
      unit?: string;
      access: 'read' | 'write' | 'readwrite';
      range?: {
        min: number;
        max: number;
      };
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
        dataType: 'number',
        access: 'readwrite'
      }]
    }
  };
}
```

### 实现要点

1. **数值控制逻辑**
   - 支持滑块实时调整数值
   - 配置最小值、最大值、步长
   - 支持小数位数控制

2. **数据获取与发布**
   - 属性数据：getAttributeDataSet / attributeDataPub
   - 遥测数据：telemetryDataCurrentKeys / telemetryDataPub
   - 自动获取数据单位信息

3. **用户界面**
   - 数值显示：当前值 + 单位
   - 滑块控制：NSlider 组件
   - 指标名称：显示数据源名称

4. **响应式设计**
   - 使用 ResizeObserver 监听容器大小
   - 动态调整字体大小
   - 保持良好的视觉比例

5. **数据验证**
   - 配置变化时验证数值范围
   - 确保数值在有效范围内
   - 支持实时数据更新

## 迁移检查清单

- [ ] 验证数据源映射正确性
- [ ] 确认数值控制逻辑
- [ ] 测试滑块功能
- [ ] 验证配置选项
- [ ] 检查权限控制
- [ ] 测试单位显示
- [ ] 验证响应式布局
- [ ] 测试实时数据更新
- [ ] 确认数值验证机制

## 迁移步骤

1. **创建 Card 2.1 组件定义**
   - 定义组件元数据和配置架构
   - 设置数据源要求和权限控制
   - 配置布局约束和数值验证

2. **实现数据源适配器**
   - 创建数据源映射函数
   - 处理数值类型验证
   - 适配单位信息获取

3. **迁移控制逻辑**
   - 保持滑块控制逻辑
   - 适配新的数据发布接口
   - 维护数值范围验证

4. **更新配置表单**
   - 适配 Card 2.1 配置架构
   - 添加数值范围验证
   - 优化配置界面

5. **增强用户体验**
   - 改进数值显示格式
   - 优化滑块交互体验
   - 添加操作反馈

6. **测试验证**
   - 功能测试：数值控制、滑块操作
   - 配置测试：范围设置、步长调整
   - 权限测试：读写权限验证
   - 兼容性测试：不同设备类型
   - 性能测试：响应式调整、数据更新

## 配置验证规则

1. **数值范围验证**
   - 最大值必须大于最小值
   - 步长必须为正数且合理
   - 小数位数在有效范围内

2. **数据类型验证**
   - 确保数据源为数值类型
   - 验证当前值在配置范围内
   - 检查单位信息有效性

3. **权限验证**
   - 验证用户控制权限
   - 检查设备写入权限
   - 确认操作安全性

## 相关文档

- [Card 2.1 架构文档](../architecture/card21-architecture.md)
- [数据源映射指南](../guides/data-source-mapping.md)
- [数值控制安全指南](../guides/numeric-control-security.md)
- [配置验证规范](../guides/config-validation.md)