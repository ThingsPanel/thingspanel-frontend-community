# 递归更新问题修复说明

## 问题描述
在visual-editor中，当打开属性面板时会出现"Maximum recursive updates exceeded"错误，导致控制台打印大量重复信息。

## 问题根源
递归更新循环主要由以下几个原因造成：

1. **StaticDataSourceConfig.vue** 中的 `watch` 监听器监听 `props.modelValue` 变化
2. **SettingsPanel.vue** 中的 `watch` 监听器监听 `props.selectedWidget` 变化  
3. **DataSourceSelector.vue** 中的更新方法频繁触发状态变更
4. **PanelEditor.vue** 中的状态更新没有防抖机制

## 修复方案

### 1. 添加防抖机制
在所有可能导致频繁更新的方法中添加防抖机制：

```typescript
// 防抖更新配置
let updateConfigTimer: NodeJS.Timeout | null = null
const updateConfig = () => {
  if (updateConfigTimer) {
    clearTimeout(updateConfigTimer)
  }
  
  updateConfigTimer = setTimeout(() => {
    emit('update:modelValue', { ...config.value })
  }, 100)
}
```

### 2. 条件检查避免重复更新
在 `watch` 监听器中添加条件检查：

```typescript
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // 防止递归更新：只有当值真正不同时才更新
    if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
      return
    }
    // ... 更新逻辑
  },
  { deep: true }
)
```

### 3. 使用 nextTick 避免同步更新
在状态更新时使用 `nextTick` 来避免同步更新导致的递归：

```typescript
nextTick(() => {
  config.value = { ...config.value, ...newValue }
  // ... 其他更新逻辑
})
```

### 4. 清理定时器
在组件卸载时清理所有定时器，避免内存泄漏：

```typescript
onUnmounted(() => {
  if (updateConfigTimer) {
    clearTimeout(updateConfigTimer)
  }
})
```

## 修复的文件

1. `src/components/visual-editor/settings/data-sources/StaticDataSourceConfig.vue`
2. `src/components/visual-editor/settings/SettingsPanel.vue`
3. `src/components/visual-editor/settings/components/DataSourceSelector.vue`
4. `src/components/visual-editor/PanelEditor.vue`

## 修复效果

- ✅ 消除了递归更新错误
- ✅ 减少了控制台重复打印
- ✅ 提高了属性面板的响应性能
- ✅ 避免了内存泄漏

## 注意事项

1. 防抖时间设置为100-200ms，平衡了响应性和性能
2. 所有定时器都在组件卸载时正确清理
3. 条件检查确保只在真正需要时才触发更新
4. 使用 `nextTick` 确保状态更新的正确时序 