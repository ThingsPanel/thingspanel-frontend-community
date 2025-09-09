# 国际化系统 - Card 2.1 多语言支持指南

本章详细介绍 Card 2.1 组件系统的国际化(i18n)实现、多语言配置和组件国际化最佳实践。

## 🌍 国际化架构概览

### 系统架构图
```
┌─────────────────────────────────────────────────────────┐
│                    Application                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Vue I18n  │  │  Language   │  │   Locale    │     │
│  │   Plugin    │  │   Files     │  │  Detector   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                   Card 2.1 I18n                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Component   │  │  Dynamic    │  │ Settings    │     │
│  │ Messages    │  │  Message    │  │ Controls    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Error       │  │ Category    │  │ Data Source │     │
│  │ Messages    │  │ Names       │  │ Labels      │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 📁 语言文件结构

### 目录组织
```
src/locales/
├── index.ts                    # 国际化配置入口
├── helper.ts                  # 国际化工具函数
└── langs/                     # 语言包目录
    ├── zh-cn/                 # 中文简体
    │   ├── index.ts           # 中文语言包入口
    │   ├── common.json        # 通用词汇
    │   ├── route.json         # 路由标题
    │   ├── system.json        # 系统信息
    │   └── card2/             # Card 2.1 专用
    │       ├── index.json     # Card 2.1 基础词汇
    │       ├── components.json # 组件相关翻译
    │       ├── categories.json # 组件分类翻译
    │       ├── datasources.json # 数据源翻译
    │       └── errors.json    # 错误信息翻译
    └── en/                    # English
        ├── index.ts           # English language pack entry
        ├── common.json        # Common vocabulary
        ├── route.json         # Route titles
        ├── system.json        # System information
        └── card2/             # Card 2.1 specific
            ├── index.json     # Card 2.1 basic vocabulary
            ├── components.json # Component translations
            ├── categories.json # Category translations
            ├── datasources.json # Data source translations
            └── errors.json    # Error message translations
```

## 🔧 国际化配置

### 基础配置文件
```typescript
// src/locales/index.ts
import { createI18n } from 'vue-i18n'
import type { App } from 'vue'
import { localStg } from '@/utils/storage'

// 导入语言包
import zhCN from './langs/zh-cn'
import en from './langs/en'

/**
 * 创建国际化实例
 */
export const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getLanguage(),
  fallbackLocale: 'zh-CN',
  globalInjection: true,
  messages: {
    'zh-CN': zhCN,
    'en': en
  }
})

/**
 * 获取当前语言设置
 */
function getLanguage(): string {
  return localStg.get('language') || navigator.language || 'zh-CN'
}

/**
 * 安装国际化插件
 */
export function setupI18n(app: App) {
  app.use(i18n)
}

/**
 * 切换语言
 */
export function setLanguage(locale: string) {
  i18n.global.locale.value = locale
  localStg.set('language', locale)
  document.documentElement.lang = locale
}

export default i18n
```

### Card 2.1 语言包结构
```typescript
// src/locales/langs/zh-cn/card2/index.json
{
  "system": {
    "name": "Card 2.1 组件系统",
    "description": "新一代数据驱动的组件架构",
    "version": "版本"
  },
  "registry": {
    "loading": "正在加载组件...",
    "loaded": "已加载 {count} 个组件",
    "failed": "组件加载失败",
    "noComponents": "暂无可用组件",
    "register": "注册组件",
    "unregister": "注销组件"
  },
  "editor": {
    "addComponent": "添加组件",
    "removeComponent": "移除组件",
    "configureComponent": "配置组件",
    "componentAdded": "组件已添加",
    "componentRemoved": "组件已移除",
    "configSaved": "配置已保存"
  }
}
```

## 🧩 组件国际化实现

### 1. 组件定义国际化
```typescript
// src/card2.1/components/test/simple-display/definition.ts
import type { ComponentDefinition } from '@/card2.1/types'

export const definition: ComponentDefinition = {
  type: 'simple-display',
  // 使用国际化键值，不要硬编码
  name: 'card2.components.simpleDisplay.name',
  description: 'card2.components.simpleDisplay.description',
  
  category: 'test',
  tags: ['card2.tags.basic', 'card2.tags.display'],
  
  // 配置项也需要国际化
  config: {
    style: {
      width: 300,
      height: 200
    }
  },
  
  // 权限描述国际化
  permission: {
    description: 'card2.permissions.simpleDisplay'
  },
  
  // 元数据国际化
  metadata: {
    author: 'ThingsPanel Team',
    version: '1.0.0',
    changelog: 'card2.changelog.simpleDisplay'
  }
}

