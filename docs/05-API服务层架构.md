# ThingsPanel API 服务层架构详解

## API服务层概述

ThingsPanel项目采用了专业的分层架构设计API服务层，基于自研的`@sa/axios`包装器，构建了一套完整的HTTP客户端系统。整个服务层具有强类型约束、统一错误处理、多环境支持、模块化组织等特性，为复杂的物联网平台提供了稳定可靠的数据交互基础。

## 技术架构

### 核心技术栈
- **HTTP客户端**: `@sa/axios` (项目自研包装器)
- **基础库**: Axios + axios-retry (重试机制)
- **类型系统**: 完整的TypeScript类型定义
- **架构模式**: 扁平化请求实例 + 业务模块分离
- **环境配置**: 多环境配置管理

### 目录结构
```
src/service/
├── request/                    # HTTP客户端封装层
│   ├── index.ts                # 导出入口文件
│   ├── instance.ts             # 请求实例配置
│   └── request.ts              # 核心请求封装
├── api/                        # 业务API模块层
│   ├── auth.ts                 # 认证授权API
│   ├── device.ts               # 设备管理API
│   ├── panel.ts                # 面板管理API
│   ├── system-manage.ts        # 系统管理API
│   ├── alarm.ts                # 告警管理API
│   ├── automation.ts           # 自动化API
│   ├── notification.ts         # 通知管理API
│   └── ...                     # 其他业务模块
├── product/                    # 产品相关API
│   ├── list.ts                 # 产品列表
│   ├── update-ota.ts           # OTA升级
│   └── update-package.ts       # 升级包管理
└── api_demo/                   # 演示和适配器API
    ├── index.ts
    ├── management.ts
    └── management.adapter.ts
```

## HTTP客户端封装

### 请求实例配置

#### 双实例设计
```typescript
/**
 * 主要业务请求实例
 */
export const request = createFlatRequest<App.Service.DEVResponse>(
  // 基础配置
  {
    baseURL: isHttpProxy ? createProxyPattern() : demoUrl,
    headers: {
      'Content-Type': 'application/json',
      'apifoxToken': 'XL299LiMEDZ0H5h3A29PxwQXdMJqWyY2'
    }
  },
  // 拦截器配置
  {
    onRequest: async (config) => { /* 请求拦截逻辑 */ },
    onResponse: (response) => { /* 响应拦截逻辑 */ },
    onError: (error) => { /* 错误处理逻辑 */ }
  }
)

/**
 * Mock数据请求实例
 */
export const mockRequest = createFlatRequest<App.Service.MockResponse>({
  baseURL: otherBaseURL.mock
})
```

#### 环境适配机制
```typescript
/**
 * 环境配置自动适配
 */
const { otherBaseURL } = createServiceConfig(import.meta.env)
const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y'
const demoUrl = otherBaseURL.demo ? otherBaseURL.demo : `${window.location.origin}/api/v1`

/**
 * 代理模式支持
 */
export function createProxyPattern(key?: App.Service.OtherBaseURLKey) {
  if (!key) {
    return '/proxy-default'
  }
  return `/proxy-${key}`
}
```

### 请求拦截器

#### 认证处理
```typescript
async onRequest(config) {
  const { headers } = config
  
  // Token认证注入
  const token = localStg.get('token')
  const headersWithToken = token ? { 'x-token': token } : {}
  
  // 国际化支持
  const userLanguage = localStg.get('lang')
  if (userLanguage) {
    headersWithToken['Accept-Language'] = userLanguage
  }
  
  Object.assign(headers, headersWithToken)
  
  return config
}
```

#### 参数清理机制
```typescript
/**
 * 自动清理空参数
 * 避免传递无效数据到后端
 */
function cleanEmptyParams(params: Record<string, any>) {
  const cleanedParams = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleanedParams[key] = value
    }
  }
  
  return cleanedParams
}
```

### 响应拦截器

#### 成功判断逻辑
```typescript
/**
 * 后端响应成功判断
 */
isBackendSuccess(response) {
  return response.data.code === 200
}
```

