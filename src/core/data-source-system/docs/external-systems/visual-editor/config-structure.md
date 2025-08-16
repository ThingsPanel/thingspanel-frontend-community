# Visual Editor 配置结构设计

## 📋 核心文件分析

**主要文件**: `/src/components/visual-editor/core/data-source-config-types.ts`

## 🎯 数据源配置分层结构

### 1. 顶层配置结构
```typescript
interface ComponentDataSourceConfig {
  /** 组件ID - 配置的归属 */
  componentId: string
  
  /** JSON数据源列表 - 支持多数据源 */
  jsonDataSources: JsonDataSourceConfig[]
  
  /** 字段映射配置 - 每个数据源的映射规则 */
  fieldMappings: DataSourceFieldMapping[]
  
  /** 启用状态 - 可以整体开关数据绑定 */
  enabled: boolean
  
  /** 配置版本 - 支持配置迁移 */
  version: string
}
```

### 2. 数据源配置层
```typescript
interface JsonDataSourceConfig {
  /** 数据源唯一ID */
  id: string
  
  /** 用户友好的数据源名称 */
  name: string
  
  /** JSON数据内容（字符串形式存储） */
  jsonData: string
  
  /** 数据源启用状态 */
  enabled: boolean
  
  /** 该数据源的字段映射规则 */
  fieldMappings?: FieldMappingRule[]
  
  /** 时间戳信息 */
  createdAt: Date
  updatedAt: Date
}
```

### 3. 映射配置层
```typescript
interface DataSourceFieldMapping {
  /** 映射归属的数据源ID */
  dataSourceId: string
  
  /** 具体的映射规则列表 */
  mappingRules: FieldMappingRule[]
}

interface FieldMappingRule {
  /** 目标字段（组件期望的字段名） */
  targetField: string
  
  /** 源路径（JSON路径表达式） */
  sourcePath: string
  
  /** 映射失败时的默认值 */
  defaultValue?: any
  
  /** 可选的数据转换函数 */
  transformer?: string
  
  /** 是否启用此映射规则 */
  enabled: boolean
}
```

## 🔧 配置管理接口

### 1. 配置管理器
```typescript
interface DataSourceConfigManager {
  /** 保存组件的数据源配置 */
  saveConfig(componentId: string, config: ComponentDataSourceConfig): void
  
  /** 加载组件的数据源配置 */
  loadConfig(componentId: string): ComponentDataSourceConfig | null
  
  /** 删除组件的数据源配置 */
  deleteConfig(componentId: string): void
  
  /** 获取所有已配置的组件列表 */
  getAllConfiguredComponents(): string[]
  
  /** 验证配置的有效性 */
  validateConfig(config: ComponentDataSourceConfig): { valid: boolean; errors: string[] }
}
```

### 2. 运行时状态管理
```typescript
interface DataSourceConfigState {
  /** 当前选中的数据源索引 */
  activeDataSourceIndex: number
  
  /** 是否显示JSON编辑器 */
  showJsonEditor: boolean
  
  /** 是否显示映射预览 */
  showMappingPreview: boolean
  
  /** 映射预览结果 */
  previewResults: MappingPreviewResult[]
  
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean
}
```

## 📊 配置存储机制

### 1. 本地存储策略
```typescript
const DATA_SOURCE_CONFIG_CONSTANTS = {
  /** 最大数据源数量限制 */
  MAX_DATA_SOURCES: 9,
  
  /** 配置版本号 */
  CONFIG_VERSION: '1.0.0',
  
  /** 本地存储键名前缀 */
  STORAGE_KEY_PREFIX: 'visual_editor_data_source_config_'
}

// 存储键格式: visual_editor_data_source_config_{componentId}
```

### 2. 配置序列化
配置以JSON格式存储在localStorage中，包含：
- 数据源定义
- 映射规则
- 元数据（创建时间、版本等）
- 启用状态

## 🔑 关键设计原则

### 1. 分层设计
- **组件层**: 一个组件对应一个配置
- **数据源层**: 一个组件可以有多个数据源
- **映射层**: 每个数据源有独立的映射规则

### 2. 独立性原则
- 每个数据源可以独立启用/禁用
- 每个映射规则可以独立启用/禁用
- 组件的数据绑定可以整体开关

### 3. 版本控制
- 配置带有版本号，支持未来迁移
- 时间戳记录配置的创建和修改历史

### 4. 验证机制
- 配置保存前进行有效性验证
- JSON数据格式验证
- 映射路径有效性验证

## 🚀 在新系统中的应用

### 简化配置结构
```typescript
// 简化版配置结构
interface SimpleDataSourceConfig {
  id: string
  componentId: string
  dataSources: {
    id: string
    type: 'static' | 'api' | 'websocket' | 'script'
    config: any
    fieldMapping?: { [targetField: string]: string } // 简化映射为键值对
  }[]
  triggers: TriggerConfig[]
  enabled: boolean
}
```

### 学习点总结
1. **分层配置管理** - 清晰的层次结构便于管理
2. **独立开关控制** - 各层级都有启用/禁用机制
3. **本地存储策略** - 配置持久化到localStorage
4. **版本控制设计** - 为将来的升级迁移做准备
5. **实时状态管理** - UI状态与配置数据分离