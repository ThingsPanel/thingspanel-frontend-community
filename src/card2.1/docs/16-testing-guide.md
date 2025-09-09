# 测试指南 - Card 2.1 全面测试策略

本章详细介绍 Card 2.1 组件系统的测试架构、测试工具和最佳实践，确保系统的稳定性和可靠性。

## 🧪 测试架构概览

### 测试金字塔结构
```
┌─────────────────────────────────────────────────────────┐
│                    E2E Tests                           │
│                  (端到端测试)                            │
│            ┌─────────────────────┐                      │
│            │  User Workflows     │                      │
│            │  Visual Regression  │                      │
│            └─────────────────────┘                      │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                Integration Tests                        │
│                  (集成测试)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Component   │  │    API      │  │   Data      │     │
│  │ Integration │  │ Integration │  │ Integration │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                   Unit Tests                           │
│                  (单元测试)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Components  │  │ Functions   │  │    Hooks    │     │
│  │    Tests    │  │   Tests     │  │   Tests     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 🔧 测试环境配置

### 1. 测试框架配置
```typescript
// vitest.config.ts - Card 2.1 测试配置
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/card2.1/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/card2.1/tests/',
        '**/*.d.ts',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@card2': resolve(__dirname, './src/card2.1')
    }
  }
})
```

### 2. 测试环境初始化
```typescript
// src/card2.1/tests/setup.ts
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

// 全局测试配置
config.global.plugins = [createPinia()]

// Mock 浏览器 API
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock performance API
global.performance.mark = vi.fn()
global.performance.measure = vi.fn()
global.performance.clearMarks = vi.fn()
global.performance.clearMeasures = vi.fn()

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock console 方法
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
}
```

### 3. 测试工具库
```typescript
// src/card2.1/tests/utils/test-helpers.ts
/**
 * Card 2.1 测试工具库
 * 提供常用的测试辅助函数
 */

import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import type { ComponentDefinition } from '@card2/types'

/**
 * 创建组件测试包装器
 */
export function createComponentWrapper<T>(
  component: any,
  props: Record<string, any> = {},
  options: any = {}
) {
  const pinia = createPinia()
  
  return mount(component, {
    props,
    global: {
      plugins: [pinia],
      stubs: {
        'n-card': true,
        'n-button': true,
        'n-input': true,
        'n-select': true,
        'n-form': true,
        'n-form-item': true
      },
      ...options.global
    },
    ...options
  }) as VueWrapper<T>
}

/**
 * 等待异步操作完成
 */
export async function waitForAsync(timeout = 1000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

/**
 * 模拟数据源响应
 */
export function mockDataSourceResponse<T>(data: T, delay = 0): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * 创建模拟的组件定义
 */
export function createMockComponentDefinition(
  overrides: Partial<ComponentDefinition> = {}
): ComponentDefinition {
  return {
    type: 'test-component',
    name: 'Test Component',
    description: 'A test component',
    category: 'test',
    tags: ['test'],
    config: {
      style: { width: 300, height: 200 }
    },
    dataSources: [
      {
        key: 'testData',
        name: 'Test Data',
        description: 'Test data source',
        type: 'api' as const,
        required: false,
        multiple: false,
        fieldMappings: {
          value: { path: 'data.value', type: 'number' }
        }
      }
    ],
    ...overrides
  }
}

/**
 * 创建模拟的API响应
 */
export function createMockApiResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })
}

/**
 * 断言元素可见性
 */
export function expectElementVisible(wrapper: VueWrapper, selector: string) {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.isVisible()).toBe(true)
}

/**
 * 断言元素包含文本
 */
export function expectElementText(
  wrapper: VueWrapper, 
  selector: string, 
  text: string
) {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.text()).toContain(text)
}

/**
 * 模拟用户输入
 */
export async function simulateUserInput(
  wrapper: VueWrapper,
  selector: string,
  value: string
) {
  const input = wrapper.find(selector)
  expect(input.exists()).toBe(true)
  
  await input.setValue(value)
  await input.trigger('input')
  await nextTick()
}

/**
 * 模拟用户点击
 */
