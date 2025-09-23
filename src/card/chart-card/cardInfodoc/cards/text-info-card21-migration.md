# Text Info 组件 Card 2.1 迁移配置

## 组件概述
**组件名称**: text-info (文本信息)  
**组件ID**: chart-text  
**分类**: information (信息展示)  
**功能**: 展示静态或动态文本信息，支持富文本格式和自适应字体

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
      metricsType: 'attributes';
      deviceId: string;
      metricsId: string;
      metricsName?: string;
    }];
  };
  iCardViewDefault: {
    w: 2; h: 2; minW: 1; minH: 1;
  };
}
```

### 数据获取方式
- **属性数据**: 通过 `getAttributeDataSet` API 获取设备属性
- **WebSocket更新**: 支持实时数据更新
- **默认值**: 当无数据时显示默认值 '1.9.2'
- **单位处理**: 自动提取属性中的 unit 字段

### 布局特性
- **自适应字体**: 根据容器尺寸动态调整字体大小
- **响应式设计**: 使用 ResizeObserver 监听容器变化
- **垂直布局**: 指标名称和值垂直排列
- **最小尺寸**: 支持 1x1 最小布局

## Card 2.1 迁移配置

### 组件定义
```typescript
import type { ComponentDefinition } from '@/card2.1/core/types';

export const textInfoDefinition: ComponentDefinition = {
  type: 'text-info',
  name: '文本信息',
  description: '展示静态或动态文本信息，支持富文本格式和自适应字体',
  category: 'information',
  
  // 默认配置
  defaultConfig: {
    title: '文本信息',
    content: '',
    fontSize: 'auto', // 自适应字体大小
    fontWeight: 'normal',
    textAlign: 'center',
    color: '#333333',
    backgroundColor: 'transparent',
    showTitle: true,
    titlePosition: 'top', // 'top' | 'bottom' | 'left' | 'right'
    richText: false, // 是否支持富文本
    defaultValue: '暂无数据',
    wordWrap: true,
    maxLines: null // 最大行数限制
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
      type: 'device-attribute',
      required: false, // 可以是静态文本
      multiple: false,
      description: '设备属性数据源'
    },
    static: {
      type: 'static-text',
      required: false,
      multiple: false,
      description: '静态文本内容'
    }
  },
  
  // 静态参数配置
  staticParams: {
    title: {
      type: 'string',
      label: '标题',
      defaultValue: '文本信息',
      required: false
    },
    content: {
      type: 'textarea',
      label: '静态内容',
      defaultValue: '',
      required: false,
      description: '当无数据源时显示的静态内容'
    },
    fontSize: {
      type: 'select',
      label: '字体大小',
      options: [
        { label: '自适应', value: 'auto' },
        { label: '12px', value: '12px' },
        { label: '14px', value: '14px' },
        { label: '16px', value: '16px' },
        { label: '18px', value: '18px' },
        { label: '20px', value: '20px' },
        { label: '24px', value: '24px' },
        { label: '28px', value: '28px' },
        { label: '32px', value: '32px' }
      ],
      defaultValue: 'auto'
    },
    fontWeight: {
      type: 'select',
      label: '字体粗细',
      options: [
        { label: '正常', value: 'normal' },
        { label: '粗体', value: 'bold' },
        { label: '细体', value: 'lighter' },
        { label: '特粗', value: 'bolder' }
      ],
      defaultValue: 'normal'
    },
    textAlign: {
      type: 'select',
      label: '文本对齐',
      options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' },
        { label: '两端对齐', value: 'justify' }
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
    },
    showTitle: {
      type: 'boolean',
      label: '显示标题',
      defaultValue: true
    },
    titlePosition: {
      type: 'select',
      label: '标题位置',
      options: [
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
        { label: '左侧', value: 'left' },
        { label: '右侧', value: 'right' }
      ],
      defaultValue: 'top',
      condition: { showTitle: true }
    },
    richText: {
      type: 'boolean',
      label: '富文本模式',
      defaultValue: false,
      description: '支持HTML标签和Markdown格式'
    },
    defaultValue: {
      type: 'string',
      label: '默认值',
      defaultValue: '暂无数据',
      description: '当数据源无数据时显示的内容'
    },
    wordWrap: {
      type: 'boolean',
      label: '自动换行',
      defaultValue: true
    },
    maxLines: {
      type: 'number',
      label: '最大行数',
      defaultValue: null,
      min: 1,
      max: 20,
      description: '限制显示的最大行数，超出部分显示省略号'
    }
  },
  
  // 交互能力声明
  interactionCapabilities: {
    supportedEvents: ['click', 'dataUpdate', 'textSelect'],
    supportedActions: ['refresh', 'copy', 'highlight'],
    canListenToProps: ['content', 'title', 'isLoading', 'hasError'],
    defaultInteractionConfig: {
      onClick: {
        enabled: false,
        actions: []
      },
      onDataUpdate: {
        enabled: true,
        actions: ['updateContent']
      },
      onTextSelect: {
        enabled: false,
        actions: ['copy']
      }
    }
  },
  
  // 属性暴露白名单
  exposeProps: ['currentContent', 'title', 'textLength', 'isLoading', 'hasError', 'dataSource']
};
```

### 数据源映射
```typescript
// Card 2.1 数据源接口
interface DataSourceMapping {
  // 设备属性数据源
  deviceAttribute: {
    deviceId: string;
    attributeKey: string;
    displayName?: string;
  };
  
