# 数据源配置系统 MVP 闭环需求文档

## 🎯 MVP 核心目标

基于您的需求"配置数据源"，设计一个最小可行产品，实现从数据源配置到组件数据绑定的完整闭环。

## 📋 MVP 功能范围

### 核心功能（P0 - 必须实现）
1. **基础数据源配置** - 静态数据源配置
2. **简单数据映射** - 支持基础路径映射
3. **组件数据绑定** - 基础绑定功能
4. **配置验证** - 基础配置验证

### 重要功能（P1 - 重要实现）
1. **API数据源配置** - HTTP接口数据源
2. **实时预览** - 基础预览功能
3. **错误处理** - 基础错误提示
4. **数据源测试** - 连接测试功能

### 可选功能（P2 - 后续实现）
1. **设备数据源配置** - 设备数据源
2. **高级数据映射** - 拖拽映射、转换函数
3. **性能监控** - 详细性能指标
4. **配置模板** - 预设配置模板

## 🏗️ MVP 技术架构

### 系统组件
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   数据源配置     │    │   数据映射配置   │    │   组件数据绑定   │
│   DataSource    │───▶│   DataMapping   │───▶│   Component     │
│   Config        │    │   Config        │    │   Binding       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   数据源执行器   │    │   数据转换器     │    │   组件渲染器     │
│   Executor      │    │   Transformer   │    │   Renderer      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据流设计
```
用户配置 → 数据源执行 → 数据转换 → 组件绑定 → 实时渲染
```

### 与现有系统集成
- **Card 2.1集成**：复用现有的`ComponentDefinition`和`ComponentDataRequirement`
- **Visual Editor集成**：通过`useVisualEditorIntegration`与编辑器集成
- **数据源复用**：复用现有的`StaticDataSourceConfig`、`HttpDataSourceConfig`等组件

## 📝 MVP 详细需求

### 1. 数据源配置界面

#### 1.1 静态数据源配置（P0）
```typescript
interface StaticDataSourceConfig {
  type: 'static'
  data: string // JSON格式的字符串
  refreshInterval?: number // 刷新间隔（毫秒），0表示不自动刷新
}
```

**配置界面要求：**
- JSON编辑器（支持语法高亮和格式化）
- 数据验证（JSON格式验证）
- 实时预览（显示解析后的数据结构）
- 刷新间隔设置

#### 1.2 API数据源配置（P1）
```typescript
interface ApiDataSourceConfig {
  type: 'api'
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string // JSON格式的请求体
  refreshInterval?: number
  timeout?: number
}
```

**配置界面要求：**
- URL输入框（支持http/https）
- 请求方法选择
- 请求头配置（键值对形式）
- 请求体配置（JSON编辑器）
- 刷新间隔设置
- 超时时间设置
- 连接测试按钮

#### 1.3 设备数据源配置（P2）
```typescript
interface DeviceDataSourceConfig {
  type: 'device'
  deviceId: string
  propertyId: string
  refreshInterval?: number
}
```

**配置界面要求：**
- 设备选择器（下拉选择或搜索）
- 属性选择器（基于选中设备的属性列表）
- 刷新间隔设置
- 数据预览（显示当前设备属性值）

### 2. 数据映射配置

#### 2.1 简化映射规则定义（P0）
```typescript
interface SimpleDataMapping {
  sourcePath: string // 数据源中的路径，如 "data.temperature"
  targetField: string // 组件中的字段名
  defaultValue?: any // 默认值（可选）
}
```

#### 2.2 映射配置界面（P0）
**功能要求：**
- 数据源结构预览（树形展示）
- 组件字段列表（从组件定义中获取）
- 路径输入（支持手动输入数据路径）
- 默认值设置
- 映射验证（检查路径是否存在）

**P2功能（后续实现）：**
- 拖拽映射（从数据源拖拽到组件字段）
- 转换函数选择（内置常用转换函数）

### 3. 组件数据绑定

#### 3.1 简化绑定配置（P0）
```typescript
interface SimpleBinding {
  componentId: string
  dataSourceId: string
  mappings: SimpleDataMapping[]
  isActive: boolean
}
```