#### 数据转换机制
```typescript
/**
 * 响应数据标准化处理
 */
transformBackendResponse(response) {
  // 非GET请求清理消息提示
  if (response.config.method !== 'get') {
    window.$message?.destroyAll()
  }
  
  // 根据配置决定返回完整响应还是仅数据
  if ((response as any).config?.needMessage) {
    return response.data  // 返回包含code、message的完整响应
  }
  
  return response.data.data  // 仅返回业务数据
}
```

#### 错误处理机制
```typescript
/**
 * 统一错误处理策略
 */
async onError(error) {
  const { response } = error
  
  switch (response?.status) {
    case 401:
      // 身份验证失败
      await handleAuthError()
      break
    case 403:
      // 权限不足
      showErrorMessage('权限不足，请联系管理员')
      break
    case 404:
      // 资源未找到
      showErrorMessage('请求的资源不存在')
      break
    case 500:
      // 服务器内部错误
      showErrorMessage('服务器内部错误，请稍后重试')
      break
    default:
      // 通用错误处理
      showErrorMessage(error.message || '网络请求失败')
  }
  
  return Promise.reject(error)
}

/**
 * 认证错误处理
 */
async function handleAuthError() {
  const authStore = useAuthStore()
  
  // 清除认证信息
  await authStore.logout()
  
  // 跳转登录页
  const currentRoute = router.currentRoute.value
  await router.push({
    name: 'login',
    query: { redirect: currentRoute.fullPath }
  })
}
```

## API模块设计

### 1. 认证模块 (auth.ts)

#### 功能覆盖
- 用户登录/登出
- 用户信息管理
- 验证码服务
- 密码重置
- 角色权限

#### 接口设计模式
```typescript
/**
 * 用户登录
 */
export function fetchLogin(email: string, password: string, salt: string | null) {
  return request.post<Api.Auth.LoginToken>('/login', { 
    email, 
    password, 
    salt 
  })
}

/**
 * 获取用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>('/user/detail')
}

/**
 * 发送验证码
 */
export function fetchSendCode(email: string) {
  return request.post<string>('/verification_code', { email })
}

/**
 * 用户注册
 */
export function fetchRegister(params: Api.Auth.RegisterParams) {
  return request.post<Api.Auth.LoginToken>('/register', params)
}

/**
 * 密码重置
 */
export function fetchResetPassword(params: Api.Auth.ResetPasswordParams) {
  return request.post('/reset_password', params)
}

/**
 * 获取常量路由（权限路由）
 */
export function fetchGetConstantRoutes() {
  return request.get<Api.Route.MenuRoute[]>('/route/constant')
}

/**
 * 获取用户路由（动态路由）
 */
export function fetchGetUserRoutes() {
  return request.get<Api.Route.UserRoute[]>('/route/user')
}
```

### 2. 设备管理模块 (device.ts)

#### 架构特色
采用**类和函数混合模式**，既提供面向对象的API，也提供函数式接口：

```typescript
/**
 * 面向对象API设计
 */
export default class Device {
  private readonly http: AxiosInstance
  
  constructor(http: AxiosInstance) {
    this.http = http
  }
  
  /**
   * 获取设备分组
   */
  async getDeviceGroup(params: any) {
    return await this.http.get<any>('/device/group', { params })
  }
  
  /**
   * 获取设备详情
   */
  async getDeviceDetail(deviceId: string) {
    return await this.http.get<any>(`/device/${deviceId}`)
  }
}

/**
 * 函数式API（推荐使用）
 */
export const getDeviceGroup = async (params: DeviceGroupParams) => {
  return await request.get<DeviceGroupResponse>('/device/group', { params })
}

export const deviceDetail = async (deviceId: string) => {
  return await request.get<DeviceDetailResponse>(`/device/${deviceId}`)
}
```

#### 核心功能模块

##### 设备生命周期管理
```typescript
/**
 * 设备CRUD操作
 */
export const createDevice = async (params: CreateDeviceParams) => {
  return await request.post<Device>('/device', params)
}

export const updateDevice = async (id: string, params: UpdateDeviceParams) => {
  return await request.put<Device>(`/device/${id}`, params)
}

export const deleteDevice = async (id: string) => {
  return await request.delete(`/device/${id}`)
}

export const getDeviceList = async (params: DeviceListParams) => {
  return await request.get<DeviceListResponse>('/device', { params })
}
```

