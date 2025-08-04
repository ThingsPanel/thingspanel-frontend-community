# Card 2.1 配置组件标准规范

本文档定义了 Card 2.1 系统中配置组件的标准格式和最佳实践。

## 目标

1. **统一格式**：确保所有配置组件遵循相同的结构和模式
2. **兼容性**：与原始面板系统和 Visual Editor 完全兼容
3. **可维护性**：代码结构清晰，易于维护和扩展
4. **响应式**：配置变更能正确地双向绑定

## 标准配置组件模板

### 基础模板

```vue
<script lang="ts" setup>
import { inject, onMounted } from 'vue'
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
import { $t } from '@/locales'

// 注入配置上下文（必需）
const ctx = inject<IConfigCtx>('config-ctx')!

// 可选：组件挂载时设置默认值
onMounted(() => {
  // 设置默认配置（如果不存在）
  if (ctx.config.someProperty === undefined) {
    ctx.config.someProperty = 'default-value'
  }
})

// 可选：配置更新处理函数
const handleConfigUpdate = (key: string, value: any) => {
  ctx.config[key] = value
}
</script>

<template>
  <div class="card-config">
    <!-- 配置标题（可选） -->
    <div v-if="showTitle" class="config-title">
      {{ $t('card.configTitle') }}
    </div>

    <!-- 配置表单 -->
    <n-form :model="ctx.config" label-placement="left">
      <!-- 示例：文本输入 -->
      <n-form-item :label="$t('common.title')">
        <n-input 
          v-model:value="ctx.config.title" 
          :placeholder="$t('common.titlePlaceholder')" 
        />
      </n-form-item>

      <!-- 示例：颜色选择器 -->
      <n-form-item :label="$t('common.color')">
        <n-color-picker 
          v-model:value="ctx.config.color" 
          :show-alpha="false" 
        />
      </n-form-item>

      <!-- 示例：数字输入 -->
      <n-form-item :label="$t('common.size')">
        <n-input-number 
          v-model:value="ctx.config.size" 
          :min="1" 
          :max="100" 
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped>
.config-title {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--n-text-color);
}

.card-config :deep(.n-form-item) {
  margin-bottom: 16px;
}
</style>
```

## 必需的导入和声明

### 1. 核心导入
```typescript
import { inject } from 'vue'
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
import { $t } from '@/locales'
```

### 2. 上下文注入
```typescript
const ctx = inject<IConfigCtx>('config-ctx')!
```

### 3. Naive UI 组件
使用 Naive UI 作为主要 UI 库：
```typescript
import { NForm, NFormItem, NInput, NColorPicker, NInputNumber } from 'naive-ui'
```

## 配置更新模式

### 直接绑定（推荐）
```vue
<template>
  <n-input v-model:value="ctx.config.propertyName" />
</template>
```

### 函数处理方式
```vue
<script setup>
const updateProperty = (value: any) => {
  ctx.config.propertyName = value
}
</script>

<template>
  <n-input :value="ctx.config.propertyName" @update:value="updateProperty" />
</template>
```

## 默认值处理

### 在 onMounted 中设置
```typescript
onMounted(() => {
  // 仅在值不存在时设置默认值
  if (ctx.config.title === undefined) {
    ctx.config.title = $t('card.defaultTitle')
  }
  if (ctx.config.color === undefined) {
    ctx.config.color = '#1890ff'
  }
})
```

### 使用计算属性处理默认值
```typescript
const configWithDefaults = computed(() => ({
  title: ctx.config.title ?? $t('card.defaultTitle'),
  color: ctx.config.color ?? '#1890ff',
  ...ctx.config
}))
```

## 国际化支持

### 标签和文本
```typescript
// 使用 $t 函数进行国际化
:label="$t('device_template.table_header.unit')"
:placeholder="$t('generate.pleaseEnterValue')"
```

### 动态文本
```vue
<template>
  <div class="title">{{ $t('generate.configurationTitle') }}</div>
</template>
```

## 图标选择器集成

