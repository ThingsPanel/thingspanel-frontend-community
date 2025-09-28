<template>
  <div
    ref="containerRef"
    class="digit-indicator-container"
    :class="{
      'gradient-bg': config.showGradient,
      'hover-enabled': config.enableHover
    }"
    :style="containerStyle"
  >
    <!-- 图标区域 -->
    <div class="icon-section" :style="iconSectionStyle">
      <n-icon
        class="main-icon"
        :size="config.iconSize"
        :color="config.iconColor"
      >
        <component :is="iconComponent" />
      </n-icon>
    </div>

    <!-- 数值区域 -->
    <div class="value-section" :style="valueSectionStyle">
      <span class="value-text" :style="valueTextStyle">
        {{ displayValue }}
      </span>
      <span class="unit-text" :style="unitTextStyle">
        {{ displayUnit }}
      </span>
    </div>

    <!-- 标题区域 -->
    <div
      v-if="displayTitle"
      class="title-section"
      :style="titleSectionStyle"
    >
      <span class="title-text" :style="titleTextStyle">
        {{ displayTitle }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数字指示器组件 - 职责清晰版本
 * 数据源负责业务数据，组件配置负责样式
 */

import { computed, ref } from 'vue'
import { NIcon } from 'naive-ui'
import { icons as iconOptions } from '@/components/common/icons'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'
import type { DigitIndicatorCustomize } from './settingConfig'

// Props 接口
interface Props {
  config: any                    // 配置数据
  data?: Record<string, unknown> // 数据源执行结果
  componentId?: string           // 组件唯一ID
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

// 使用统一配置管理
const { unifiedConfig } = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId
})

// 响应式变量
const containerRef = ref<HTMLElement>()

// 开发环境标识
const isDev = computed(() => import.meta.env.DEV)

// 获取样式配置（纯样式，不包含业务数据）
const config = computed((): DigitIndicatorCustomize => {
  return {
    // 图标样式配置
    iconName: 'Water',
    iconColor: '#1890ff',
    iconSize: 48,
    // 数值样式配置
    valueColor: 'var(--text-color)',
    valueSize: 32,
    valueFontWeight: 700,
    // 单位样式配置
    unitColor: 'var(--text-color-2)',
    unitSize: 16,
    // 标题样式配置
    titleColor: 'var(--text-color-2)',
    titleSize: 14,
    // 布局样式配置
    padding: 16,
    backgroundColor: '',
    showGradient: true,
    enableHover: true,
    // 合并用户样式配置
    ...unifiedConfig.value.component
  }
})

// 业务数据获取 - 正确的默认值逻辑：数据源优先，无数据时显示默认值
const displayValue = computed(() => {
  // 添加调试信息
  return props.data?.main?.data?.value || '45'  // 数据源优先，无数据时显示默认值
})

const displayUnit = computed(() => {
  return props.data?.main?.data?.unit || '%'    // 数据源优先，无数据时显示默认值
})

const displayTitle = computed(() => {
  return props.data?.main?.data?.metricsName || '湿度'  // 数据源优先，无数据时显示默认值
})

// 计算图标组件
const iconComponent = computed(() => {
  const iconName = config.value.iconName || 'Water'
  return iconOptions[iconName] || iconOptions.Water
})

// 样式计算
const containerStyle = computed(() => {
  return {
    padding: `${config.value.padding}px`,
    backgroundColor: config.value.backgroundColor || 'transparent'
  }
})

const iconSectionStyle = computed(() => {
  return {
    marginBottom: `${config.value.padding / 2}px`
  }
})

const valueSectionStyle = computed(() => {
  return {
    marginBottom: `${config.value.padding / 3}px`
  }
})

const valueTextStyle = computed(() => {
  return {
    fontSize: `${config.value.valueSize}px`,
    fontWeight: config.value.valueFontWeight,
    color: config.value.valueColor
  }
})

const unitTextStyle = computed(() => {
  return {
    fontSize: `${config.value.unitSize}px`,
    color: config.value.unitColor,
    marginLeft: '4px'
  }
})

const titleSectionStyle = computed(() => {
  return {
    marginTop: `${config.value.padding / 2}px`
  }
})

const titleTextStyle = computed(() => {
  return {
    fontSize: `${config.value.titleSize}px`,
    color: config.value.titleColor
  }
})
</script>

<style scoped>
/* 调试面板样式 */
.debug-panel {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  background: rgba(255, 0, 0, 0.9);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  z-index: 1000;
  max-height: 150px;
  overflow-y: auto;
}

.debug-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #ffff00;
}

.debug-item {
  margin-bottom: 2px;
  word-break: break-all;
  line-height: 1.3;
}

.digit-indicator-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 专业渐变背景效果 */
.digit-indicator-container.gradient-bg {
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(248, 250, 252, 0.8) 100%
  );
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 专业Hover效果 */
.digit-indicator-container.hover-enabled:hover {
  transform: translateY(-3px);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 4px 15px rgba(0, 0, 0, 0.04);
}

.digit-indicator-container.hover-enabled.gradient-bg:hover {
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(248, 250, 252, 0.85) 100%
  );
  border-color: rgba(255, 255, 255, 0.3);
}

/* 图标区域 */
.icon-section {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.main-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.hover-enabled:hover .main-icon {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

/* 数值区域 */
.value-section {
  display: flex;
  justify-content: center;
  align-items: baseline;
  text-align: center;
  position: relative;
}

.value-text {
  line-height: 1;
  transition: all 0.3s ease;
  font-feature-settings: 'tnum' 1;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.unit-text {
  line-height: 1;
  transition: all 0.3s ease;
  opacity: 0.8;
}

/* 标题区域 */
.title-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.title-text {
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s ease;
  opacity: 0.75;
  letter-spacing: 0.01em;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .digit-indicator-container {
    padding: 8px !important;
    border-radius: 8px;
  }

  .value-text {
    font-size: 24px !important;
  }

  .unit-text {
    font-size: 12px !important;
  }

  .title-text {
    font-size: 11px !important;
  }

  .main-icon {
    transform: scale(0.85);
  }
}

/* 平板适配 */
@media (max-width: 768px) and (min-width: 481px) {
  .digit-indicator-container {
    border-radius: 10px;
  }

  .value-text {
    font-size: calc(var(--value-size, 32px) * 0.9);
  }
}

/* 暗主题适配 */
[data-theme="dark"] .digit-indicator-container {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .digit-indicator-container.gradient-bg {
  background: linear-gradient(145deg,
    rgba(30, 35, 42, 0.9) 0%,
    rgba(45, 52, 62, 0.7) 50%,
    rgba(25, 30, 36, 0.8) 100%
  );
  border-color: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .digit-indicator-container.hover-enabled.gradient-bg:hover {
  background: linear-gradient(145deg,
    rgba(35, 40, 47, 0.95) 0%,
    rgba(50, 57, 67, 0.75) 50%,
    rgba(30, 35, 41, 0.85) 100%
  );
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 4px 15px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .main-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

[data-theme="dark"] .hover-enabled:hover .main-icon {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
}

[data-theme="dark"] .value-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 数值变化动画 */
@keyframes valueChange {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.value-text.changing {
  animation: valueChange 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 加载状态 */
.digit-indicator-container.loading {
  opacity: 0.6;
}

.digit-indicator-container.loading .value-text {
  color: var(--text-color-3);
}

/* 高级玻璃态效果（可选） */
.digit-indicator-container.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .digit-indicator-container.glass-effect {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
