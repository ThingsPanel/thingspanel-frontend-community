# HTTP配置测试文件夹

这个文件夹包含HTTP配置相关的测试组件和页面。

## 文件说明

### 1. `HttpConfigFormComponent.vue` - 独立表单组件
**独立的HTTP配置表单组件，可以直接复制到其他项目使用**

**特点**：
- ✅ 完全独立，基于Naive UI
- ✅ 支持所有HTTP配置选项
- ✅ 完整的表单验证
- ✅ 示例数据回显功能
- ✅ 双向数据绑定

**接口**：
```vue
<HttpConfigFormComponent
  v-model="httpConfig"
  @change="onConfigChange"
  @validate="onConfigValidate"
  ref="formRef"
/>

// 方法调用
formRef.value?.loadConfig(config)    // 加载配置
formRef.value?.reset()               // 重置表单
formRef.value?.validate()            // 验证表单
```

### 2. `FormTestPage.vue` - 表单测试页面
**专门用于测试 `HttpConfigFormComponent` 组件的完整页面**

**功能**：
- ✅ 6个预设示例按钮
- ✅ 实时配置验证
- ✅ 完整的执行测试
- ✅ 结果展示和错误处理
- ✅ 配置JSON预览

### 3. `index.vue` - 原始测试页面
**原有的测试页面，已经被我改过了，但建议使用 `FormTestPage.vue`**

## 使用建议

### 开发阶段
访问 `FormTestPage.vue` 来测试表单组件功能

### 复制到正式项目
1. 复制 `HttpConfigFormComponent.vue` 到你的组件目录
2. 复制相关的类型定义文件：
   - `/src/core/data-source-system/types/http-config.ts`
3. 在你的页面中导入和使用

### 示例使用代码

```vue
<template>
  <div>
    <HttpConfigFormComponent
      ref="httpFormRef"
      v-model="httpConfig"
      @change="onConfigChange"
      @validate="onValidate"
    />
    
    <!-- 示例按钮 -->
    <n-button @click="loadExample">加载示例</n-button>
  </div>
</template>

<script setup>
import HttpConfigFormComponent from './HttpConfigFormComponent.vue'
import type { HttpConfig } from '@/types/http-config'

const httpFormRef = ref()
const httpConfig = ref<HttpConfig>()

const loadExample = () => {
  const example = {
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: { Accept: 'application/json' },
    params: {},
    timeout: 10000
  }
  httpFormRef.value?.loadConfig(example)
}

const onConfigChange = (config) => {
  console.log('配置已更新:', config)
}

const onValidate = (valid, errors) => {
  console.log('验证结果:', valid, errors)
}
</script>
```

## 文件大小和复杂度

- `HttpConfigFormComponent.vue`: ~15KB，包含完整功能
- 类型定义文件: ~8KB
- 总计约23KB的代码，可以处理所有HTTP配置需求

这样你就有了一个完全独立、功能完整的HTTP配置表单组件！