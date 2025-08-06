# 设备数据源API请求方式分析

## 📋 需要设备ID的API请求总结

### 1. **遥测数据相关** (4个)
- `telemetryDataCurrentKeys` - 获取遥测数据当前值
  - 参数: `{ device_id, keys }`
  - 用途: 获取设备指定指标的当前值
  - 返回: 当前值、单位等

- `telemetryDataHistoryList` - 获取遥测数据历史值
  - 参数: `{ device_id, key, time_range, aggregate_function }`
  - 用途: 获取设备指定指标的历史数据
  - 返回: 历史数据数组、聚合值

- `telemetryDataPub` - 发布遥测数据
  - 参数: `{ device_id, key, value }`
  - 用途: 向设备发布遥测数据
  - 返回: 发布结果

- `getTelemetryLogList` - 获取遥测日志
  - 参数: `{ device_id, key }`
  - 用途: 获取遥测数据操作日志
  - 返回: 日志列表

### 2. **属性数据相关** (4个)
- `getAttributeDataSet` - 获取属性数据集
  - 参数: `{ device_id }`
  - 用途: 获取设备所有属性数据
  - 返回: 属性数据数组

- `getAttributeDatasKey` - 获取指定属性键值
  - 参数: `{ device_id, key }`
  - 用途: 获取设备指定属性的值
  - 返回: 属性值

- `attributeDataPub` - 发布属性数据
  - 参数: `{ device_id, key, value }`
  - 用途: 向设备发布属性数据
  - 返回: 发布结果

- `getAttributeDataSetLogs` - 获取属性日志
  - 参数: `{ device_id }`
  - 用途: 获取属性数据操作日志
  - 返回: 日志列表

### 3. **事件数据相关** (1个)
- `getEventDataSet` - 获取事件数据集
  - 参数: `{ device_id }`
  - 用途: 获取设备事件数据
  - 返回: 事件数据数组

### 4. **命令数据相关** (3个)
- `commandDataPub` - 发布命令数据
  - 参数: `{ device_id, key, value }`
  - 用途: 向设备发布命令
  - 返回: 发布结果

- `getCommandDataSetLogs` - 获取命令日志
  - 参数: `{ device_id }`
  - 用途: 获取命令操作日志
  - 返回: 日志列表

- `deviceCustomCommandsIdList` - 获取自定义命令列表
  - 参数: `device_id`
  - 用途: 获取设备可用的自定义命令
  - 返回: 命令列表

### 5. **设备信息相关** (4个)
- `deviceDetail` - 获取设备详情
  - 参数: `device_id`
  - 用途: 获取设备详细信息
  - 返回: 设备详情对象

- `getDeviceConnectInfo` - 获取设备连接信息
  - 参数: `{ device_id }`
  - 用途: 获取设备连接状态信息
  - 返回: 连接信息

- `deviceAlarmStatus` - 获取设备告警状态
  - 参数: `{ device_id }`
  - 用途: 获取设备当前告警状态
  - 返回: 告警状态

- `deviceAlarmHistory` - 获取设备告警历史
  - 参数: `{ device_id }`
  - 用途: 获取设备告警历史记录
  - 返回: 告警历史

### 6. **模拟数据相关** (2个)
- `getSimulation` - 获取模拟数据
  - 参数: `{ device_id }`
  - 用途: 获取设备模拟数据命令
  - 返回: 模拟数据

- `sendSimulation` - 发送模拟数据
  - 参数: `{ device_id, key, value }`
  - 用途: 向设备发送模拟数据
  - 返回: 发送结果

## 🎯 实现计划

### 第一阶段：创建基础组件结构
1. **创建主配置文件** - `index.ts`
   - 导出所有API配置组件
   - 定义API类型枚举

2. **创建设备选择器组件** - `DeviceSelector.vue`
   - 复用现有的设备列表请求
   - 提供设备选择功能