export default definition
```

### 2. 组件内部国际化
```vue
<!-- src/card2.1/components/test/simple-display/index.vue -->
<script setup lang="ts">
/**
 * 简单数据展示组件 - 国际化版本
 * 展示单个数据值的卡片组件
 */

import { useI18n } from 'vue-i18n'
import { useComponentDataBinding } from '@/card2.1/hooks/useComponentDataBinding'

// 国际化 Hook
const { t } = useI18n()

// 组件Props
interface Props {
  title?: string
  showUnit?: boolean
  decimalPlaces?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showUnit: true,
  decimalPlaces: 2
})

// 数据绑定
const { data, loading, error } = useComponentDataBinding()

// 错误处理国际化
const getErrorMessage = (error: Error) => {
  const errorKey = `card2.errors.${error.name}` 
  return t(errorKey, error.message)
}

// 格式化数值显示
const formatValue = (value: number) => {
  return new Intl.NumberFormat(t('locale'), {
    minimumFractionDigits: props.decimalPlaces,
    maximumFractionDigits: props.decimalPlaces
  }).format(value)
}
</script>

<template>
  <n-card class="simple-display-card">
    <!-- 标题 - 支持动态国际化 -->
    <template #header>
      <n-text strong>
        {{ props.title || t('card2.components.simpleDisplay.defaultTitle') }}
      </n-text>
    </template>
    
    <!-- 内容区 -->
    <div class="content">
      <!-- 加载状态 -->
      <n-spin v-if="loading" size="large">
        <n-text depth="3">{{ t('common.loading') }}</n-text>
      </n-spin>
      
      <!-- 错误状态 -->
      <n-result v-else-if="error" status="error" size="small">
        <template #title>{{ t('card2.errors.loadFailed') }}</template>
        <template #description>{{ getErrorMessage(error) }}</template>
      </n-result>
      
      <!-- 数据展示 -->
      <div v-else class="data-display">
        <n-statistic
          :label="t('card2.components.simpleDisplay.currentValue')"
          :value="formatValue(data.value)"
          :precision="props.decimalPlaces"
        >
          <template v-if="props.showUnit && data.unit" #suffix>
            {{ data.unit }}
          </template>
        </n-statistic>
        
        <!-- 更新时间 -->
        <n-text depth="3" class="update-time">
          {{ t('card2.components.simpleDisplay.lastUpdate') }}:
          {{ new Date(data.timestamp).toLocaleString(t('locale')) }}
        </n-text>
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.simple-display-card {
  width: 100%;
  height: 100%;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.data-display {
  text-align: center;
  width: 100%;
}

.update-time {
  margin-top: 12px;
  font-size: 12px;
}
</style>
```

### 3. 配置面板国际化
```vue
<!-- src/card2.1/components/test/simple-display/setting.vue -->
<script setup lang="ts">
/**
 * 简单数据展示组件 - 配置面板
 * 支持多语言的配置界面
 */

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 配置数据
interface ConfigData {
  title: string
  showUnit: boolean
  decimalPlaces: number
  refreshInterval: number
}

const props = defineProps<{
  modelValue: ConfigData
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ConfigData]
}>()

// 配置项选项国际化
const decimalOptions = computed(() => [
  { label: t('card2.settings.decimal.none'), value: 0 },
  { label: t('card2.settings.decimal.one'), value: 1 },
  { label: t('card2.settings.decimal.two'), value: 2 },
  { label: t('card2.settings.decimal.three'), value: 3 }
])

const intervalOptions = computed(() => [
  { label: t('card2.settings.interval.realtime'), value: 0 },
  { label: t('card2.settings.interval.second', { count: 1 }), value: 1000 },
  { label: t('card2.settings.interval.second', { count: 5 }), value: 5000 },
  { label: t('card2.settings.interval.minute', { count: 1 }), value: 60000 }
])

// 表单验证规则国际化
const rules = computed(() => ({
  title: {
    required: true,
    message: t('card2.validation.titleRequired'),
    trigger: 'blur'
  },
  decimalPlaces: {
    type: 'number',
    min: 0,
    max: 6,
    message: t('card2.validation.decimalRange'),
    trigger: 'change'
  }
}))
</script>