##### 设备数据处理
```typescript
/**
 * 遥测数据处理
 */
export const telemetryDataCurrent = async (params: TelemetryCurrentParams) => {
  return await request.get<TelemetryData[]>('/telemetry/current', { params })
}

export const telemetryDataHistoryList = async (params: TelemetryHistoryParams) => {
  return await request.get<TelemetryHistoryResponse>('/telemetry/history', { params })
}

/**
 * 属性管理
 */
export const getAttributeDataSet = async (params: AttributeParams) => {
  return await request.get<AttributeData[]>('/attribute', { params })
}

export const attributeDataPub = async (params: AttributePublishParams) => {
  return await request.post('/attribute/pub', params)
}

/**
 * 命令控制
 */
export const commandDataPub = async (params: CommandParams) => {
  return await request.post('/command/pub', params)
}

export const commandDataById = async (id: string) => {
  return await request.get<CommandData>(`/command/${id}`)
}

/**
 * 事件处理
 */
export const getEventDataSet = async (params: EventParams) => {
  return await request.get<EventData[]>('/event', { params })
}
```

##### 设备配置管理
```typescript
/**
 * 设备模板管理
 */
export const getDeviceConfigList = async (params: ConfigListParams) => {
  return await request.get<ConfigListResponse>('/device/config', { params })
}

export const createDeviceConfig = async (params: CreateConfigParams) => {
  return await request.post<DeviceConfig>('/device/config', params)
}

/**
 * 设备分组管理
 */
export const getDeviceGroup = async (params: GroupParams) => {
  return await request.get<DeviceGroup[]>('/device/group', { params })
}

export const createDeviceGroup = async (params: CreateGroupParams) => {
  return await request.post<DeviceGroup>('/device/group', params)
}
```

### 3. 面板管理模块 (panel.ts)

#### RESTful风格设计
```typescript
/**
 * 看板管理 - 标准CRUD操作
 */

// 查询看板列表
export const getBoardList = async (params: Panel.RequestParams) => {
  return await request.get<Panel.Data>('/board', { params })
}

// 获取单个看板
export const getBoard = async (id: string) => {
  return await request.get<Panel.Board>(`/board/${id}`)
}

// 创建看板
export const createBoard = async (params: Panel.CreateParams) => {
  return await request.post<Panel.Board>('/board', params)
}

// 更新看板
export const updateBoard = async (id: string, params: Panel.UpdateParams) => {
  return await request.put<Panel.Board>(`/board/${id}`, params)
}

// 删除看板
export const deleteBoard = async (id: string) => {
  return await request.delete(`/board/${id}`)
}

/**
 * 看板配置管理
 */
export const getBoardConfig = async (boardId: string) => {
  return await request.get<Panel.Config>(`/board/${boardId}/config`)
}

export const updateBoardConfig = async (boardId: string, config: Panel.Config) => {
  return await request.put<Panel.Config>(`/board/${boardId}/config`, config)
}
```

### 4. 系统管理模块 (system-manage.ts)

#### 通用泛型设计
```typescript
/**
 * 角色管理
 */
export const fetchGetRoleList = (params?: Api.SystemManage.RoleSearchParams) => {
  return request.get<Api.SystemManage.RoleList>('/role', { params })
}

export const fetchAddRole = (data: Api.SystemManage.RoleEdit) => {
  return request.post<boolean>('/role', data)
}

export const fetchUpdateRole = (data: Api.SystemManage.RoleEditWithId) => {
  return request.put<boolean>(`/role/${data.id}`, data)
}

export const fetchDeleteRole = (id: string) => {
  return request.delete<boolean>(`/role/${id}`)
}

/**
 * 用户管理
 */
export const fetchGetUserList = (params?: Api.SystemManage.UserSearchParams) => {
  return request.get<Api.SystemManage.UserList>('/user', { params })
}

export const fetchAddUser = (data: Api.SystemManage.UserEdit) => {
  return request.post<boolean>('/user', data)
}

/**
 * 菜单管理
 */
export const fetchGetMenuList = () => {
  return request.get<Api.SystemManage.MenuList>('/menu')
}

export const fetchGetMenuTree = () => {
  return request.get<Api.SystemManage.MenuTree[]>('/menu/tree')
}
```

