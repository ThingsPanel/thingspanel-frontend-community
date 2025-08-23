<template>
  <n-modal 
    v-model:show="visible" 
    preset="dialog" 
    title="原始数据详情" 
    style="width: 600px"
  >
    <n-space vertical :size="12">
      <n-text>数据项 "{{ rawDataName }}" 的详细内容：</n-text>
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
 * 原始数据详情查看弹窗组件
 * 用于显示原始数据项的详细内容（经过处理后的数据）
 */

import { computed } from 'vue'
import { NModal, NSpace, NText, NCode, NButton } from 'naive-ui'

// 组件属性
interface Props {
  /** 弹窗显示状态 */
  modelValue: boolean
  /** 原始数据项名称 */
  rawDataName: string
  /** 原始数据项内容（已处理） */
  rawDataContent: any
}

// 组件事件
interface Emits {
  /** 更新弹窗显示状态 */
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  rawDataName: '',
  rawDataContent: null
})

const emit = defineEmits<Emits>()

// 弹窗显示状态
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 格式化数据显示
const formattedData = computed(() => {
  if (props.rawDataContent !== null && props.rawDataContent !== undefined) {
    try {
      return JSON.stringify(props.rawDataContent, null, 2)
    } catch {
      return String(props.rawDataContent)
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