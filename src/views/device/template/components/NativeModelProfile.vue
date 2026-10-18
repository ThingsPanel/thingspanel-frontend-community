<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { localStg } from '@/utils/storage'
import { getDemoServerUrl } from '@/utils/common/tool'
import type { NativeModelProfile } from '@/service/api/thingmodel-native'

const props = defineProps<{ modelValue: NativeModelProfile; disabled?: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: NativeModelProfile): void }>()
const apiBase = getDemoServerUrl()
const previewBase = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
const showTagInput = ref(false)
const tagInput = ref('')
const coverPreview = computed(() => {
  const path = props.modelValue.cover
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `${previewBase}/${path.replace(/^\.?\//, '')}`
})
const update = (patch: Partial<NativeModelProfile>) => emit('update:modelValue', { ...props.modelValue, ...patch, tags: [...(patch.tags ?? props.modelValue.tags)] })
const addTag = () => {
  const value = tagInput.value.trim()
  if (value && !props.modelValue.tags.includes(value)) update({ tags: [...props.modelValue.tags, value] })
  tagInput.value = ''
  showTagInput.value = false
}
const removeTag = (index: number) => update({ tags: props.modelValue.tags.filter((_, i) => i !== index) })
const finishUpload = ({ event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  const target = event?.target
  if (!(target instanceof XMLHttpRequest)) {
    window.$message?.error('封面上传失败。')
    return
  }
  try {
    const response = JSON.parse(target.responseText)
    const path = response?.data?.path
    if (typeof path !== 'string' || !path.trim()) throw new Error('上传响应缺少封面路径')
    update({ cover: path })
  } catch {
    window.$message?.error('封面上传失败。')
  }
}
const uploadError = () => window.$message?.error('封面上传失败，请检查网络后重试。')
</script>

<template>
  <NFormItem label="标签">
    <NSpace align="center" wrap>
      <NTag v-for="(tag, index) in modelValue.tags" :key="`${tag}-${index}`" closable :disabled="disabled" @close="removeTag(index)">{{ tag }}</NTag>
      <NInput v-if="showTagInput" v-model:value="tagInput" size="small" autofocus :disabled="disabled" placeholder="输入标签后按回车" @keydown.enter.prevent="addTag" @blur="addTag" />
      <NButton v-else size="small" :disabled="disabled" @click="showTagInput = true">添加标签</NButton>
    </NSpace>
  </NFormItem>
  <NFormItem label="封面">
    <NSpace align="center">
      <n-upload
        :action="`${apiBase}/file/up`"
        :headers="{ 'x-token': localStg.get('token') || '' }"
        :data="{ type: 'image' }"
        :show-file-list="false"
        accept="image/png,image/jpeg,image/jpg,image/gif"
        :disabled="disabled"
        @finish="finishUpload"
        @error="uploadError"
      >
        <NButton :disabled="disabled">选择封面</NButton>
      </n-upload>
      <img v-if="coverPreview" :src="coverPreview" alt="物模型封面预览" class="cover-preview" />
      <NButton v-if="modelValue.cover" quaternary :disabled="disabled" @click="update({ cover: '' })">移除封面</NButton>
    </NSpace>
  </NFormItem>
  <NFormItem label="作者"><NInput :value="modelValue.author" :disabled="disabled" placeholder="请输入作者" :input-props="{ 'aria-label': '作者' }" @update:value="update({ author: $event })" /></NFormItem>
  <NFormItem label="版本"><NInput :value="modelValue.version" :disabled="disabled" placeholder="请输入版本" :input-props="{ 'aria-label': '版本' }" @update:value="update({ version: $event })" /></NFormItem>
  <NFormItem label="品牌"><NInput :value="modelValue.brand" :disabled="disabled" placeholder="请输入品牌" :input-props="{ 'aria-label': '品牌' }" @update:value="update({ brand: $event })" /></NFormItem>
  <NFormItem label="型号"><NInput :value="modelValue.modelNumber" :disabled="disabled" placeholder="请输入型号" :input-props="{ 'aria-label': '型号' }" @update:value="update({ modelNumber: $event })" /></NFormItem>
</template>

<style scoped>
.cover-preview { width: 120px; height: 90px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 4px; }
</style>