export async function simulateUserClick(
  wrapper: VueWrapper,
  selector: string
) {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  
  await element.trigger('click')
  await nextTick()
}
```

## 🧪 单元测试

### 1. 组件单元测试模板
```typescript
// src/card2.1/components/test/simple-display/simple-display.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SimpleDisplayCard from './index.vue'
import { createComponentWrapper, waitForAsync, mockDataSourceResponse } from '@card2/tests/utils/test-helpers'

describe('SimpleDisplayCard', () => {
  let wrapper: any
  
  const defaultProps = {
    title: 'Test Display',
    showUnit: true,
    decimalPlaces: 2
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('组件渲染', () => {
    it('应该正确渲染基本结构', async () => {
      wrapper = createComponentWrapper(SimpleDisplayCard, defaultProps)
      
      // 检查卡片是否存在
      expect(wrapper.find('.simple-display-card').exists()).toBe(true)
      
      // 检查标题是否正确显示
      expect(wrapper.find('[data-testid="component-title"]').text())
        .toBe('Test Display')
    })
    
    it('应该正确显示加载状态', async () => {
      // Mock 数据加载
      const mockDataBinding = {
        data: { value: null },
        loading: true,
        error: null
      }
      
      wrapper = createComponentWrapper(SimpleDisplayCard, defaultProps, {
        global: {
          provide: {
            'component-data-binding': mockDataBinding
          }
        }
      })
      
      // 检查加载状态
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
    })
    
    it('应该正确显示错误状态', async () => {
      const mockError = new Error('Data load failed')
      const mockDataBinding = {
        data: { value: null },
        loading: false,
        error: mockError
      }
      
      wrapper = createComponentWrapper(SimpleDisplayCard, defaultProps, {
        global: {
          provide: {
            'component-data-binding': mockDataBinding
          }
        }
      })
      
      // 检查错误状态
      expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="error-message"]').text())
        .toContain('Data load failed')
    })
  })
  
  describe('数据显示', () => {
    it('应该正确格式化数值显示', async () => {
      const mockData = {
        value: 123.456789,
        unit: '°C',
        timestamp: Date.now()
      }
      
      const mockDataBinding = {
        data: mockData,
        loading: false,
        error: null
      }
      
      wrapper = createComponentWrapper(SimpleDisplayCard, defaultProps, {
        global: {
          provide: {
            'component-data-binding': mockDataBinding
          }
        }
      })
      
      await waitForAsync()
      
      // 检查数值格式化
      const valueElement = wrapper.find('[data-testid="data-value"]')
      expect(valueElement.text()).toBe('123.46') // 2位小数
      
      // 检查单位显示
      const unitElement = wrapper.find('[data-testid="data-unit"]')
      expect(unitElement.text()).toBe('°C')
    })
    
    it('应该根据配置控制单位显示', async () => {
      const propsWithoutUnit = { ...defaultProps, showUnit: false }
      const mockData = {
        value: 100,
        unit: '°C',
        timestamp: Date.now()
      }
      
      wrapper = createComponentWrapper(SimpleDisplayCard, propsWithoutUnit, {
        global: {
          provide: {
            'component-data-binding': { data: mockData, loading: false, error: null }
          }
        }
      })
      
      await waitForAsync()
      
      // 单位应该不显示
      expect(wrapper.find('[data-testid="data-unit"]').exists()).toBe(false)
    })
  })
  
  describe('响应式更新', () => {
    it('应该响应属性变化重新渲染', async () => {
      wrapper = createComponentWrapper(SimpleDisplayCard, defaultProps)
      
      // 初始标题
      expect(wrapper.find('[data-testid="component-title"]').text())
        .toBe('Test Display')
      
      // 更新标题
      await wrapper.setProps({ title: 'Updated Title' })
      
      // 检查更新后的标题
      expect(wrapper.find('[data-testid="component-title"]').text())
        .toBe('Updated Title')
    })
    
    it('应该响应数据变化重新渲染', async () => {
      const initialData = {
        data: { value: 100, unit: '°C', timestamp: Date.now() },
        loading: false,
        error: null
      }
      
      wrapper = createComponentWrapper(SimpleDisplayCard, defaultProps, {
        global: {
          provide: {
            'component-data-binding': reactive(initialData)
          }
        }
      })
      
      await waitForAsync()
      
      // 初始值
      expect(wrapper.find('[data-testid="data-value"]').text()).toBe('100.00')
      
      // 更新数据
      initialData.data.value = 200
      await nextTick()
      
      // 检查更新后的值
      expect(wrapper.find('[data-testid="data-value"]').text()).toBe('200.00')
    })
  })
  
  describe('事件处理', () => {
    it('应该正确处理刷新事件', async () => {
      const mockRefresh = vi.fn()
      
      wrapper = createComponentWrapper(SimpleDisplayCard, defaultProps, {
        global: {
          provide: {
            'component-data-binding': {
              data: { value: 100 },
              loading: false,
              error: null,
              refresh: mockRefresh
            }
          }
        }
      })
      
      // 触发刷新
      await wrapper.find('[data-testid="refresh-button"]').trigger('click')
      
      // 检查刷新函数是否被调用
      expect(mockRefresh).toHaveBeenCalledOnce()
    })
  })
  
  describe('国际化', () => {
    it('应该正确显示国际化文本', async () => {
      const mockI18n = {
        t: vi.fn().mockImplementation((key) => {
          const translations: Record<string, string> = {
            'card2.components.simpleDisplay.defaultTitle': '数据显示',
            'card2.components.simpleDisplay.currentValue': '当前值'
          }
          return translations[key] || key
        })
      }
      
      wrapper = createComponentWrapper(SimpleDisplayCard, {}, {
        global: {
          mocks: {
            $t: mockI18n.t
          }
        }
      })
      
      expect(mockI18n.t).toHaveBeenCalledWith(
        'card2.components.simpleDisplay.defaultTitle'
      )
    })
  })
  
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })
})
```

### 2. Hook 单元测试
```typescript
// src/card2.1/hooks/useComponentDataBinding.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useComponentDataBinding } from './useComponentDataBinding'
import { mockDataSourceResponse } from '@card2/tests/utils/test-helpers'

