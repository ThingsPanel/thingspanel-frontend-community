# 开发最佳实践 - Card 2.1 组件开发规范与技巧

本章总结Card 2.1组件开发的最佳实践、常见陷阱和解决方案，帮助开发者编写高质量、可维护的组件。

## 🎯 核心开发原则

### 1. 单一职责原则
每个组件应该有明确的职责和用途：

```typescript
// ✅ 正确：职责明确的数据显示组件
const DataDisplayComponent = {
  type: 'data-display',
  name: '数据显示',
  description: '显示单个数据值，支持格式化和状态显示'
}

// ❌ 错误：职责不明确的复合组件
const MultiPurposeComponent = {
  type: 'multi-component',
  name: '多功能组件',
  description: '可以显示数据、控制设备、显示图表等'
}
```

### 2. 组合优于继承
通过组合小功能创建复杂组件：

```vue
<!-- ✅ 正确：通过组合创建复杂组件 -->
<template>
  <div class="dashboard-panel">
    <TitleComponent :title="title" />
    <DataDisplayComponent :value="data.value" />
    <StatusIndicator :status="data.status" />
    <ActionButtons :actions="availableActions" />
  </div>
</template>

<!-- ❌ 错误：单一组件包含所有功能 -->
<template>
  <div class="mega-component">
    <!-- 包含标题、数据、状态、按钮等所有功能 -->
  </div>
</template>
```

### 3. 数据驱动设计
组件行为应该由数据和配置驱动：

```typescript
// ✅ 正确：数据驱动的组件配置
export const chartSettingConfig = [
  createSetting(SettingControlType.SELECT, '图表类型', 'customize.chartType', {
    options: [
      { label: '折线图', value: 'line' },
      { label: '柱状图', value: 'bar' },
      { label: '饼图', value: 'pie' }
    ]
  }),
  createSetting(SettingControlType.SWITCH, '显示图例', 'customize.showLegend'),
  createSetting(SettingControlType.COLOR_PICKER, '主色调', 'customize.primaryColor')
]

// ❌ 错误：硬编码的组件行为
const hardcodedChart = {
  type: 'line', // 硬编码图表类型
  showLegend: true, // 硬编码显示选项
  color: '#2080f0' // 硬编码颜色
}
```

## 📝 代码质量规范

### 1. TypeScript严格类型
```typescript
// ✅ 正确：完整的类型定义
interface ComponentProps {
  title: string
  value: number | string
  status: 'normal' | 'warning' | 'error'
  formatter?: (value: any) => string
  onValueChange?: (newValue: any) => void
}

interface ComponentState {
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
}

// ❌ 错误：使用any类型
interface BadProps {
  data: any
  config: any
  callback: any
}
```

### 2. 响应式数据管理
```vue
<script setup lang="ts">
// ✅ 正确：合理使用响应式API
const props = defineProps<ComponentProps>()

// 简单响应式状态
const isVisible = ref(true)
const clickCount = ref(0)

// 复杂响应式状态
const state = reactive({
  isLoading: false,
  error: null,
  data: []
})

// 计算属性
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.formatter ? props.formatter(props.value) : props.value.toLocaleString()
  }
  return props.value
})

// ❌ 错误：不恰当的响应式使用
const badState = ref({
  // 复杂对象应该使用reactive
  nested: {
    deep: {
      value: 'should use reactive'
    }
  }
})

const badComputed = ref() // 计算属性应该使用computed
watch(props.value, () => {
  badComputed.value = props.value * 2 // 应该使用computed
})
</script>
```