### 5. 告警管理模块 (alarm.ts)

#### 告警处理链路
```typescript
/**
 * 告警信息管理
 */
export const getAlarmInfo = async (params: AlarmInfoParams) => {
  return await request.get<AlarmInfoResponse>('/alarm/info', { params })
}

export const createAlarmRule = async (params: CreateAlarmRuleParams) => {
  return await request.post<AlarmRule>('/alarm/rule', params)
}

export const updateAlarmRule = async (id: string, params: UpdateAlarmRuleParams) => {
  return await request.put<AlarmRule>(`/alarm/rule/${id}`, params)
}

/**
 * 通知管理
 */
export const getNotificationServices = async (params?: NotificationParams) => {
  return await request.get<NotificationService[]>('/notification/services', { params })
}

export const createNotificationGroup = async (params: CreateNotificationGroupParams) => {
  return await request.post<NotificationGroup>('/notification/group', params)
}
```

## 类型系统架构

### API类型定义结构

#### 命名空间组织
```typescript
declare namespace Api {
  /**
   * 基础API类型
   */
  namespace BaseApi {
    interface Response<T = any> {
      code: number
      message: string
      data: T
    }
    
    interface PaginatedResponse<T = any> extends Response<T[]> {
      total: number
      page: number
      pageSize: number
    }
  }
  
  /**
   * 通用类型约束
   */
  namespace Common {
    interface PaginatingCommonParams {
      page?: number
      pageSize?: number
    }
    
    interface CommonSearchParams extends PaginatingCommonParams {
      keyword?: string
      startTime?: string
      endTime?: string
    }
  }
  
  /**
   * 认证相关类型
   */
  namespace Auth {
    interface LoginToken {
      token: string
      refreshToken?: string
    }
    
    interface UserInfo {
      id: string
      userName: string
      userRole: string
      email?: string
      phone?: string
    }
    
    interface RegisterParams {
      userName: string
      email: string
      password: string
      confirmPassword: string
      code: string
    }
    
    interface ResetPasswordParams {
      email: string
      code: string
      password: string
    }
  }
  
  /**
   * 设备管理类型
   */
  namespace Device {
    interface DeviceInfo {
      id: string
      name: string
      deviceNo: string
      status: 'online' | 'offline'
      deviceType: string
      protocol: string
      createTime: string
      lastActiveTime?: string
    }
    
    interface TelemetryData {
      deviceId: string
      key: string
      value: any
      timestamp: number
      dataType: string
    }
    
    interface CommandData {
      id: string
      deviceId: string
      command: string
      params: Record<string, any>
      status: 'pending' | 'success' | 'failed'
    }
  }
  
  /**
   * 面板管理类型
   */
  namespace Panel {
    interface Board {
      id: string
      name: string
      description?: string
      config: BoardConfig
      isHome: boolean
      createTime: string
    }
    
    interface BoardConfig {
      layout: LayoutItem[]
      theme: ThemeConfig
      settings: Record<string, any>
    }
  }
}
```

#### 业务类型扩展
```typescript
/**
 * 业务域类型扩展
 */
declare namespace DeviceManagement {
  interface Service extends Api.ApiApplyManagement.Service {
    // 扩展字段
    customConfig?: Record<string, any>
  }
  
  interface DeviceDetail extends Api.Device.DeviceInfo {
    telemetryData?: Api.Device.TelemetryData[]
    attributes?: Record<string, any>
    commands?: Api.Device.CommandData[]
  }
}

/**
 * 自定义路由类型
 */
declare namespace CustomRoute {
  interface Route extends Api.Route.MenuRoute {
    component?: any
    redirect?: string
  }
}
```

