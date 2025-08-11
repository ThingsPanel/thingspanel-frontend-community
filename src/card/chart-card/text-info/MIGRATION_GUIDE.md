# Text Info 组件迁移指南

## 📋 组件概述

**text-info** 是一个文本信息展示组件，用于显示设备的文本类型数据，如版本号、状态描述、设备名称等字符串信息。是最简单的数据展示组件之一。

## 🔍 技术架构分析

### 当前实现结构
```
text-info/
├── index.ts           # 组件定义
├── component.vue      # 核心显示逻辑（119 行）
├── card-config.vue    # 配置界面（空实现）
└── poster.png         # 组件预览图
```

### 核心功能特性
1. **文本显示**: 大字号显示文本内容
2. **属性数据**: 仅支持 attributes 类型数据获取
3. **响应式字体**: 根据容器大小自动调整字体
4. **默认值**: 无数据时显示 "1.9.2"（硬编码）
5. **WebSocket 更新**: 支持实时数据更新

### 数据流程
```
设备属性数据 → API 获取 → 显示文本 → WebSocket 更新
```

## ❗ 现有问题识别

### 1. 🚨 **配置界面缺失**
```vue
<!-- card-config.vue 完全为空 -->
<template>
  <div></div>  <!-- 没有任何配置选项 -->
</template>
```
**影响**: 用户无法配置任何显示选项，功能极其有限。

### 2. 📊 **数据源限制**
```javascript
// 只支持 attributes 类型，不支持 telemetry
if (metricsType === 'attributes' && deviceId && metricsId) {
  // 只有这一种数据获取方式
}
```
**影响**: 无法显示遥测数据中的文本信息。

### 3. 🎨 **样式系统问题**
```css
/* 硬编码样式和固定布局 */
.value {
  font-size: 3em;        /* 固定倍数 */
  font-weight: bold;
}
```
**影响**: 无法适配不同主题和样式需求。

### 4. 🔧 **功能过于简单**
- 无文本格式化选项
- 无多行文本支持
- 无文本颜色和样式配置
- 无文本对齐方式选择

### 5. 🌐 **国际化问题**
```javascript
// 硬编码默认值和标签
detail ?? '1.9.2'
$t('card.firmVersion')  // 固定为固件版本
```
**影响**: 缺少灵活的默认值配置。

### 6. 📱 **响应式设计有限**
```javascript
// 简单的字体大小计算
const newFontSize = `${Math.min(width, height) / 10}px`
```
**影响**: 在极端尺寸下可能显示不佳。

## 🎯 Card 2.1 迁移策略

### 组件重新设计