### 3. 错误处理和边界情况
```vue
<script setup lang="ts">
import { ref, computed, onErrorCaptured } from 'vue'

const props = defineProps<{
  data?: any[]
  apiUrl?: string
}>()

const error = ref<string | null>(null)
const isLoading = ref(false)

// 数据验证
const validatedData = computed(() => {
  if (!props.data || !Array.isArray(props.data)) {
    return []
  }
  
  return props.data.filter(item => {
    // 验证数据项的有效性
    return item && typeof item === 'object' && 'value' in item
  })
})

// API调用错误处理
const fetchData = async () => {
  if (!props.apiUrl) {
    error.value = '缺少API URL配置'
    return
  }
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await fetch(props.apiUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data || typeof data !== 'object') {
      throw new Error('API返回数据格式无效')
    }
    
    // 处理成功的数据
    return data
  } catch (err) {
    error.value = err instanceof Error ? err.message : '数据获取失败'
    console.error('组件数据获取错误:', err)
  } finally {
    isLoading.value = false
  }
}

// 组件错误捕获
onErrorCaptured((err, instance, info) => {
  error.value = `组件错误: ${err.message}`
  console.error('组件错误:', err, info)
  
  // 错误已处理，阻止向上传播
  return false
})
</script>

<template>
  <div class="component-container">
    <!-- 错误状态显示 -->
    <div v-if="error" class="error-state">
      <n-alert type="error" :title="error" />
    </div>
    
    <!-- 加载状态显示 -->
    <div v-else-if="isLoading" class="loading-state">
      <n-spin size="large" />
    </div>
    
    <!-- 空数据状态 -->
    <div v-else-if="validatedData.length === 0" class="empty-state">
      <n-empty description="暂无数据" />
    </div>
    
    <!-- 正常内容显示 -->
    <div v-else class="content">
      <!-- 组件内容 -->
    </div>
  </div>
</template>
```

## 🎨 UI/UX最佳实践

### 1. 主题系统集成
```vue
<script setup lang="ts">
import { useComponentTheme } from '@/card2.1/hooks/useComponentTheme'

// 自定义主题配置
const customTheme = computed(() => ({
  primaryColor: props.primaryColor,
  spacing: props.compactMode ? 'compact' : 'normal'
}))

const { theme, styles, classes, isDark } = useComponentTheme('my-component', customTheme.value)
</script>

<template>
  <div 
    class="themed-component"
    :class="classes"
    :style="styles"
  >
    <!-- ✅ 正确：使用CSS变量 -->
    <div class="content" style="color: var(--component-text-color)">
      内容
    </div>
    
    <!-- ❌ 错误：硬编码颜色 -->
    <!-- <div style="color: #333333">内容</div> -->
  </div>
</template>

<style scoped>
.themed-component {
  /* ✅ 使用CSS变量适配主题 */
  background: var(--component-bg-color);
  border: 1px solid var(--component-border-color);
  border-radius: var(--border-radius);
}

/* ✅ 主题响应式样式 */
.theme-dark .themed-component {
  box-shadow: var(--box-shadow-dark);
}

.theme-light .themed-component {
  box-shadow: var(--box-shadow);
}

/* ❌ 错误：硬编码样式 */
/*
.bad-component {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  color: #333333;
}
*/
</style>
```

### 2. 响应式设计
```vue
<template>
  <div class="responsive-component">
    <!-- 使用CSS Grid/Flexbox实现响应式 -->
    <div class="component-grid">
      <div class="header-section">标题</div>
      <div class="content-section">内容</div>
      <div class="action-section">操作</div>
    </div>
  </div>
</template>

<style scoped>
.responsive-component {
  width: 100%;
  height: 100%;
  container-type: inline-size; /* 使用容器查询 */
}

.component-grid {
  display: grid;
  grid-template: 
    "header" auto
    "content" 1fr
    "action" auto
    / 1fr;
  gap: 12px;
  height: 100%;
}

.header-section { grid-area: header; }
.content-section { grid-area: content; }
.action-section { grid-area: action; }

/* 使用容器查询实现响应式 */
@container (min-width: 300px) {
  .component-grid {
    grid-template:
      "header action" auto
      "content content" 1fr
      / 1fr auto;
  }
}

@container (min-width: 600px) {
  .component-grid {
    grid-template:
      "header header action" auto
      "content content content" 1fr
      / 1fr 2fr auto;
  }
}

/* 传统媒体查询作为后备 */
@media (max-width: 480px) {
  .responsive-component {
    font-size: 14px;
  }
  
  .component-grid {
    gap: 8px;
  }
}
</style>
```

