<template>
  <n-modal v-model:show="visible" preset="dialog" title="当前数据源最终数据" style="width: 600px">
    <n-space vertical :size="12">
      <n-text>数据源 "{{ dataSourceKey }}" 的当前最终数据：</n-text>
      <n-code
        :code="formattedData"
        language="json"
        :show-line-numbers="true"
        style="max-height: 400px; overflow-y: auto"
      />
    </n-space>
    <template #action>
      <n-button @click="handleClose">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 最终数据查看弹窗组件
 * 用于显示数据源处理后的最终数据
 */

import { computed } from 'vue'
import { NModal, NSpace, NText, NCode, NButton } from 'naive-ui'

// 组件属性
interface Props {
  /** 弹窗显示状态 */
  modelValue: boolean
  /** 数据源标识 */
  dataSourceKey: string
  /** 最终数据 */
  finalData: any
}

// 组件事件
interface Emits {
  /** 更新弹窗显示状态 */
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  dataSourceKey: '',
  finalData: null
})

const emit = defineEmits<Emits>()

// 弹窗显示状态
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 格式化数据显示
const formattedData = computed(() => {
  if (props.finalData) {
    try {
      return JSON.stringify(props.finalData, null, 2)
    } catch {
      return String(props.finalData)
    }
  } else {
    return '暂无数据'
  }
})

// 关闭弹窗
const handleClose = () => {
  visible.value = false
}
</script>
