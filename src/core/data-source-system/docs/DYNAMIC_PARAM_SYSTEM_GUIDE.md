# 动态参数系统实现指南（V2.0 - 勾选式控制）

## 概述

本文档详细说明了 ThingsPanel 中动态参数系统的最新设计理念和实现方式。该系统通过**勾选式控制**让用户主动选择哪些参数需要动态化，避免了复杂的正则扫描，提供更直观和可控的参数管理体验。

## 🎯 设计理念演进

### V2.0 核心思想

**显式参数控制 + 勾选式管理**

1. **显式参数定义**：用户通过勾选复选框主动标记需要动态化的参数
2. **直观参数配置**：勾选后立即切换到动态参数配置界面
3. **双模式支持**：每个参数可以在静态值和动态参数之间灵活切换
4. **可视化概览**：统一展示所有动态参数的配置状态

### V1.0 vs V2.0 对比

```javascript
// ❌ V1.0：基于正则自动扫描（复杂且不直观）
const config = {
  headers: {
    'Authorization': '${authToken}',  // 需要手动写占位符
    'Content-Type': 'application/json'
  },
  params: {
    'page': '1',
    'size': '${pageSize}'  // 需要手动写占位符
  }
  // 系统自动扫描生成 dynamicParams
}

// ✅ V2.0：勾选式主动控制（直观且可控）
// UI界面：
// Authorization: [Bearer xxx] [☑️ 动态] -> [authToken] [示例: Bearer abc123]
// Content-Type:  [application/json] [☐ 静态]
// page:         [1] [☐ 静态] 
// size:         [10] [☑️ 动态] -> [pageSize] [示例: 20]
```

## 🏗️ 架构设计

### 组件层次结构

```
SimpleHttpForm.vue (表单组件)
├── 基础配置区域
├── 请求头配置 ⭐️
│   ├── 参数名输入
│   ├── 静态值输入 OR 动态参数配置
│   ├── 动态参数勾选框
│   └── 删除按钮
├── 查询参数配置 ⭐️ 
│   ├── 参数名输入
│   ├── 静态值输入 OR 动态参数配置
│   ├── 动态参数勾选框
│   └── 删除按钮
├── 请求体配置
└── 动态参数概览 📊
    ├── 汇总展示
    ├── 参数位置标识
    └── 示例值预览
```

### 核心实现逻辑

#### 1. 增强的数据结构 (SimpleHttpForm.vue:391-405)

```typescript
// 扩展的请求头/查询参数数据结构
const headerList = ref<Array<{
  key: string,           // 参数名
  value: string,         // 静态值
  isDynamic?: boolean,   // 是否为动态参数
  dynamicName?: string,  // 动态参数名
  exampleValue?: string  // 示例值
}>>([])

const paramList = ref<Array<{
  key: string,           // 参数名  
  value: string,         // 静态值
  isDynamic?: boolean,   // 是否为动态参数
  dynamicName?: string,  // 动态参数名
  exampleValue?: string  // 示例值
}>>([])
```

#### 2. 动态参数汇总逻辑 (SimpleHttpForm.vue:423-450)

```typescript
// 从请求头和查询参数中收集所有动态参数
const dynamicParamSummary = computed(() => {
  const dynamicParams: Array<{name: string, location: string, exampleValue: string}> = [];
  
  // 从请求头中收集动态参数
  headerList.value.forEach(header => {
    if (header.isDynamic && header.dynamicName) {
      dynamicParams.push({
        name: header.dynamicName,
        location: `请求头 ${header.key}`,
        exampleValue: header.exampleValue || ''
      });
    }
  });
  
  // 从查询参数中收集动态参数
  paramList.value.forEach(param => {
    if (param.isDynamic && param.dynamicName) {
      dynamicParams.push({
        name: param.dynamicName,
        location: `查询参数 ${param.key}`,
        exampleValue: param.exampleValue || ''
      });
    }
  });
  
  return dynamicParams;
});
```

#### 3. 动态参数开关处理 (SimpleHttpForm.vue:506-521)

```typescript
// 处理查询参数动态参数开关
const handleParamDynamicChange = (index: number, isDynamic: boolean) => {
  const param = paramList.value[index];
  param.isDynamic = isDynamic;
  
  if (isDynamic) {
    // 切换到动态模式：使用 key 作为默认的动态参数名
    param.dynamicName = param.key || 'queryParam';
    param.exampleValue = param.value || '';
  } else {
    // 切换到静态模式：清空动态相关字段
    param.dynamicName = '';
    param.exampleValue = '';
  }
  
  handleChange();
};
```