### 3. 无障碍性 (A11y) 支持
```vue
<template>
  <div 
    class="accessible-component"
    role="region"
    :aria-label="title"
    :aria-describedby="description ? `${componentId}-desc` : undefined"
  >
    <!-- 标题使用正确的语义标签 -->
    <h3 v-if="title" :id="`${componentId}-title`">{{ title }}</h3>
    
    <!-- 描述信息 -->
    <p v-if="description" :id="`${componentId}-desc`" class="description">
      {{ description }}
    </p>
    
    <!-- 数据显示 -->
    <div 
      class="data-display"
      role="status"
      :aria-live="isRealtime ? 'polite' : 'off'"
    >
      <span class="sr-only">当前数值：</span>
      <span :aria-label="`${formattedValue} ${unit}`">
        {{ formattedValue }} <span aria-hidden="true">{{ unit }}</span>
      </span>
    </div>
    
    <!-- 交互按钮 -->
    <button
      v-if="actionable"
      class="action-button"
      :aria-describedby="`${componentId}-action-desc`"
      @click="handleAction"
    >
      操作
    </button>
    
    <div :id="`${componentId}-action-desc`" class="sr-only">
      点击执行相关操作
    </div>
  </div>
</template>

<style scoped>
/* 屏幕阅读器专用文本 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 焦点管理 */
.action-button:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .accessible-component {
    border: 2px solid;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .accessible-component * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
```

## 🚀 性能优化最佳实践

### 1. 组件懒加载
```typescript
// ✅ 正确：异步组件定义
export const lazyComponentDefinition = {
  type: 'lazy-component',
  name: '懒加载组件',
  
  // 异步加载组件实现
  component: defineAsyncComponent({
    loader: () => import('./LazyComponent.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorComponent,
    delay: 200,
    timeout: 3000
  }),
  
  // 异步加载配置面板
  configComponent: defineAsyncComponent(() => import('./LazyComponentSetting.vue'))
}
```

### 2. 渲染优化
```vue
<script setup lang="ts">
// ✅ 合理使用memo和shallowRef
const heavyComputedValue = computed(() => {
  // 复杂计算逻辑
  return props.data?.reduce((acc, item) => {
    return acc + complexCalculation(item)
  }, 0)
})

// 使用shallowRef减少深度响应式开销
const largeDataSet = shallowRef([])

// 使用memo缓存子组件
const MemoizedChild = defineComponent({
  name: 'MemoizedChild',
  props: ['data'],
  setup(props) {
    return () => h('div', props.data.value)
  }
})
</script>

<template>
  <div class="optimized-component">
    <!-- ✅ 使用v-memo缓存渲染结果 -->
    <div v-for="item in list" :key="item.id" v-memo="[item.value, item.status]">
      <ExpensiveChildComponent :data="item" />
    </div>
    
    <!-- ✅ 条件渲染优化 -->
    <template v-if="showDetails">
      <DetailComponent :data="heavyComputedValue" />
    </template>
    
    <!-- ❌ 错误：不必要的响应式包装 -->
    <!-- <div v-for="item in reactive(staticList)"> -->
  </div>
</template>
```

### 3. 数据源优化
```typescript
// ✅ 正确：数据源缓存和去重
export const optimizedDataBinding = {
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300000, // 5分钟缓存
    key: (config) => `${config.url}_${JSON.stringify(config.params)}`
  },
  
  // 请求去重
  deduplication: {
    enabled: true,
    keyGenerator: (config) => config.url
  },
  
  // 数据转换优化
  transform: {
    // 使用Worker处理大量数据
    useWorker: true,
    chunkSize: 1000
  }
}

// 数据源Hook优化示例
export function useOptimizedDataSource(config: DataSourceConfig) {
  const data = ref()
  const error = ref()
  const loading = ref(false)
  
  // 使用防抖避免频繁请求
  const debouncedFetch = debounce(async () => {
    loading.value = true
    try {
      // 检查缓存
      const cachedData = getCache(config)
      if (cachedData) {
        data.value = cachedData
        return
      }
      
      // 发起请求
      const result = await fetchData(config)
      
      // 存储缓存
      setCache(config, result)
      
      data.value = result
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }, 300)
  
  return { data, error, loading, fetch: debouncedFetch }
}
```