#### 1. 组件定义
```typescript
// src/card2.1/components/text-display/index.ts
import type { ComponentDefinition } from '@/card2.1/core/component-definition'

export const TextDisplayDefinition: ComponentDefinition = {
  type: 'text-display',
  name: '文本显示',
  category: '数据展示',
  description: '显示设备的文本类型数据，支持多种格式化和样式选项',
  
  // 数据需求声明
  dataRequirements: {
    textValue: {
      type: 'string',
      description: '要显示的文本内容',
      required: true
    },
    
    metricsInfo: {
      type: 'object',
      description: '指标信息',
      structure: {
        metricsName: { type: 'string', description: '指标名称' },
        deviceId: { type: 'string', description: '设备ID' },
        metricsId: { type: 'string', description: '指标ID' },
        metricsType: { 
          type: 'string', 
          enum: ['telemetry', 'attributes'],
          description: '指标类型' 
        }
      }
    }
  },
  
  // 配置结构
  config: {
    // 内容配置
    contentConfig: {
      type: 'object',
      label: '内容配置',
      structure: {
        defaultValue: {
          type: 'string',
          label: '默认显示值',
          default: '--',
          placeholder: '无数据时显示的内容',
          description: '当没有数据时显示的默认文本'
        },
        
        textFormat: {
          type: 'select',
          label: '文本格式',
          options: [
            { label: '原始文本', value: 'raw' },
            { label: '大写转换', value: 'uppercase' },
            { label: '小写转换', value: 'lowercase' },
            { label: '首字母大写', value: 'capitalize' },
            { label: '版本号格式', value: 'version' },
            { label: '自定义格式', value: 'custom' }
          ],
          default: 'raw',
          description: '选择文本的显示格式'
        },
        
        customFormat: {
          type: 'string',
          label: '自定义格式',
          placeholder: 'v{value} | {value}版本',
          condition: { field: 'contentConfig.textFormat', value: 'custom' },
          description: '使用 {value} 作为占位符'
        },
        
        maxLength: {
          type: 'number',
          label: '最大长度',
          default: 0,
          min: 0,
          max: 200,
          description: '限制显示的最大字符数，0表示不限制'
        },
        
        truncateMode: {
          type: 'select',
          label: '截断模式',
          options: [
            { label: '省略号', value: 'ellipsis' },
            { label: '换行', value: 'wrap' },
            { label: '滚动', value: 'scroll' }
          ],
          default: 'ellipsis',
          condition: { field: 'contentConfig.maxLength', operator: '>', value: 0 }
        }
      }
    },
    
    // 显示样式配置
    styleConfig: {
      type: 'object',
      label: '样式配置',
      structure: {
        fontSize: {
          type: 'select',
          label: '字体大小',
          options: [
            { label: '极小', value: 'xs' },
            { label: '小', value: 'sm' },
            { label: '中等', value: 'md' },
            { label: '大', value: 'lg' },
            { label: '极大', value: 'xl' },
            { label: '自适应', value: 'auto' }
          ],
          default: 'auto',
          description: '文字显示大小'
        },
        
        fontWeight: {
          type: 'select',
          label: '字体粗细',
          options: [
            { label: '细体', value: 'light' },
            { label: '正常', value: 'normal' },
            { label: '中等', value: 'medium' },
            { label: '粗体', value: 'bold' },
            { label: '超粗', value: 'black' }
          ],
          default: 'bold'
        },
        
        textAlign: {
          type: 'select',
          label: '文本对齐',
          options: [
            { label: '左对齐', value: 'left' },
            { label: '居中', value: 'center' },
            { label: '右对齐', value: 'right' },
            { label: '两端对齐', value: 'justify' }
          ],
          default: 'center'
        },
        
        textColor: {
          type: 'select',
          label: '文字颜色',
          options: [
            { label: '默认', value: 'default' },
            { label: '主要', value: 'primary' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '危险', value: 'danger' },
            { label: '自定义', value: 'custom' }
          ],
          default: 'default'
        },
        
        customTextColor: {
          type: 'color',
          label: '自定义文字颜色',
          default: '#333333',
          condition: { field: 'styleConfig.textColor', value: 'custom' }
        },
        
        backgroundColor: {
          type: 'color',
          label: '背景颜色',
          default: 'transparent',
          description: '文本区域的背景颜色'
        }
      }
    },
    
    // 布局配置
    layoutConfig: {
      type: 'object',
      label: '布局配置',
      structure: {
        showTitle: {
          type: 'boolean',
          label: '显示标题',
          default: true,
          description: '是否显示指标名称'
        },
        
        titlePosition: {
          type: 'select',
          label: '标题位置',
          options: [
            { label: '顶部', value: 'top' },
            { label: '底部', value: 'bottom' },
            { label: '左侧', value: 'left' },
            { label: '右侧', value: 'right' }
          ],
          default: 'bottom',
          condition: { field: 'layoutConfig.showTitle', value: true }
        },
        
        contentLayout: {
          type: 'select',
          label: '内容布局',
          options: [
            { label: '垂直居中', value: 'center' },
            { label: '顶部对齐', value: 'top' },
            { label: '底部对齐', value: 'bottom' },
            { label: '填充容器', value: 'fill' }
          ],
          default: 'center'
        },
        
        padding: {
          type: 'number',
          label: '内边距(px)',
          default: 8,
          min: 0,
          max: 32,
          description: '内容区域的内边距'
        }
      }
    },
    
    // 高级功能
    advancedConfig: {
      type: 'object',
      label: '高级功能',
      structure: {
        enableCopy: {
          type: 'boolean',
          label: '启用复制',
          default: false,
          description: '点击文本时复制到剪贴板'
        },
        
        enableTooltip: {
          type: 'boolean',
          label: '启用提示',
          default: true,
          description: '鼠标悬停时显示完整内容'
        },
        
        updateAnimation: {
          type: 'select',
          label: '更新动画',
          options: [
            { label: '无动画', value: 'none' },
            { label: '淡入淡出', value: 'fade' },
            { label: '滑动', value: 'slide' },
            { label: '缩放', value: 'scale' },
            { label: '弹跳', value: 'bounce' }
          ],
          default: 'fade'
        },
        
        refreshButton: {
          type: 'boolean',
          label: '显示刷新按钮',
          default: false,
          description: '显示手动刷新数据的按钮'
        }
      }
    }
  },
  
  // 默认布局
  defaultLayout: {
    canvas: { width: 160, height: 80 },
    gridstack: { w: 2, h: 2, minW: 1, minH: 1 }
  }
}
```