<template>
  <div class="simple-display-settings">
    <n-form 
      :model="props.modelValue"
      :rules="rules"
      label-placement="top"
      @update:model="emit('update:modelValue', $event)"
    >
      <!-- 基础设置 -->
      <n-divider title-placement="left">
        <n-text strong>{{ t('card2.settings.groups.basic') }}</n-text>
      </n-divider>
      
      <n-form-item 
        :label="t('card2.settings.title.label')"
        path="title"
      >
        <n-input 
          v-model:value="props.modelValue.title"
          :placeholder="t('card2.settings.title.placeholder')"
          clearable
        />
        <template #feedback>
          <n-text depth="3">{{ t('card2.settings.title.help') }}</n-text>
        </template>
      </n-form-item>
      
      <!-- 显示设置 -->
      <n-divider title-placement="left">
        <n-text strong>{{ t('card2.settings.groups.display') }}</n-text>
      </n-divider>
      
      <n-form-item :label="t('card2.settings.showUnit.label')">
        <n-switch 
          v-model:value="props.modelValue.showUnit"
          :checked-text="t('common.yes')"
          :unchecked-text="t('common.no')"
        />
        <template #feedback>
          <n-text depth="3">{{ t('card2.settings.showUnit.help') }}</n-text>
        </template>
      </n-form-item>
      
      <n-form-item 
        :label="t('card2.settings.decimalPlaces.label')"
        path="decimalPlaces"
      >
        <n-select
          v-model:value="props.modelValue.decimalPlaces"
          :options="decimalOptions"
        />
      </n-form-item>
      
      <!-- 数据设置 -->
      <n-divider title-placement="left">
        <n-text strong>{{ t('card2.settings.groups.data') }}</n-text>
      </n-divider>
      
      <n-form-item :label="t('card2.settings.refreshInterval.label')">
        <n-select
          v-model:value="props.modelValue.refreshInterval"
          :options="intervalOptions"
        />
        <template #feedback>
          <n-text depth="3">{{ t('card2.settings.refreshInterval.help') }}</n-text>
        </template>
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped>
.simple-display-settings {
  padding: 16px;
}
</style>
```

## 🗂️ 语言包管理

### 1. 中文语言包
```json
// src/locales/langs/zh-cn/card2/components.json
{
  "simpleDisplay": {
    "name": "简单数据显示",
    "description": "展示单个数据值的简洁卡片",
    "defaultTitle": "数据显示",
    "currentValue": "当前值",
    "lastUpdate": "最后更新"
  },
  "dualDataDisplay": {
    "name": "双数据显示",
    "description": "并排显示两个数据值",
    "primaryValue": "主要数据",
    "secondaryValue": "次要数据"
  },
  "tripleDataDisplay": {
    "name": "三数据显示",
    "description": "并排显示三个数据值",
    "leftValue": "左侧数据",
    "centerValue": "中间数据", 
    "rightValue": "右侧数据"
  }
}
```

```json
// src/locales/langs/zh-cn/card2/categories.json
{
  "test": "测试组件",
  "statistics": "统计信息",
  "alarm": "报警组件",
  "control": "控制组件",
  "display": "显示组件",
  "chart": "图表组件"
}
```

```json
// src/locales/langs/zh-cn/card2/datasources.json
{
  "types": {
    "api": "API 接口",
    "websocket": "WebSocket 连接",
    "static": "静态数据",
    "script": "脚本生成"
  },
  "fields": {
    "url": "接口地址",
    "method": "请求方法",
    "headers": "请求头",
    "params": "请求参数",
    "timeout": "超时时间"
  },
  "validation": {
    "urlRequired": "请输入接口地址",
    "urlInvalid": "接口地址格式无效",
    "timeoutRange": "超时时间必须在 1-60 秒之间"
  }
}
```

### 2. 英文语言包
```json
// src/locales/langs/en/card2/components.json
{
  "simpleDisplay": {
    "name": "Simple Data Display",
    "description": "A clean card for displaying single data value",
    "defaultTitle": "Data Display",
    "currentValue": "Current Value",
    "lastUpdate": "Last Update"
  },
  "dualDataDisplay": {
    "name": "Dual Data Display",
    "description": "Side-by-side display of two data values",
    "primaryValue": "Primary Data",
    "secondaryValue": "Secondary Data"
  },
  "tripleDataDisplay": {
    "name": "Triple Data Display",
    "description": "Side-by-side display of three data values",
    "leftValue": "Left Data",
    "centerValue": "Center Data",
    "rightValue": "Right Data"
  }
}
```

## 🛠️ 国际化工具函数

### 1. 组件国际化 Hook
```typescript
// src/card2.1/hooks/useComponentI18n.ts
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Card 2.1 组件专用国际化 Hook
 */