### 基础图标选择器
```vue
<script setup>
import IconSelector from '@/components/common/icon-selector.vue'

const setIcon = (icon: string) => {
  ctx.config.iconName = icon
}
</script>

<template>
  <IconSelector 
    :default-icon="ctx.config.iconName || 'DefaultIcon'" 
    @icon-selected="setIcon" 
  />
</template>
```

## 复杂配置处理

### 数组配置
```vue
<script setup>
const addItem = () => {
  if (!ctx.config.items) {
    ctx.config.items = []
  }
  ctx.config.items.push({
    name: '',
    value: ''
  })
}

const removeItem = (index: number) => {
  ctx.config.items.splice(index, 1)
}
</script>

<template>
  <div v-for="(item, index) in ctx.config.items" :key="index">
    <n-input v-model:value="item.name" />
    <n-button @click="removeItem(index)">删除</n-button>
  </div>
  <n-button @click="addItem">添加</n-button>
</template>
```

### 对象配置
```vue
<script setup>
const updateObjectProperty = (key: string, value: any) => {
  if (!ctx.config.settings) {
    ctx.config.settings = {}
  }
  ctx.config.settings[key] = value
}
</script>
```

## 样式规范

### 基础样式类
```scss
.config-title {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--n-text-color);
}

.config-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
}

.config-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
```

### 深度样式覆盖
```scss
:deep(.n-form-item) {
  margin-bottom: 16px;
}

:deep(.n-input-number .n-input .n-input-wrapper .n-input__suffix) {
  display: none !important;
}
```

## 验证和错误处理

### 表单验证
```vue
<script setup>
import { ref } from 'vue'

const formRef = ref()
const rules = {
  title: {
    required: true,
    message: $t('validation.titleRequired'),
    trigger: 'blur'
  }
}

const validate = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      // 验证通过
    }
  })
}
</script>

<template>
  <n-form ref="formRef" :model="ctx.config" :rules="rules">
    <!-- 表单项 -->
  </n-form>
</template>
```

## 文件命名和组织

### 文件结构
```
src/card2.1/components/[category]/[component-name]/
├── index.ts                    # 组件定义和导出
├── component.vue              # 主组件
├── card-config.vue           # 配置组件（遵循此标准）
├── poster.png                # 组件预览图
└── types.ts                  # 组件特定类型（可选）
```

### 配置组件命名
- 文件名：`card-config.vue`
- 组件名：`[ComponentName]Config`

## 兼容性检查清单

- [ ] 正确导入 `IConfigCtx` 类型
- [ ] 使用 `inject('config-ctx')` 获取上下文
- [ ] 使用 `v-model:value` 绑定配置属性
- [ ] 支持国际化（使用 `$t` 函数）
- [ ] 设置合理的默认值
- [ ] 使用 Naive UI 组件
- [ ] 响应式样式（支持暗黑模式）
- [ ] 无控制台错误或警告

## 迁移现有配置组件

### Step 1: 更新导入
```typescript
// 旧的导入
import type { IConfigCtx } from '@/components/panel/card'

// 新的导入
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
```

### Step 2: 统一样式
确保使用标准的样式类和结构。

### Step 3: 添加默认值处理
在 `onMounted` 中添加默认值逻辑。

### Step 4: 测试兼容性
使用 ConfigWrapper 测试组件加载和配置更新。

## 最佳实践

1. **保持简洁**：配置界面应该简洁明了，避免过于复杂的UI
2. **即时反馈**：配置更改应该立即生效，提供实时预览
3. **合理默认值**：提供有意义的默认配置值
4. **错误处理**：优雅地处理无效输入和边界情况
5. **性能考虑**：避免在配置组件中进行重型计算或频繁的DOM操作
6. **可访问性**：确保配置组件支持键盘导航和屏幕阅读器

## 测试指南

### 单元测试
使用 ConfigWrapper 的测试组件验证：
- 配置加载是否正确
- 配置更新是否同步
- 默认值是否正确应用
- 验证逻辑是否工作

### 集成测试
在实际的 Visual Editor 环境中测试：
- 与其他组件的交互
- 主题切换的兼容性
- 响应式布局的适配

通过遵循这些标准，我们可以确保所有 Card 2.1 配置组件的一致性、可维护性和用户体验。