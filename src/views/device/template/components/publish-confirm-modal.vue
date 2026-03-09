<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NDescriptions, NDescriptionsItem, NButton, NAlert } from 'naive-ui'
import { $t } from '@/locales'
import { publishToMarket } from '@/service/api/market'
import { getDeviceTemplateDetail } from '@/service/api/device-template-model'

const emit = defineEmits(['publish-success'])

const visible = ref(false)
const loading = ref(false)
const templateInfo = reactive({
  id: '',
  name: '',
  brand: '',
  model_number: '',
  version: '',
  author: '',
  description: ''
})

const open = async (templateId: string) => {
  templateInfo.id = templateId
  try {
    const res: any = await getDeviceTemplateDetail(templateId)
    if (!res.error && res.data) {
      templateInfo.name = res.data.name || ''
      templateInfo.brand = res.data.brand || ''
      templateInfo.model_number = res.data.model_number || ''
      templateInfo.version = res.data.version || '1.0.0'
      templateInfo.author = res.data.author || ''
      templateInfo.description = res.data.description || ''
    }
  } catch (e) {
    console.error('Failed to get template detail', e)
  }
  visible.value = true
}

const handlePublish = async () => {
  const token = sessionStorage.getItem('market_token')
  if (!token) {
    window.$message?.error($t('market.loginRequired'))
    visible.value = false
    return
  }

  loading.value = true
  try {
    const res: any = await publishToMarket({
      device_template_id: templateInfo.id,
      market_token: token
    })
    if (!res.error) {
      window.$message?.success($t('device_template.publishSuccess'))
      visible.value = false
      emit('publish-success')
    } else {
      window.$message?.error($t('device_template.publishFailed') + ': ' + (res.error?.msg || ''))
    }
  } catch (e: any) {
    // Check if token expired
    if (e?.response?.status === 401) {
      sessionStorage.removeItem('market_token')
      window.$message?.error($t('market.tokenExpired'))
    } else {
      window.$message?.error($t('device_template.publishFailed') + ': ' + (e?.message || ''))
    }
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="dialog"
    :title="$t('device_template.publishConfirmTitle')"
    style="width: 500px"
  >
    <NDescriptions :column="1" label-placement="left" bordered size="small" style="margin-bottom: 16px">
      <NDescriptionsItem :label="$t('device_template.templateName')">{{ templateInfo.name }}</NDescriptionsItem>
      <NDescriptionsItem :label="$t('device_template.brand')">{{ templateInfo.brand || '--' }}</NDescriptionsItem>
      <NDescriptionsItem :label="$t('device_template.modelNumber')">
        {{ templateInfo.model_number || '--' }}
      </NDescriptionsItem>
      <NDescriptionsItem :label="$t('device_template.author')">{{ templateInfo.author || '--' }}</NDescriptionsItem>
      <NDescriptionsItem :label="$t('device_template.version')">{{ templateInfo.version || '--' }}</NDescriptionsItem>
    </NDescriptions>

    <NAlert type="warning" style="margin-bottom: 12px">
      {{ $t('device_template.publishConfirmMessage') }}
    </NAlert>

    <template #action>
      <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
      <NButton type="primary" :loading="loading" @click="handlePublish">
        {{ $t('device_template.publishToMarket') }}
      </NButton>
    </template>
  </NModal>
</template>