export function useComponentI18n(componentType: string) {
  const { t, locale } = useI18n()
  
  /**
   * 获取组件基础信息翻译
   */
  const componentInfo = computed(() => ({
    name: t(`card2.components.${componentType}.name`),
    description: t(`card2.components.${componentType}.description`)
  }))
  
  /**
   * 获取设置项翻译
   */
  const getSettingLabel = (settingKey: string) => {
    return t(`card2.settings.${settingKey}.label`)
  }
  
  /**
   * 获取设置项帮助文本
   */
  const getSettingHelp = (settingKey: string) => {
    return t(`card2.settings.${settingKey}.help`)
  }
  
  /**
   * 获取数据源类型翻译
   */
  const getDataSourceTypeLabel = (type: string) => {
    return t(`card2.datasources.types.${type}`)
  }
  
  /**
   * 获取错误信息翻译
   */
  const getErrorMessage = (errorCode: string, fallback?: string) => {
    const key = `card2.errors.${errorCode}`
    const message = t(key)
    return message !== key ? message : (fallback || 'Unknown error')
  }
  
  /**
   * 格式化数值 - 根据当前语言环境
   */
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale.value, options).format(value)
  }
  
  /**
   * 格式化日期时间 - 根据当前语言环境
   */
  const formatDateTime = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(date)
  }
  
  return {
    t,
    locale,
    componentInfo,
    getSettingLabel,
    getSettingHelp,
    getDataSourceTypeLabel,
    getErrorMessage,
    formatNumber,
    formatDateTime
  }
}
```

### 2. 动态翻译工具
```typescript
// src/card2.1/utils/i18n-helpers.ts
import { i18n } from '@/locales'

/**
 * 动态注册组件翻译
 */
export function registerComponentMessages(
  componentType: string,
  messages: Record<string, any>
) {
  for (const [locale, content] of Object.entries(messages)) {
    const currentMessages = i18n.global.getLocaleMessage(locale)
    
    // 深度合并翻译内容
    currentMessages.card2 = currentMessages.card2 || {}
    currentMessages.card2.components = currentMessages.card2.components || {}
    currentMessages.card2.components[componentType] = {
      ...currentMessages.card2.components[componentType],
      ...content
    }
    
    i18n.global.setLocaleMessage(locale, currentMessages)
  }
}

/**
 * 检查翻译键是否存在
 */
export function hasTranslation(key: string, locale?: string): boolean {
  const targetLocale = locale || i18n.global.locale.value
  const message = i18n.global.getLocaleMessage(targetLocale)
  
  return key.split('.').reduce((obj, k) => obj?.[k], message) !== undefined
}

/**
 * 获取所有可用语言列表
 */
export function getAvailableLocales() {
  return i18n.global.availableLocales.map(locale => ({
    code: locale,
    name: getLocaleDisplayName(locale)
  }))
}

/**
 * 获取语言显示名称
 */
export function getLocaleDisplayName(locale: string): string {
  const displayNames: Record<string, string> = {
    'zh-CN': '简体中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어'
  }
  
  return displayNames[locale] || locale
}

/**
 * 验证组件定义的国际化完整性
 */
export function validateComponentI18n(
  componentType: string,
  definition: any
): string[] {
  const errors: string[] = []
  const requiredKeys = [
    `card2.components.${componentType}.name`,
    `card2.components.${componentType}.description`
  ]
  
  for (const locale of i18n.global.availableLocales) {
    for (const key of requiredKeys) {
      if (!hasTranslation(key, locale)) {
        errors.push(`Missing translation for "${key}" in locale "${locale}"`)
      }
    }
  }
  
  return errors
}
```

## 🎨 最佳实践

### 1. 翻译键命名规范
```typescript
// 好的命名规范
'card2.components.simpleDisplay.name'           // 组件名称
'card2.components.simpleDisplay.description'   // 组件描述
'card2.settings.title.label'                   // 设置项标签
'card2.settings.title.help'                    // 设置项帮助
'card2.errors.loadFailed'                      // 错误信息
'card2.categories.statistics'                  // 分类名称

