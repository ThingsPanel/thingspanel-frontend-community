<script setup lang="ts">
import { ref } from 'vue'
import { $t } from '@/locales'
import { putRegisterService } from '@/service/api/plugin'
const serviceType = ref<any>('接入协议')
const emit = defineEmits(['getList'])
const serviceModal = ref<any>(false)
const formRef = ref<any>(null)
const details = ref<any>({})

const loading = ref<any>(false)
const defaultForm = {
  http_address: '',
  device_type: 1,
  sub_topic_prefix: '',
  access_address: ''
}
const form = ref<any>({ ...defaultForm })

const rules = ref<any>({
  http_address: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('card.httpAddress')
  },
  device_type: {
    required: true,
    message: $t('card.chooseDeviceType')
  },
  sub_topic_prefix: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('card.subscribeSubjectPrefix')
  }
})
const options = ref<any>([
  {
    label: $t('card.directConnectDevice'),
    value: 1
  },
  {
    label: $t('card.gatewayDevice'),
    value: 2
  },
  {
    label: $t('card.gatewaySubDevice'),
    value: 3
  }
])

const openModal: (row: any) => void = row => {
  if (row) {
    serviceType.value = row.service_type === 1 ? $t('card.accessProtocol') : $t('card.accessService')
    Object.assign(details.value, row)
    if (details.value.service_config === '') return
    Object.assign(form.value, JSON.parse(row.service_config))
  }
  serviceModal.value = true
}
const close: () => void = () => {
  serviceModal.value = false
  Object.assign(details.value, {})
  Object.assign(form.value, defaultForm)
}

const submitSevice: () => void = () => {
  formRef.value?.validate(async errors => {
    if (errors) return
    loading.value = true
    const params = details.value
    params.service_config = JSON.stringify(form.value)
    const data: any = await putRegisterService(params)
    if (data.data) {
      emit('getList')
      close()
    }
    loading.value = false
  })
}

defineExpose({ openModal })
</script>

<template>
  <n-modal
    v-model:show="serviceModal"
    preset="dialog"
    :title="`${$t('common.pluginConfig')}(${serviceType})`"
    @after-leave="close"
  >
    <n-space vertical>
      <n-spin :show="loading">
        <n-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
          :disabled="loading"
        >
          <n-form-item :label="$t('card.httpServerAddress')" path="http_address">
            <n-input v-model:value="form.http_address" placeholder="127.0.0.1:503" />
          </n-form-item>
          <n-form-item v-if="serviceType === '接入协议'" :label="$t('generate.device-type')" path="device_type">
            <n-select v-model:value="form.device_type" :placeholder="$t('card.chooseDeviceType')" :options="options" />
          </n-form-item>
          <n-form-item :label="$t('card.serverSubscribeSubjectPrefix')" path="sub_topic_prefix">
            <n-input v-model:value="form.sub_topic_prefix" placeholder="plugin/xxx/" />
          </n-form-item>
          <n-form-item v-if="serviceType === '接入协议'" :label="$t('card.deviceAccessAddress')" path="access_address">
            <n-input
              v-model:value="form.access_address"
              :placeholder="$t('card.fillDeviceAccessAddress')"
              type="textarea"
            />
          </n-form-item>
        </n-form>
        <div class="footer">
          <NButton type="primary" class="btn" @click="submitSevice">{{ $t('common.confirm') }}</NButton>
          <NButton @click="close">{{ $t('common.cancel') }}</NButton>
        </div>
      </n-spin>
    </n-space>
  </n-modal>
</template>

<style lang="scss" scoped>
.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  .btn {
    margin-left: 10px;
  }
}
</style>