describe('useComponentDataBinding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('基础功能', () => {
    it('应该正确初始化状态', () => {
      const { data, loading, error } = useComponentDataBinding({
        dataSources: [
          {
            key: 'test',
            name: 'Test',
            description: 'Test data source',
            type: 'api',
            required: false,
            multiple: false,
            fieldMappings: {}
          }
        ]
      })
      
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
    
    it('应该正确加载数据', async () => {
      const mockData = { value: 123, unit: '°C' }
      
      // Mock API 响应
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
      
      const { data, loading, error, load } = useComponentDataBinding({
        dataSources: [
          {
            key: 'test',
            name: 'Test',
            type: 'api',
            required: false,
            multiple: false,
            config: {
              url: 'https://api.test.com/data',
              method: 'GET'
            },
            fieldMappings: {
              value: { path: 'value', type: 'number' },
              unit: { path: 'unit', type: 'string' }
            }
          }
        ]
      })
      
      // 开始加载
      const promise = load()
      
      // 检查加载状态
      expect(loading.value).toBe(true)
      
      // 等待加载完成
      await promise
      
      // 检查结果
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(data.value).toEqual(mockData)
    })
    
    it('应该正确处理加载错误', async () => {
      const mockError = new Error('Network error')
      
      // Mock API 错误
      global.fetch = vi.fn().mockRejectedValue(mockError)
      
      const { data, loading, error, load } = useComponentDataBinding({
        dataSources: [
          {
            key: 'test',
            name: 'Test',
            type: 'api',
            required: false,
            multiple: false,
            config: { url: 'https://api.test.com/data' },
            fieldMappings: {}
          }
        ]
      })
      
      // 开始加载
      const promise = load()
      
      // 等待加载完成
      await promise.catch(() => {}) // 忽略错误
      
      // 检查错误状态
      expect(loading.value).toBe(false)
      expect(error.value).toEqual(mockError)
      expect(data.value).toBeNull()
    })
  })
  
  describe('数据转换', () => {
    it('应该正确应用字段映射', async () => {
      const mockApiResponse = {
        response: {
          data: {
            temperature: 25.5,
            humidity: 60,
            location: 'Living Room'
          }
        }
      }
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })
      
      const { data, load } = useComponentDataBinding({
        dataSources: [
          {
            key: 'sensor',
            name: 'Sensor Data',
            type: 'api',
            required: false,
            multiple: false,
            config: { url: 'https://api.sensor.com/data' },
            fieldMappings: {
              temperature: { path: 'response.data.temperature', type: 'number' },
              humidity: { path: 'response.data.humidity', type: 'number' },
              room: { path: 'response.data.location', type: 'string' }
            }
          }
        ]
      })
      
      await load()
      
      expect(data.value).toEqual({
        temperature: 25.5,
        humidity: 60,
        room: 'Living Room'
      })
    })
  })
  
  describe('缓存机制', () => {
    it('应该使用缓存避免重复请求', async () => {
      const mockData = { value: 123 }
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
      
      global.fetch = fetchMock
      
      const { load } = useComponentDataBinding({
        dataSources: [
          {
            key: 'cached',
            name: 'Cached Data',
            type: 'api',
            required: false,
            multiple: false,
            config: { 
              url: 'https://api.test.com/data',
              cacheTTL: 300000 // 5分钟缓存
            },
            fieldMappings: {}
          }
        ]
      })
      
      // 第一次加载
      await load()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      
      // 第二次加载（应该使用缓存）
      await load()
      expect(fetchMock).toHaveBeenCalledTimes(1) // 仍然只调用一次
    })
  })
})
```

## 🔗 集成测试

### 1. 组件集成测试
```typescript
// src/card2.1/tests/integration/component-integration.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ComponentRegistry } from '@card2/core/component-registry'
import { InteractionManager } from '@card2/core/interaction-manager'
import { createComponentWrapper } from '@card2/tests/utils/test-helpers'
import TestComponent from '@card2/components/test/simple-display/index.vue'

