<script setup lang="ts">
/**
 * 模板编辑表单 - 基本信息
 * 从 step-template-info.vue 提取的表单逻辑
 */

import { ref, onMounted } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { NForm, NFormItem, NInput, NTag, NButton, NUpload, NSpace, NDynamicTags } from 'naive-ui'
import { $t } from '@/locales'
import { localStg } from '@/utils/storage'
import { getDemoServerUrl } from '@/utils/common/tool'
import { putTemplat, getTemplat } from '@/service/api/system-data'
import { createProxyPattern } from '~/env.config'
import SvgIcon from '@/components/custom/svg-icon.vue'

const emit = defineEmits(['success', 'cancel'])

const props = defineProps<{
  templateId: string
}>()

const formRef = ref<any>(null)

// 表单数据
interface FormData {
  name: string
  templateTage: string[]
  version: string
  author: string
  description: string
  path: string
  label: string
  id?: string
}

const formData = ref<FormData>({
  name: '',
  templateTage: [],
  version: '',
  author: '',
  description: '',
  path: '',
  label: ''
})

// 表单验证规则
const formRules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.enterTemplateName')
  }
}

// 图片上传
const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y'
const uploadUrl = isHttpProxy ? createProxyPattern() : getDemoServerUrl()
const url = ref(uploadUrl)
const iconPreviewUrl = ref('')

const handleUploadFinish = ({ event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  if (!event || !event.target) return

  const xhr = event.target as XMLHttpRequest
  const response = JSON.parse(xhr.response)

  if (response.data && response.data.path) {
    formData.value.path = response.data.path
    // 显示图片时使用服务器域名，去掉 /api/v1 路径
    const serverUrl = getDemoServerUrl().replace('/api/v1', '')
    iconPreviewUrl.value = serverUrl + response.data.path.substring(1)
  }
}

const uploadHeaders = {
  'x-token': localStg.get('token') || ''
}

/**
 * 加载模板数据
 */
const loadTemplateData = async () => {
  if (!props.templateId) return

  try {
    const res = await getTemplat(props.templateId)
    if (!res.error && res.data) {
      const data = res.data
      formData.value = {
        id: data.id,
        name: data.name || '',
        templateTage: data.label ? data.label.split(',').filter(Boolean) : [],
        version: data.version || '',
        author: data.author || '',
        description: data.description || '',
        path: data.path || '',
        label: data.label || ''
      }

      // 设置图标预览
      if (data.path) {
        const serverUrl = getDemoServerUrl().replace('/api/v1', '')
        iconPreviewUrl.value = serverUrl + data.path.substring(1)
      }
    }
  } catch (error) {
    console.error('加载模板数据失败:', error)
  }
}

/**
 * 保存
 */
const handleSave = async () => {
  try {
    await formRef.value?.validate()

    // 将templateTage数组转换为逗号分隔的字符串
    formData.value.label = formData.value.templateTage.join(',')

    const response = await putTemplat(formData.value)

    if (!response.error) {
      window.$message?.success($t('common.updateSuccess'))
      emit('success')
    } else {
      window.$message?.error(response.error || $t('common.saveFailed'))
    }
  } catch (error) {
    console.error('保存模板信息失败:', error)
  }
}

/**
 * 取消
 */
const handleCancel = () => {
  emit('cancel')
}

onMounted(() => {
  loadTemplateData()
})
</script>

<template>
  <div class="template-edit-form">
    <NForm ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="100">
      <!-- 模板名称 -->
      <NFormItem :label="$t('device_template.table_header.templateName')" path="name">
        <NInput v-model:value="formData.name" :placeholder="$t('device_template.enterTemplateName')" />
      </NFormItem>

      <!-- 版本 -->
      <NFormItem :label="$t('device_template.version')">
        <NInput v-model:value="formData.version" :placeholder="$t('device_template.enterTemplateVersion')" />
      </NFormItem>

      <!-- 作者 -->
      <NFormItem :label="$t('device_template.author')">
        <NInput v-model:value="formData.author" :placeholder="$t('device_template.enterTemplateAuthor')" />
      </NFormItem>

      <!-- 标签 -->
      <NFormItem :label="$t('generate.labels')">
        <NDynamicTags v-model:value="formData.templateTage" />
      </NFormItem>

      <!-- 封面图标 -->
      <NFormItem :label="$t('device_template.selectCover')">
        <NUpload
          :action="url + '/file/up'"
          :headers="uploadHeaders"
          :data="{ type: 'image' }"
          :show-file-list="false"
          accept="image/png, image/jpeg, image/jpg, image/gif"
          @finish="handleUploadFinish"
        >
          <n-upload-dragger class="upload-dragger">
            <div class="upload-content">
              <img v-if="iconPreviewUrl" :src="iconPreviewUrl" class="preview-img" />
              <template v-else>
                <SvgIcon local-icon="picture" :size="35" />
                <p class="upload-text">{{ $t('device_template.selectCover') }}</p>
              </template>
            </div>
          </n-upload-dragger>
        </NUpload>
      </NFormItem>

      <!-- 描述 -->
      <NFormItem :label="$t('device_template.table_header.description')">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          :placeholder="$t('device_template.table_header.PleaseEnterADescription')"
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
      </NFormItem>

      <!-- 操作按钮 -->
      <NFormItem>
        <NSpace>
          <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSave">{{ $t('common.save') }}</NButton>
        </NSpace>
      </NFormItem>
    </NForm>
  </div>
</template>

<style scoped lang="scss">
.template-edit-form {
  padding: 20px 0;
}

.upload-dragger {
  width: 100%;

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 120px;

    .preview-img {
      max-width: 100px;
      max-height: 100px;
      object-fit: contain;
    }

    .upload-text {
      margin-top: 8px;
      color: var(--text-color-3);
      font-size: 14px;
    }
  }
}
</style>