// 避免的命名方式
'simpleDisplayName'                            // 过于简化
'card2ComponentSimpleDisplayNameLabel'         // 过于冗长
'card2.simple-display-name'                    // 不一致的格式
```

### 2. 复数形式处理
```typescript
// 使用参数化翻译处理复数
const messages = {
  'zh-CN': {
    'card2.components.loaded': '已加载 {count} 个组件',
    'card2.settings.interval.second': '{count} 秒',
    'card2.settings.interval.minute': '{count} 分钟'
  },
  'en': {
    'card2.components.loaded': 'Loaded {count} component | Loaded {count} components',
    'card2.settings.interval.second': '{count} second | {count} seconds',
    'card2.settings.interval.minute': '{count} minute | {count} minutes'
  }
}

// 在组件中使用
const loadedText = t('card2.components.loaded', { count: componentCount.value })
```

### 3. 日期时间本地化
```typescript
// 在组件中处理日期时间
const { formatDateTime } = useComponentI18n(componentType)

// 根据语言环境格式化
const formattedTime = formatDateTime(new Date(), {
  dateStyle: 'medium',
  timeStyle: 'short'
})
```

### 4. 数值格式化本地化
```typescript
// 在组件中处理数值显示
const { formatNumber } = useComponentI18n(componentType)

// 根据语言环境格式化数值
const formattedValue = formatNumber(123456.789, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
```

## 🔍 开发调试工具

### 1. 翻译缺失检测器
```vue
<!-- 开发环境翻译调试组件 -->
<template>
  <div v-if="isDev" class="i18n-debug">
    <n-card title="翻译调试信息" size="small">
      <n-space vertical>
        <n-text>当前语言: {{ currentLocale }}</n-text>
        <n-text>缺失翻译: {{ missingKeys.length }} 个</n-text>
        <n-collapse v-if="missingKeys.length">
          <n-collapse-item title="查看缺失的翻译键" name="missing">
            <n-code :code="missingKeys.join('\n')" language="text" />
          </n-collapse-item>
        </n-collapse>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { validateComponentI18n } from '@/card2.1/utils/i18n-helpers'

const { locale } = useI18n()
const isDev = process.env.NODE_ENV === 'development'
const currentLocale = computed(() => locale.value)

// 检测当前页面组件的翻译完整性
const missingKeys = ref<string[]>([])

onMounted(() => {
  if (isDev) {
    // 这里可以扫描页面中的所有 Card 2.1 组件
    // 检查翻译完整性
  }
})
</script>
```

### 2. 语言切换工具
```vue
<!-- 开发环境语言切换器 -->
<template>
  <n-dropdown 
    :options="localeOptions" 
    @select="handleLocaleChange"
  >
    <n-button quaternary>
      <template #icon>
        <n-icon :component="GlobalOutline" />
      </template>
      {{ currentLocaleName }}
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
import { GlobalOutline } from '@vicons/ionicons5'
import { setLanguage } from '@/locales'
import { getAvailableLocales, getLocaleDisplayName } from '@/card2.1/utils/i18n-helpers'

const { locale } = useI18n()

const localeOptions = computed(() => 
  getAvailableLocales().map(({ code, name }) => ({
    label: name,
    key: code
  }))
)

const currentLocaleName = computed(() => 
  getLocaleDisplayName(locale.value)
)

const handleLocaleChange = (localeCode: string) => {
  setLanguage(localeCode)
  // 可能需要刷新页面或重新加载组件
  window.location.reload()
}
</script>
```

## ✅ 国际化检查清单

### 开发阶段
- [ ] 组件定义使用翻译键而非硬编码文本
- [ ] 所有用户可见文本都有对应的翻译键
- [ ] 错误信息支持多语言显示
- [ ] 数值和日期根据语言环境格式化
- [ ] 配置面板支持多语言

### 测试阶段
- [ ] 在不同语言环境下测试组件显示
- [ ] 验证文本长度变化不影响布局
- [ ] 检查翻译的准确性和一致性
- [ ] 测试语言切换后的组件行为

### 发布阶段
- [ ] 所有翻译键都有对应的翻译内容
- [ ] 翻译内容经过校对和审核
- [ ] 支持的语言列表明确定义
- [ ] 提供翻译贡献指南

## 🔗 相关文档

- [组件配置](./05-component-configuration.md) - 配置面板国际化
- [错误处理](./17-best-practices.md#错误处理) - 错误信息国际化  
- [主题系统](./12-theme-system.md) - 主题与语言的协调
- [测试指南](./16-testing-guide.md) - 国际化测试方法

---

**多语言支持让组件面向全球用户！** 🌍