describe('组件系统集成测试', () => {
  let registry: ComponentRegistry
  let interactionManager: InteractionManager
  
  beforeEach(() => {
    registry = new ComponentRegistry()
    interactionManager = new InteractionManager()
  })
  
  afterEach(() => {
    registry.clear()
    interactionManager.clear()
  })
  
  describe('组件注册与加载', () => {
    it('应该完整的注册和加载组件流程', async () => {
      const definition = createMockComponentDefinition({
        type: 'integration-test-component'
      })
      
      // 注册组件
      registry.register(definition)
      
      // 验证注册成功
      expect(registry.has('integration-test-component')).toBe(true)
      expect(registry.getDefinition('integration-test-component'))
        .toEqual(definition)
      
      // 加载组件
      const component = await registry.loadComponent('integration-test-component')
      expect(component).toBeDefined()
    })
    
    it('应该正确处理组件依赖关系', async () => {
      // 注册依赖组件
      const dependencyDefinition = createMockComponentDefinition({
        type: 'dependency-component'
      })
      registry.register(dependencyDefinition)
      
      // 注册主组件（依赖上面的组件）
      const mainDefinition = createMockComponentDefinition({
        type: 'main-component',
        dependencies: ['dependency-component']
      })
      registry.register(mainDefinition)
      
      // 加载主组件应该自动加载依赖
      const mainComponent = await registry.loadComponent('main-component')
      expect(mainComponent).toBeDefined()
      
      // 验证依赖组件也被加载
      expect(registry.isLoaded('dependency-component')).toBe(true)
    })
  })
  
  describe('数据绑定集成', () => {
    it('应该正确建立组件与数据源的绑定关系', async () => {
      const mockApiResponse = { value: 42 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })
      
      const wrapper = createComponentWrapper(TestComponent, {
        componentId: 'test-component-1',
        dataSources: {
          testData: {
            type: 'api',
            config: {
              url: 'https://api.test.com/data'
            },
            fieldMappings: {
              value: { path: 'value', type: 'number' }
            }
          }
        }
      })
      
      await waitForAsync()
      
      // 验证数据绑定成功
      expect(wrapper.vm.data).toEqual({ value: 42 })
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/data',
        expect.any(Object)
      )
    })
  })
  
  describe('组件交互集成', () => {
    it('应该正确处理组件间的交互', async () => {
      // 创建两个组件实例
      const sourceWrapper = createComponentWrapper(TestComponent, {
        componentId: 'source-component',
        interactionCapability: {
          supportedEvents: ['dataChange'],
          listenableProperties: ['value']
        }
      })
      
      const targetWrapper = createComponentWrapper(TestComponent, {
        componentId: 'target-component',
        interactionCapability: {
          supportedActions: ['updateData']
        }
      })
      
      // 配置交互关系
      interactionManager.configureInteraction(
        'source-component',
        'target-component',
        {
          trigger: {
            type: 'property-change',
            property: 'value'
          },
          action: {
            type: 'updateData',
            params: { newValue: '${trigger.value}' }
          }
        }
      )
      
      // 触发源组件数据变化
      await sourceWrapper.setProps({ value: 100 })
      await waitForAsync()
      
      // 验证目标组件收到交互事件
      expect(targetWrapper.vm.receivedInteractions).toContainEqual({
        action: 'updateData',
        params: { newValue: 100 }
      })
    })
  })
})
```

### 2. API 集成测试
```typescript
// src/card2.1/tests/integration/api-integration.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { ComponentRegistry } from '@card2/core/component-registry'