#### 4. 增强的用户界面 (Template部分)

```vue
<template>
  <!-- 增强的参数行 -->
  <div class="enhanced-param-row">
    <!-- 参数名 -->
    <n-input v-model:value="param.key" placeholder="参数名" />
    
    <!-- 参数值/动态参数配置切换区 -->
    <div class="param-value-section">
      <!-- 静态参数值 -->
      <n-input v-if="!param.isDynamic" v-model:value="param.value" placeholder="参数值" />
      
      <!-- 动态参数配置 -->
      <div v-else class="dynamic-param-config">
        <n-input v-model:value="param.dynamicName" placeholder="动态参数名" />
        <n-input v-model:value="param.exampleValue" placeholder="测试示例值" />
      </div>
    </div>
    
    <!-- 动态参数开关 -->
    <n-checkbox v-model:checked="param.isDynamic" />
    
    <!-- 删除按钮 -->
    <n-button @click="removeParam(index)">删除</n-button>
  </div>
</template>
```

## 🔧 实现细节

### 1. 配置输出格式转换

```typescript
const toHttpConfig = (): HttpConfig => {
  // 处理请求头：静态值直接使用，动态参数使用占位符
  const headers = headerList.value.reduce((acc, cur) => {
    if (cur.key) {
      if (cur.isDynamic && cur.dynamicName) {
        // 动态参数：生成占位符格式 ${paramName}
        acc[cur.key] = `\${${cur.dynamicName}}`;
      } else {
        // 静态参数：直接使用值
        acc[cur.key] = cur.value || '';
      }
    }
    return acc
  }, {} as Record<string, string>)

  // 收集所有动态参数定义
  const dynamicParams: DynamicParam[] = [];
  headerList.value.forEach(header => {
    if (header.isDynamic && header.dynamicName) {
      dynamicParams.push({
        name: header.dynamicName,
        description: `请求头参数 ${header.key}`,
        exampleValue: header.exampleValue
      });
    }
  });
  
  return { headers, params, dynamicParams, ...formData.value }
}
```

### 2. 配置加载和解析

```typescript
const loadConfig = (config: HttpConfig) => {
  // 处理请求头：检测占位符并恢复到UI状态
  headerList.value = config.headers ? Object.entries(config.headers).map(([key, value]) => {
    const strValue = String(value);
    const isDynamic = /^\$\{(.+)\}$/.test(strValue);
    
    if (isDynamic) {
      // 动态参数：提取参数名和示例值
      const dynamicName = strValue.match(/^\$\{(.+)\}$/)?.[1] || '';
      const paramDef = config.dynamicParams?.find(p => p.name === dynamicName);
      return {
        key,
        value: '',
        isDynamic: true,
        dynamicName,
        exampleValue: paramDef?.exampleValue || ''
      };
    } else {
      // 静态参数：直接使用值
      return {
        key,
        value: strValue,
        isDynamic: false,
        dynamicName: '',
        exampleValue: ''
      };
    }
  }) : [];
};
```

### 3. 数据流转过程（V2.0）

```
1. 用户添加请求头: Authorization: "Bearer token123"
    ↓
2. 用户勾选动态: ☑️ 动态参数
    ↓
3. 系统自动转换: dynamicName = "Authorization", exampleValue = "Bearer token123"
    ↓ 
4. 用户调整配置: dynamicName = "authToken", exampleValue = "Bearer abc123"
    ↓
5. 生成HTTP配置: { headers: { "Authorization": "${authToken}" }, dynamicParams: [...] }
    ↓
6. 执行时参数替换: Authorization: "Bearer abc123"
```

## 🎯 请求头动态化应用场景

### 为什么需要动态请求头？

请求头动态化在现代Web应用和企业系统中有着广泛的应用场景。与查询参数不同，请求头主要用于传递**元数据**、**上下文信息**和**安全凭证**，这些信息往往需要根据执行环境动态变化。

### 1. **认证和授权场景** (最常见)