## 环境配置与代理

### 多环境配置管理

#### 服务配置映射
```typescript
/**
 * 环境配置管理
 * 支持开发、测试、生产三套环境
 */
export function createServiceConfig(env: Env.ImportMeta) {
  const mockURL = 'https://mock.apifox.com/m1/4080832-0-default'
  const devURL = 'http://c.thingspanel.cn/api/v1'
  const testURL = 'https://test-api.thingspanel.cn/api/v1'
  const prodURL = 'https://api.thingspanel.cn/api/v1'

  const serviceConfigMap: App.Service.ServiceConfigMap = {
    dev: {
      baseURL: devURL,
      otherBaseURL: {
        demo: devURL,
        mock: mockURL
      }
    },
    test: {
      baseURL: testURL,
      otherBaseURL: {
        demo: testURL,
        mock: mockURL
      }
    },
    prod: {
      baseURL: prodURL,
      otherBaseURL: {
        demo: prodURL,
        mock: mockURL
      }
    }
  }

  const { VITE_SERVICE_ENV = 'dev' } = env
  return serviceConfigMap[VITE_SERVICE_ENV]
}
```

#### 代理配置
```typescript
/**
 * 开发环境代理配置
 */
export function createViteProxy(env: Env.ImportMeta) {
  const { VITE_HTTP_PROXY, VITE_PROXY_DOMAIN_REAL } = env
  
  if (VITE_HTTP_PROXY !== 'Y') return undefined

  return {
    '/proxy-default': {
      target: VITE_PROXY_DOMAIN_REAL,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/proxy-default/, ''),
      configure: (proxy, options) => {
        // 代理配置钩子
      }
    }
  }
}
```

## @sa/axios 包分析

### 核心特性扩展

#### 请求配置扩展
```typescript
/**
 * 自定义请求配置
 */
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  needMessage?: boolean          // 是否需要完整响应消息
  skipErrorHandler?: boolean     // 跳过默认错误处理
  timeout?: number              // 请求超时时间
  retries?: number              // 重试次数
  retryDelay?: number           // 重试延迟
}
```

#### 响应类型映射
```typescript
/**
 * 响应类型映射
 */
type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer'

interface MappedType {
  json: any
  text: string
  blob: Blob
  arrayBuffer: ArrayBuffer
}
```

#### 拦截器增强
```typescript
/**
 * 拦截器链增强
 */
interface RequestInterceptorConfig {
  onRequest?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>
  onRequestError?: (error: any) => any
  onResponse?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>
  onResponseError?: (error: any) => any
}
```

## 设计模式与最佳实践

### 设计模式应用

#### 1. 工厂模式
```typescript
/**
 * 请求实例工厂
 * 根据不同配置创建特定用途的请求实例
 */
export function createFlatRequest<ResponseType>(
  axiosConfig: AxiosRequestConfig,
  options: CreateRequestOptions<ResponseType>
): FlatRequestInstance<ResponseType> {
  return new FlatRequestInstance(axiosConfig, options)
}
```

#### 2. 拦截器模式
```typescript
/**
 * 链式拦截器处理
 * 支持多个拦截器的组合使用
 */
class InterceptorChain {
  private interceptors: Interceptor[] = []
  
  use(interceptor: Interceptor) {
    this.interceptors.push(interceptor)
    return this
  }
  
  execute(context: any) {
    return this.interceptors.reduce(
      (result, interceptor) => interceptor(result),
      context
    )
  }
}
```

#### 3. 适配器模式
```typescript
/**
 * 环境适配器
 * 将不同环境的配置适配为统一接口
 */
class EnvironmentAdapter {
  static adapt(env: string): ServiceConfig {
    const adapters = {
      development: () => ({ baseURL: DEV_URL }),
      testing: () => ({ baseURL: TEST_URL }),
      production: () => ({ baseURL: PROD_URL })
    }
    
    return adapters[env]?.() || adapters.development()
  }
}
```

### 开发最佳实践