// Mock Service Worker 配置
const server = setupServer(
  rest.get('/api/components/definitions', (req, res, ctx) => {
    return res(ctx.json([
      {
        type: 'api-test-component',
        name: 'API Test Component',
        category: 'test'
      }
    ]))
  }),
  
  rest.post('/api/data-sources/batch', (req, res, ctx) => {
    const { requests } = req.body as any
    const responses = requests.map((request: any) => ({
      id: request.id,
      data: { value: Math.random() * 100 }
    }))
    return res(ctx.json({ responses }))
  })
)

describe('API 集成测试', () => {
  let registry: ComponentRegistry
  
  beforeAll(() => {
    server.listen()
    registry = new ComponentRegistry()
  })
  
  afterAll(() => {
    server.close()
  })
  
  beforeEach(() => {
    server.resetHandlers()
  })
  
  describe('组件定义API', () => {
    it('应该正确从API加载组件定义', async () => {
      const definitions = await registry.loadDefinitionsFromAPI()
      
      expect(definitions).toHaveLength(1)
      expect(definitions[0]).toMatchObject({
        type: 'api-test-component',
        name: 'API Test Component',
        category: 'test'
      })
    })
    
    it('应该正确处理API错误', async () => {
      // Mock API 错误
      server.use(
        rest.get('/api/components/definitions', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }))
        })
      )
      
      await expect(registry.loadDefinitionsFromAPI())
        .rejects.toThrow('Failed to load component definitions')
    })
  })
  
  describe('数据源API', () => {
    it('应该正确执行批量数据请求', async () => {
      const requests = [
        { id: '1', type: 'api', config: { url: '/api/sensor/1' } },
        { id: '2', type: 'api', config: { url: '/api/sensor/2' } }
      ]
      
      const response = await fetch('/api/data-sources/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      })
      
      const data = await response.json()
      
      expect(data.responses).toHaveLength(2)
      expect(data.responses[0]).toHaveProperty('id', '1')
      expect(data.responses[0]).toHaveProperty('data')
      expect(data.responses[1]).toHaveProperty('id', '2')
      expect(data.responses[1]).toHaveProperty('data')
    })
  })
})
```

## 🚀 端到端测试

### 1. 用户工作流测试
```typescript
// src/card2.1/tests/e2e/user-workflows.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Card 2.1 用户工作流', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/editor-integration')
    await page.waitForLoadState('networkidle')
  })
  
  test('完整的组件添加和配置流程', async ({ page }) => {
    // 1. 打开组件库
    await page.click('[data-testid="widget-library-button"]')
    
    // 2. 选择组件分类
    await page.click('[data-testid="category-test"]')
    
    // 3. 拖拽组件到画布
    const component = page.locator('[data-testid="component-simple-display"]')
    const canvas = page.locator('[data-testid="editor-canvas"]')
    
    await component.dragTo(canvas)
    
    // 4. 验证组件添加成功
    await expect(page.locator('[data-testid="component-instance"]')).toBeVisible()
    
    // 5. 打开组件配置面板
    await page.click('[data-testid="component-instance"]')
    await page.click('[data-testid="configure-button"]')
    
    // 6. 配置组件属性
    await page.fill('[data-testid="title-input"]', '温度传感器')
    await page.selectOption('[data-testid="decimal-places-select"]', '1')
    
    // 7. 配置数据源
    await page.click('[data-testid="data-source-tab"]')
    await page.selectOption('[data-testid="data-source-type"]', 'api')
    await page.fill('[data-testid="api-url-input"]', 'https://api.sensor.com/temperature')
    
    // 8. 保存配置
    await page.click('[data-testid="save-config-button"]')
    
    // 9. 验证配置保存成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // 10. 验证组件显示更新
    await expect(page.locator('[data-testid="component-title"]')).toHaveText('温度传感器')
  })
  
  test('组件交互配置流程', async ({ page }) => {
    // 1. 添加两个组件
    await page.click('[data-testid="widget-library-button"]')
    
    // 添加第一个组件
    const sourceComponent = page.locator('[data-testid="component-simple-display"]')
    const canvas = page.locator('[data-testid="editor-canvas"]')
    await sourceComponent.dragTo(canvas, { targetPosition: { x: 100, y: 100 } })
    
    // 添加第二个组件
    await sourceComponent.dragTo(canvas, { targetPosition: { x: 300, y: 100 } })
    
    // 2. 打开交互配置面板
    await page.click('[data-testid="interaction-config-button"]')
    
    // 3. 选择源组件
    await page.selectOption('[data-testid="source-component-select"]', 'component-1')
    
    // 4. 选择目标组件
    await page.selectOption('[data-testid="target-component-select"]', 'component-2')
    
    // 5. 配置触发条件
    await page.selectOption('[data-testid="trigger-type-select"]', 'property-change')
    await page.selectOption('[data-testid="trigger-property-select"]', 'value')
    
    // 6. 配置响应动作
    await page.selectOption('[data-testid="action-type-select"]', 'update-data')
    await page.fill('[data-testid="action-params-input"]', '{"newValue": "${trigger.value}"}')
    
    // 7. 保存交互配置
    await page.click('[data-testid="save-interaction-button"]')
    
    // 8. 测试交互效果
    // 修改第一个组件的数据
    await page.click('[data-testid="component-1"]')
    await page.click('[data-testid="configure-button"]')
    await page.fill('[data-testid="mock-data-input"]', '25.5')
    await page.click('[data-testid="apply-mock-data-button"]')
    
    // 9. 验证第二个组件收到交互事件
    await expect(page.locator('[data-testid="component-2"] [data-testid="data-value"]'))
      .toHaveText('25.5')
  })
  
  test('大量组件性能测试', async ({ page }) => {
    // 1. 打开性能测试页面
    await page.goto('/test/performance-test')
    
    // 2. 配置测试参数
    await page.fill('[data-testid="component-count-input"]', '100')
    await page.click('[data-testid="enable-virtual-scroll"]')
    
    // 3. 开始测试
    const startTime = Date.now()
    await page.click('[data-testid="start-performance-test"]')
    
    // 4. 等待所有组件加载完成
    await page.waitForSelector('[data-testid="test-completed"]', { timeout: 30000 })
    const endTime = Date.now()
    
    // 5. 验证性能指标
    const loadTime = endTime - startTime
    expect(loadTime).toBeLessThan(10000) // 应该在10秒内完成
    
    // 6. 检查内存使用情况
    const metrics = await page.evaluate(() => (performance as any).memory)
    expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024) // 小于100MB
    
    // 7. 验证滚动性能
    await page.mouse.wheel(0, 1000)
    await page.waitForTimeout(100)
    
    // FPS应该保持在合理范围
    const fps = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0
        const startTime = performance.now()
        
        function countFrame() {
          frameCount++
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrame)
          } else {
            resolve(frameCount)
          }
        }
        requestAnimationFrame(countFrame)
      })
    })
    
    expect(fps).toBeGreaterThan(30) // FPS应该大于30
  })
})
```

### 2. 视觉回归测试
```typescript
// src/card2.1/tests/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Card 2.1 视觉回归测试', () => {
  test('组件库界面截图对比', async ({ page }) => {
    await page.goto('/test/editor-integration')
    
    // 打开组件库
    await page.click('[data-testid="widget-library-button"]')
    await page.waitForLoadState('networkidle')
    
    // 截图对比
    await expect(page.locator('[data-testid="widget-library"]'))
      .toHaveScreenshot('widget-library.png')
  })
  
  test('组件渲染效果截图对比', async ({ page }) => {
    await page.goto('/test/component-showcase')
    
    // 等待所有组件加载完成
    await page.waitForSelector('[data-testid="all-components-loaded"]')
    
    // 对每个组件分别截图
    const components = await page.locator('[data-testid^="component-"]').count()
    
    for (let i = 0; i < components; i++) {
      const component = page.locator('[data-testid^="component-"]').nth(i)
      const componentId = await component.getAttribute('data-testid')
      
      await expect(component).toHaveScreenshot(`${componentId}.png`)
    }
  })
  
  test('主题切换视觉效果', async ({ page }) => {
    await page.goto('/test/theme-test')
    
    // 明亮主题截图
    await expect(page.locator('[data-testid="theme-showcase"]'))
      .toHaveScreenshot('light-theme.png')
    
    // 切换到暗黑主题
    await page.click('[data-testid="theme-toggle"]')
    await page.waitForTimeout(500) // 等待主题切换动画
    
    // 暗黑主题截图
    await expect(page.locator('[data-testid="theme-showcase"]'))
      .toHaveScreenshot('dark-theme.png')
  })
})
```

## 📊 测试覆盖率和质量

### 1. 测试覆盖率配置
```json
// package.json - 测试脚本配置
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run src/card2.1/tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e",
    "test:watch": "vitest --watch",
    "test:debug": "vitest --inspect-brk --no-coverage"
  }
}
```

### 2. 质量门禁配置
```yaml
# .github/workflows/test.yml - CI/CD 测试流程
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  quality-gate:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]
    steps:
      - name: Quality Gate Check
        run: |
          echo "All tests passed. Quality gate approved."