#### 用户身份认证
```javascript
// 场景：用户登录后，每个请求都需要携带认证信息
headers: {
  'Authorization': '${userToken}',     // Bearer eyJhbGciOiJIUzI1NiIs...
  'X-Refresh-Token': '${refreshToken}' // 用于token续期
}

// 实际应用：
// - 用户A: userToken = "Bearer abc123", refreshToken = "refresh_abc"  
// - 用户B: userToken = "Bearer xyz789", refreshToken = "refresh_xyz"
```

#### API密钥管理
```javascript
// 场景：不同环境或客户使用不同的API密钥
headers: {
  'X-API-Key': '${apiKey}',           // 开发/测试/生产环境不同密钥
  'X-App-Secret': '${appSecret}'      // 应用级别的密钥
}

// 实际应用：
// - 开发环境: apiKey = "dev-key-123"
// - 生产环境: apiKey = "prod-key-xyz"
```

### 2. **多租户/多组织系统**

#### SaaS平台租户隔离
```javascript
// 场景：SaaS平台需要区分不同企业客户的数据
headers: {
  'X-Tenant-ID': '${tenantId}',       // tenant-company-a, tenant-company-b
  'X-Organization-ID': '${orgId}',    // org-startup-001, org-enterprise-002
  'X-Workspace-ID': '${workspaceId}'  // workspace-team-dev, workspace-team-prod
}

// 实际应用：
// - 公司A员工: tenantId = "tenant-company-a", orgId = "org-startup-001"
// - 公司B员工: tenantId = "tenant-company-b", orgId = "org-enterprise-002"
```

### 3. **物联网设备管理**

#### 设备身份和状态
```javascript
// 场景：IoT设备向云端上报数据
headers: {
  'X-Device-ID': '${deviceId}',       // device-sensor-001, device-gateway-hub-01
  'X-Device-Type': '${deviceType}',   // temperature-sensor, humidity-sensor
  'X-Device-Version': '${firmware}',  // v2.1.0, v2.1.1
  'X-Location': '${deviceLocation}'   // building-a-floor-2, warehouse-north
}

// 实际应用：
// - 温度传感器: deviceId = "temp-sensor-001", deviceType = "temperature-sensor"
// - 湿度传感器: deviceId = "humid-sensor-002", deviceType = "humidity-sensor"
```

### 4. **用户上下文和追踪**

#### 请求追踪和用户标识
```javascript
// 场景：微服务架构中的请求链路追踪
headers: {
  'X-User-ID': '${currentUserId}',    // user-12345, admin-001
  'X-Request-ID': '${requestId}',     // req-uuid-abc-123-def
  'X-Trace-ID': '${traceId}',        // trace-service-call-chain
  'X-Session-ID': '${sessionId}'      // session-browser-xyz789
}

// 实际应用：
// - 普通用户: userId = "user-12345", role = "member"
// - 管理员: userId = "admin-001", role = "administrator"
```

### 5. **环境和配置管理**

#### 多环境部署
```javascript
// 场景：同一套代码在不同环境中运行
headers: {
  'X-Environment': '${env}',          // development, testing, production
  'X-Region': '${region}',           // us-east-1, eu-west-1, cn-north-1
  'X-Data-Center': '${dataCenter}',  // dc-beijing-01, dc-shanghai-02
  'X-Version': '${apiVersion}'       // v1, v2, beta
}

// 实际应用：
// - 开发环境: env = "development", region = "local", apiVersion = "v2-beta"
// - 生产环境: env = "production", region = "cn-north-1", apiVersion = "v2"
```

### 6. **安全和防护**

#### 安全验证和防护
```javascript
// 场景：API安全防护和签名验证
headers: {
  'X-CSRF-Token': '${csrfToken}',    // csrf-abc123def (防CSRF攻击)
  'X-Signature': '${signature}',     // sha256-hash-of-request (请求签名)
  'X-Nonce': '${nonce}',            // random-unique-string (防重放)
  'X-Timestamp': '${requestTime}'    // 1705123456789 (时间戳验证)
}

// 实际应用：
// - 每次请求生成新的nonce和signature
// - 防止请求被重放攻击
```

## 🏢 实际业务案例详解

### 案例1：智慧城市IoT平台

