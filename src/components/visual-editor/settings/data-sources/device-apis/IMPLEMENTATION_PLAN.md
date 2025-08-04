# 设备API请求方式实现计划

## 📋 当前状态

### ✅ 已完成
1. **项目结构创建**
   - 创建了 `device-apis` 文件夹
   - 创建了 `components`、`types`、`utils` 子文件夹

2. **类型定义** (`types/api-types.ts`)
   - 定义了所有API类型枚举
   - 定义了配置接口和参数接口
   - 定义了表单配置接口

3. **工具函数** (`utils/api-helpers.ts`)
   - 定义了所有API的表单配置
   - 实现了参数验证函数
   - 实现了响应格式化函数

4. **主配置文件** (`index.ts`)
   - 导出了所有类型和工具函数
   - 定义了API选项和默认配置

<<<<<<< Updated upstream
5. **基础组件** ✅
   - **设备选择器组件** (`components/DeviceSelector.vue`) ✅
     - 复用现有的设备列表请求
     - 提供设备搜索和选择功能
     - 显示设备状态和基本信息
   
   - **基础表单组件** (`components/BaseApiForm.vue`) ✅
     - 提供统一的表单布局
     - 处理通用的错误显示
     - 提供数据预览功能
     - 统一的加载状态管理

6. **轮询配置组件** (`components/PollingConfig.vue`) ✅
   - 是否启用轮询
   - 轮询间隔设置
   - 轮询状态显示
   - 手动启动/停止轮询

7. **遥测数据表单** (`components/TelemetryApiForm.vue`) ✅
   - 支持4种API类型：当前值、历史值、发布、日志
   - 动态表单验证
   - 轮询配置集成
   - 实时数据预览

8. **示例组件** (`components/DeviceApiExample.vue`) ✅
   - 完整的使用示例
   - 配置信息显示
   - 代码示例生成

### 🔄 进行中
- 其他API表单组件的实现

### ⏳ 待完成
- 属性数据表单
- 事件数据表单
- 命令数据表单
- 设备信息表单
- 模拟数据表单
- WebSocket配置组件（预留）
- 主配置组件（整合所有表单）

## 🎯 详细实现计划

### 第一阶段：基础组件 (优先级：高) ✅

#### 1. 设备选择器组件 (`components/DeviceSelector.vue`) ✅
=======
### 🔄 进行中
- 基础组件开发

### ⏳ 待完成
- 所有具体组件的实现

## 🎯 详细实现计划

### 第一阶段：基础组件 (优先级：高)

#### 1. 设备选择器组件 (`components/DeviceSelector.vue`)
>>>>>>> Stashed changes
**功能**：
- 复用现有的设备列表请求 (`deviceListForPanel`)
- 提供设备搜索和选择功能
- 显示设备状态和基本信息

**实现要点**：
- 使用 `n-select` 组件
- 支持搜索和过滤
- 显示设备名称和状态
- 自动加载设备列表

<<<<<<< Updated upstream
#### 2. 基础表单组件 (`components/BaseApiForm.vue`) ✅
=======
#### 2. 基础表单组件 (`components/BaseApiForm.vue`)
>>>>>>> Stashed changes
**功能**：
- 提供统一的表单布局
- 处理通用的错误显示
- 提供数据预览功能
- 统一的加载状态管理

**实现要点**：
- 使用 `n-form` 组件
- 统一的错误处理
- JSON数据预览
- 加载状态显示

### 第二阶段：HTTP请求表单 (优先级：高)

<<<<<<< Updated upstream
#### 3. 遥测数据表单 (`components/TelemetryApiForm.vue`) ✅
**支持的API**：
- `telemetryDataCurrentKeys` - 当前值 ✅
- `telemetryDataHistoryList` - 历史值 ✅
- `telemetryDataPub` - 发布数据 ✅
- `getTelemetryLogList` - 日志 ✅

**表单字段**：
- 当前值：指标键 (keys) ✅
- 历史值：指标键 (key)、时间范围、聚合函数 ✅
- 发布：指标键 (key)、数据值 (value) ✅
- 日志：指标键 (key，可选) ✅

#### 4. 属性数据表单 (`components/AttributesApiForm.vue`) ⏳
=======
#### 3. 遥测数据表单 (`components/TelemetryApiForm.vue`)
**支持的API**：
- `telemetryDataCurrentKeys` - 当前值
- `telemetryDataHistoryList` - 历史值
- `telemetryDataPub` - 发布数据
- `getTelemetryLogList` - 日志

**表单字段**：
- 当前值：指标键 (keys)
- 历史值：指标键 (key)、时间范围、聚合函数
- 发布：指标键 (key)、数据值 (value)
- 日志：指标键 (key，可选)

#### 4. 属性数据表单 (`components/AttributesApiForm.vue`)
>>>>>>> Stashed changes
**支持的API**：
- `getAttributeDataSet` - 数据集
- `getAttributeDatasKey` - 指定键值
- `attributeDataPub` - 发布数据
- `getAttributeDataSetLogs` - 日志