## 🔧 开发工具和流程

### 1. 代码质量检查
```json
// .eslintrc.js 规则配置
{
  "extends": ["@vue/eslint-config-typescript"],
  "rules": {
    // TypeScript规则
    "@typescript-eslint/no-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    
    // Vue规则
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/require-default-prop": "error",
    "vue/no-unused-components": "error",
    "vue/no-multiple-template-root": "off", // Vue 3允许
    
    // Card 2.1自定义规则
    "card2/require-component-definition": "error",
    "card2/validate-setting-config": "error",
    "card2/no-hardcoded-colors": "warn"
  }
}
```

### 2. 测试规范
```typescript
// 组件单元测试示例
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  const defaultProps = {
    title: '测试标题',
    value: 42
  }
  
  it('应该正确渲染标题和数值', () => {
    const wrapper = mount(MyComponent, {
      props: defaultProps
    })
    
    expect(wrapper.find('h3').text()).toBe('测试标题')
    expect(wrapper.find('.value').text()).toBe('42')
  })
  
  it('应该响应数值变化', async () => {
    const wrapper = mount(MyComponent, {
      props: defaultProps
    })
    
    await wrapper.setProps({ value: 100 })
    
    expect(wrapper.find('.value').text()).toBe('100')
  })
  
  it('应该触发正确的事件', async () => {
    const wrapper = mount(MyComponent, {
      props: defaultProps
    })
    
    await wrapper.find('.action-button').trigger('click')
    
    expect(wrapper.emitted().click).toBeTruthy()
    expect(wrapper.emitted().click[0]).toEqual([
      expect.objectContaining({
        value: 42
      })
    ])
  })
  
  it('应该处理错误状态', async () => {
    const wrapper = mount(MyComponent, {
      props: {
        ...defaultProps,
        error: '测试错误'
      }
    })
    
    expect(wrapper.find('.error-message').text()).toBe('测试错误')
    expect(wrapper.find('.content').exists()).toBe(false)
  })
})
```

### 3. 文档规范
```typescript
/**
 * 数据显示组件
 * 
 * @description 用于显示单个数值，支持格式化、状态显示和主题配置
 * 
 * @example
 * ```vue
 * <DataDisplayComponent
 *   title="温度"
 *   :value="25.6"
 *   unit="°C"
 *   status="normal"
 *   :formatter="(v) => v.toFixed(1)"
 * />
 * ```
 * 
 * @author ThingsPanel Team
 * @version 2.1.0
 * @since 2024-01-01
 */
export const dataDisplayDefinition = {
  type: 'data-display',
  name: '数据显示',
  
  /**
   * 组件属性说明
   */
  props: {
    /** 显示标题 */
    title: {
      type: String,
      required: false,
      default: ''
    },
    
    /** 数据值，支持数字和字符串 */
    value: {
      type: [Number, String],
      required: true,
      validator: (value: any) => value !== null && value !== undefined
    },
    
    /** 数据单位 */
    unit: {
      type: String,
      required: false,
      default: ''
    },
    
    /** 状态类型，影响颜色显示 */
    status: {
      type: String as PropType<'normal' | 'warning' | 'error'>,
      required: false,
      default: 'normal',
      validator: (value: string) => ['normal', 'warning', 'error'].includes(value)
    }
  },
  
  /**
   * 组件事件说明
   */
  emits: {
    /** 点击事件，返回当前数值 */
    click: (value: any) => true,
    
    /** 数值变化事件 */
    valueChange: (newValue: any, oldValue: any) => true
  }
}
```

## ❌ 常见陷阱与解决方案