3. **创建基础表单组件** - `BaseApiForm.vue`
   - 通用的表单布局
   - 统一的错误处理
   - 数据预览功能

### 第二阶段：实现HTTP请求方式
4. **遥测数据表单** - `TelemetryApiForm.vue`
   - 当前值获取
   - 历史值获取（支持时间范围和聚合）
   - 数据发布
   - 日志查看

5. **属性数据表单** - `AttributesApiForm.vue`
   - 数据集获取
   - 指定键值获取
   - 数据发布
   - 日志查看

6. **事件数据表单** - `EventApiForm.vue`
   - 事件数据集获取

7. **命令数据表单** - `CommandApiForm.vue`
   - 命令发布
   - 日志查看
   - 自定义命令列表

8. **设备信息表单** - `DeviceInfoApiForm.vue`
   - 设备详情
   - 连接信息
   - 告警状态
   - 告警历史

9. **模拟数据表单** - `SimulationApiForm.vue`
   - 模拟数据获取
   - 模拟数据发送

### 第三阶段：实现轮询配置
10. **轮询配置组件** - `PollingConfig.vue`
    - 是否启用轮询
    - 轮询间隔设置
    - 轮询状态显示

### 第四阶段：实现WebSocket方式（预留）
11. **WebSocket配置组件** - `WebSocketConfig.vue`
    - WebSocket URL配置
    - 连接状态管理
    - 消息订阅配置

### 第五阶段：整合和优化
12. **主配置组件** - `DeviceApiConfig.vue`
    - 整合所有API表单
    - 提供统一的配置界面
    - 数据映射配置

13. **示例和文档** - `DeviceApiExample.vue`
    - 使用示例
    - 配置说明

## 📁 文件结构

```
device-apis/
├── README.md                    # 本文档
├── index.ts                     # 主配置文件
├── components/                  # 组件目录
│   ├── DeviceSelector.vue       # 设备选择器
│   ├── BaseApiForm.vue          # 基础表单组件
│   ├── TelemetryApiForm.vue     # 遥测数据表单
│   ├── AttributesApiForm.vue    # 属性数据表单
│   ├── EventApiForm.vue         # 事件数据表单
│   ├── CommandApiForm.vue       # 命令数据表单
│   ├── DeviceInfoApiForm.vue    # 设备信息表单
│   ├── SimulationApiForm.vue    # 模拟数据表单
│   ├── PollingConfig.vue        # 轮询配置
│   └── WebSocketConfig.vue      # WebSocket配置（预留）
├── types/                       # 类型定义
│   └── api-types.ts             # API相关类型
└── utils/                       # 工具函数
    └── api-helpers.ts           # API辅助函数
```

## 🔧 技术要点

### 1. **表单设计原则**
- 每个API类型一个独立的表单组件
- 统一的表单布局和样式
- 清晰的参数说明和验证
- 实时的数据预览

### 2. **轮询配置**
- HTTP请求支持轮询
- 可配置轮询间隔
- 轮询状态显示
- 手动停止/启动轮询

### 3. **错误处理**
- 统一的错误提示
- 网络错误处理
- 参数验证错误
- 友好的错误信息

### 4. **数据预览**
- JSON格式显示
- 语法高亮
- 可折叠显示
- 复制功能

### 5. **配置保存**
- 自动保存配置
- 配置历史记录
- 配置导入/导出
- 配置模板

## 🚀 开发优先级

1. **高优先级**：HTTP请求方式（遥测、属性、设备信息）
2. **中优先级**：事件、命令、模拟数据
3. **低优先级**：WebSocket方式、高级配置

## 📝 注意事项

1. **细心和耐心**：每个API的参数都要仔细验证
2. **用户体验**：表单要简洁明了，操作要流畅
3. **错误处理**：要考虑到各种异常情况
4. **性能优化**：避免不必要的请求，合理使用缓存
5. **代码复用**：提取公共组件和函数 