**表单字段**：
- 数据集：无参数
- 指定键值：属性键 (key)
- 发布：属性键 (key)、属性值 (value)
- 日志：无参数

<<<<<<< Updated upstream
#### 5. 设备信息表单 (`components/DeviceInfoApiForm.vue`) ⏳
=======
#### 5. 设备信息表单 (`components/DeviceInfoApiForm.vue`)
>>>>>>> Stashed changes
**支持的API**：
- `deviceDetail` - 设备详情
- `getDeviceConnectInfo` - 连接信息
- `deviceAlarmStatus` - 告警状态
- `deviceAlarmHistory` - 告警历史

**表单字段**：
- 所有API都无需额外参数

### 第三阶段：其他HTTP请求表单 (优先级：中)

<<<<<<< Updated upstream
#### 6. 事件数据表单 (`components/EventApiForm.vue`) ⏳
=======
#### 6. 事件数据表单 (`components/EventApiForm.vue`)
>>>>>>> Stashed changes
**支持的API**：
- `getEventDataSet` - 事件数据集

**表单字段**：
- 无参数

<<<<<<< Updated upstream
#### 7. 命令数据表单 (`components/CommandApiForm.vue`) ⏳
=======
#### 7. 命令数据表单 (`components/CommandApiForm.vue`)
>>>>>>> Stashed changes
**支持的API**：
- `commandDataPub` - 发布命令
- `getCommandDataSetLogs` - 命令日志
- `deviceCustomCommandsIdList` - 自定义命令

**表单字段**：
- 发布：命令键 (key)、命令值 (value)
- 日志：无参数
- 自定义命令：无参数

<<<<<<< Updated upstream
#### 8. 模拟数据表单 (`components/SimulationApiForm.vue`) ⏳
=======
#### 8. 模拟数据表单 (`components/SimulationApiForm.vue`)
>>>>>>> Stashed changes
**支持的API**：
- `getSimulation` - 获取模拟数据
- `sendSimulation` - 发送模拟数据

**表单字段**：
- 获取：无参数
- 发送：数据键 (key)、数据值 (value)

<<<<<<< Updated upstream
### 第四阶段：轮询配置 (优先级：高) ✅

#### 9. 轮询配置组件 (`components/PollingConfig.vue`) ✅
**功能**：
- 是否启用轮询 ✅
- 轮询间隔设置 ✅
- 轮询状态显示 ✅
- 手动启动/停止轮询 ✅

**实现要点**：
- 使用 `n-switch` 控制启用状态 ✅
- 使用 `n-select` 选择轮询间隔 ✅
- 显示轮询状态和最后更新时间 ✅
- 提供启动/停止按钮 ✅

### 第五阶段：WebSocket配置 (优先级：低)

#### 10. WebSocket配置组件 (`components/WebSocketConfig.vue`) ⏳
=======
### 第四阶段：轮询配置 (优先级：高)

#### 9. 轮询配置组件 (`components/PollingConfig.vue`)
**功能**：
- 是否启用轮询
- 轮询间隔设置
- 轮询状态显示
- 手动启动/停止轮询

**实现要点**：
- 使用 `n-switch` 控制启用状态
- 使用 `n-select` 选择轮询间隔
- 显示轮询状态和最后更新时间
- 提供启动/停止按钮

### 第五阶段：WebSocket配置 (优先级：低)

#### 10. WebSocket配置组件 (`components/WebSocketConfig.vue`)
>>>>>>> Stashed changes
**功能**：
- WebSocket URL配置
- 连接状态管理
- 消息订阅配置

**实现要点**：
- 预留实现，暂时不开发
- 提供URL输入框
- 显示连接状态
- 预留消息订阅配置

### 第六阶段：整合和优化 (优先级：中)

<<<<<<< Updated upstream
#### 11. 主配置组件 (`components/DeviceApiConfig.vue`) ⏳
=======
#### 11. 主配置组件 (`components/DeviceApiConfig.vue`)
>>>>>>> Stashed changes
**功能**：
- 整合所有API表单
- 提供统一的配置界面
- 数据映射配置

**实现要点**：
- 使用 `n-tabs` 组织不同API类型
- 统一的配置保存和加载
- 集成数据映射功能

<<<<<<< Updated upstream
#### 12. 示例和文档 (`components/DeviceApiExample.vue`) ✅
**功能**：
- 使用示例 ✅
- 配置说明 ✅
- 演示各种API的使用 ✅

## 🔧 技术实现细节

### 1. 组件通信 ✅
- 使用 `v-model` 进行双向绑定 ✅
- 使用 `emit` 向上传递事件 ✅
- 使用 `props` 接收配置 ✅

### 2. 状态管理 ✅
- 每个组件维护自己的加载状态 ✅
- 统一的错误状态管理 ✅
- 配置状态持久化 ✅

### 3. 错误处理 ✅
- 网络错误处理 ✅
- 参数验证错误 ✅
- 友好的错误提示 ✅

### 4. 数据预览 ✅
- JSON格式显示 ✅
- 语法高亮 ✅
- 可折叠显示 ✅
- 复制功能 ✅

## 📝 开发注意事项

