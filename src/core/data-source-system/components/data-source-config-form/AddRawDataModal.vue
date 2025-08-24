<template>
  <n-modal
    :show="isModalVisible"
    preset="card"
    :title="modalTitle"
    style="width: 600px"
    :bordered="false"
    @update:show="val => !val && closeModal()"
  >
    <n-form ref="formRef" :model="currentRawData" label-placement="left" label-width="auto">
      <n-form-item label="名称" path="name">
        <n-input v-model:value="currentRawData.name" placeholder="输入名称" />
      </n-form-item>
      <n-form-item label="类型" path="type">
        <n-select v-model:value="currentRawData.type" :options="rawDataTypes" placeholder="选择类型" />
      </n-form-item>

      <!-- 根据类型动态渲染配置表单 -->
      <div v-if="currentRawData.type === 'json'">
        <n-form-item label="JSON 数据" path="config.data">
          <n-input
            v-model:value="currentRawData.config.data"
            type="textarea"
            :rows="10"
            placeholder="请输入 JSON 格式数据"
          />
        </n-form-item>
      </div>
      <HttpConfigForm v-if="currentRawData.type === 'http'" v-model:value="currentRawData.config" />
      <WebSocketConfigForm v-if="currentRawData.type === 'websocket'" v-model:value="currentRawData.config" />
    </n-form>
    <template #footer>
      <n-button @click="closeModal">取消</n-button>
      <n-button type="primary" @click="handleConfirm">确定</n-button>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NButton } from 'naive-ui'
import HttpConfigForm from '../HttpConfigForm.vue'
import WebSocketConfigForm from '../WebSocketConfigForm.vue'

const props = defineProps({
  isModalVisible: Boolean,
  modalTitle: String,
  currentRawData: Object
})

const emit = defineEmits(['confirm', 'close'])

const formRef = ref(null)

const rawDataTypes = [
  { label: 'JSON', value: 'json' },
  { label: 'HTTP', value: 'http' },
  { label: 'WebSocket', value: 'websocket' }
]

const handleConfirm = () => {
  formRef.value?.validate(errors => {
    if (!errors) {
      emit('confirm', props.currentRawData)
    }
  })
}

const closeModal = () => {
  emit('close')
}
</script>