  // 静态文本数据源
  staticText: {
    content: string;
    format?: 'plain' | 'html' | 'markdown';
  };
  
  // 系统数据源
  systemData: {
    endpoint: string;
    params?: Record<string, any>;
    textField: string; // 指定哪个字段作为文本内容
  };
  
  // API数据源
  apiData: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    textField: string;
  };
}
```

### 实现要点

#### 1. 文本处理增强
- **富文本支持**: 支持HTML标签和Markdown格式渲染
- **文本格式化**: 支持数字格式化、日期格式化等
- **多语言支持**: 支持国际化文本内容
- **文本截断**: 支持按字符数或行数截断，显示省略号

#### 2. 样式系统升级
- **主题适配**: 支持亮色/暗色主题自动切换
- **字体系统**: 更丰富的字体选项和自定义字体
- **排版控制**: 行高、字间距、段落间距等
- **边框和阴影**: 支持边框样式和阴影效果

#### 3. 布局系统
- **弹性布局**: 支持标题和内容的多种排列方式
- **滚动控制**: 内容超出时的滚动行为
- **对齐方式**: 支持多种文本对齐方式
- **响应式**: 不同尺寸下的布局自适应

#### 4. 交互能力
- **文本选择**: 支持文本选择和复制
- **点击事件**: 支持点击触发自定义动作
- **悬停效果**: 鼠标悬停时的视觉反馈
- **右键菜单**: 提供复制、刷新等快捷操作

#### 5. 数据处理
- **多源支持**: 支持设备属性、静态文本、API等多种数据源
- **数据验证**: 增加数据类型验证和错误处理
- **缓存机制**: 实现数据缓存，减少重复请求
- **实时更新**: WebSocket数据的实时更新

## 迁移检查清单

### 功能对等性
- [ ] 设备属性数据获取
- [ ] WebSocket 实时更新
- [ ] 自适应字体大小
- [ ] 响应式布局
- [ ] 默认值显示
- [ ] 标题和内容显示

### 新增功能
- [ ] 富文本支持
- [ ] 多数据源支持
- [ ] 主题适配
- [ ] 文本格式化
- [ ] 交互事件
- [ ] 文本选择和复制
- [ ] 多种布局模式

### 性能优化
- [ ] 数据缓存
- [ ] 防抖处理
- [ ] 内存泄漏防护
- [ ] 渲染优化
- [ ] 虚拟滚动（长文本）

## 迁移步骤

1. **创建组件定义文件** (`definition.ts`)
2. **实现 Vue 组件** (`component.vue`)
3. **配置数据源适配器**
4. **实现配置面板**
5. **添加富文本渲染器**
6. **实现主题样式**
7. **添加交互功能**
8. **编写单元测试**
9. **性能测试和优化**
10. **文档和示例**

## 相关文档

- [Card 2.1 组件开发指南](../../../card2.1/docs/component-development.md)
- [数据源系统文档](../../../card2.1/docs/data-source-system.md)
- [交互系统文档](../../../card2.1/docs/interaction-system.md)
- [主题系统文档](../../../card2.1/docs/theme-system.md)
- [富文本渲染文档](../../../card2.1/docs/rich-text-rendering.md)