# Switch 组件迁移指南

## 📋 组件概述

**switch** 是一个开关控制组件，专门用于设备的二值状态控制，如开/关、启用/禁用等。与enum-control和state-display组件功能重叠达70%，是三个设备控制组件中最简单的一个。

## 🔍 技术架构分析

### 当前实现结构
```
switch/
├── index.ts           # 组件定义
├── component.vue      # 核心控制逻辑
├── card-config.vue    # 配置界面
└── poster.png         # 组件预览图
```

### 核心功能特性
1. **二值控制**: 专门处理开/关两种状态的切换
2. **可视化开关**: 使用开关按钮或切换按钮的UI形式
3. **状态同步**: 显示设备当前的开关状态
4. **即时反馈**: 操作后立即显示状态变化
5. **设备控制**: 将开关状态发送到目标设备

### 数据流程
```
设备开关状态 → 开关UI显示 → 用户切换 → 发送到设备 → 状态同步更新
```

## ❗ 现有问题识别

### 1. 🚨 **与enum-control/state-display功能严重重叠**
```javascript
// 三个组件的核心逻辑70%相同
// switch: 二值开关控制
// enum-control: 多值枚举控制（包含二值情况）
// state-display: 状态显示（无控制）

// 相同的数据获取逻辑
const fetchDeviceState = async () => {
  // API调用和数据处理逻辑完全相同
}

// 相同的WebSocket更新处理
defineExpose({
  updateData: (deviceId, metricsId, data) => {
    // 数据更新逻辑相同
  }
})
```

### 2. 🔧 **功能局限性**
```javascript
// 只能处理二值状态，扩展性差
const switchStates = {
  on: { label: '开启', value: true },
  off: { label: '关闭', value: false }
}

// 无法处理三值或多值状态（如：开启/关闭/维护模式）
```

### 3. 🎨 **UI模式单一**
- 主要使用标准的开关组件
- 缺少其他视觉化表示方式
- 无法自定义开关的样式和标签

### 4. 🔒 **缺少高级控制功能**
```javascript
// 缺少确认机制
const handleSwitch = (value) => {
  // 直接发送，无确认步骤
  sendControlCommand(value)
}

// 缺少权限控制和安全检查
```

## 🎯 Card 2.1 迁移策略

### 🔄 组件合并策略

**switch组件将完全整合到统一的`DeviceController`组件中**，作为`controlMode: 'switch'`的特化模式。

#### 在统一组件中的开关模式配置
```typescript
// DeviceController组件中的开关控制配置
const switchModeConfig = {
  controlMode: 'switch',  // 开关控制模式
  
  // 开关特定配置
  switchConfig: {
    // 开关状态定义
    onState: {
      label: '开启',
      value: true,
      color: '#52c41a',
      icon: 'power'
    },
    offState: {
      label: '关闭', 
      value: false,
      color: '#f5222d',
      icon: 'power-off'
    },
    
    // 开关行为配置
    defaultState: false,
    immediateUpdate: true,    // 立即更新UI状态
    confirmBeforeChange: false, // 是否需要确认
    allowToggleWhenOffline: false, // 离线时是否允许切换
    
    // 安全控制
    dangerousActions: ['off'], // 危险操作列表
    requireConfirmation: false, // 危险操作是否需要确认
    
    // 显示配置
    showStateLabel: true,     // 显示状态文本
    showStateIcon: false,     // 显示状态图标
    compactMode: false        // 紧凑显示模式
  },
  
  uiConfig: {
    displayMode: 'switch',    // 使用开关UI
    size: 'medium',
    layout: 'horizontal'
  },
  
  behaviorConfig: {
    confirmBeforeSend: false,
    showFeedback: true,
    disableWhenOffline: true
  }
}
```

