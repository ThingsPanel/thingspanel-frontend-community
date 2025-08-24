# JsonDataInput 组件使用文档

## 概述

`JsonDataInput` 是一个功能完整的 JSON 数据输入组件，提供 JSON 编辑、格式化、验证、压缩等功能。组件严格遵循项目的 Naive UI 优先原则和主题系统集成要求。

## 功能特性

- ✅ **完整的 JSON 操作**: 格式化、验证、压缩、清空
- ✅ **实时验证**: 支持自动验证和手动验证
- ✅ **语法高亮**: 使用等宽字体提供更好的代码阅读体验
- ✅ **工具栏集成**: 直观的操作按钮和状态指示
- ✅ **主题系统**: 完全集成明暗主题切换
- ✅ **国际化**: 支持中英文界面
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **无障碍支持**: 支持高对比度和减少动画偏好
- ✅ **v-model 双向绑定**: 标准 Vue 组件模式

## 安装和导入

```vue
<script setup lang="ts">
import JsonDataInput from '@/core/data-source-system/components/JsonDataInput.vue'
</script>
```

## 基础用法

### 简单使用

```vue
<template>
  <JsonDataInput 
    v-model="jsonData"
    show-label
    label="JSON数据"
    placeholder="请输入JSON数据..."
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const jsonData = ref('')
</script>
```

### 无标签模式

```vue
<template>
  <JsonDataInput 
    v-model="jsonData"
    placeholder="请输入JSON数据..."
    :rows="8"
  />
</template>
```

## Props 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `modelValue` | `string` | `''` | JSON内容，支持v-model双向绑定 |
| `showLabel` | `boolean` | `false` | 是否显示标题 |
| `label` | `string` | `'JSON数据'` | 标题文本 |
| `labelWidth` | `number` | `60` | 标题宽度 |
| `placeholder` | `string` | `'请输入JSON数据'` | 占位提示文本 |
| `rows` | `number` | `8` | 输入框行数 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `size` | `FormItemSize` | `'small'` | 组件尺寸 |
| `autoValidate` | `boolean` | `true` | 是否在输入时自动验证 |
| `autoFormat` | `boolean` | `false` | 是否在失焦时自动格式化 |

## Events 事件

| 事件名 | 类型 | 说明 |
|--------|------|------|
| `update:modelValue` | `(value: string) => void` | 数据更新事件 |
| `validation-change` | `(status: ValidationStatus) => void` | 验证状态变化事件 |
| `input` | `(value: string) => void` | 输入事件 |
| `blur` | `(event: FocusEvent) => void` | 失焦事件 |
| `focus` | `(event: FocusEvent) => void` | 聚焦事件 |
| `format` | `(value: string) => void` | JSON格式化事件 |
| `validate` | `(status: ValidationStatus) => void` | JSON验证事件 |
| `clear` | `() => void` | 内容清空事件 |

## ValidationStatus 类型

```typescript
interface ValidationStatus {
  type: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  text: string
  detail: string
}
```

## 公共方法

通过 `ref` 可以调用组件的公共方法：

```vue
<template>
  <JsonDataInput ref="jsonInputRef" v-model="jsonData" />
  <n-button @click="formatJson">格式化</n-button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const jsonInputRef = ref()
const jsonData = ref('')

const formatJson = () => {
  jsonInputRef.value?.formatJson()
}
</script>
```

### 可用方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `formatJson()` | - | `void` | 格式化JSON |
| `validateJson()` | - | `void` | 验证JSON |
| `compressJson()` | - | `void` | 压缩JSON |
| `clearJson()` | - | `void` | 清空内容 |
| `getParsedValue()` | - | `any \| null` | 获取解析后的JSON对象 |
| `setValue(value)` | `string \| object` | `void` | 设置JSON内容 |
| `getValidationStatus()` | - | `ValidationStatus` | 获取验证状态 |

## 高级用法

### 自动格式化模式

```vue
<template>
  <JsonDataInput 
    v-model="jsonData"
    show-label
    label="自动格式化JSON"
    :auto-format="true"
    :auto-validate="true"
    placeholder="失焦时自动格式化..."
  />
</template>
```

### 事件监听

```vue
<template>
  <JsonDataInput 
    v-model="jsonData"
    @validation-change="handleValidationChange"
    @format="handleFormat"
    @validate="handleValidate"
    @clear="handleClear"
  />
</template>

<script setup lang="ts">
const handleValidationChange = (status: ValidationStatus) => {
  console.log('验证状态:', status)
}

const handleFormat = (value: string) => {
  console.log('格式化完成:', value)
}

const handleValidate = (status: ValidationStatus) => {
  console.log('验证结果:', status)
}

const handleClear = () => {
  console.log('内容已清空')
}
</script>
```

### 只读模式

```vue
<template>
  <JsonDataInput 
    v-model="readonlyData"
    show-label
    label="只读JSON"
    :readonly="true"
  />
</template>

<script setup lang="ts">
const readonlyData = ref(`{
  "name": "只读示例",
  "readonly": true
}`)
</script>
```

## 样式自定义

组件完全集成了主题系统，支持明暗主题切换。如需自定义样式，请使用 CSS 变量：

```css
.custom-json-input :deep(.json-editor-container) {
  border-color: var(--primary-color);
}

.custom-json-input :deep(.json-editor-toolbar) {
  background: var(--hover-color);
}
```

## 国际化

组件支持中英文界面，翻译键位于：
- `src/locales/langs/zh-cn/common.json`
- `src/locales/langs/en-us/common.json`

可以通过修改这些文件来自定义界面文本。

## 最佳实践

1. **数据验证**: 启用 `autoValidate` 获得实时验证反馈
2. **自动格式化**: 对于用户输入场景，启用 `autoFormat` 提升体验
3. **事件监听**: 监听验证状态变化来处理业务逻辑
4. **错误处理**: 使用 `getParsedValue()` 安全获取解析后的数据
5. **主题适配**: 确保自定义样式兼容明暗主题

## 示例项目

完整的使用示例可以在测试页面中查看：
`/src/views/test/json-data-input-test/index.vue`

访问路径（开发环境）：`/test/json-data-input-test`

## 故障排除

### 常见问题

1. **JSON验证失败**
   - 检查JSON语法是否正确
   - 使用组件的验证状态获取详细错误信息

2. **主题样式异常**
   - 确保已正确导入 `useThemeStore`
   - 检查CSS变量是否正确引用

3. **国际化文本未显示**
   - 确认翻译文件中包含所需的键值对
   - 检查 `useI18n` 是否正确初始化

### 调试技巧

```vue
<script setup lang="ts">
// 监听数据变化进行调试
watch(() => jsonData.value, (newVal) => {
  console.log('JSON数据变化:', newVal)
})

// 监听验证状态变化
const handleValidationChange = (status) => {
  console.log('验证状态变化:', status)
}
</script>
```

## 版本历史

- **v1.0.0**: 初始版本，包含基础JSON编辑功能
- 支持格式化、验证、压缩、清空等核心功能
- 完整的主题系统和国际化支持
- 响应式设计和无障碍支持