#### 2. 核心组件实现
```vue
<!-- src/card2.1/components/text-display/TextDisplay.vue -->
<script setup lang="ts">
/**
 * 文本显示组件
 * 支持多种文本格式化和丰富的样式配置
 */
import { computed, ref, watch, nextTick } from 'vue'
import { NButton, NIcon, NTooltip, useMessage } from 'naive-ui'
import { CopyOutline, RefreshOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useCard2Integration } from '@/card2.1/hooks/useCard2Integration'

interface TextDisplayConfig {
  contentConfig?: {
    defaultValue?: string
    textFormat?: 'raw' | 'uppercase' | 'lowercase' | 'capitalize' | 'version' | 'custom'
    customFormat?: string
    maxLength?: number
    truncateMode?: 'ellipsis' | 'wrap' | 'scroll'
  }
  styleConfig?: {
    fontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto'
    fontWeight?: 'light' | 'normal' | 'medium' | 'bold' | 'black'
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    textColor?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'custom'
    customTextColor?: string
    backgroundColor?: string
  }
  layoutConfig?: {
    showTitle?: boolean
    titlePosition?: 'top' | 'bottom' | 'left' | 'right'
    contentLayout?: 'center' | 'top' | 'bottom' | 'fill'
    padding?: number
  }
  advancedConfig?: {
    enableCopy?: boolean
    enableTooltip?: boolean
    updateAnimation?: 'none' | 'fade' | 'slide' | 'scale' | 'bounce'
    refreshButton?: boolean
  }
}

interface Props {
  config: TextDisplayConfig
  data?: {
    textValue?: string
    metricsInfo?: {
      metricsName: string
      deviceId: string
      metricsId: string
      metricsType: string
    }
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { t } = useI18n()
const themeStore = useThemeStore()
const message = useMessage()

// 组件状态
const containerRef = ref()
const isAnimating = ref(false)

// 配置计算属性
const contentConfig = computed(() => ({
  defaultValue: '--',
  textFormat: 'raw' as const,
  customFormat: '',
  maxLength: 0,
  truncateMode: 'ellipsis' as const,
  ...props.config.contentConfig
}))

const styleConfig = computed(() => ({
  fontSize: 'auto' as const,
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  textColor: 'default' as const,
  customTextColor: '#333333',
  backgroundColor: 'transparent',
  ...props.config.styleConfig
}))

const layoutConfig = computed(() => ({
  showTitle: true,
  titlePosition: 'bottom' as const,
  contentLayout: 'center' as const,
  padding: 8,
  ...props.config.layoutConfig
}))

const advancedConfig = computed(() => ({
  enableCopy: false,
  enableTooltip: true,
  updateAnimation: 'fade' as const,
  refreshButton: false,
  ...props.config.advancedConfig
}))

// 原始文本值
const rawTextValue = computed(() => 
  props.data?.textValue || contentConfig.value.defaultValue
)

// 格式化文本
const formatText = (text: string): string => {
  const format = contentConfig.value.textFormat
  
  switch (format) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    case 'capitalize':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    case 'version':
      // 版本号格式：确保以 v 开头
      return text.startsWith('v') ? text : `v${text}`
    case 'custom':
      return contentConfig.value.customFormat?.replace('{value}', text) || text
    default:
      return text
  }
}

// 文本截断处理
const truncateText = (text: string): string => {
  const maxLength = contentConfig.value.maxLength
  
  if (maxLength <= 0 || text.length <= maxLength) {
    return text
  }
  
  switch (contentConfig.value.truncateMode) {
    case 'ellipsis':
      return text.substring(0, maxLength - 3) + '...'
    case 'wrap':
    case 'scroll':
      return text // 由 CSS 处理
    default:
      return text
  }
}

// 最终显示文本
const displayText = computed(() => {
  const formatted = formatText(rawTextValue.value)
  return truncateText(formatted)
})

// 指标标题
const metricsTitle = computed(() => 
  props.data?.metricsInfo?.metricsName || t('textDisplay.defaultTitle')
)

// 字体大小计算
const computedFontSize = computed(() => {
  if (styleConfig.value.fontSize !== 'auto') {
    const sizeMap = {
      xs: '12px',
      sm: '14px', 
      md: '16px',
      lg: '20px',
      xl: '24px'
    }
    return sizeMap[styleConfig.value.fontSize]
  }
  
  // 自适应字体大小（基于容器和文本长度）
  if (!containerRef.value) return '16px'
  
  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight
  const textLength = displayText.value.length
  
  const baseSize = Math.min(containerWidth, containerHeight) / 8
  const lengthFactor = Math.max(0.5, 1 - textLength / 50) // 文本越长，字体越小
  
  return `${Math.max(12, baseSize * lengthFactor)}px`
})

// 文字颜色
const computedTextColor = computed(() => {
  const colorConfig = styleConfig.value.textColor
  
  if (colorConfig === 'custom') {
    return styleConfig.value.customTextColor
  }
  
  const colorMap = {
    default: 'var(--text-color)',
    primary: 'var(--primary-color)',
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    danger: 'var(--error-color)'
  }
  
  return colorMap[colorConfig] || colorMap.default
})

// 样式计算
const containerStyle = computed(() => ({
  padding: `${layoutConfig.value.padding}px`,
  backgroundColor: styleConfig.value.backgroundColor
}))

const textStyle = computed(() => ({
  fontSize: computedFontSize.value,
  fontWeight: styleConfig.value.fontWeight,
  textAlign: styleConfig.value.textAlign,
  color: computedTextColor.value,
  // 截断模式样式
  ...(contentConfig.value.truncateMode === 'wrap' ? {
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap'
  } : {}),
  ...(contentConfig.value.truncateMode === 'scroll' ? {
    overflow: 'auto',
    whiteSpace: 'nowrap'
  } : {})
}))

// 复制功能
const handleCopy = async () => {
  if (!advancedConfig.value.enableCopy) return
  
  try {
    await navigator.clipboard.writeText(rawTextValue.value)
    message.success(t('textDisplay.copySuccess'))
  } catch (error) {
    message.error(t('textDisplay.copyFailed'))
  }
}

// 刷新功能
const handleRefresh = () => {
  // 触发数据刷新
  // 这里可以集成 Card 2.1 的数据刷新机制
}

// 更新动画
const triggerUpdateAnimation = async () => {
  if (advancedConfig.value.updateAnimation === 'none') return
  
  isAnimating.value = true
  await nextTick()
  
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

// 监听文本变化触发动画
watch(displayText, () => {
  triggerUpdateAnimation()
})

// 暴露组件接口
defineExpose({
  getText: () => displayText.value,
  getRawText: () => rawTextValue.value,
  copy: handleCopy,
  refresh: handleRefresh
})
</script>

<template>
  <div 
    ref="containerRef"
    class="text-display"
    :class="[
      `layout-${layoutConfig.contentLayout}`,
      `title-${layoutConfig.titlePosition}`,
      { 'with-animation': isAnimating }
    ]"
    :style="containerStyle"
  >
    <!-- 顶部标题 -->
    <div 
      v-if="layoutConfig.showTitle && layoutConfig.titlePosition === 'top'" 
      class="display-title title-top"
    >
      {{ metricsTitle }}
    </div>
    
    <!-- 主要内容区域 -->
    <div class="text-content" :class="`animation-${advancedConfig.updateAnimation}`">
      <!-- 刷新按钮 -->
      <NButton
        v-if="advancedConfig.refreshButton"
        text
        size="tiny"
        class="refresh-button"
        :loading="loading"
        @click="handleRefresh"
      >
        <template #icon>
          <NIcon><RefreshOutline /></NIcon>
        </template>
      </NButton>
      
      <!-- 文本显示区域 -->
      <div class="text-wrapper">
        <NTooltip
          v-if="advancedConfig.enableTooltip && rawTextValue !== displayText"
          :show-arrow="false"
        >
          <template #trigger>
            <div
              class="display-text"
              :style="textStyle"
              :class="{ 
                'clickable': advancedConfig.enableCopy,
                'truncated': contentConfig.maxLength > 0
              }"
              @click="handleCopy"
            >
              {{ displayText }}
            </div>
          </template>
          {{ rawTextValue }}
        </NTooltip>
        
        <div
          v-else
          class="display-text"
          :style="textStyle"
          :class="{ 
            'clickable': advancedConfig.enableCopy,
            'truncated': contentConfig.maxLength > 0
          }"
          @click="handleCopy"
        >
          {{ displayText }}
        </div>
        
        <!-- 复制图标 -->
        <NIcon
          v-if="advancedConfig.enableCopy"
          class="copy-icon"
          size="14"
          @click="handleCopy"
        >
          <CopyOutline />
        </NIcon>
      </div>
    </div>
    
    <!-- 底部标题 -->
    <div 
      v-if="layoutConfig.showTitle && layoutConfig.titlePosition === 'bottom'" 
      class="display-title title-bottom"
    >
      {{ metricsTitle }}
    </div>
  </div>
</template>

<style scoped>
.text-display {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
}

/* 布局方式 */
.layout-center {
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.layout-top {
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.layout-bottom {
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.layout-fill {
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
}

.layout-fill .text-content {
  flex: 1;
}

/* 标题样式 */
.display-title {
  font-size: 12px;
  color: var(--text-color-2);
  margin: 4px 0;
}

.title-top {
  order: 1;
}

.title-bottom {
  order: 3;
}

/* 文本内容区域 */
.text-content {
  position: relative;
  order: 2;
  flex: 0 0 auto;
}

.layout-fill .text-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-wrapper {
  position: relative;
  display: inline-block;
}

.display-text {
  position: relative;
  line-height: 1.2;
  word-break: break-word;
  transition: all 0.3s ease;
}

.display-text.clickable {
  cursor: pointer;
}

.display-text.clickable:hover {
  opacity: 0.8;
}

.display-text.truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 复制图标 */
.copy-icon {
  position: absolute;
  top: -4px;
  right: -20px;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.3s ease;
  color: var(--text-color-3);
}

.text-wrapper:hover .copy-icon {
  opacity: 1;
}

.copy-icon:hover {
  color: var(--primary-color);
}

/* 刷新按钮 */
.refresh-button {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

/* 更新动画 */
.animation-fade.with-animation {
  animation: fadeUpdate 0.3s ease;
}

.animation-slide.with-animation {
  animation: slideUpdate 0.3s ease;
}

.animation-scale.with-animation {
  animation: scaleUpdate 0.3s ease;
}

.animation-bounce.with-animation {
  animation: bounceUpdate 0.5s ease;
}

@keyframes fadeUpdate {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

@keyframes slideUpdate {
  0% { transform: translateX(-10px); opacity: 0.3; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes scaleUpdate {
  0% { transform: scale(0.95); opacity: 0.3; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounceUpdate {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  60% { transform: translateY(-2px); }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .text-display {
    padding: 4px;
  }
  
  .display-title {
    font-size: 10px;
  }
  
  .copy-icon,
  .refresh-button {
    display: none;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .text-display {
  background-color: var(--card-color-dark);
  color: var(--text-color-dark);
}
</style>
```

