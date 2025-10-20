# AutoBind 使用指南

AutoBind 功能提供了简化的数据源配置，自动将组件属性绑定到HTTP参数，无需手动配置复杂的参数绑定表达式。

## 基本概念

AutoBind 支持三种模式：
- **strict**: 严格模式，仅绑定指定的属性
- **loose**: 宽松模式，绑定所有可用属性，排除指定属性
- **custom**: 自定义模式，使用自定义绑定规则

## 配置示例

### 1. 宽松模式 (推荐)

最简单的配置，自动绑定所有标准属性：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'loose'
  }
}
```

**自动绑定的属性：**
- `base.deviceId` → `deviceId` 参数
- `base.metricsList` → `metrics` 参数
- `component.startTime` → `startTime` 参数
- `component.endTime` → `endTime` 参数
- `component.dataType` → `dataType` 参数

### 2. 严格模式

仅绑定指定的属性：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'strict',
    includeProperties: [
      'base.deviceId',
      'component.startTime',
      'component.endTime'
    ]
  }
}
```

### 3. 宽松模式 + 排除属性

绑定所有属性，但排除某些不需要的：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'loose',
    excludeProperties: [
      'component.refreshInterval', // 排除刷新间隔
      'component.filterCondition'  // 排除过滤条件
    ]
  }
}
```

### 4. 自定义模式

使用完全自定义的绑定规则：

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/custom/endpoint',
    method: 'POST'
  },
  autoBind: {
    enabled: true,
    mode: 'custom',
    customRules: [
      {
        propertyPath: 'base.deviceId',
        paramName: 'device_id', // 自定义参数名
        required: true
      },
      {
        propertyPath: 'component.customProperty',
        paramName: 'custom_param',
        transform: (value) => `prefix_${value}`, // 自定义转换
        required: false
      }
    ]
  }
}
```

## 与传统方式的对比

### 传统方式（复杂）

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET',
    params: {
      deviceId: '${component_id}.base.deviceId',
      startTime: '${component_id}.component.startTime',
      endTime: '${component_id}.component.endTime',
      metrics: '${component_id}.base.metricsList'
    }
  }
}
```

### AutoBind方式（简化）

```typescript
const dataSourceConfig = {
  type: 'http',
  config: {
    url: '/api/device/data',
    method: 'GET'
  },
  autoBind: {
    enabled: true,
    mode: 'loose'
  }
}
```

## 技术实现

AutoBind 功能由以下核心组件实现：

1. **DataSourceBindingConfig**: 管理绑定规则和参数映射
2. **SimpleDataFlow**: 处理属性变更和数据源触发
3. **VisualEditorBridge**: 在数据源执行时注入自动绑定的参数

### 绑定规则

系统内置了以下标准绑定规则：

| 属性路径 | HTTP参数名 | 数据转换 | 是否必需 |
|---------|-----------|---------|----------|
| `base.deviceId` | `deviceId` | 无 | 是 |
| `base.metricsList` | `metrics` | 数组 → 逗号分隔字符串 | 否 |
| `component.startTime` | `startTime` | Date → ISO字符串 | 否 |
| `component.endTime` | `endTime` | Date → ISO字符串 | 否 |
| `component.dataType` | `dataType` | 无 | 否 |
| `component.refreshInterval` | `refreshInterval` | 转换为整数 | 否 |
| `component.filterCondition` | `filter` | 无 | 否 |

### 扩展绑定规则

可以通过编程方式添加自定义绑定规则：

```typescript
import { dataSourceBindingConfig } from '@/core/data-architecture/DataSourceBindingConfig'

// 添加全局绑定规则
dataSourceBindingConfig.addCustomBindingRule({
  propertyPath: 'component.customField',
  paramName: 'custom_field',
  transform: (value) => value?.toString().toUpperCase(),
  required: false,
  description: '自定义字段转换为大写'
})

// 为特定组件类型设置绑定配置
dataSourceBindingConfig.setComponentConfig('my-widget', {
  componentType: 'my-widget',
  autoBindEnabled: true,
  additionalBindings: [
    {
      propertyPath: 'component.widgetSpecificProp',
      paramName: 'widget_prop',
      required: true
    }
  ]
})
```

## 调试和诊断

启用开发模式后，可以在控制台查看AutoBind的执行日志：

```
🚀 [VisualEditorBridge] AutoBind参数注入完成: {
  mode: "loose",
  autoBindParams: {
    deviceId: "device_001",
    startTime: "2024-01-01T00:00:00.000Z",
    endTime: "2024-01-01T23:59:59.999Z"
  },
  finalConfig: { ... }
}
```

可以使用全局调试对象检查绑定配置：

```javascript
// 在浏览器控制台中
console.log(__dataSourceBindingConfig.getDebugInfo())
```

## 最佳实践

1. **优先使用宽松模式**: 对于大多数场景，宽松模式提供了最好的开发体验
2. **合理使用排除属性**: 当某些属性不应该传递给后端时，使用`excludeProperties`
3. **严格模式用于敏感场景**: 当需要精确控制哪些参数被发送时使用严格模式
4. **自定义模式用于特殊需求**: 当需要复杂的参数转换或非标准参数名时使用自定义模式
5. **测试参数绑定**: 确保在开发环境中验证AutoBind生成的参数是否符合API要求

## 性能考虑

- AutoBind在属性变更时会自动重新生成参数，确保数据的实时性
- 内置防抖机制避免频繁的HTTP请求
- 绑定规则缓存提供了良好的性能表现

## 向后兼容

AutoBind功能完全向后兼容：
- 未配置autoBind的数据源继续使用传统的绑定表达式
- 可以在同一个项目中混合使用AutoBind和传统方式
- 现有的绑定表达式不受影响