#### 3.2 绑定管理（P0）
**功能要求：**
- 绑定列表（显示所有组件的绑定状态）
- 绑定开关（启用/禁用数据绑定）
- 绑定状态显示（连接状态、最后更新时间、错误信息）
- 手动刷新按钮
- 绑定配置编辑

### 4. 实时预览

#### 4.1 预览功能（P1）
**功能要求：**
- 配置变更实时预览
- 数据流可视化（显示数据从数据源到组件的流转过程）
- 错误提示（数据源错误、映射错误、绑定错误）
- 基础性能指标（响应时间、数据大小）

## 🎨 MVP 用户界面设计

### 1. 主界面布局
```
┌─────────────────────────────────────────────────────────────┐
│                    数据源配置系统                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│   数据源列表     │   配置面板       │      预览区域           │
│                 │                 │                         │
│ • 静态数据源     │  [数据源配置]    │  [组件实时预览]         │
│ • API数据源      │  [映射配置]      │  [数据流图]             │
│ • 设备数据源     │  [绑定配置]      │  [状态监控]             │
│                 │                 │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 2. 配置流程
```
1. 选择数据源类型 → 2. 配置数据源参数 → 3. 设置数据映射 → 4. 绑定到组件 → 5. 实时预览
```

## 🔧 MVP 技术实现

### 1. 核心接口定义

#### 数据源接口
```typescript
interface DataSource {
  id: string
  type: 'static' | 'api' | 'device'
  name: string
  config: DataSourceConfig
  execute(): Promise<any>
  validate(): boolean
  test(): Promise<boolean>
}
```

#### 简化数据映射接口
```typescript
interface SimpleDataMapper {
  mappings: SimpleDataMapping[]
  map(sourceData: any): Record<string, any>
  validate(): boolean
  preview(sourceData: any): Record<string, any>
}
```

#### 简化组件绑定接口
```typescript
interface SimpleComponentBinding {
  id: string
  componentId: string
  dataSourceId: string
  mapper: SimpleDataMapper
  isActive: boolean
  start(): void
  stop(): void
  refresh(): Promise<void>
  getCurrentData(): any
}
```

### 2. 核心服务类

#### 数据源管理器
```typescript
class DataSourceManager {
  private dataSources: Map<string, DataSource> = new Map()
  
  registerDataSource(id: string, dataSource: DataSource): void
  getDataSource(id: string): DataSource | undefined
  getAllDataSources(): DataSource[]
  removeDataSource(id: string): boolean
  testDataSource(id: string): Promise<boolean>
}
```

#### 绑定管理器
```typescript
class BindingManager {
  private bindings: Map<string, SimpleComponentBinding> = new Map()
  
  createBinding(config: SimpleBindingConfig): SimpleComponentBinding
  getBinding(id: string): SimpleComponentBinding | undefined
  getAllBindings(): SimpleComponentBinding[]
  removeBinding(id: string): boolean
  startBinding(id: string): void
  stopBinding(id: string): void
}
```

### 3. 与现有系统集成

#### Card 2.1集成
```typescript
// 复用现有的组件定义
interface ComponentDefinition {
  // ... 现有定义
  dataSourceConfig?: SimpleBindingConfig // 新增数据源配置
}