```javascript
// 温度传感器上报数据的HTTP配置
{
  url: '/api/telemetry/temperature',
  method: 'POST',
  headers: {
    'Authorization': '${deviceToken}',      // 设备认证token
    'X-Device-ID': '${deviceId}',          // 传感器设备ID  
    'X-Location': '${sensorLocation}',     // 传感器地理位置
    'X-Tenant-ID': '${cityId}',           // 城市标识
    'Content-Type': 'application/json'     // 静态值
  },
  body: JSON.stringify({
    temperature: 25.6,
    humidity: 60.2,
    timestamp: new Date().toISOString()
  })
}

// 动态参数配置：
// deviceToken: "Bearer device-temp-001-token"
// deviceId: "temp-sensor-park-001" 
// sensorLocation: "central-park-zone-a"
// cityId: "city-beijing"
```

### 案例2：企业级CRM系统

```javascript
// 销售人员查询客户订单的HTTP配置
{
  url: '/api/customers/${customerId}/orders',
  method: 'GET', 
  headers: {
    'Authorization': '${userToken}',        // 销售人员认证token
    'X-User-ID': '${salesUserId}',         // 销售人员ID
    'X-Tenant-ID': '${companyId}',         // 公司租户ID
    'X-Role': '${userRole}',              // 用户角色
    'X-Department': '${department}',       // 部门信息
    'Accept': 'application/json'           // 静态值
  },
  params: {
    'page': '1',                           // 静态值
    'size': '${pageSize}',                // 动态分页大小
    'status': 'active'                     // 静态值
  }
}

// 动态参数配置：
// userToken: "Bearer sales-user-token-abc123"
// salesUserId: "sales-zhang-001"
// companyId: "company-tech-startup-001"  
// userRole: "sales-manager"
// department: "sales-north-region"
// customerId: "customer-12345"
// pageSize: "20"
```

### 案例3：移动应用后端API

```javascript
// 移动App用户个人信息更新的HTTP配置
{
  url: '/api/user/profile', 
  method: 'PUT',
  headers: {
    'Authorization': '${userAuthToken}',    // 用户认证token
    'X-Device-ID': '${mobileDeviceId}',    // 手机设备ID
    'X-App-Version': '${appVersion}',      // App版本号
    'X-Platform': '${platform}',          // iOS/Android
    'X-Push-Token': '${pushNotificationToken}', // 推送token
    'Content-Type': 'application/json'     // 静态值
  },
  body: JSON.stringify({
    nickname: "张三",
    avatar: "https://example.com/avatar.jpg"
  })
}

// 动态参数配置：
// userAuthToken: "Bearer mobile-user-abc123"
// mobileDeviceId: "iPhone-14-uuid-xyz789"
// appVersion: "v3.2.1"
// platform: "iOS"  
// pushNotificationToken: "apns-token-push-abc123"
```

## 💡 请求头动态化的核心价值

### 1. **上下文传递** 
请求头是HTTP协议中传递元数据的标准方式，不会影响请求体的业务数据，但提供了丰富的上下文信息。

### 2. **安全性增强**
认证token、API密钥、签名等敏感安全信息必须动态传递，硬编码会带来严重的安全风险。

### 3. **多环境适配** 
同一套配置在开发、测试、生产环境中需要使用不同的认证信息和配置参数。

### 4. **可观测性**
通过动态请求头传递用户ID、请求ID、链路ID等信息，便于日志记录、性能监控和问题追踪。

### 5. **业务隔离**
多租户系统通过请求头进行数据隔离，确保不同客户的数据安全性。

---

## 📋 使用方法

### 1. 基础操作流程

#### 步骤1：添加基础参数
```
1. 点击"添加请求头"或"添加查询参数"
2. 输入参数名，如：Authorization
3. 输入静态值，如：Bearer token123
```

#### 步骤2：转换为动态参数  
```
1. 勾选参数右侧的复选框
2. 系统自动切换到动态参数配置模式
3. 配置动态参数名，如：authToken
4. 设置测试示例值，如：Bearer abc123
```

#### 步骤3：查看参数概览
```
1. 页面底部显示"动态参数概览"
2. 查看所有动态参数的汇总信息
3. 确认参数位置和示例值设置
```

### 2. 请求头动态化实际操作

#### 场景：IoT设备数据上报配置

**步骤1: 添加静态请求头**
```
1. 点击"添加请求头"
2. 参数名: Content-Type, 参数值: application/json
3. 参数名: Accept, 参数值: application/json  
4. 参数名: Authorization, 参数值: Bearer device-temp-001-token
5. 参数名: X-Device-ID, 参数值: temp-sensor-park-001
```

