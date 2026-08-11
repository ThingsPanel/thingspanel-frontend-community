<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NAlert, NSelect, NUpload, NUploadDragger, FormInst, FormRules } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { $t } from '@/locales'
import { publishToMarket } from '@/service/api/market'
import { deviceConfigInfo } from '@/service/api/device'
import { getDemoServerUrl } from '@/utils/common/tool'
import { localStg } from '@/utils/storage'
import { useMarketAuth } from '../composables/use-market-auth'
import { useAuthStore } from '@/store/modules/auth'

const emit = defineEmits(['publish-success'])
const { getToken, clearToken, refreshAccessToken } = useMarketAuth()
const authStore = useAuthStore()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInst | null>(null)
// 传入的是 device_config_id（发布单位）
const deviceConfigIdValue = ref('')
const uploadUrl = getDemoServerUrl()

const formModel = reactive({
  market_name: '',
  brand: '',
  model: '',
  category: '',
  version: '1.0.0',
  author: '',
  description: '',
  cover_url: ''
})

const rules: FormRules = {
  market_name: [
    { required: true, message: () => $t('device_template.requireName'), trigger: 'blur' },
    { max: 50, message: () => $t('common.maxLength', { length: 50 }), trigger: 'blur' }
  ],
  brand: [],
  model: [],
  category: [],
  version: [
    { required: true, message: () => $t('device_template.requireVersion'), trigger: 'blur' },
    {
      pattern: /^\d+\.\d+\.\d+$/,
      message: () => $t('device_template.versionFormatError', { format: 'x.y.z' }),
      trigger: 'blur'
    }
  ],
  author: [{ required: true, message: () => $t('device_template.requireAuthor'), trigger: 'blur' }],
  description: []
}

const categoryOptions = [
  { label: () => $t('device_template.marketCatIoT'), value: 'IoT' },
  { label: () => $t('device_template.marketCatIndustrial'), value: '工业' },
  { label: () => $t('device_template.marketCatAgriculture'), value: '农业' },
  { label: () => $t('device_template.marketCatSmartCity'), value: '智慧城市' },
  { label: () => $t('device_template.marketCatOther'), value: '其他' }
]

const handleCoverUpload = ({ event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  if (!event?.target) return
  const response = JSON.parse((event.target as XMLHttpRequest).response)
  const path = response?.data?.path
  if (!path) {
    window.$message?.error('封面上传失败')
    return
  }
  formModel.cover_url = `${uploadUrl.replace(/\/api\/v1$/, '')}/${String(path).replace(/^\.\//, '')}`
}

const resolveConfigCoverUrl = (imageUrl?: string) => {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${uploadUrl.replace(/\/api\/v1$/, '')}/${String(imageUrl).replace(/^\.\//, '').replace(/^\//, '')}`
}

// open 接收 device_config_id，而非 device_template_id
const open = async (deviceConfigId: string, defaultName?: string) => {
  deviceConfigIdValue.value = deviceConfigId

  formModel.market_name = defaultName || ''
  formModel.brand = ''
  formModel.model = ''
  formModel.category = categoryOptions[0].value
  formModel.version = '1.0.0'
  formModel.author = authStore.userInfo.userName || authStore.userInfo.name || ''
  formModel.description = ''
  formModel.cover_url = ''

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
      formModel.description = dc.description || ''
      if (dc.image_url) {
        formModel.cover_url = resolveConfigCoverUrl(dc.image_url)
      }
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

  let token = getToken()
  if (!token) token = await refreshAccessToken()
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
      description: formModel.description,
      cover_url: formModel.cover_url
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
      clearToken()
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
    :title="$t('device_template.uploadResourceConfirmTitle')"
    style="width: 680px; max-width: 92vw"
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
        <NFormItem :label="$t('device_template.resourceName')" path="market_name">
          <NInput
            v-model:value="formModel.market_name"
            :placeholder="$t('device_template.inputMarketName')"
            maxlength="50"
            show-count
            clearable
          />
        </NFormItem>
        <div class="market-form-grid">
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
        </div>
        <NFormItem :label="$t('generate.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            :placeholder="$t('device_template.inputDescription')"
            clearable
          />
        </NFormItem>
        <NFormItem :label="$t('device_template.resourceCover')" class="cover-form-item">
          <NUpload
            :action="`${uploadUrl}/file/up`"
            :headers="{ 'x-token': localStg.get('token') || '' }"
            :data="{ type: 'image' }"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            :show-file-list="false"
            @finish="handleCoverUpload"
          >
            <NUploadDragger class="cover-uploader">
              <img
                v-if="formModel.cover_url"
                :src="formModel.cover_url"
                :alt="$t('device_template.resourceCover')"
                class="cover-preview"
              />
              <span v-else>点击或拖拽上传封面</span>
            </NUploadDragger>
          </NUpload>
        </NFormItem>
      </NForm>

      <NAlert type="info" style="margin-top: 12px">
        {{ $t('device_template.publishConfirmMessage') }}
      </NAlert>
    </div>

    <template #action>
      <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
      <NButton type="primary" :loading="loading" @click="handlePublish">
        {{ $t('device_template.confirmUpload') }}
      </NButton>
    </template>
  </NModal>
</template>

<style scoped>
.market-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}

.cover-form-item :deep(.n-form-item-blank) {
  align-items: flex-start;
}

.cover-uploader {
  width: 300px;
  height: 150px;
  padding: 0;
  margin: 0;
}

.cover-uploader :deep(.n-upload-dragger) {
  padding: 0;
  margin: 0;
  border-radius: 4px;
  overflow: hidden;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

@media (max-width: 640px) {
  .market-form-grid {
    grid-template-columns: 1fr;
    column-gap: 0;
  }

  .cover-uploader {
    width: 100%;
  }
}
</style>
