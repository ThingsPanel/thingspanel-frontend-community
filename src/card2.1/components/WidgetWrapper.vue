<!--
  WidgetWrapper.vue
  组件包装器 - 演示如何使用 useWidgetProps Hook
  按照重构方案第5步的要求实现
-->

<template>
  <div class="widget-wrapper">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="widget-loading">
      <n-spin size="medium" />
      <span class="loading-text">{{ $t('common.loading') }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="widget-error">
      <n-alert type="error" :title="$t('common.error')">
        {{ error.message }}
        <template #action>
          <n-button size="small" type="primary" :loading="isLoading" @click="refresh">
            {{ $t('common.retry') }}
          </n-button>
        </template>
      </n-alert>
    </div>

    <!-- 正常渲染状态 -->
    <component :is="widgetComponent" v-else v-bind="widgetProps" class="widget-content" />
  </div>
</template>

<script setup lang="ts">
/**
 * 组件包装器实现
 * 使用 useWidgetProps Hook 连接配置和组件渲染
 */

import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWidgetProps } from '../hooks/useWidgetProps'
import type { ComponentDefinition, WidgetConfiguration } from '../core/types'

// 组件属性定义
interface Props {
  /** 组件定义 */
  definition: ComponentDefinition
  /** 组件配置 */
  configuration: WidgetConfiguration
}

const props = defineProps<Props>()
const { t } = useI18n()

// 计算组件实例
const widgetComponent = computed(() => props.definition.component)

// 使用Hook获取所有响应式状态
const {
  props: widgetProps,
  isLoading,
  error,
  refresh
} = useWidgetProps(toRef(props, 'definition'), toRef(props, 'configuration'))

// widgetProps 可以直接在模板中使用
</script>

<style scoped>
.widget-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.widget-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--text-color-3);
}

.loading-text {
  font-size: 14px;
}

.widget-error {
  padding: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-content {
  width: 100%;
  height: 100%;
}

/* 响应主题变化 */
[data-theme='dark'] .widget-loading {
  color: var(--text-color-dark-3);
}
</style>
