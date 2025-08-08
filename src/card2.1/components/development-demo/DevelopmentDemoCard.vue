<template>
  <!-- 开发演示卡片组件 - 用于帮助开发者快速开发新组件 -->
  <div class="development-demo-card" :style="cardStyle">
    <!-- 卡片头部区域 -->
    <div class="card-header">
      <h3>{{ title }}</h3>
      <!-- 开发状态标识 -->
      <div v-if="showDevBadge" class="dev-badge">
        <span class="badge-text">开发中</span>
      </div>
    </div>

    <!-- 卡片内容区域 -->
    <div class="card-content">
      <!-- 数值显示区域 -->
      <div class="value-section">
        <div class="value-display">
          <span class="value">{{ value }}</span>
          <span v-if="unit" class="unit">{{ unit }}</span>
        </div>
        <!-- 数值变化趋势指示器 -->
        <div v-if="showTrend" class="trend-indicator">
          <span class="trend-arrow" :class="trendDirection">
            {{ trendArrow }}
          </span>
          <span class="trend-text">{{ trendText }}</span>
        </div>
      </div>

      <!-- 描述信息区域 -->
      <div v-if="description" class="description-section">
        <p class="description-text">{{ description }}</p>
      </div>

      <!-- 开发信息区域 - 仅在开发模式下显示 -->
      <div v-if="showDevInfo" class="dev-info">
        <div class="dev-item">
          <span class="dev-label">组件类型:</span>
          <span class="dev-value">{{ componentType }}</span>
        </div>
        <div class="dev-item">
          <span class="dev-label">创建时间:</span>
          <span class="dev-value">{{ createTime }}</span>
        </div>
        <div class="dev-item">
          <span class="dev-label">开发状态:</span>
          <span class="dev-value dev-status">{{ devStatus }}</span>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div v-if="showActions" class="action-section">
        <button class="action-btn primary" @click="handlePrimaryAction">
          {{ primaryActionText }}
        </button>
        <button class="action-btn secondary" @click="handleSecondaryAction">
          {{ secondaryActionText }}
        </button>
      </div>
    </div>

    <!-- 卡片底部区域 -->
    <div v-if="showFooter" class="card-footer">
      <span class="footer-text">{{ footerText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// 组件属性接口定义
interface Props {
  // 基础显示属性
  title?: string // 卡片标题
  value?: string | number // 显示的数值
  unit?: string // 数值单位
  description?: string // 描述文字

  // 样式属性
  backgroundColor?: string // 背景颜色
  textColor?: string // 文字颜色
  fontSize?: string // 字体大小

  // 功能开关属性
  showDevBadge?: boolean // 是否显示开发标识
  showTrend?: boolean // 是否显示趋势指示器
  showDevInfo?: boolean // 是否显示开发信息
  showActions?: boolean // 是否显示操作按钮
  showFooter?: boolean // 是否显示底部信息

  // 趋势相关属性
  trendDirection?: 'up' | 'down' | 'stable' // 趋势方向
  trendText?: string // 趋势描述文字

  // 开发信息属性
  componentType?: string // 组件类型
  createTime?: string // 创建时间
  devStatus?: string // 开发状态

  // 操作按钮属性
  primaryActionText?: string // 主要操作按钮文字
  secondaryActionText?: string // 次要操作按钮文字

  // 底部信息属性
  footerText?: string // 底部文字
}

// 组件属性默认值设置
const props = withDefaults(defineProps<Props>(), {
  // 基础显示属性默认值
  title: '开发演示卡片',
  value: '0',
  unit: '',
  description: '这是一个用于开发演示的组件，帮助开发者快速开发新组件',

  // 样式属性默认值
  backgroundColor: '#f8f9fa',
  textColor: '#333333',
  fontSize: '16px',

  // 功能开关属性默认值
  showDevBadge: true,
  showTrend: true,
  showDevInfo: true,
  showActions: true,
  showFooter: true,

  // 趋势相关属性默认值
  trendDirection: 'stable',
  trendText: '数据稳定',

  // 开发信息属性默认值
  componentType: 'DevelopmentDemo',
  createTime: new Date().toLocaleDateString('zh-CN'),
  devStatus: '开发中',

  // 操作按钮属性默认值
  primaryActionText: '主要操作',
  secondaryActionText: '次要操作',

  // 底部信息属性默认值
  footerText: '开发演示组件 - 仅供开发参考'
})

// 组件事件定义
const emit = defineEmits<{
  'primary-action': [value: any] // 主要操作事件
  'secondary-action': [value: any] // 次要操作事件
  'value-change': [value: any] // 数值变化事件
}>()

// 计算属性：卡片样式
const cardStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
  color: props.textColor,
  fontSize: props.fontSize
}))

