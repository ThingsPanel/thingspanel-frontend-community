# 🚀 交互系统快速入门指南

欢迎使用ThingsPanel核心交互系统！这份指南将帮助你在5分钟内快速上手。

## 📚 前置知识

在开始之前，请确保你熟悉以下技术：

- ✅ Vue 3 Composition API
- ✅ TypeScript 基础语法
- ✅ Naive UI 组件库
- ✅ ThingsPanel Card 2.1 系统

## ⚡ 快速安装

### 1. 导入核心组件

```typescript
// 导入主要组件
import { 
  InteractionSettingsForm,
  InteractionResponseEditor,
  InteractionTemplateSelector,
  InteractionPreview 
} from '@/core/interaction-system'

// 导入类型定义
import type { 
  InteractionConfig,
  InteractionResponse 
} from '@/card2.1/core/interaction-types'
```

### 2. 基础集成

```vue
<template>
  <div class="component-settings">
    <!-- 其他配置... -->
    
    <!-- 🎯 交互配置区域 -->
    <n-collapse-item title="交互配置" name="interaction">
      <InteractionSettingsForm
        v-model="interactionConfigs"
        :component-id="currentComponentId"
        :component-type="currentComponentType"
        @change="handleInteractionChange"
      />
    </n-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { InteractionSettingsForm } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

// 交互配置数据
const interactionConfigs = ref<InteractionConfig[]>([])
const currentComponentId = ref('my-component-001')
const currentComponentType = ref('chart-component')

// 处理交互配置变化
const handleInteractionChange = (configs: InteractionConfig[]) => {
  console.log('交互配置已更新:', configs)
  // 保存到组件配置或发送到服务器
}
</script>
```

## 🎯 5分钟实战示例

### 示例1：点击跳转功能

创建一个点击组件跳转到外部链接的交互：

```typescript
const jumpInteraction: InteractionConfig = {
  event: 'click',                    // 点击触发
  enabled: true,
  priority: 1,
  name: '跳转到官网',
  responses: [{
    action: 'navigateToUrl',         // URL跳转动作
    value: 'https://thingspanel.io', // 目标链接
    target: '_blank'                 // 新窗口打开
  }]
}

// 应用到组件
interactionConfigs.value.push(jumpInteraction)
```

### 示例2：数据变化触发

当温度超过30度时显示警告：

```typescript
const temperatureWarning: InteractionConfig = {
  event: 'dataChange',               // 数据变化触发
  watchedProperty: 'temperature',    // 监听温度属性
  condition: {                       // 执行条件
    type: 'comparison',
    operator: 'greaterThan',
    value: 30
  },
  enabled: true,
  priority: 2,                       // 高优先级
  name: '温度警告',
  responses: [{
    action: 'updateComponentData',   // 更新组件数据
    targetComponentId: 'warning-panel-001',
    targetProperty: 'visible',
    updateValue: true,
    updateMode: 'replace'
  }, {
    action: 'changeBackgroundColor', // 同时改变背景色
    value: '#ffebee',               // 淡红色警告
    duration: 500
  }]
}

// 应用到组件
interactionConfigs.value.push(temperatureWarning)
```

### 示例3：悬停效果

鼠标悬停时改变背景色：

```typescript
const hoverEffect: InteractionConfig = {
  event: 'hover',                    // 悬停触发
  enabled: true,
  name: '悬停高亮',
  responses: [{
    action: 'changeBackgroundColor', // 改变背景色
    value: '#f0f8ff',               // 淡蓝色
    duration: 300                   // 300ms过渡
  }]
}
```

## 🛠️ 常用代码片段

### 配置表单集成

```vue
<template>
  <!-- 完整的配置面板 -->
  <n-card title="交互设置" size="small">
    <InteractionSettingsForm
      v-model="interactions"
      :component-id="componentId"
      :component-type="componentType"
      :readonly="readonly"
      @change="handleChange"
      @validate="handleValidate"
    >
      <!-- 自定义工具栏 -->
      <template #toolbar>
        <n-space>
          <n-button @click="openPreview">预览效果</n-button>
          <n-button @click="openTemplates">选择模板</n-button>
        </n-space>
      </template>
    </InteractionSettingsForm>
  </n-card>
</template>
```

### 模板选择器

```vue
<template>
  <!-- 模板选择对话框 -->
  <n-modal v-model:show="showTemplates" title="选择交互模板">
    <n-card style="width: 800px">
      <InteractionTemplateSelector
        @select="applyTemplate"
        @cancel="showTemplates = false"
      />
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
const showTemplates = ref(false)

const applyTemplate = (template: InteractionConfig) => {
  interactions.value.push({
    ...template,
    name: `${template.name} (模板)`
  })
  showTemplates.value = false
}
</script>
```

### 预览功能

