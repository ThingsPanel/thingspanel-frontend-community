# Digit Indicator 组件 Card 2.1 迁移配置

## 组件概述
**组件名称**: digit-indicator (数字指示器)  
**组件ID**: chart-digit  
**分类**: information (信息展示)  
**功能**: 以大字体数字形式显示设备数据，支持单位和颜色配置，自适应字体大小

## 当前实现分析

### 配置结构
```typescript
// 当前配置接口
interface CurrentConfig {
  dataSource: {
    origin: 'device';
    sourceNum: 1;
    systemSource: [{}];
    deviceSource: [{
      metricsType: 'telemetry' | 'attributes';
      deviceId: string;
      metricsId: string;
    }];
  };
  config: {
    name: string; // 显示名称
  };
  iCardViewDefault: {
    w: 2; h: 2; minH: 1; minW: 1;
  };
}
```

### 数据获取方式
- **遥测数据**: 通过 `telemetryDataCurrentKeys` API 获取当前值
- **属性数据**: 通过 `getAttributeDataSet` API 获取设备属性
- **WebSocket更新**: 支持实时数据更新，包含数组数据处理
- **单位处理**: 自动提取数据中的 unit 字段，默认为 '%'

### 布局特性
- **自适应字体**: 根据容器尺寸动态调整字体大小
- **响应式设计**: 使用 ResizeObserver 监听容器变化
- **最小尺寸**: 支持 1x1 最小布局

## Card 2.1 迁移配置

### 组件定义
```typescript
import type { ComponentDefinition } from '@/card2.1/core/types';

export const digitIndicatorDefinition: ComponentDefinition = {
  type: 'digit-indicator',
  name: '数字指示器',
  description: '以大字体数字形式显示设备数据，支持单位和自适应字体',
  category: 'information',
  
  // 默认配置
  defaultConfig: {
    displayName: '数字指示器',
    fontSize: 'auto', // 自适应字体大小
    showUnit: true,
    unitPosition: 'suffix', // 'prefix' | 'suffix'
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
    backgroundColor: 'transparent'
  },
  
  // 布局配置
  layout: {
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 12, height: 12 },
    resizable: true,
    aspectRatio: null // 允许任意比例
  },
  
  // 数据源配置
  dataSources: {
    primary: {
      type: 'device-telemetry',
      required: true,
      multiple: false,
      description: '设备遥测数据源'
    }
  },
  
  // 静态参数配置
  staticParams: {
    displayName: {
      type: 'string',
      label: '显示名称',
      defaultValue: '数字指示器',
      required: false
    },
    fontSize: {
      type: 'select',
      label: '字体大小',
      options: [
        { label: '自适应', value: 'auto' },
        { label: '小', value: 'small' },
        { label: '中', value: 'medium' },
        { label: '大', value: 'large' },
        { label: '特大', value: 'xlarge' }
      ],
      defaultValue: 'auto'
    },
    showUnit: {
      type: 'boolean',
      label: '显示单位',
      defaultValue: true
    },
    unitPosition: {
      type: 'select',
      label: '单位位置',
      options: [
        { label: '前缀', value: 'prefix' },
        { label: '后缀', value: 'suffix' }
      ],
      defaultValue: 'suffix',
      condition: { showUnit: true }
    },
    textAlign: {
      type: 'select',
      label: '文本对齐',
      options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' }
      ],
      defaultValue: 'center'
    },
    color: {
      type: 'color',
      label: '文字颜色',
      defaultValue: '#333333'
    },
    backgroundColor: {
      type: 'color',
      label: '背景颜色',
      defaultValue: 'transparent'
    }
  },
  
  // 交互能力声明
  interactionCapabilities: {
    supportedEvents: ['click', 'dataUpdate'],
    supportedActions: ['refresh', 'highlight'],
    canListenToProps: ['value', 'unit', 'status'],
    defaultInteractionConfig: {
      onClick: {
        enabled: false,
        actions: []
      },
      onDataUpdate: {
        enabled: true,
        actions: ['updateDisplay']
      }
    }
  },
  
  // 属性暴露白名单
  exposeProps: ['currentValue', 'unit', 'displayText', 'isLoading', 'hasError']
};
```

### 数据源映射
```typescript
// Card 2.1 数据源接口
interface DataSourceMapping {
  // 设备遥测数据源
  deviceTelemetry: {
    deviceId: string;
    telemetryKey: string;
    aggregation?: 'latest' | 'avg' | 'sum' | 'min' | 'max';
    timeRange?: TimeRange;
  };
  
  // 设备属性数据源  
  deviceAttribute: {
    deviceId: string;
    attributeKey: string;
  };
  
  // 系统数据源
  systemData: {
    endpoint: string;
    params?: Record<string, any>;
  };
}
```

### 实现要点

#### 1. 数据处理增强
- **多源支持**: 支持遥测、属性、系统数据等多种数据源
- **数据验证**: 增加数据类型验证和错误处理
- **缓存机制**: 实现数据缓存，减少重复请求
- **格式化**: 支持数字格式化（千分位、小数位等）

#### 2. 样式系统升级
- **主题适配**: 支持亮色/暗色主题自动切换
- **字体系统**: 更丰富的字体大小和权重选项
- **颜色系统**: 支持主题色彩和自定义颜色
- **动画效果**: 数值变化时的过渡动画

#### 3. 响应式优化
- **容器查询**: 使用现代 CSS 容器查询替代 ResizeObserver
- **断点系统**: 支持不同尺寸下的布局调整
- **性能优化**: 防抖处理和虚拟化渲染

#### 4. 交互能力
- **点击事件**: 支持点击触发自定义动作
- **状态反馈**: 加载、错误、成功状态的视觉反馈
- **工具提示**: 显示详细信息和数据来源
- **右键菜单**: 提供刷新、配置等快捷操作

## 迁移检查清单

### 功能对等性
- [ ] 设备遥测数据获取
- [ ] 设备属性数据获取  
- [ ] WebSocket 实时更新
- [ ] 自适应字体大小
- [ ] 单位显示和位置控制
- [ ] 响应式布局

### 新增功能
- [ ] 多数据源支持
- [ ] 主题适配
- [ ] 数字格式化
- [ ] 动画效果
- [ ] 交互事件
- [ ] 错误处理

### 性能优化
- [ ] 数据缓存
- [ ] 防抖处理
- [ ] 内存泄漏防护
- [ ] 渲染优化

## 迁移步骤

1. **创建组件定义文件** (`definition.ts`)
2. **实现 Vue 组件** (`component.vue`)
3. **配置数据源适配器**
4. **实现配置面板**
5. **添加主题样式**
6. **编写单元测试**
7. **性能测试和优化**
8. **文档和示例**

## 相关文档

- [Card 2.1 组件开发指南](../../../card2.1/docs/component-development.md)
- [数据源系统文档](../../../card2.1/docs/data-source-system.md)
- [交互系统文档](../../../card2.1/docs/interaction-system.md)
- [主题系统文档](../../../card2.1/docs/theme-system.md)