### 1. 响应式陷阱
```typescript
// ❌ 错误：解构响应式对象
const { count, name } = reactive({ count: 0, name: 'test' })
// count和name失去响应式

// ✅ 正确：使用toRefs解构
const state = reactive({ count: 0, name: 'test' })
const { count, name } = toRefs(state)

// ❌ 错误：将ref传递给子组件
const count = ref(0)
// <ChildComponent :count="count" /> // 传递的是ref对象

// ✅ 正确：传递ref的值
// <ChildComponent :count="count.value" />
// 或者在子组件中正确处理ref
```

### 2. 数据源配置陷阱
```typescript
// ❌ 错误：缺少字段映射
const badDataSource = {
  key: 'data',
  supportedTypes: ['api']
  // 缺少fieldMappings，导致数据无法传递给组件
}

// ✅ 正确：完整的数据源配置
const goodDataSource = {
  key: 'data',
  name: '数据源',
  supportedTypes: ['static', 'api'],
  fieldMappings: {
    'value': {
      targetField: 'dataValue',
      type: 'value',
      required: true,
      defaultValue: 0
    }
  },
  required: false
}
```

### 3. 主题适配陷阱
```css
/* ❌ 错误：硬编码颜色 */
.bad-component {
  color: #333333;
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

/* ✅ 正确：使用CSS变量 */
.good-component {
  color: var(--text-color);
  background: var(--card-color);
  border: 1px solid var(--border-color);
}

/* ✅ 支持主题切换 */
[data-theme="dark"] .good-component {
  box-shadow: var(--box-shadow-dark);
}
```

### 4. 性能陷阱
```vue
<script setup lang="ts">
// ❌ 错误：在模板中使用复杂计算
const props = defineProps<{ items: any[] }>()

// 不要在模板中直接使用
// {{ items.filter(item => item.active).map(item => item.name).join(', ') }}

// ✅ 正确：使用计算属性
const activeItemNames = computed(() => {
  return props.items
    .filter(item => item.active)
    .map(item => item.name)
    .join(', ')
})
</script>

<template>
  <!-- ✅ 使用计算属性 -->
  <div>{{ activeItemNames }}</div>
  
  <!-- ❌ 避免在v-for中使用复杂表达式 -->
  <!-- <div v-for="item in items.filter(i => i.visible)" :key="item.id"> -->
  
  <!-- ✅ 先计算再渲染 -->
  <div v-for="item in visibleItems" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

## ✅ 代码审查清单

### 组件定义检查
- [ ] 组件类型唯一且符合kebab-case规范
- [ ] 包含完整的基础信息（name、description、version等）
- [ ] mainCategory与文件夹路径匹配
- [ ] 配置了适当的defaultLayout
- [ ] dataSources配置完整且字段映射正确
- [ ] settingConfig与组件Props一致

### 代码质量检查
- [ ] 使用TypeScript严格类型，避免any
- [ ] Props定义完整且有默认值
- [ ] 错误边界处理完善
- [ ] 响应式数据使用正确
- [ ] 计算属性和监听器使用合理
- [ ] 内存泄露检查（取消事件监听、清理定时器等）

### UI/UX检查
- [ ] 支持明暗主题切换
- [ ] 响应式布局适配
- [ ] 无障碍性支持
- [ ] 加载和错误状态处理
- [ ] 用户交互反馈

### 性能检查
- [ ] 避免不必要的重新渲染
- [ ] 大数据列表虚拟化
- [ ] 图片懒加载
- [ ] 网络请求优化（缓存、去重、防抖）
- [ ] 包大小合理

### 测试检查
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] 边界情况测试
- [ ] 性能测试通过

## 🔗 相关文档

- [快速开始](./01-quick-start.md) - 开始开发第一个组件
- [调试工具](./15-debugging-tools.md) - 调试技巧和工具
- [性能优化](./14-performance.md) - 性能优化详解
- [API参考](./18-api-reference.md) - 完整API文档

---

**遵循最佳实践，让代码更加健壮和优雅！** ✨