<template>
  <div class="dual-data-test">
    <n-card title="双数据源测试组件" size="small">
      <n-space vertical size="small">
        <!-- 对象数据展示 -->
        <div>
          <n-text strong>对象数据源 (objectData):</n-text>
          <n-code
            :code="objectDataDisplay"
            language="json"
            :show-line-numbers="false"
            style="font-size: 11px; margin-top: 4px"
          />
        </div>

        <!-- 数组数据展示 -->
        <div>
          <n-text strong>数组数据源 (arrayData):</n-text>
          <n-code
            :code="arrayDataDisplay"
            language="json"
            :show-line-numbers="false"
            style="font-size: 11px; margin-top: 4px"
          />
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 双数据源测试组件
 * 用于测试Card2.1数据绑定系统的双数据源功能
 * 纯数据展示，不包含复杂UI和逻辑
 */

import { computed, watch } from 'vue'
import { NCard, NSpace, NText, NCode } from 'naive-ui'

interface Props {
  rawDataSources?: any // 🔥 架构修复：接收原始数据源配置
}

const props = withDefaults(defineProps<Props>(), {
  rawDataSources: null
})

// 🔥 组件自己解析需要的数据
const objectData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.objectData
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

const arrayData = computed(() => {
  const binding = props.rawDataSources?.dataSourceBindings?.arrayData
  if (!binding?.rawData) return null
  try {
    return JSON.parse(binding.rawData)
  } catch {
    return null
  }
})

// 调试：监听原始数据源变化
watch(() => props.rawDataSources, (newDataSources) => {
  console.log('🔧 [DEBUG-Component] DualDataTest 接收到原始数据源:', newDataSources)
  console.log('🔧 [DEBUG-Component] 解析后的数据:', {
    objectData: objectData.value,
    arrayData: arrayData.value,
    hasObjectData: !!objectData.value,
    hasArrayData: !!arrayData.value
  })
}, { deep: true, immediate: true })

// 额外调试：监听所有props变化
watch(() => props, (newProps) => {
  console.log('🔧 [DEBUG-Component] DualDataTest 所有props变化:', newProps)
}, { deep: true, immediate: true })

// 格式化对象数据显示
const objectDataDisplay = computed(() => {
  if (!objectData.value) return '暂无对象数据'
  try {
    return JSON.stringify(objectData.value, null, 2)
  } catch {
    return String(objectData.value)
  }
})

// 格式化数组数据显示
const arrayDataDisplay = computed(() => {
  if (!arrayData.value) return '暂无数组数据'
  try {
    return JSON.stringify(arrayData.value, null, 2)
  } catch {
    return String(arrayData.value)
  }
})
</script>

<style scoped>
.dual-data-test {
  width: 100%;
  height: 100%;
}
</style>