```

## 🔍 测试最佳实践

### 1. 测试金字塔指导原则
```markdown
## 测试分层策略

### 70% - 单元测试
- 快速执行，提供即时反馈
- 测试独立的函数、方法和组件
- Mock 外部依赖
- 高覆盖率要求（>80%）

### 20% - 集成测试  
- 测试模块间的交互
- 验证API集成
- 测试数据流
- 中等执行速度

### 10% - E2E测试
- 测试完整用户流程
- 验证真实环境行为
- 包含视觉回归测试
- 执行速度较慢，成本较高
```

### 2. 测试编写规范
```typescript
// 良好的测试结构示例
describe('ComponentName', () => {
  // 测试分组：按功能模块组织
  describe('渲染行为', () => {
    it('应该渲染基本结构', () => {
      // 测试基础渲染
    })
    
    it('应该正确显示属性', () => {
      // 测试属性显示
    })
  })
  
  describe('交互行为', () => {
    it('应该响应点击事件', () => {
      // 测试用户交互
    })
  })
  
  describe('数据处理', () => {
    it('应该正确处理数据更新', () => {
      // 测试数据处理逻辑
    })
  })
  
  describe('错误处理', () => {
    it('应该正确处理错误状态', () => {
      // 测试错误情况
    })
  })
})
```

### 3. Mock 策略
```typescript
// 智能 Mock 策略
const createMockAPI = () => ({
  // 成功响应
  success: (data: any) => Promise.resolve({ ok: true, json: () => data }),
  
  // 错误响应
  error: (status: number, message: string) => 
    Promise.reject(new Error(`${status}: ${message}`)),
  
  // 延迟响应
  delayed: (data: any, delay: number) =>
    new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => data }), delay))
})

// 在测试中使用
const mockAPI = createMockAPI()
global.fetch = vi.fn().mockImplementation(mockAPI.success({ data: 'test' }))
```

## 🔗 相关文档

- [调试工具](./15-debugging-tools.md) - 测试调试方法
- [性能优化](./14-performance.md) - 性能测试策略
- [最佳实践](./17-best-practices.md) - 代码质量标准
- [问题排查](./20-troubleshooting.md) - 测试问题解决

---

**完善的测试是代码质量的保障！** 🧪