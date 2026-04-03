<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NAlert, NSelect, FormInst, FormRules } from 'naive-ui'
import { $t } from '@/locales'
import { publishToMarket } from '@/service/api/market'
import { deviceConfigInfo } from '@/service/api/device'

const emit = defineEmits(['publish-success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInst | null>(null)
// 传入的是 device_config_id（发布单位）
const deviceConfigIdValue = ref('')

const formModel = reactive({
  market_name: '',
  brand: '',
  model: '',
  category: '',
  version: '1.0.0',
  author: '',
  description: ''
})

const rules: FormRules = {
  market_name: [
    { required: true, message: () => $t('device_template.requireName'), trigger: 'blur' },
    { max: 50, message: () => $t('common.maxLength', { length: 50 }), trigger: 'blur' }
  ],
  brand: [{ required: true, message: () => $t('device_template.requireBrand'), trigger: 'blur' }],
  model: [{ required: true, message: () => $t('device_template.requireModel'), trigger: 'blur' }],
  category: [{ required: true, message: () => $t('device_template.requireCategory'), trigger: ['blur', 'change'] }],
  version: [
    { required: true, message: () => $t('device_template.requireVersion'), trigger: 'blur' },
    {
      pattern: /^\d+\.\d+\.\d+$/,
      message: () => $t('device_template.versionFormatError', { format: 'x.y.z' }),
      trigger: 'blur'
    }
  ],
  author: [{ required: true, message: () => $t('device_template.requireAuthor'), trigger: 'blur' }],
  description: [{ required: true, message: () => $t('device_template.requireDescription'), trigger: 'blur' }]
}

const categoryOptions = [
  { label: () => $t('device_template.marketCatIoT'), value: 'IoT' },
  { label: () => $t('device_template.marketCatIndustrial'), value: '工业' },
  { label: () => $t('device_template.marketCatAgriculture'), value: '农业' },
  { label: () => $t('device_template.marketCatSmartCity'), value: '智慧城市' },
  { label: () => $t('device_template.marketCatOther'), value: '其他' }
]

// open 接收 device_config_id，而非 device_template_id
const open = async (deviceConfigId: string, defaultName?: string) => {
  deviceConfigIdValue.value = deviceConfigId

  formModel.market_name = defaultName || ''
  formModel.brand = ''
  formModel.model = ''
  formModel.category = ''
  formModel.version = '1.0.0'
  formModel.author = ''
  formModel.description = ''

  // 获取设备配置详情（包含 device_template_id），再获取模板详情填充表单
  try {
    const dcRes: any = await deviceConfigInfo({ id: deviceConfigId })
    if (!dcRes.error && dcRes.data) {
      const dc = dcRes.data
      // 自动填充设备配置名称（如果没有默认名）
      if (!formModel.market_name) {
        formModel.market_name = dc.name || ''
      }
      formModel.brand = dc.brand || ''
      formModel.model = dc.model_number || dc.product_model || ''
      formModel.version = dc.version || '1.0.0'
      formModel.author = dc.author || ''
      formModel.description = dc.description || ''
    }
  } catch (e) {
    console.error('Failed to get device config detail', e)
  }
  visible.value = true
}

const handlePublish = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const token = sessionStorage.getItem('market_token')
  if (!token) {
    window.$message?.error($t('market.loginRequired'))
    visible.value = false
    return
  }

  loading.value = true
  try {
    const res: any = await publishToMarket({
      device_config_id: deviceConfigIdValue.value,
      market_token: token,
      market_name: formModel.market_name,
      brand: formModel.brand,
      model: formModel.model,
      category: formModel.category,
      version: formModel.version,
      author: formModel.author,
      description: formModel.description
    })
    if (!res.error) {
      window.$message?.success($t('device_template.publishSuccess'))
      visible.value = false
      emit('publish-success')
    } else {
      window.$message?.error($t('device_template.publishFailed') + ': ' + (res.error?.msg || ''))
    }
  } catch (e: any) {
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

const handleCancel = () => {
  visible.value = false
}

defineExpose({ open })
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="dialog"
    :title="$t('device_template.publishConfirmTitle')"
    style="width: 550px"
  >
    <div style="margin-top: 20px">
      <NForm
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="left"
        label-width="110"
        require-mark-placement="right-hanging"
      >
        <NFormItem :label="$t('device_template.marketName')" path="market_name">
          <NInput
            v-model:value="formModel.market_name"
            :placeholder="$t('device_template.inputMarketName')"
            maxlength="50"
            show-count
            clearable
          />
        </NFormItem>
        <NFormItem :label="$t('device_template.brand')" path="brand">
          <NInput v-model:value="formModel.brand" :placeholder="$t('device_template.inputBrand')" clearable />
        </NFormItem>
        <NFormItem :label="$t('device_template.modelNumber')" path="model">
          <NInput v-model:value="formModel.model" :placeholder="$t('device_template.inputModelNumber')" clearable />
        </NFormItem>
        <NFormItem :label="$t('device_template.category')" path="category">
          <NSelect
            v-model:value="formModel.category"
            :options="categoryOptions"
            :placeholder="$t('device_template.selectCategory')"
            clearable
          />
        </NFormItem>
        <NFormItem :label="$t('device_template.version')" path="version">
          <NInput v-model:value="formModel.version" :placeholder="$t('device_template.inputVersion')" clearable />
        </NFormItem>
        <NFormItem :label="$t('device_template.author')" path="author">
          <NInput v-model:value="formModel.author" :placeholder="$t('device_template.inputAuthor')" clearable />
        </NFormItem>
        <NFormItem :label="$t('generate.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            :placeholder="$t('device_template.inputDescription')"
            clearable
          />
        </NFormItem>
      </NForm>

      <NAlert type="info" style="margin-top: 12px">
        {{ $t('device_template.publishConfirmMessage') }}
      </NAlert>
    </div>

    <template #action>
      <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
      <NButton type="primary" :loading="loading" @click="handlePublish">
        {{ $t('device_template.confirmPublish') }}
      </NButton>
    </template>
  </NModal>
</template>

<style scoped></style>