**步骤2: 选择需要动态化的请求头**
```
┌─────────────────┬─────────────────────────────────────────┬──────┐
│ 参数名          │ 当前值                                   │ 动态 │
├─────────────────┼─────────────────────────────────────────┼──────┤
│ Content-Type    │ application/json                        │ ☐   │
│ Accept          │ application/json                        │ ☐   │  
│ Authorization   │ Bearer device-temp-001-token            │ ☑️   │ <- 勾选
│ X-Device-ID     │ temp-sensor-park-001                    │ ☑️   │ <- 勾选
└─────────────────┴─────────────────────────────────────────┴──────┘
```

**步骤3: 配置动态参数**
```
Authorization ☑️ 动态参数:
  ├─ 动态参数名: deviceToken
  └─ 示例值: Bearer device-temp-001-token

X-Device-ID ☑️ 动态参数:  
  ├─ 动态参数名: deviceId
  └─ 示例值: temp-sensor-park-001
```

**步骤4: 查看动态参数概览**
```
📊 动态参数概览
┌──────────────┬──────────────────────┬─────────────────────────────┐
│ 参数名       │ 位置                 │ 示例值                      │
├──────────────┼──────────────────────┼─────────────────────────────┤
│ deviceToken  │ 请求头 Authorization  │ Bearer device-temp-001-token │
│ deviceId     │ 请求头 X-Device-ID   │ temp-sensor-park-001        │
└──────────────┴──────────────────────┴─────────────────────────────┘
```

**最终生成配置:**
```json
{
  "url": "/api/telemetry/temperature",
  "method": "POST", 
  "headers": {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "${deviceToken}",
    "X-Device-ID": "${deviceId}"
  },
  "dynamicParams": [
    {
      "name": "deviceToken",
      "description": "请求头参数 Authorization",
      "exampleValue": "Bearer device-temp-001-token"
    },
    {
      "name": "deviceId", 
      "description": "请求头参数 X-Device-ID",
      "exampleValue": "temp-sensor-park-001"
    }
  ]
}
```

### 3. 多租户SaaS平台配置示例

#### 场景：企业客户数据查询

**请求头配置过程:**
```
🏢 企业A配置:
Authorization ☑️ -> userToken -> "Bearer company-a-user-token"  
X-Tenant-ID ☑️ -> tenantId -> "tenant-company-a"
X-User-Role ☑️ -> userRole -> "admin"

🏢 企业B配置:  
Authorization ☑️ -> userToken -> "Bearer company-b-user-token"
X-Tenant-ID ☑️ -> tenantId -> "tenant-company-b"  
X-User-Role ☑️ -> userRole -> "member"
```

**生成的配置差异:**
```javascript
// 企业A的配置
headers: {
  "Authorization": "${userToken}",    // Bearer company-a-user-token
  "X-Tenant-ID": "${tenantId}",      // tenant-company-a
  "X-User-Role": "${userRole}"       // admin
}

// 企业B的配置 (相同的模板，不同的参数值)
headers: {
  "Authorization": "${userToken}",    // Bearer company-b-user-token  
  "X-Tenant-ID": "${tenantId}",      // tenant-company-b
  "X-User-Role": "${userRole}"       // member
}
```

### 4. API安全认证配置示例

#### 场景：带签名验证的安全API

**高安全级别API请求头配置:**
```
┌─────────────────┬─────────────────┬─────────────────────────────────┬──────┐
│ 参数名          │ 配置模式        │ 动态参数名/示例值                │ 动态 │
├─────────────────┼─────────────────┼─────────────────────────────────┼──────┤
│ Authorization   │ 动态参数        │ authToken                       │ ☑️   │
│                 │                 │ 示例: Bearer jwt-token-abc123    │      │
│ X-API-Key       │ 动态参数        │ apiKey                          │ ☑️   │
│                 │                 │ 示例: api-key-production-xyz    │      │
│ X-Signature     │ 动态参数        │ requestSignature                │ ☑️   │
│                 │                 │ 示例: sha256-hash-of-request    │      │
│ X-Timestamp     │ 动态参数        │ requestTimestamp                │ ☑️   │
│                 │                 │ 示例: 1705123456789             │      │
│ X-Nonce         │ 动态参数        │ randomNonce                     │ ☑️   │
│                 │                 │ 示例: random-string-abc123      │      │
│ Content-Type    │ 静态值          │ application/json                │ ☐   │
└─────────────────┴─────────────────┴─────────────────────────────────┴──────┘
```