### 1. 细心和耐心 ✅
- 每个API的参数都要仔细验证 ✅
- 确保参数类型和格式正确 ✅
- 测试各种边界情况 ✅

### 2. 用户体验 ✅
- 表单要简洁明了 ✅
- 操作要流畅 ✅
- 提供清晰的提示信息 ✅

### 3. 代码质量 ✅
- 提取公共组件和函数 ✅
- 保持代码结构清晰 ✅
- 添加适当的注释 ✅

### 4. 性能优化 ✅
- 避免不必要的请求 ✅
- 合理使用缓存 ✅
- 优化组件渲染 ✅

## 🚀 开发顺序建议

1. **第一步**：创建设备选择器和基础表单组件 ✅
2. **第二步**：实现遥测数据表单（最常用） ✅
3. **第三步**：实现属性数据和设备信息表单 ⏳
4. **第四步**：实现轮询配置 ✅
5. **第五步**：实现其他表单 ⏳
6. **第六步**：整合和优化 ⏳

## 📊 进度跟踪

- [x] 设备选择器组件 ✅
- [x] 基础表单组件 ✅
- [x] 遥测数据表单 ✅
- [ ] 属性数据表单 ⏳
- [ ] 设备信息表单 ⏳
- [ ] 事件数据表单 ⏳
- [ ] 命令数据表单 ⏳
- [ ] 模拟数据表单 ⏳
- [x] 轮询配置组件 ✅
- [ ] WebSocket配置组件（预留） ⏳
- [ ] 主配置组件 ⏳
- [x] 示例组件 ✅

## 🎯 成功标准

1. **功能完整**：所有API类型都有对应的表单 ⏳ (1/6 完成)
2. **用户体验好**：操作流畅，提示清晰 ✅
3. **代码质量高**：结构清晰，易于维护 ✅
4. **错误处理完善**：各种异常情况都有处理 ✅
5. **文档完整**：有详细的使用说明和示例 ✅

## 📈 当前成果

### 已完成的核心功能
1. **完整的遥测数据API支持** - 支持4种遥测数据操作
2. **设备选择器** - 支持搜索、过滤、状态显示
3. **基础表单框架** - 统一的表单布局和错误处理
4. **轮询配置系统** - 完整的轮询控制和管理
5. **数据预览功能** - JSON格式显示和复制功能
6. **示例和文档** - 完整的使用示例和代码生成

### 技术亮点
1. **模块化设计** - 每个API类型独立表单
2. **类型安全** - 完整的TypeScript类型定义
3. **用户体验** - 直观的表单布局和实时反馈
4. **错误处理** - 完善的错误提示和状态管理
5. **代码复用** - 公共组件和工具函数

### 下一步计划
继续实现其他API表单组件，按照优先级顺序：
1. 属性数据表单
2. 设备信息表单
3. 事件数据表单
4. 命令数据表单
5. 模拟数据表单 
=======
#### 12. 示例组件 (`components/DeviceApiExample.vue`)
**功能**：
- 使用示例
- 配置说明
- 演示各种API的使用

## 🔧 技术实现细节

### 1. 组件通信
- 使用 `v-model` 进行双向绑定
- 使用 `emit` 向上传递事件
- 使用 `props` 接收配置

### 2. 状态管理
- 每个组件维护自己的加载状态
- 统一的错误状态管理
- 配置状态持久化

### 3. 错误处理
- 网络错误处理
- 参数验证错误
- 友好的错误提示

### 4. 数据预览
- JSON格式显示
- 语法高亮
- 可折叠显示
- 复制功能

## 📝 开发注意事项

### 1. 细心和耐心
- 每个API的参数都要仔细验证
- 确保参数类型和格式正确
- 测试各种边界情况

### 2. 用户体验
- 表单要简洁明了
- 操作要流畅
- 提供清晰的提示信息

### 3. 代码质量
- 提取公共组件和函数
- 保持代码结构清晰
- 添加适当的注释

### 4. 性能优化
- 避免不必要的请求
- 合理使用缓存
- 优化组件渲染

## 🚀 开发顺序建议

1. **第一步**：创建设备选择器和基础表单组件
2. **第二步**：实现遥测数据表单（最常用）
3. **第三步**：实现属性数据和设备信息表单
4. **第四步**：实现轮询配置
5. **第五步**：实现其他表单
6. **第六步**：整合和优化

## 📊 进度跟踪

- [ ] 设备选择器组件
- [ ] 基础表单组件
- [ ] 遥测数据表单
- [ ] 属性数据表单
- [ ] 设备信息表单
- [ ] 事件数据表单
- [ ] 命令数据表单
- [ ] 模拟数据表单
- [ ] 轮询配置组件
- [ ] WebSocket配置组件（预留）
- [ ] 主配置组件
- [ ] 示例组件

## 🎯 成功标准

1. **功能完整**：所有API类型都有对应的表单
2. **用户体验好**：操作流畅，提示清晰
3. **代码质量高**：结构清晰，易于维护
4. **错误处理完善**：各种异常情况都有处理
5. **文档完整**：有详细的使用说明和示例 
>>>>>>> Stashed changes
