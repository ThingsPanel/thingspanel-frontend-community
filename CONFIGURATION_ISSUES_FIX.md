# 配置系统问题修复方案 🔧

## 🔍 问题清单

### 1. **合并策略变化数据不变**
**问题**: 修改合并策略后，组件显示的数据没有更新
**原因**: 缓存没有被清除，执行器没有重新运行

### 2. **删除数据项数据不变** 
**问题**: 删除数据项后，组件还显示之前的数据
**原因**: 删除操作没有清除组件缓存

### 3. **弹窗显示之前配置**
**问题**: 打开配置弹窗时显示的是上次的配置，不是空白
**原因**: 弹窗组件状态没有重置

### 4. **缺少编辑功能**
**问题**: 数据项只能删除，不能编辑修改
**原因**: 没有实现编辑功能

## ✅ 解决方案

### 修复1: 合并策略变化清除缓存
```typescript
const handleMergeStrategyUpdate = (dataSourceKey: string, strategy: any) => {
  mergeStrategies[dataSourceKey] = strategy
  
  // 🔥 关键修复：清除缓存并重新执行
  const existingConfig = configurationManager.getConfiguration(props.componentId)
  if (existingConfig?.dataSource) {
    // 清除组件缓存
    simpleDataBridge.clearComponentCache(props.componentId)
    
    // 重新提交配置触发执行
    updateDataSourceConfiguration(dataSourceKey)
  }
}
```

### 修复2: 删除数据项清除缓存
```typescript
const handleDeleteDataItem = (dataSourceKey: string, itemId: string) => {
  // ... 删除逻辑 ...
  
  // 🔥 关键修复：删除后清除缓存
  simpleDataBridge.clearComponentCache(props.componentId)
  
  // 重新提交配置
  configurationManager.updateConfiguration(...)
}
```

### 修复3: 弹窗状态重置
```typescript
const handleAddDataItem = (dataSourceKey: string) => {
  currentDataSourceKey.value = dataSourceKey
  
  // 🔥 关键修复：重置弹窗状态
  resetModalState()
  
  showRawDataModal.value = true
}

const resetModalState = () => {
  // 重置弹窗为默认空白状态
  // 通过ref或者重新初始化弹窗组件状态
}
```

### 修复4: 添加编辑功能
```typescript
const handleEditDataItem = (dataSourceKey: string, itemId: string) => {
  currentDataSourceKey.value = dataSourceKey
  
  // 找到要编辑的数据项
  const item = dataSourceItems[dataSourceKey]?.find(item => item.id === itemId)
  if (item) {
    // 填充弹窗数据
    fillModalWithItemData(item)
    showRawDataModal.value = true
  }
}
```

## 🎯 实施计划

1. **立即修复** - 缓存清除问题（最重要）
2. **添加编辑** - 数据项编辑功能
3. **优化体验** - 弹窗状态重置
4. **完善测试** - 验证所有功能正常

## 🔧 具体实现

需要修改的文件：
- `SimpleConfigurationEditor.vue` - 主要逻辑修复
- `RawDataConfigModal.vue` - 弹窗状态管理
- 可能需要导入 `simpleDataBridge` 来清除缓存