**安全防护效果:**
- ✅ **防重放攻击**: `X-Timestamp` + `X-Nonce` 组合
- ✅ **请求完整性**: `X-Signature` 验证请求内容未被篡改  
- ✅ **身份验证**: `Authorization` + `X-API-Key` 双重认证
- ✅ **环境隔离**: 不同环境使用不同的 `apiKey` 值

### 3. UI操作演示

```vue
<!-- 增强的参数行界面 -->
<div class="enhanced-param-row">
  <!-- 参数名 -->
  <n-input v-model:value="param.key" placeholder="Authorization" />
  
  <!-- 静态模式 -->
  <div v-if="!param.isDynamic" class="static-mode">
    <n-input v-model:value="param.value" placeholder="Bearer token123" />
  </div>
  
  <!-- 动态模式 -->
  <div v-else class="dynamic-mode">
    <n-input v-model:value="param.dynamicName" placeholder="authToken" />
    <n-input v-model:value="param.exampleValue" placeholder="Bearer abc123" />
  </div>
  
  <!-- 动态开关 -->
  <n-tooltip>
    <template #trigger>
      <n-checkbox v-model:checked="param.isDynamic" />
    </template>
    <span>勾选后变为动态参数</span>
  </n-tooltip>
  
  <!-- 删除按钮 -->
  <n-button @click="removeParam(index)">删除</n-button>
</div>
```

## 🚀 扩展和集成

### 1. 与数据源系统集成

```typescript
// 在数据源执行器中处理动态参数
export class HttpDataExecutor {
  async execute(config: HttpConfig, context: ParamContext) {
    // 1. 解析动态参数
    const resolvedConfig = await this.resolveDynamicParams(config, context);
    
    // 2. 执行HTTP请求
    const response = await fetch(resolvedConfig.url, {
      method: resolvedConfig.method,
      headers: resolvedConfig.headers,
      // ...
    });
    
    return response;
  }
  
  private async resolveDynamicParams(config: HttpConfig, context: ParamContext) {
    // 参数替换逻辑
    let resolvedUrl = config.url;
    const paramRegex = /\${(.+?)}/g;
    
    resolvedUrl = resolvedUrl.replace(paramRegex, (match, paramName) => {
      return this.getParamValue(paramName, context) || match;
    });
    
    return { ...config, url: resolvedUrl };
  }
}
```

### 2. 测试环境参数上下文

```typescript
// 测试页面中的参数上下文设置
const testContext = ref<ParamContext>({
  deviceId: 'device-12345',
  userId: 'user-001',
  pageSize: 10,
  tenantId: 'tenant-001',
  $system: {
    timestamp: Date.now(),
    userId: 'admin',
    deviceId: 'device-12345',
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }
  }
})
```

## 📚 最佳实践

### 1. 参数命名规范

```javascript
// ✅ 推荐的参数命名
${deviceId}           // 设备ID
${userId}            // 用户ID
${$system.timestamp} // 系统参数
${tenant.id}         // 嵌套属性

// ❌ 不推荐的命名
${device-id}         // 包含连字符
${user ID}           // 包含空格
${123param}          // 数字开头
```

### 2. 参数分类使用

```javascript
// 上下文参数：来自外部传入
${deviceId}          // 设备相关
${userId}            // 用户相关
${tenantId}          // 租户相关

// 系统参数：内置可用
${$system.timestamp}        // 当前时间戳
${$system.timeRange.start}  // 时间范围开始
${$system.timeRange.end}    // 时间范围结束

// 配置参数：固定配置
${pageSize}          // 分页大小
${timeout}           // 超时设置
```

### 3. 错误处理

```typescript
// 参数缺失处理
const resolveParam = (paramName: string, context: ParamContext) => {
  const value = getValueByPath(context, paramName);
  if (value === undefined) {
    console.warn(`参数 ${paramName} 未找到，使用默认值`);
    return getDefaultValue(paramName);
  }
  return value;
}

// 类型转换处理
const convertParamType = (value: any, expectedType: DynamicParamType) => {
  switch (expectedType) {
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'object':
      return typeof value === 'string' ? JSON.parse(value) : value;
    default:
      return String(value);
  }
}
```

## 🎯 实际应用场景

### 1. 设备数据查询

