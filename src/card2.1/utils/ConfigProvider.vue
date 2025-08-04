<!--
  简洁的配置提供者
  只做最核心的事情：提供配置上下文
-->

<script setup lang="ts">
import { provide, reactive, watch } from 'vue'
import type { CardConfig, ConfigContext } from '../core/types'

interface Props {
  config: CardConfig
}

interface Emits {
  'update:config': [config: CardConfig]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 创建响应式配置
const reactiveConfig = reactive<CardConfig>({ ...props.config })

// 监听外部配置变化
watch(
  () => props.config,
  (newConfig) => {
    Object.assign(reactiveConfig, newConfig)
  },
  { deep: true }
)

// 监听内部配置变化
watch(
  reactiveConfig,
  (newConfig) => {
    emit('update:config', { ...newConfig })
  },
  { deep: true }
)

// 提供配置上下文
const configContext: ConfigContext = {
  config: reactiveConfig,
  updateConfig: (updates) => {
    Object.assign(reactiveConfig, updates)
  }
}

provide('config-ctx', configContext)
</script>

<template>
  <slot />
</template>