// 在组件中使用数据绑定
export function useComponentDataBinding(componentId: string) {
  const binding = getComponentBinding(componentId)
  const { data, loading, error } = useReactiveData(binding)
  
  return { data, loading, error }
}
```

#### Visual Editor集成
```typescript
// 通过现有的集成Hook扩展
export function useVisualEditorDataBinding() {
  const { registerComponent, getComponentTree } = useVisualEditorIntegration()
  
  // 扩展组件注册，支持数据源配置
  const registerComponentWithDataSource = (component: ComponentDefinition) => {
    registerComponent(component.type, {
      ...component,
      dataSourceConfig: component.dataSourceConfig
    })
  }
  
  return { registerComponentWithDataSource }
}
```

## 📊 MVP 验收标准

### 功能验收（P0）
- [ ] 能够配置静态数据源并成功绑定到组件
- [ ] 能够设置基础数据映射规则（路径映射）
- [ ] 能够启用/禁用数据绑定
- [ ] 能够验证数据源配置

### 功能验收（P1）
- [ ] 能够配置API数据源并成功绑定到组件
- [ ] 能够实时预览配置效果
- [ ] 能够测试数据源连接
- [ ] 能够显示基础错误提示

### 功能验收（P2）
- [ ] 能够配置设备数据源并成功绑定到组件
- [ ] 能够使用高级数据映射功能
- [ ] 能够查看详细性能指标
- [ ] 能够使用配置模板

### 性能验收（具体可测试）
- [ ] 数据源配置保存响应时间 < 500ms（在标准配置下）
- [ ] 数据映射配置响应时间 < 200ms（10个映射规则）
- [ ] 组件数据更新延迟 < 1秒（单数据源）
- [ ] 支持5个并发数据源（同时刷新，无性能下降）
- [ ] 内存使用 < 50MB（10个数据源场景）

### 用户体验验收
- [ ] 配置界面直观易用
- [ ] 错误提示清晰明确
- [ ] 操作流程简单明了
- [ ] 实时反馈及时准确
- [ ] 支持配置的保存和恢复

## 🚀 MVP 开发计划

### 第一阶段（1周）：P0核心功能
- [ ] 静态数据源配置实现
- [ ] 基础数据映射功能
- [ ] 简单组件绑定
- [ ] 基础配置验证

### 第二阶段（1周）：P1重要功能
- [ ] API数据源配置实现
- [ ] 实时预览功能
- [ ] 基础错误处理
- [ ] 数据源测试功能

### 第三阶段（1周）：集成测试
- [ ] 与Card 2.1系统集成
- [ ] 与Visual Editor集成
- [ ] 端到端测试
- [ ] 性能优化

### 第四阶段（1周）：P2可选功能
- [ ] 设备数据源配置
- [ ] 高级数据映射
- [ ] 性能监控
- [ ] 配置模板

## 🔍 MVP 风险控制

### 技术风险
- **数据源连接失败**：实现重试机制和错误处理
- **数据格式不匹配**：提供数据格式转换和验证
- **性能问题**：实现数据缓存和批量处理
- **与现有系统集成**：分阶段集成，降低风险

### 业务风险
- **用户配置错误**：提供配置向导和验证
- **数据源变更**：实现配置版本管理
- **系统稳定性**：实现监控和告警机制

## 🛡️ 错误处理机制

### 错误分类
1. **配置错误**：JSON格式错误、必填字段缺失、URL格式错误
2. **网络错误**：连接超时、服务器错误、CORS错误
3. **数据格式错误**：数据类型不匹配、路径不存在、数据为空
4. **系统错误**：内存不足、组件加载失败、绑定冲突

### 错误处理策略
```typescript
interface ErrorHandler {
  // 错误分类
  classifyError(error: Error): ErrorType
  
  // 错误提示
  showError(error: Error, context: string): void
  
  // 错误恢复
  suggestRecovery(error: Error): RecoveryAction[]
  
  // 错误日志
  logError(error: Error, context: string): void
}
```

### 用户反馈机制
- **实时错误提示**：配置时实时显示错误信息
- **错误详情展示**：点击错误可查看详细信息
- **修复建议**：提供具体的修复建议和操作指引
- **错误恢复**：提供一键修复或回滚功能

## 📈 MVP 后续扩展

### 短期扩展（MVP完成后1-2个月）
- [ ] 更多数据源类型（WebSocket、MQTT、数据库）
- [ ] 高级数据转换功能
- [ ] 数据源模板系统
- [ ] 配置导入导出

### 中期扩展（3-6个月）
- [ ] 数据源监控和告警
- [ ] 数据质量检测
- [ ] 性能分析和优化
- [ ] 企业级安全功能

### 长期扩展（6个月以上）
- [ ] AI辅助配置
- [ ] 自动化数据映射
- [ ] 分布式数据源管理
- [ ] 云原生架构支持

---

**文档版本**：v2.0  
**创建时间**：2025年1月17日  
**目标**：MVP闭环数据源配置系统  
**优先级**：高  
**评审状态**：已根据专家意见整改 