```javascript
const deviceDataConfig = {
  url: '/api/devices/${deviceId}/telemetry',
  params: {
    start_time: '${$system.timeRange.start}',
    end_time: '${$system.timeRange.end}',
    page_size: '${pageSize}'
  }
}
```

### 2. 用户权限验证

```javascript
const authConfig = {
  url: '/api/auth/check',
  headers: {
    'Authorization': 'Bearer ${token}',
    'X-User-ID': '${userId}',
    'X-Tenant-ID': '${tenantId}'
  }
}
```

### 3. 批量操作

```javascript
const batchConfig = {
  url: '/api/devices/batch-update',
  method: 'POST',
  body: JSON.stringify({
    device_ids: '${selectedDeviceIds}',
    operation: '${operationType}',
    operator: '${$system.userId}'
  })
}
```

## 🔄 未来扩展方向

### 1. 参数验证增强

- 添加参数类型验证
- 支持参数值范围校验
- 实现参数依赖关系检查

### 2. 可视化配置增强

- 支持参数值选择器
- 添加参数来源可视化标识
- 实现参数使用情况统计

### 3. 性能优化

- 参数缓存机制
- 批量参数解析
- 异步参数计算支持

---

## 🎯 V2.0 系统优势

### 核心改进

1. **用户主导控制**：从被动接受自动扫描结果转为主动选择动态参数
2. **直观操作界面**：勾选框 + 配置切换，操作逻辑清晰明确  
3. **零学习成本**：无需理解复杂的占位符语法规则
4. **配置状态可视**：动态参数概览提供全局视图

### 与V1.0对比

| 特性 | V1.0 (自动扫描) | V2.0 (勾选控制) |
|------|----------------|----------------|
| **参数识别** | 正则扫描 `${param}` | 用户勾选选择 |
| **操作复杂度** | 需要写占位符语法 | 直接勾选切换 |
| **配置透明度** | 扫描结果不可预期 | 用户完全控制 |
| **错误处理** | 占位符语法错误 | 无语法错误风险 |
| **学习成本** | 需学习占位符规则 | 零学习成本 |

### 应用场景

**✅ 适合V2.0的场景：**
- 📋 表单式配置界面
- 🎛️ 可视化参数管理 
- 👥 面向非技术用户
- 🔄 频繁参数调整需求

**⚠️ 可能需要混合使用：**
- 📝 复杂脚本化配置
- 🔀 批量参数处理
- 🎯 高度自定义需求

## 📚 最佳实践建议

### 1. 参数命名规范
```
✅ 推荐命名：
- authToken (认证令牌)
- deviceId (设备标识) 
- pageSize (分页大小)
- tenantId (租户标识)

❌ 避免命名：
- param1 (无语义)
- data (过于通用)
- xxx (无意义)
```

### 2. 动态参数使用策略
```
🎯 应该动态化的参数：
- 认证相关：token, userId, tenantId
- 业务标识：deviceId, projectId, orderId  
- 时间范围：startTime, endTime
- 分页参数：pageSize, pageNumber

🔒 保持静态的参数：
- 固定配置：Accept, Content-Type
- 常量值：version, format
- 调试标识：debug, trace
```

### 3. 测试示例值设置
```
💡 示例值设计原则：
- 真实性：使用真实格式的测试数据
- 可识别：包含明确的标识信息
- 一致性：同类参数使用相似格式

Examples:
- deviceId: "device-12345" (而非 "123")
- authToken: "Bearer abc123def" (而非 "token")
- tenantId: "tenant-demo-001" (而非 "t1")
```

---

## 总结

**V2.0 勾选式动态参数系统**通过**显式控制 + 直观配置**的设计理念，彻底解决了V1.0自动扫描带来的复杂性和不可预期性问题。

### 核心价值

1. **操作简化**：从复杂的占位符语法转为简单的勾选操作
2. **控制增强**：用户完全掌控哪些参数需要动态化
3. **体验提升**：直观的配置界面和实时预览
4. **维护友好**：清晰的参数来源和配置状态

通过这种设计，无论是技术开发者还是业务用户都能快速上手，专注于业务逻辑而非复杂的配置细节。V2.0系统真正实现了**简单易用**和**功能强大**的完美平衡。

## 🌟 请求头动态化的特殊价值

### 为什么请求头动态化如此重要？

相比于查询参数，**请求头动态化**在现代应用中具有更加重要和不可替代的作用：