// 计算属性：趋势箭头符号
const trendArrow = computed(() => {
  switch (props.trendDirection) {
    case 'up':
      return '↗'
    case 'down':
      return '↘'
    case 'stable':
    default:
      return '→'
  }
})

// 响应式数据：内部状态
const internalValue = ref(props.value)

// 方法：处理主要操作
const handlePrimaryAction = () => {
  console.log('🚀 [DevelopmentDemo] 执行主要操作')
  emit('primary-action', {
    type: 'primary',
    value: internalValue.value,
    timestamp: new Date().toISOString()
  })
}

// 方法：处理次要操作
const handleSecondaryAction = () => {
  console.log('⚙️ [DevelopmentDemo] 执行次要操作')
  emit('secondary-action', {
    type: 'secondary',
    value: internalValue.value,
    timestamp: new Date().toISOString()
  })
}

// 方法：更新数值（供外部调用）
const updateValue = (newValue: string | number) => {
  internalValue.value = newValue
  emit('value-change', {
    oldValue: props.value,
    newValue: newValue,
    timestamp: new Date().toISOString()
  })
}

// 暴露方法供父组件调用
defineExpose({
  updateValue
})
</script>

<style scoped>
/* 开发演示卡片基础样式 */
.development-demo-card {
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(135deg, var(--bg-color, #f8f9fa) 0%, #ffffff 100%);
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.card-header h3 {
  margin: 0;
  font-size: 1.3em;
  font-weight: 600;
  color: inherit;
}

/* 开发标识样式 */
.dev-badge {
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
}

.badge-text {
  font-size: 0.8em;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 卡片内容样式 */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 数值区域样式 */
.value-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.value {
  font-size: 2.5em;
  font-weight: bold;
  color: inherit;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.unit {
  font-size: 1.2em;
  opacity: 0.7;
  font-weight: 500;
}

/* 趋势指示器样式 */
.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

.trend-arrow {
  font-size: 1.2em;
  font-weight: bold;
}

.trend-arrow.up {
  color: #52c41a;
  animation: pulse 2s infinite;
}

.trend-arrow.down {
  color: #ff4d4f;
  animation: pulse 2s infinite;
}

.trend-arrow.stable {
  color: #1890ff;
}

.trend-text {
  font-size: 0.9em;
  font-weight: 500;
}

/* 描述区域样式 */
.description-section {
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.description-text {
  margin: 0;
  font-size: 0.95em;
  line-height: 1.5;
  color: inherit;
  opacity: 0.9;
}

/* 开发信息区域样式 */
.dev-info {
  padding: 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  border: 1px dashed #d9d9d9;
}

.dev-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.dev-item:last-child {
  margin-bottom: 0;
}

.dev-label {
  font-size: 0.85em;
  font-weight: 600;
  color: #666;
}

.dev-value {
  font-size: 0.85em;
  font-weight: 500;
  color: #333;
}

.dev-status {
  color: #ff6b6b;
  font-weight: 600;
}

/* 操作按钮区域样式 */
.action-section {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn.primary {
  background: linear-gradient(45deg, #1890ff, #40a9ff);
  color: white;
}

.action-btn.primary:hover {
  background: linear-gradient(45deg, #096dd9, #1890ff);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
}

.action-btn.secondary {
  background: linear-gradient(45deg, #f5f5f5, #e8e8e8);
  color: #666;
  border: 1px solid #d9d9d9;
}

.action-btn.secondary:hover {
  background: linear-gradient(45deg, #e8e8e8, #d9d9d9);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 卡片底部样式 */
.card-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.footer-text {
  font-size: 0.8em;
  color: #999;
  font-style: italic;
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .development-demo-card {
    padding: 16px;
    min-height: 180px;
  }

  .value {
    font-size: 2em;
  }

  .action-section {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