```vue
<template>
  <!-- 预览对话框 -->
  <n-modal v-model:show="showPreview" title="交互效果预览">
    <n-card style="width: 900px; height: 600px">
      <InteractionPreview
        :interactions="interactions"
        :component-id="componentId"
        @close="showPreview = false"
      />
    </n-card>
  </n-modal>
</template>
```

## 🎨 样式定制

### 主题集成

```vue
<style scoped>
/* 集成ThingsPanel主题系统 */
.interaction-panel {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
}

/* 交互配置项样式 */
.interaction-item {
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.interaction-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px var(--primary-color-hover);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .interaction-panel {
    padding: 12px;
  }
}
</style>
```

## 📊 调试技巧

### 1. 开启调试日志

```typescript
// 在开发环境开启详细日志
if (process.env.NODE_ENV === 'development') {
  window.__INTERACTION_DEBUG__ = true
}

// 监听交互执行
interactionManager.on('execute', (event) => {
  console.log('[交互执行]', event.config, event.result)
})
```

### 2. 使用Vue DevTools

在Vue DevTools中查看交互状态：

```typescript
// 暴露调试信息到开发者工具
const { expose } = getCurrentInstance()
expose({
  interactions: interactionConfigs,
  executionLog: executionLog,
  debugInfo: computed(() => ({
    activeInteractions: activeCount.value,
    lastExecution: lastExecutionTime.value
  }))
})
```

### 3. 错误边界处理

```typescript
const handleInteractionError = (error: Error, config: InteractionConfig) => {
  console.error('交互执行失败:', {
    error: error.message,
    config: config,
    timestamp: new Date().toISOString()
  })
  
  // 发送错误报告
  if (process.env.NODE_ENV === 'production') {
    errorReporter.report('INTERACTION_ERROR', { error, config })
  }
}
```

## 🔧 性能优化

### 1. 延迟加载

```typescript
// 异步加载交互组件
const InteractionSettingsForm = defineAsyncComponent(() => 
  import('@/core/interaction-system/components/InteractionSettingsForm.vue')
)
```

### 2. 配置缓存

```typescript
// 缓存交互配置
const configCache = new Map<string, InteractionConfig[]>()

const getCachedConfig = (componentId: string) => {
  if (!configCache.has(componentId)) {
    const config = loadInteractionConfig(componentId)
    configCache.set(componentId, config)
  }
  return configCache.get(componentId)
}
```

### 3. 批量更新

```typescript
// 使用nextTick批量处理配置更新
const batchUpdateConfigs = useDebounceFn((configs: InteractionConfig[]) => {
  nextTick(() => {
    interactionManager.batchUpdate(configs)
  })
}, 300)
```

## 📱 移动端适配

### 响应式配置

```vue
<template>
  <div class="interaction-mobile-wrapper">
    <!-- 移动端使用简化版组件 -->
    <InteractionCardWizard
      v-if="isMobile"
      v-model="interactions"
      :component-id="componentId"
      :component-type="componentType"
    />
    
    <!-- 桌面端使用完整版组件 -->
    <InteractionSettingsForm
      v-else
      v-model="interactions"
      :component-id="componentId"
      :component-type="componentType"
    />
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024
})

const isMobile = breakpoints.smaller('tablet')
</script>
```

## 🚨 常见问题

### Q1: 交互配置不生效？

```typescript
// 检查交互管理器注册状态
console.log('组件交互配置:', interactionManager.getComponentConfigs(componentId))

// 检查属性暴露配置
console.log('属性暴露信息:', propertyExposureRegistry.getComponentExposure(componentType))
```

### Q2: 跨组件交互失败？

```typescript
// 检查目标组件是否存在
const availableComponents = visualEditorState.getAvailableComponents()
const targetExists = availableComponents.find(comp => comp.id === targetComponentId)

if (!targetExists) {
  console.error('目标组件不存在:', targetComponentId)
}
```

### Q3: 模板导入失败？

```typescript
// 验证模板格式
const validateTemplate = (template: any): boolean => {
  return !!(
    template.name &&
    template.config &&
    Array.isArray(template.config) &&
    template.config.every(config => config.event && config.responses)
  )
}
```

## 🎯 下一步

现在你已经掌握了基础用法，可以：

1. 📖 阅读 [完整API文档](./API.md)
2. 🏗️ 查看 [架构设计文档](./README.md)
3. 🎨 学习 [高级定制技巧](./ADVANCED.md)
4. 🧪 参考 [测试用例](./tests/)

## 💡 专业提示

- ✨ 使用模板系统快速创建常用交互
- ⚡ 利用条件执行减少不必要的计算
- 🎯 优先使用内置动作类型，避免过度自定义
- 📊 开发时始终开启预览功能验证效果
- 🛠️ 为复杂交互编写单元测试

---

**🎉 恭喜！你已经完成了交互系统的快速入门。开始创建令人惊艳的交互体验吧！**

---

*快速入门指南 | 版本：v1.0 | 预计阅读时间：5分钟*