#### 开关控制的实现逻辑
```vue
<!-- DeviceController.vue 中的开关控制部分 -->
<script setup lang="ts">
// 开关状态计算
const switchState = computed(() => {
  const currentValue = props.data?.currentState
  const switchConfig = config.switchConfig
  
  // 判断当前状态
  if (currentValue === switchConfig?.onState?.value || 
      currentValue === true || 
      currentValue === 'on' || 
      currentValue === '1') {
    return 'on'
  }
  
  return 'off'
})

const currentSwitchInfo = computed(() => {
  const isOn = switchState.value === 'on'
  const switchConfig = config.switchConfig
  
  return isOn ? switchConfig?.onState : switchConfig?.offState
})

// 开关切换处理
const handleSwitchToggle = async (newValue: boolean) => {
  const switchConfig = config.switchConfig
  
  // 危险操作确认
  if (switchConfig?.requireConfirmation) {
    const targetState = newValue ? 'on' : 'off'
    if (switchConfig.dangerousActions?.includes(targetState)) {
      const confirmed = await showConfirmDialog({
        title: t('deviceController.confirmAction'),
        content: t('deviceController.dangerousActionWarning'),
        type: 'warning'
      })
      
      if (!confirmed) return
    }
  }
  
  // 发送控制命令
  try {
    await sendDeviceControl({
      deviceId: props.data?.deviceInfo?.deviceId,
      metricsId: props.data?.deviceInfo?.metricsId,
      value: newValue
    })
    
    // 立即更新UI状态（如果配置允许）
    if (switchConfig?.immediateUpdate) {
      updateLocalState(newValue)
    }
    
    // 显示成功反馈
    if (config.behaviorConfig?.showFeedback) {
      message.success(t('deviceController.controlSuccess'))
    }
    
  } catch (error) {
    console.error('Switch control failed:', error)
    
    if (config.behaviorConfig?.showFeedback) {
      message.error(t('deviceController.controlFailed'))
    }
  }
}

// 本地状态更新
const updateLocalState = (newValue: boolean) => {
  // 临时更新本地状态，等待WebSocket确认
  localState.value = newValue
  
  // 设置超时，如果一定时间内没有收到确认则恢复
  setTimeout(() => {
    if (localState.value !== props.data?.currentState) {
      localState.value = props.data?.currentState
    }
  }, 5000)
}

// 权限检查
const canOperate = computed(() => {
  // 检查设备是否在线
  if (config.behaviorConfig?.disableWhenOffline && !deviceOnline.value) {
    return false
  }
  
  // 检查用户权限
  if (!hasControlPermission.value) {
    return false
  }
  
  return true
})

// 设备在线状态检查
const deviceOnline = computed(() => {
  return props.data?.deviceInfo?.online !== false
})
</script>

<template>
  <div class="device-controller switch-mode">
    <!-- 开关控制区域 -->
    <div 
      v-if="config.controlMode === 'switch'"
      class="switch-control-container"
      :class="{ 
        'compact': config.switchConfig?.compactMode,
        'with-labels': config.switchConfig?.showStateLabel 
      }"
    >
      <!-- 开关标题 -->
      <div 
        v-if="config.displayConfig?.showTitle"
        class="switch-title"
      >
        {{ props.data?.deviceInfo?.metricsName || t('deviceController.switchControl') }}
      </div>
      
      <!-- 主开关控件 -->
      <div class="switch-main">
        <NSwitch
          :value="switchState === 'on'"
          :disabled="!canOperate"
          :size="config.uiConfig?.size"
          :loading="loading"
          @update:value="handleSwitchToggle"
        >
          <!-- 开启状态内容 -->
          <template #checked>
            <NIcon v-if="config.switchConfig?.showStateIcon">
              <component :is="getIconComponent(config.switchConfig?.onState?.icon)" />
            </NIcon>
            <span v-if="config.switchConfig?.showStateLabel && !config.switchConfig?.compactMode">
              {{ config.switchConfig?.onState?.label }}
            </span>
          </template>
          
          <!-- 关闭状态内容 -->
          <template #unchecked>
            <NIcon v-if="config.switchConfig?.showStateIcon">
              <component :is="getIconComponent(config.switchConfig?.offState?.icon)" />
            </NIcon>
            <span v-if="config.switchConfig?.showStateLabel && !config.switchConfig?.compactMode">
              {{ config.switchConfig?.offState?.label }}
            </span>
          </template>
        </NSwitch>
        
        <!-- 状态标签（紧凑模式时显示在开关旁边） -->
        <div 
          v-if="config.switchConfig?.showStateLabel && config.switchConfig?.compactMode"
          class="switch-state-label"
        >
          <NIcon 
            v-if="config.switchConfig?.showStateIcon"
            :color="currentSwitchInfo?.color"
            size="16"
          >
            <component :is="getIconComponent(currentSwitchInfo?.icon)" />
          </NIcon>
          <span :style="{ color: currentSwitchInfo?.color }">
            {{ currentSwitchInfo?.label }}
          </span>
        </div>
      </div>
      
      <!-- 状态信息 -->
      <div 
        v-if="config.advancedConfig?.showStateInfo"
        class="switch-state-info"
      >
        <div class="state-duration">
          {{ t('deviceController.stateDuration') }}: {{ stateDuration }}
        </div>
        
        <div 
          v-if="!deviceOnline"
          class="offline-indicator"
        >
          <NIcon size="14" color="#f5222d">
            <WifiOffOutline />
          </NIcon>
          {{ t('deviceController.deviceOffline') }}
        </div>
      </div>
      
      <!-- 操作提示 -->
      <div 
        v-if="!canOperate"
        class="operation-disabled-tip"
      >
        <NAlert type="warning" size="small" :show-icon="false">
          {{ getDisabledReason() }}
        </NAlert>
      </div>
    </div>
  </div>
</template>

<style scoped>
.switch-control-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.switch-control-container.compact {
  padding: 8px;
  gap: 6px;
}

.switch-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  text-align: center;
}

.switch-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-state-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.switch-state-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-color-3);
}

.offline-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--error-color);
}

.operation-disabled-tip {
  width: 100%;
}

/* 水平布局 */
.switch-control-container.horizontal {
  flex-direction: row;
  justify-content: space-between;
}

.horizontal .switch-title {
  flex: 1;
  text-align: left;
}

.horizontal .switch-main {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .switch-control-container {
    padding: 8px;
  }
  
  .switch-state-info {
    display: none;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .switch-control-container {
  color: var(--text-color-dark);
}
</style>
```

