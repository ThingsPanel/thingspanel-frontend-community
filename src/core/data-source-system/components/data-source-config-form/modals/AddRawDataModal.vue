<!--
  添加数据项弹窗 - 只保留简单UI
-->
<template>
  <n-modal v-model:show="visible" title="添加数据项" preset="card" :closable="true" style="width: 600px">
    <!-- 简单表单UI -->
    <n-space vertical :size="16">
      <n-form-item label="数据项名称">
        <n-input placeholder="请输入数据项名称" />
      </n-form-item>

      <n-form-item label="数据类型">
        <n-select
          :options="[
            { label: '字符串', value: 'string' },
            { label: '数字', value: 'number' },
            { label: 'JSON', value: 'json' }
          ]"
          placeholder="请选择数据类型"
        />
      </n-form-item>

      <n-form-item label="数据值">
        <n-input type="textarea" :rows="4" placeholder="请输入数据值" />
      </n-form-item>

      <n-form-item label="描述">
        <n-input type="textarea" :rows="2" placeholder="请输入描述（可选）" />
      </n-form-item>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 添加数据项弹窗 - 只保留简单UI，无复杂逻辑
 */
import { computed } from 'vue'

interface Props {
  visible: boolean
}

interface Emits {
  'update:visible': [value: boolean]
  submit: [data: any]
  cancel: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

const handleSubmit = () => {
  // 简单的模拟数据，不做任何验证或复杂逻辑
  const mockData = {
    name: '示例数据项',
    type: 'string',
    value: '示例值',
    description: '示例描述'
  }
  emit('submit', mockData)
  visible.value = false
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>