## 💻 具体实现步骤

### Phase 1: 基础重构（第1周）

1. **创建组件结构**
```bash
src/card2.1/components/text-display/
├── index.ts                 # 组件定义
├── TextDisplay.vue          # 核心组件
├── ConfigPanel.vue          # 配置面板
├── types.ts                 # 类型定义
└── utils/
    └── text-formatter.ts    # 文本格式化工具
```

2. **实现基础功能**
- 多种数据源支持
- 文本格式化功能
- 响应式字体调整

### Phase 2: 功能增强（第2周）

1. **完善配置系统**
- 丰富的样式配置选项
- 布局和对齐配置
- 高级功能选项

2. **用户体验优化**
- 复制到剪贴板功能
- 更新动画效果
- 工具提示支持

### Phase 3: 测试和完善（第3周）

1. **功能测试**
- 各种文本格式测试
- 响应式布局测试
- 配置选项验证

2. **性能和无障碍优化**
- 长文本性能测试
- 无障碍访问支持

## ✅ 测试验证方案

### 功能测试
- [ ] 文本格式化正确工作
- [ ] 截断和换行功能
- [ ] 复制功能正常
- [ ] 刷新按钮响应
- [ ] 动画效果流畅

### 样式测试
- [ ] 各种字体大小适配
- [ ] 颜色和主题切换
- [ ] 布局方式正确显示
- [ ] 响应式设计

### 数据测试
- [ ] 多种数据源支持
- [ ] 实时更新响应
- [ ] 默认值显示
- [ ] 边界情况处理

## 📈 迁移收益

### 功能增强
- **配置选项**: 无配置 → 完整的配置系统
- **文本处理**: 原始显示 → 多种格式化选项
- **交互功能**: 无交互 → 复制、刷新等实用功能

### 视觉改进
- **样式灵活性**: 固定样式 → 丰富的样式配置
- **动画效果**: 无动画 → 多种更新动画
- **主题适配**: 固定主题 → 完整主题系统支持

### 用户体验
- **易用性**: 基础显示 → 智能截断、工具提示等
- **可访问性**: 基础功能 → 复制、刷新等便民功能
- **响应式**: 简单缩放 → 智能自适应布局

---

**总结**: 文本显示组件通过 Card 2.1 重构，将从最简单的文本显示升级为功能完整的文本展示解决方案，显著提升用户体验和使用便利性。