#### 1. **安全第一** 🔒
- **认证信息安全传递**: JWT Token、API Key等敏感信息通过请求头传输更安全
- **防止信息泄露**: 请求头不会出现在URL中，避免在日志、缓存中暴露敏感数据
- **标准化安全实践**: HTTP Authorization标准、CSRF Token等都使用请求头

#### 2. **上下文丰富** 📋  
- **用户身份上下文**: 用户ID、角色、权限等身份信息
- **设备环境上下文**: 设备ID、平台、版本等设备信息
- **业务场景上下文**: 租户ID、组织ID、项目ID等业务隔离信息

#### 3. **系统集成** 🔗
- **微服务通信**: 服务间调用时传递链路追踪ID、用户上下文等
- **第三方集成**: 对接外部API时需要动态传递不同的认证密钥
- **多环境支持**: 开发、测试、生产环境使用不同的认证配置

#### 4. **可观测性** 📊
- **链路追踪**: X-Trace-ID、X-Span-ID等追踪信息
- **性能监控**: X-Request-ID用于请求性能分析
- **用户行为分析**: X-User-ID、X-Session-ID等用户行为数据

### 请求头 vs 查询参数的使用场景

| 信息类型 | 推荐位置 | 原因 |
|---------|---------|------|
| **认证Token** | 请求头 `Authorization` | 🔒 安全性，不在URL中暴露 |
| **API密钥** | 请求头 `X-API-Key` | 🔒 避免在访问日志中记录 |
| **用户ID** | 请求头 `X-User-ID` | 📋 上下文信息，非业务参数 |  
| **设备ID** | 请求头 `X-Device-ID` | 📋 设备标识，用于日志追踪 |
| **租户ID** | 请求头 `X-Tenant-ID` | 🏢 多租户隔离，安全考虑 |
| **分页参数** | 查询参数 `?page=1&size=10` | 🔍 业务查询条件 |
| **过滤条件** | 查询参数 `?status=active` | 🔍 业务过滤逻辑 |
| **排序参数** | 查询参数 `?sort=name` | 🔍 数据展示方式 |

### 实际影响对比

#### ❌ 不使用动态请求头的问题:
```javascript
// 硬编码方式 - 存在严重问题
const config = {
  url: '/api/device/data',
  headers: {
    'Authorization': 'Bearer hardcoded-token-123',  // 🚨 安全风险
    'X-Tenant-ID': 'tenant-001',                   // 🚨 无法多租户
    'X-User-ID': 'user-123'                        // 🚨 无法多用户
  }
}

// 问题:
// 1. Token过期无法动态更新
// 2. 无法支持多个租户/用户
// 3. 开发/生产环境无法区分
// 4. 安全信息暴露在配置中
```

#### ✅ 使用动态请求头的优势:
```javascript
// 动态配置方式 - 灵活安全
const config = {
  url: '/api/device/data',
  headers: {
    'Authorization': '${userToken}',    // ✅ 根据用户动态设置
    'X-Tenant-ID': '${tenantId}',      // ✅ 支持多租户
    'X-User-ID': '${currentUserId}'    // ✅ 支持多用户
  },
  dynamicParams: [
    { name: 'userToken', exampleValue: 'Bearer current-user-token' },
    { name: 'tenantId', exampleValue: 'tenant-current-org' },
    { name: 'currentUserId', exampleValue: 'user-current-session' }
  ]
}

// 优势:
// ✅ Token自动跟随用户会话更新
// ✅ 支持无限量租户和用户
// ✅ 环境配置完全隔离
// ✅ 敏感信息在运行时注入
```

---

## 🎉 结语

**请求头动态化**不仅仅是一个技术特性，更是现代Web应用和企业系统的**必要能力**。它解决了：

- 🔐 **安全认证**的动态性需求
- 🏢 **多租户系统**的数据隔离需求  
- 📱 **多平台应用**的上下文传递需求
- 🔗 **微服务架构**的服务间通信需求
- 📊 **可观测性**的链路追踪需求

通过V2.0勾选式动态参数系统，我们让这些复杂的企业级需求变得**简单易配置**，真正做到了**让技术服务业务，而非让业务适应技术**。

无论是IoT设备管理、SaaS平台、移动应用后端还是企业内部系统，请求头动态化都是不可或缺的核心功能。这个特性的价值会随着系统复杂度的增加而愈发重要！