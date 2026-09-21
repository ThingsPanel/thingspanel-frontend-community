<script setup lang="ts">
import { defineExpose, ref } from 'vue'
import moment from 'moment'
import { $t } from '@/locales'

const modalVisible = ref(false)
const detailInfo = ref({
  id: '',
  email: '',
  username: '',
  ip: '',
  request_message: '',
  response_message: '',
  latency: '',
  name: '',
  path: '',
  created_at: ''
})

const show = info => {
  modalVisible.value = true
  detailInfo.value = info
}
const closeModal = () => {
  modalVisible.value = false
}
defineExpose({
  show
})
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="$t('custom.management.logDetail')"
    :style="{ width: 'min(760px, calc(100vw - 24px))' }"
    class="system-log-detail-modal"
  >
    <NForm v-model="detailInfo" label-placement="left" label-align="left" label-width="80px">
      <NFormItem :label="$t('custom.management.account')">
        <div class="result">{{ detailInfo.email }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.account')">
        <div class="result">{{ detailInfo.username }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestTime')">
        <div class="result">{{ detailInfo.latency }}ms</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.time')">
        <div class="result">
          {{ moment(detailInfo.created_at).format('YYYY-MM-DD hh:mm:ss') }}
        </div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestPath')">
        <div class="result">{{ detailInfo.path }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestMethod')">
        <div class="result">{{ detailInfo.name }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.ipAddress')">
        <div class="result">{{ detailInfo.ip }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestContent')">
        <NInput v-model:value="detailInfo.request_message" type="textarea" readonly disabled></NInput>
      </NFormItem>
      <NFormItem :label="$t('custom.management.responseContent')">
        <NInput v-model:value="detailInfo.response_message" type="textarea" readonly disabled></NInput>
      </NFormItem>
    </NForm>
    <div class="text-right">
      <NButton @click="closeModal">{{ $t('custom.management.close') }}</NButton>
    </div>
  </NModal>
</template>

<style scoped>
.system-log-detail-modal :deep(.n-card__content) {
  max-height: calc(100dvh - 160px);
  overflow-y: auto;
}

.n-form-item .n-form-item-label {
  font-size: 14px;
  color: #101010;
}
.value {
  font-size: 14px;
  color: #101010;
}

.result {
  min-width: 0;
  overflow-wrap: anywhere;
}

.system-log-detail-modal :deep(.n-input__textarea-el) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 480px) {
  .system-log-detail-modal :deep(.n-card__content) {
    padding: 16px;
  }

  .system-log-detail-modal :deep(.n-form-item) {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .system-log-detail-modal :deep(.n-form-item-label) {
    width: auto !important;
    padding: 0;
  }

  .system-log-detail-modal :deep(.n-form-item-blank),
  .system-log-detail-modal :deep(.n-form-item-feedback-wrapper) {
    width: 100%;
  }
}
</style>
