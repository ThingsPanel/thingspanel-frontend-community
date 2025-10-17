<script setup lang="ts">
/**
 * 模板顶部信息展示 - 对齐设备详情风格
 */

import { inject, computed } from 'vue'
import type { Ref } from 'vue'
import { NButton, NSpace, NModal, NCode, NTag, NFlex } from 'naive-ui'
import { $t } from '@/locales'
import { ref } from 'vue'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { getDemoServerUrl } from '@/utils/common/tool'

const emit = defineEmits(['edit'])

const templateData = inject<Ref<any>>('templateData')!
const fullTemplateJson = inject<Ref<string>>('fullTemplateJson')!

// JSON 弹窗显示状态
const showJsonModal = ref(false)

/**
 * 获取图标URL
 */
const getIconUrl = (path: string) => {
  if (!path) return ''
  const serverUrl = getDemoServerUrl().replace('/api/v1', '')
  return serverUrl + path.substring(1)
}

/**
 * 标签列表
 */
const tags = computed(() => {
  if (!templateData.value || !templateData.value.label) return []
  return templateData.value.label.split(',').filter(Boolean)
})

/**
 * 查看完整JSON
 */
const viewJson = () => {
  showJsonModal.value = true
}

/**
 * 复制JSON到剪贴板
 */
const copyJson = (): void => {
  const text = fullTemplateJson.value
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        window.$message?.info($t('common.copiedClipboard'))
      })
      .catch(err => {
        window.$message?.error(`${$t('common.copyingFailed')}: ${err}`)
      })
  } else {
    // Fallback
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('Copy')
    document.body.removeChild(textArea)
    window.$message?.success($t('theme.configOperation.copySuccess'))
  }
}
</script>

<template>
  <div class="template-overview">
    <!-- 第一行：图标 + 模板名称 + 小编辑按钮 -->
    <div class="header-row">
      <div class="name-with-edit">
        <div class="icon-container">
          <img v-if="templateData?.path" :src="getIconUrl(templateData.path)" alt="icon" class="template-icon" />
          <SvgIcon v-else local-icon="default-template" :size="40" class="template-icon" />
        </div>
        <span class="template-name">{{ templateData?.name || '--' }}</span>
        <NButton type="primary" size="small" @click="emit('edit')">
          {{ $t('common.edit') }}
        </NButton>
      </div>
      <NSpace>
        <NButton size="small" @click="viewJson">{{ $t('generate.view') }} JSON</NButton>
        <NButton size="small" type="primary" @click="copyJson">{{ $t('generate.copy-json') }}</NButton>
      </NSpace>
    </div>

    <!-- 第二行：详细信息（灰色小字） -->
    <NFlex class="info-row">
      <div class="info-item">
        <span class="label">ID:</span>
        <span class="value">{{ templateData?.id || '--' }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ $t('device_template.version') }}:</span>
        <span class="value">{{ templateData?.version || '--' }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ $t('device_template.author') }}:</span>
        <span class="value">{{ templateData?.author || '--' }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ $t('common.creationTime') }}:</span>
        <span class="value">{{
          templateData?.created_at ? new Date(templateData.created_at).toLocaleString() : '--'
        }}</span>
      </div>
      <div v-if="tags.length > 0" class="info-item">
        <span class="label">{{ $t('generate.labels') }}:</span>
        <NSpace :size="4">
          <NTag v-for="tag in tags" :key="tag" type="primary" size="small">
            {{ tag }}
          </NTag>
        </NSpace>
      </div>
    </NFlex>

    <!-- 描述（如果有） -->
    <div v-if="templateData?.description" class="description-row">
      <span class="label">{{ $t('device_template.table_header.description') }}:</span>
      <span class="value">{{ templateData.description }}</span>
    </div>

    <!-- JSON 查看弹窗 -->
    <NModal
      v-model:show="showJsonModal"
      :title="$t('device_template.fullTemplateJson')"
      preset="card"
      class="json-modal"
    >
      <NCode :code="fullTemplateJson" language="json" :word-wrap="true" style="max-height: 600px; overflow: auto" />
      <template #footer>
        <div class="flex justify-end">
          <NButton type="primary" @click="copyJson">{{ $t('generate.copy-json') }}</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.template-overview {
  width: 100%;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -5px;
  gap: 16px; // 增加间距防止按钮被遮挡

  .name-with-edit {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0; // 防止被压缩

    .icon-container {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      .template-icon {
        width: 40px;
        height: 40px;
        object-fit: contain;
      }
    }

    .template-name {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-color);
    }
  }
}

.info-row {
  margin-top: 8px;

  .info-item {
    display: flex;
    align-items: center;
    margin-right: 16px;
    color: #ccc;
    font-size: 13px;

    .label {
      margin-right: 4px;
    }

    .value {
      color: #ccc;
    }
  }
}

.description-row {
  margin-top: 8px;
  font-size: 13px;
  color: #ccc;

  .label {
    margin-right: 8px;
  }

  .value {
    color: #999;
  }
}

.json-modal {
  width: 800px;
  max-width: 90vw;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
