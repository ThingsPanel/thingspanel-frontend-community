# 数据源系统开发指南

## 🚀 快速开始

### 环境准备
```bash
# 1. 确保使用正确的Node.js版本
node --version  # 应该是 v16+

# 2. 安装依赖（使用pnpm）
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 访问测试页面
# 浏览器打开: http://localhost:5002
# 导航到: 菜单 → 测试 → 数据源系统测试
```

### 开发工具配置
```bash
# 类型检查
pnpm typecheck

# 代码格式化
pnpm lint

# 质量检查（包含架构合规性验证）
pnpm quality-check
```

## 🏗️ 新功能开发流程

### 1. 新数据源类型开发

#### 步骤1: 创建执行器类
```typescript
// executors/CustomItemExecutor.ts
import { DataItemExecutor } from './DataItemExecutor'

export class CustomItemExecutor extends DataItemExecutor {
  private customConfig: CustomConfig
  
  constructor(config: CustomConfig) {
    super()
    this.customConfig = config
  }
  
  async execute(): Promise<any> {
    // 实现自定义数据获取逻辑
    try {
      this.updateStatus('running')
      const result = await this.fetchCustomData()
      this.updateStatus('completed')
      return result
    } catch (error) {
      this.updateStatus('error')
      throw error
    }
  }
  
  validate(): boolean {
    // 验证配置是否正确
    return this.customConfig && 
           this.customConfig.requiredField !== undefined
  }
  
  getType(): string {
    return 'custom'
  }
  
  cleanup(): void {
    // 清理资源（如关闭连接等）
  }
  
  private async fetchCustomData(): Promise<any> {
    // 实现具体的数据获取逻辑
  }
}
```

#### 步骤2: 注册执行器
```typescript
// executors/index.ts
export { CustomItemExecutor } from './CustomItemExecutor'

// managers/DataSourceScheduler.ts 中添加工厂方法
private createExecutor(config: DataItemConfig): DataItemExecutor {
  switch (config.dataSourceType) {
    case 'json':
      return new JsonItemExecutor(config)
    case 'http':
      return new HttpItemExecutor(config)
    case 'websocket':
      return new WebSocketItemExecutor(config)
    case 'custom':  // 新增
      return new CustomItemExecutor(config)
    default:
      throw new Error(`不支持的数据源类型: ${config.dataSourceType}`)
  }
}
```

#### 步骤3: 创建UI输入组件
```vue
<!-- components/modals/panels/inputs/CustomDataInput.vue -->
<template>
  <div class="custom-data-input">
    <n-form :model="localConfig" label-placement="top">
      <n-form-item label="自定义配置字段">
        <n-input 
          v-model:value="localConfig.requiredField"
          placeholder="请输入必填字段"
          @input="handleInputChange"
        />
      </n-form-item>
      
      <!-- 其他配置字段 -->
      <n-form-item label="可选配置">
        <n-input-number
          v-model:value="localConfig.optionalNumber"
          placeholder="可选数字配置"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 自定义数据源输入组件
 * 提供自定义数据源类型的配置界面
 */

interface CustomConfig {
  requiredField: string
  optionalNumber?: number
}

interface Props {
  config: CustomConfig
}

interface Emits {
  (e: 'update:config', config: CustomConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<CustomConfig>({ ...props.config })

// 监听配置变化并向上传递
watch(localConfig, (newConfig) => {
  emit('update:config', { ...newConfig })
}, { deep: true })

const handleInputChange = () => {
  // 可以添加实时验证逻辑
}
</script>

<style scoped>
.custom-data-input {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}
</style>
```

#### 步骤4: 集成到数据获取面板
```vue
<!-- components/modals/panels/DataAcquisitionPanel.vue -->
<template>
  <div class="data-acquisition-panel">
    <n-select
      v-model:value="selectedType" 
      :options="dataSourceTypeOptions"
      @update:value="handleTypeChange"
    />
    
    <!-- 根据类型显示对应输入组件 -->
    <component 
      :is="getInputComponent(selectedType)"
      v-model:config="currentConfig"
      @update:config="handleConfigUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import JsonDataInput from './inputs/JsonDataInput.vue'
import HttpDataInput from './inputs/HttpDataInput.vue'  
import WebSocketDataInput from './inputs/WebSocketDataInput.vue'
import CustomDataInput from './inputs/CustomDataInput.vue' // 新增

const dataSourceTypeOptions = [
  { label: 'JSON数据', value: 'json' },
  { label: 'HTTP接口', value: 'http' },
  { label: 'WebSocket', value: 'websocket' },
  { label: '自定义源', value: 'custom' } // 新增
]

const getInputComponent = (type: string) => {
  const components = {
    'json': JsonDataInput,
    'http': HttpDataInput, 
    'websocket': WebSocketDataInput,
    'custom': CustomDataInput // 新增
  }
  return components[type] || JsonDataInput
}
</script>
```

### 2. 新UI组件开发规范