## 💻 实施步骤

### Phase 1: 集成到统一组件（第1周）
1. **将switch功能整合到DeviceController**
   - 添加`controlMode: 'switch'`配置模式
   - 实现开关状态的UI控制逻辑
   - 保持原有的所有开关功能

### Phase 2: 功能增强（第2周）
1. **开关控制增强**
   - 危险操作确认机制
   - 权限控制和安全检查
   - 离线状态处理和提示
   - 状态持续时间显示

### Phase 3: UI模式扩展（第3周）
1. **多种开关显示模式**
   - 标准开关、按钮开关、图标开关
   - 紧凑模式和完整模式
   - 水平布局和垂直布局选项

### Phase 4: 测试和优化（第4周）
1. **兼容性验证**
   - 原switch组件功能完全兼容
   - 开关状态的准确同步
   - UI交互的流畅性测试

## ✅ 测试验证方案

### 功能兼容性测试
- [ ] 原switch组件的开关控制功能
- [ ] 设备状态同步和WebSocket更新
- [ ] 开关UI的交互响应
- [ ] 状态变化的视觉反馈

### 增强功能测试
- [ ] 危险操作确认机制
- [ ] 权限控制和禁用状态
- [ ] 离线设备的处理逻辑
- [ ] 多种UI显示模式

### 安全性测试
- [ ] 未授权操作的拦截
- [ ] 离线设备的操作限制
- [ ] 危险操作的确认流程
- [ ] 错误状态的恢复机制

## 📈 迁移收益

### 代码维护收益
- **减少重复**: 与enum-control和state-display合并，减少70%重复代码
- **统一架构**: 三种控制模式统一管理和维护

### 功能增强收益
- **安全控制**: 基础开关 → 带权限和确认的安全控制
- **状态管理**: 简单状态 → 完整的状态信息和历史
- **UI灵活性**: 单一开关样式 → 多种显示模式可选

### 用户体验收益
- **组件选择**: 3个相似组件选择困难 → 1个组件统一体验
- **功能完整**: 基础控制 → 企业级控制功能
- **视觉一致**: 分散样式 → 统一设计系统

### 开发效率收益
- **开发成本**: 三套控制逻辑 → 一套统一逻辑
- **维护成本**: 多处代码维护 → 单点维护
- **功能扩展**: 分别扩展 → 统一扩展受益

---

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u4e3abar\u67f1\u72b6\u56fe\u7ec4\u4ef6\u521b\u5efa\u8fc1\u79fb\u6587\u6863", "status": "completed", "id": "bar-migration-doc"}, {"content": "\u4e3acurve\u66f2\u7ebf\u56fe\u7ec4\u4ef6\u521b\u5eba\u8fc1\u79fb\u6587\u6863", "status": "completed", "id": "curve-migration-doc"}, {"content": "\u4e3ademo\u6f14\u793a\u7ec4\u4ef6\u521b\u5eba\u8fc1\u79fb\u6587\u6863", "status": "completed", "id": "demo-migration-doc"}, {"content": "\u4e3adigit-indicator\u6570\u5b57\u6307\u793a\u5668\u7ec4\u4ef6\u521b\u5eba\u8fc1\u79fb\u6587\u6863", "status": "completed", "id": "digit-indicator-migration-doc"}, {"content": "\u4e3aenum-control\u679a\u4e3e\u63a7\u5236\u7ec4\u4ef6\u521b\u5eba\u8fc1\u79fb\u6587\u6863", "status": "completed", "id": "enum-control-migration-doc"}, {"content": "\u4e3astate-display\u72b6\u6001\u663e\u793a\u7ec4\u4ef6\u521b\u5eba\u8fc1\u79fb\u6587\u6863", "status": "completed", "id": "state-display-migration-doc"}, {"content": "\u4e3aswitch\u5f00\u5173\u63a7\u5236\u7ec4\u4ef6\u521b\u5eba\u8fc1\u79fb\u6587\u6863", "status": "completed", "id": "switch-migration-doc"}]