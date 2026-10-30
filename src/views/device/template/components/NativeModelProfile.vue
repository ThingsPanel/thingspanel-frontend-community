<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { NIcon } from 'naive-ui'
import { AddOutline, CloseOutline } from '@vicons/ionicons5'
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
const update = (patch: Partial<NativeModelProfile>) =>
  emit('update:modelValue', { ...props.modelValue, ...patch, tags: [...(patch.tags ?? props.modelValue.tags)] })
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
const uploadError = (): void => {
  window.$message?.error('封面上传失败，请检查网络后重试。')
}
</script>

<template>
  <NFormItem label="标签" class="native-profile-wide">
    <NSpace align="center" wrap>
      <NTag
        v-for="(tag, index) in modelValue.tags"
        :key="`${tag}-${index}`"
        closable
        :disabled="disabled"
        @close="removeTag(index)"
      >
        {{ tag }}
      </NTag>
      <NInput
        v-if="showTagInput"
        v-model:value="tagInput"
        size="small"
        autofocus
        :disabled="disabled"
        placeholder="输入标签后按回车"
        @keydown.enter.prevent="addTag"
        @blur="addTag"
      />
      <NButton v-else size="small" :disabled="disabled" @click="showTagInput = true">添加标签</NButton>
    </NSpace>
  </NFormItem>
  <NFormItem label="封面" class="native-profile-wide">
    <div class="cover-control">
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
        <button
          type="button"
          class="cover-trigger"
          :class="{ 'has-cover': coverPreview }"
          :disabled="disabled"
          :aria-label="coverPreview ? '更换封面' : '上传封面'"
          :title="coverPreview ? '点击更换封面' : '上传封面'"
        >
          <img v-if="coverPreview" :src="coverPreview" alt="物模型封面" class="cover-preview" />
          <span v-else class="cover-empty">
            <NIcon :size="24"><AddOutline /></NIcon>
            <span>上传封面</span>
          </span>
        </button>
      </n-upload>
      <button
        v-if="modelValue.cover"
        type="button"
        class="cover-remove"
        :disabled="disabled"
        aria-label="移除封面"
        title="移除封面"
        @click.stop="update({ cover: '' })"
      >
        <NIcon :size="16"><CloseOutline /></NIcon>
      </button>
    </div>
  </NFormItem>
  <NFormItem label="作者">
    <NInput
      :value="modelValue.author"
      :disabled="disabled"
      placeholder="请输入作者"
      :input-props="{ 'aria-label': '作者' }"
      @update:value="update({ author: $event })"
    />
  </NFormItem>
  <NFormItem label="品牌">
    <NInput
      :value="modelValue.brand"
      :disabled="disabled"
      placeholder="请输入品牌"
      :input-props="{ 'aria-label': '品牌' }"
      @update:value="update({ brand: $event })"
    />
  </NFormItem>
  <NFormItem label="型号">
    <NInput
      :value="modelValue.modelNumber"
      :disabled="disabled"
      placeholder="请输入型号"
      :input-props="{ 'aria-label': '型号' }"
      @update:value="update({ modelNumber: $event })"
    />
  </NFormItem>
</template>

<style scoped>
.cover-control {
  position: relative;
  width: 144px;
}
.cover-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 144px;
  height: 96px;
  padding: 0;
  overflow: hidden;
  border: 1px dashed var(--n-border-color, #d9dde6);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.cover-trigger.has-cover {
  border-style: solid;
}
.cover-trigger:hover:not(:disabled) {
  border-color: var(--primary-color, #646cff);
}
.cover-trigger:disabled,
.cover-remove:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.cover-trigger:focus-visible,
.cover-remove:focus-visible {
  outline: 2px solid var(--primary-color, #646cff);
  outline-offset: 2px;
}
.cover-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.cover-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.cover-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--n-border-color, #d9dde6);
  border-radius: 50%;
  background: var(--n-color, #fff);
  color: var(--n-text-color, #515a6e);
  cursor: pointer;
}
.cover-remove:hover:not(:disabled) {
  color: #d03050;
}
</style>