#### 强制性规范检查清单
- [ ] **优先使用 Naive UI 组件**
- [ ] **集成主题系统** (`useThemeStore()`)
- [ ] **使用国际化** (`useI18n()`)
- [ ] **添加中文注释**
- [ ] **响应式设计** (明暗主题支持)
- [ ] **TypeScript 严格模式**

#### 组件模板
```vue
<template>
  <div class="my-component">
    <!-- 强制使用 Naive UI 组件 -->
    <n-card :bordered="false">
      <n-space vertical>
        <!-- 用户可见文本必须国际化 -->
        <n-text>{{ t('dataSource.myComponent.title') }}</n-text>
        
        <!-- 使用主题变量的自定义元素 -->
        <div class="custom-element">
          {{ t('dataSource.myComponent.content') }}
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 我的组件 - 功能描述
 * 用于处理特定的业务逻辑
 */

import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// 强制国际化集成
const { t } = useI18n()

// 强制主题系统集成  
const themeStore = useThemeStore()

// 组件属性类型定义
interface Props {
  data: MyData[]
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

// 事件定义
interface Emits {
  (e: 'update', value: string): void
  (e: 'change', data: MyData): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const state = reactive({
  loading: false,
  error: null as Error | null
})

// 计算属性
const computedValue = computed(() => {
  return props.data.length
})

// 方法实现
const handleUpdate = () => {
  emit('update', 'new-value')
}

// 生命周期
onMounted(() => {
  console.log('组件已挂载')
})
</script>

<style scoped>
.my-component {
  width: 100%;
  padding: 16px;
}

.custom-element {
  /* 使用主题变量，禁止硬编码颜色 */
  color: var(--text-color);
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 12px;
  
  /* 明暗主题自动适配 */
  transition: all 0.3s var(--bezier);
}

/* 暗主题特定样式 */
[data-theme="dark"] .custom-element {
  box-shadow: var(--box-shadow-dark);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .my-component {
    padding: 12px;
  }
}
</style>
```

### 3. 管理器扩展开发

#### 新管理器模板
```typescript
// managers/NewManager.ts
export class NewManager {
  private resources: Map<string, any> = new Map()
  
  constructor() {
    // 初始化逻辑
  }
  
  /**
   * 注册资源
   * @param id 资源ID
   * @param resource 资源对象
   */
  registerResource(id: string, resource: any): void {
    this.resources.set(id, resource)
    console.log(`✅ 资源已注册: ${id}`)
  }
  
  /**
   * 获取资源
   * @param id 资源ID  
   * @returns 资源对象或null
   */
  getResource(id: string): any | null {
    return this.resources.get(id) || null
  }
  
  /**
   * 清理所有资源
   */
  cleanup(): void {
    for (const [id, resource] of this.resources) {
      if (resource.cleanup) {
        resource.cleanup()
      }
    }
    this.resources.clear()
    console.log('🧹 所有资源已清理')
  }
}
```

## 🧪 测试指南

### 单元测试模板
```typescript
// tests/executors/CustomItemExecutor.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { CustomItemExecutor } from '@/core/data-source-system/executors/CustomItemExecutor'

describe('CustomItemExecutor', () => {
  let executor: CustomItemExecutor
  
  beforeEach(() => {
    executor = new CustomItemExecutor({
      requiredField: 'test-value'
    })
  })
  
  describe('execute', () => {
    it('应该成功执行并返回数据', async () => {
      const result = await executor.execute()
      expect(result).toBeDefined()
    })
    
    it('配置无效时应该抛出错误', async () => {
      const invalidExecutor = new CustomItemExecutor({})
      await expect(invalidExecutor.execute()).rejects.toThrow()
    })
  })
  
  describe('validate', () => {
    it('有效配置应该返回true', () => {
      expect(executor.validate()).toBe(true)
    })
    
    it('无效配置应该返回false', () => {
      const invalidExecutor = new CustomItemExecutor({})
      expect(invalidExecutor.validate()).toBe(false)
    })
  })
})
```

### 集成测试流程
```bash
# 1. 启动开发服务器  
pnpm dev

# 2. 访问测试页面
# http://localhost:5002/test/data-source-system

# 3. 测试步骤
# - 点击"添加数据项"按钮
# - 选择新的数据源类型
# - 填入测试配置
# - 检查预览数据是否正确
# - 保存并验证配置是否持久化
```

### UI组件测试
```typescript
// tests/components/CustomDataInput.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CustomDataInput from '@/core/data-source-system/components/modals/panels/inputs/CustomDataInput.vue'

describe('CustomDataInput', () => {
  it('应该正确渲染输入组件', () => {
    const wrapper = mount(CustomDataInput, {
      props: {
        config: { requiredField: 'test' }
      }
    })
    
    expect(wrapper.find('input').exists()).toBe(true)
  })
  
  it('配置变化时应该触发事件', async () => {
    const wrapper = mount(CustomDataInput, {
      props: {
        config: { requiredField: '' }
      }
    })
    
    const input = wrapper.find('input')
    await input.setValue('new-value')
    
    expect(wrapper.emitted('update:config')).toBeTruthy()
  })
})
```

