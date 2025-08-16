# Visual Editor 字段映射机制

## 📋 核心文件分析

**主要文件**: `/src/components/visual-editor/core/data-source-config-types.ts`

## 🎯 核心设计思想

### 1. JSON路径映射系统
通过JSON路径将任意数据结构映射到组件期望的字段：

```typescript
interface FieldMappingRule {
  /** 目标字段名（组件期望的字段） */
  targetField: string
  /** 源数据路径（JSON路径，如 abc[1].dd.fr） */
  sourcePath: string
  /** 默认值 */
  defaultValue?: any
  /** 数据转换函数代码 */
  transformer?: string
  /** 是否启用此映射 */
  enabled: boolean
}
```

### 2. 映射预览机制
在配置时可以预览映射结果：

```typescript
interface MappingPreviewResult {
  /** 目标字段名 */
  targetField: string
  /** 映射后的值 */
  mappedValue: any
  /** 源路径 */
  sourcePath: string
  /** 是否成功映射 */
  success: boolean
  /** 错误信息 */
  error?: string
}
```

### 3. 路径解析器接口
提供标准的路径解析功能：

```typescript
interface PathMapper {
  /**
   * 根据路径从数据中提取值
   * 支持: obj.prop, obj[0], obj[0].prop, obj['prop-name'] 等
   */
  extractValueByPath(data: any, path: string): any
  
  /**
   * 验证路径格式
   */
  validatePath(path: string): boolean
  
  /**
   * 预览映射结果
   */
  previewMapping(data: any, mappingRules: FieldMappingRule[]): MappingPreviewResult[]
}
```

### 4. JSON结构分析
自动分析JSON数据的结构信息：

```typescript
interface ParsedJsonStructure {
  /** 数据类型 */
  type: 'object' | 'array' | 'primitive'
  /** 字段列表（仅object类型） */
  fields?: Array<{
    name: string
    type: FieldType
    path: string
    example: any
  }>
  /** 数组元素结构（仅array类型） */
  arrayElementStructure?: ParsedJsonStructure
  /** 原始数据 */
  rawData: any
}
```

### 5. 组件数据源配置
完整的组件数据源配置结构：

```typescript
interface ComponentDataSourceConfig {
  /** 组件ID */
  componentId: string
  /** JSON数据源配置列表 */
  jsonDataSources: JsonDataSourceConfig[]
  /** 字段映射配置列表 */
  fieldMappings: DataSourceFieldMapping[]
  /** 是否启用数据绑定 */
  enabled: boolean
  /** 配置版本 */
  version: string
}

interface JsonDataSourceConfig {
  id: string
  name: string
  jsonData: string // JSON字符串
  enabled: boolean
  fieldMappings?: FieldMappingRule[]
  createdAt: Date
  updatedAt: Date
}
```

## 🔑 关键学习点

### 映射路径示例
```typescript
// 对象属性访问
"user.name"           // { user: { name: "张三" } } -> "张三"
"device.temperature"  // { device: { temperature: 25.6 } } -> 25.6

// 数组索引访问  
"data[0]"            // { data: [1, 2, 3] } -> 1
"sensors[1].value"   // { sensors: [{value: 10}, {value: 20}] } -> 20

// 复杂嵌套路径
"response.data.items[0].attributes.name"
"metrics['cpu-usage'].current"
```

### 映射配置示例
```typescript
const mappingRules: FieldMappingRule[] = [
  {
    targetField: 'temperature',    // 组件期望的字段
    sourcePath: 'sensors[0].temp', // 源数据路径
    defaultValue: 0,               // 默认值
    transformer: 'value * 0.1',   // 转换公式
    enabled: true
  },
  {
    targetField: 'deviceName',
    sourcePath: 'device.metadata.name',
    defaultValue: '未知设备',
    enabled: true
  }
]
```

### 优势分析
1. **极强的灵活性** - 可以将任意JSON结构映射到组件期望的格式
2. **可视化配置** - 用户可以通过UI配置映射规则，无需编程
3. **实时预览** - 配置时即可看到映射结果，减少错误
4. **向后兼容** - 数据源变化时，只需调整映射规则
5. **错误处理** - 映射失败时有降级机制（默认值）

## 🚀 在新系统中的应用

### 简化实现策略
1. **保留核心路径解析** - JSON路径映射是核心价值
2. **简化配置结构** - 减少不必要的元数据字段
3. **基础转换函数** - 支持简单的数值转换
4. **错误降级** - 映射失败时使用默认值

### 简化的映射接口
```typescript
interface SimpleFieldMapping {
  targetField: string
  sourcePath: string
  defaultValue?: any
}

interface SimpleDataSourceConfig {
  id: string
  type: 'static' | 'api' | 'websocket' | 'script'
  config: any
  fieldMappings?: SimpleFieldMapping[]
}
```

这种映射机制是整个系统的核心价值，确保了数据源的灵活性和组件的独立性。