#### 1. 类型安全
```typescript
/**
 * 强类型API调用
 */
// ✅ 推荐：完整类型约束
export function fetchUserInfo(): Promise<Api.Auth.UserInfo> {
  return request.get<Api.Auth.UserInfo>('/user/info')
}

// ❌ 避免：any类型
export function fetchUserInfo(): Promise<any> {
  return request.get('/user/info')
}
```

#### 2. 错误处理
```typescript
/**
 * 分层错误处理
 */
// 全局错误处理（拦截器层）
async onError(error: AxiosError) {
  // 通用错误处理逻辑
  handleCommonError(error)
  return Promise.reject(error)
}

// 业务层错误处理
export async function fetchWithErrorHandling<T>(
  apiCall: () => Promise<T>
): Promise<T | null> {
  try {
    return await apiCall()
  } catch (error) {
    // 业务特定错误处理
    console.error('API调用失败:', error)
    return null
  }
}
```

#### 3. 请求优化
```typescript
/**
 * 请求缓存机制
 */
class RequestCache {
  private cache = new Map<string, { data: any, timestamp: number }>()
  private cacheTime = 5 * 60 * 1000 // 5分钟缓存
  
  get(key: string) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data
    }
    return null
  }
  
  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}

/**
 * 请求防抖
 */
function debounceRequest<T>(
  fn: (...args: any[]) => Promise<T>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout
  
  return (...args: any[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}
```

## 性能监控与优化

### 请求性能监控
```typescript
/**
 * API调用性能监控
 */
class APIMonitor {
  private metrics = new Map<string, PerformanceMetric[]>()
  
  startTracking(apiName: string): string {
    const trackingId = nanoid()
    const startTime = performance.now()
    
    // 存储开始时间
    this.metrics.set(trackingId, {
      apiName,
      startTime,
      endTime: null,
      duration: null
    })
    
    return trackingId
  }
  
  endTracking(trackingId: string) {
    const metric = this.metrics.get(trackingId)
    if (metric) {
      metric.endTime = performance.now()
      metric.duration = metric.endTime - metric.startTime
      
      // 上报性能数据
      this.reportMetrics(metric)
    }
  }
  
  private reportMetrics(metric: PerformanceMetric) {
    // 发送到监控系统
    console.log(`API ${metric.apiName} took ${metric.duration}ms`)
  }
}
```

### 内存管理
```typescript
/**
 * 请求内存管理
 */
class RequestMemoryManager {
  private activeRequests = new Set<AbortController>()
  
  createRequest(): AbortController {
    const controller = new AbortController()
    this.activeRequests.add(controller)
    
    // 请求完成后自动清理
    controller.signal.addEventListener('abort', () => {
      this.activeRequests.delete(controller)
    })
    
    return controller
  }
  
  cancelAllRequests() {
    this.activeRequests.forEach(controller => {
      controller.abort()
    })
    this.activeRequests.clear()
  }
}
```

## 总结

### 架构优势

1. **分层清晰**: request层、api层、类型层职责明确
2. **类型安全**: 完整的TypeScript类型体系
3. **错误处理统一**: 集中式错误拦截和处理机制
4. **环境配置灵活**: 支持多环境配置和代理
5. **扩展性良好**: 模块化设计，易于添加新功能
6. **性能优化**: 内置缓存、重试、防抖等机制

### 物联网特色适配

1. **设备数据链路**: 完整的设备CRUD、遥测、命令、事件处理
2. **实时数据支持**: WebSocket集成和实时数据处理
3. **多协议支持**: 设备接入协议的统一抽象
4. **告警系统**: 完整的告警规则和通知链路
5. **面板管理**: 支持动态面板配置和数据绑定

### 开发体验

1. **类型提示**: 完整的IDE智能提示支持
2. **调试友好**: 详细的错误信息和请求日志
3. **测试支持**: Mock数据和测试工具集成
4. **文档完备**: 接口注释和使用示例
5. **工具链成熟**: ESLint、Prettier等代码质量工具

ThingsPanel的API服务层展现了企业级Vue 3项目应有的架构水准，在类型安全、错误处理、模块化组织等方面都有很好的实践，为复杂的物联网平台提供了稳定可靠的数据交互基础。