## 🔧 调试技巧

### 1. 开发者工具使用
```typescript
// 在组件中添加调试信息
const debugInfo = computed(() => ({
  currentConfig: props.config,
  validationStatus: isValid.value,
  timestamp: Date.now()
}))

// 开发模式下输出调试信息
if (import.meta.env.DEV) {
  console.group('🔍 CustomDataInput Debug Info')
  console.log('Config:', debugInfo.value.currentConfig)
  console.log('Valid:', debugInfo.value.validationStatus)
  console.groupEnd()
}
```

### 2. 网络请求调试
```typescript
// 在 HttpItemExecutor 中添加详细日志
class HttpItemExecutor extends DataItemExecutor {
  async execute(): Promise<any> {
    console.group(`🌐 HTTP Request: ${this.config.url}`)
    console.log('Method:', this.config.method)
    console.log('Headers:', this.config.headers)
    console.log('Params:', this.config.params)
    
    try {
      const result = await this.fetchData()
      console.log('✅ Response:', result)
      return result
    } catch (error) {
      console.error('❌ Error:', error)
      throw error
    } finally {
      console.groupEnd()
    }
  }
}
```

### 3. 状态管理调试
```typescript
// 使用 Vue DevTools 调试响应式状态
const state = reactive({
  executors: new Map(),
  currentTask: null,
  lastError: null
})

// 在开发模式下暴露到全局对象
if (import.meta.env.DEV) {
  window.__DATA_SOURCE_DEBUG__ = {
    state,
    executors: state.executors,
    getExecutor: (id: string) => state.executors.get(id),
    clearErrors: () => { state.lastError = null }
  }
}
```

## 🚨 常见错误和解决方案

### 1. Monaco Editor Worker 错误
**错误**: `Uncaught Error: Unexpected usage`
**解决**: 已在当前版本中移除 Monaco Editor，使用 textarea 替代

### 2. 响应式数据访问错误
```typescript
// ❌ 错误用法
const data = someComputedRef.filteredData
if (!Array.isArray(data)) return []

// ✅ 正确用法  
const data = someComputedRef.filteredData.value
if (!Array.isArray(data)) return []
```

### 3. 主题变量未生效
```css
/* ❌ 错误：硬编码颜色 */
.my-element {
  color: #333333;
  background: #ffffff;
}

/* ✅ 正确：使用主题变量 */
.my-element {
  color: var(--text-color);
  background: var(--card-color);
}
```

### 4. 国际化键值缺失
```vue
<!-- ❌ 错误：硬编码文本 -->
<n-button>保存配置</n-button>

<!-- ✅ 正确：使用国际化 -->
<n-button>{{ $t('dataSource.save') }}</n-button>
```

## 📚 最佳实践

### 1. 代码组织
```
feature/
├── components/           # UI组件
│   ├── modals/          # 弹窗组件
│   ├── panels/          # 面板组件  
│   └── inputs/          # 输入组件
├── executors/           # 执行器
├── managers/            # 管理器
├── types/              # 类型定义
└── tests/              # 测试文件
```

### 2. 性能优化
- **使用 computed 缓存计算结果**
- **使用 watchEffect 替代复杂的 watch**
- **组件懒加载**: `defineAsyncComponent()`
- **执行器池化**: 复用执行器实例
- **数据缓存**: 避免重复请求

### 3. 错误处理
```typescript
// 统一错误处理模式
const handleAsyncOperation = async () => {
  try {
    loading.value = true
    error.value = null
    
    const result = await someAsyncOperation()
    return result
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(String(err))
    console.error('操作失败:', err)
    throw err
  } finally {
    loading.value = false
  }
}
```

### 4. 内存管理
```typescript
// 组件卸载时清理资源
onBeforeUnmount(() => {
  // 清理定时器
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  // 清理WebSocket连接
  if (websocket.value) {
    websocket.value.close()
  }
  
  // 清理执行器
  if (executor.value) {
    executor.value.cleanup()
  }
})
```

## 📊 开发进度跟踪

### 当前开发状态
- ✅ **执行器架构**: 100% 完成
- ✅ **UI组件系统**: 90% 完成  
- ✅ **配置管理器**: 90% 完成
- ⚠️ **触发器管理器**: 0% 完成
- ⚠️ **多数据源合并**: 20% 完成

### 下一步开发优先级
1. **DataSourceTriggerManager** (高优先级)
2. **多数据源合并功能** (高优先级)  
3. **错误处理完善** (中优先级)
4. **代码编辑器升级** (低优先级)

### 长期规划
- **性能监控系统**
- **配置模板系统**  
- **版本管理功能**
- **批量操作优化**

---

**🎯 开发提示**: 严格遵循 ThingsPanel 项目的开发规范，确保代码质量和架构一致性。遇到问题时参考 `CLAUDE.md` 和 `DEVELOPMENT_CHECKLIST.md`。