# State Display 组件 Card 2.1 迁移配置文档

## 组件概述

State Display 组件是一个状态显示卡片，用于显示设备的状态信息。通过图标和颜色变化来直观地表示设备的当前状态（激活/非激活）。

## 当前实现分析

### 组件配置 (index.ts)
- **组件ID**: `chart-state`
- **组件类型**: `chart`
- **标题**: `$t('card.statusCard')` (状态卡片)
- **数据源**: 设备来源，支持1个数据源
- **默认布局**: 3x2 (最小高度1)

### 组件实现 (component.vue)
- **数据获取**: 从设备属性数据中获取状态值
- **状态计算**: 根据配置的激活值判断当前状态
- **图标显示**: 支持自定义激活/非激活状态的图标
- **颜色配置**: 支持自定义激活/非激活状态的颜色
- **响应式**: 使用 ResizeObserver 动态调整字体大小
- **数据类型**: 支持 string、number、boolean 类型的状态值

## Card 2.1 迁移配置

### 组件定义
```typescript
export const stateDisplayCard: CardDefinition = {
  id: 'state-display',
  name: '状态显示',
  category: 'information',
  description: '显示设备状态信息的卡片组件，支持图标和颜色自定义',
  version: '2.1.0',
  
  // 数据源配置
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes'],
    description: '设备属性数据源'
  },
  
  // 布局配置
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 6, height: 4 },
    resizable: true
  },
  
  // 配置选项
  configSchema: {
    activeIconName: {
      type: 'string',
      default: 'BulbOutline',
      title: '激活状态图标',
      description: '设备激活时显示的图标名称'
    },
    inactiveIconName: {
      type: 'string', 
      default: 'Bulb',
      title: '非激活状态图标',
      description: '设备非激活时显示的图标名称'
    },
    activeColor: {
      type: 'color',
      default: '#FFA500',
      title: '激活状态颜色',
      description: '设备激活时的图标颜色'
    },
    inactiveColor: {
      type: 'color',
      default: '#808080', 
      title: '非激活状态颜色',
      description: '设备非激活时的图标颜色'
    },
    active0: {
      type: 'string',
      title: '激活值',
      description: '表示激活状态的数据值'
    },
    active1: {
      type: 'string',
      title: '非激活值', 
      description: '表示非激活状态的数据值'
    }
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
    metricsType: 'attributes';
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
      type: 'attribute';
      dataType: 'string' | 'number' | 'boolean';
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
        type: 'attribute',
        dataType: deviceSource.metricsDataType
      }]
    }
  };
}
```

### 实现要点

1. **状态计算逻辑**
   - 支持多种数据类型的状态判断
   - 可配置激活/非激活的判断值
   - 默认非零值为激活状态

2. **图标系统**
   - 集成 ionicons5 图标库
   - 支持动态图标切换
   - 图标颜色可配置

3. **响应式设计**
   - 使用 ResizeObserver 监听容器大小变化
   - 动态调整字体和图标大小
   - 保持良好的视觉比例

4. **数据更新**
   - 支持 WebSocket 实时数据更新
   - 监听配置变化自动重新计算状态
   - 暴露 updateData 方法供外部调用

## 迁移检查清单

- [ ] 验证数据源映射正确性
- [ ] 确认状态计算逻辑
- [ ] 测试图标显示和切换
- [ ] 验证颜色配置功能
- [ ] 检查响应式布局
- [ ] 测试实时数据更新
- [ ] 验证多种数据类型支持
- [ ] 确认配置表单功能

## 迁移步骤

1. **创建 Card 2.1 组件定义**
   - 定义组件元数据和配置架构
   - 设置数据源要求和布局约束

2. **实现数据源适配器**
   - 创建数据源映射函数
   - 处理不同数据类型的状态值

3. **迁移组件逻辑**
   - 保持状态计算逻辑
   - 适配新的数据源结构
   - 维护图标和颜色配置

4. **更新配置表单**
   - 适配 Card 2.1 配置架构
   - 保持现有配置选项
   - 优化用户体验

5. **测试验证**
   - 功能测试：状态显示、图标切换、颜色变化
   - 兼容性测试：不同数据类型、设备类型
   - 性能测试：响应式调整、数据更新

## 相关文档

- [Card 2.1 架构文档](../architecture/card21-architecture.md)
- [数据源映射指南](../guides/data-source-mapping.md)
- [组件配置架构](../architecture/component-config-schema.md)
- [图标系统文档](../guides/icon-system.md)