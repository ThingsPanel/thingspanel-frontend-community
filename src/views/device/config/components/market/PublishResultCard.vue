<script setup lang="ts">
/**
 * PublishResultCard - 发布结果展示卡片
 */
import { computed } from 'vue'
import { NCard, NTag, NButton, NAlert, NSpace, NResult } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { PublishedBundle } from '@/service/api/market-bundle'

const props = defineProps<{
  result: PublishedBundle | null
  error?: string | null
}>()

const emit = defineEmits<{
  close: []
  publishAnother: []
}>()

const { t } = useI18n()

const statusConfig = computed(() => {
  if (!props.result) {
    return {
      type: 'error' as const,
      label: t('market.publish.status.failed'),
      color: '#f87171'
    }
  }

  const status = props.result.status
  switch (status) {
    case 'PENDING_REVIEW':
      return {
        type: 'warning' as const,
        label: t('market.publish.status.pendingReview'),
        color: '#fbbf24'
      }
    case 'PUBLISHED':
      return {
        type: 'success' as const,
        label: t('market.publish.status.published'),
        color: '#22c55e'
      }
    case 'REJECTED':
      return {
        type: 'error' as const,
        label: t('market.publish.status.rejected'),
        color: '#f87171'
      }
    case 'UNPUBLISHED':
      return {
        type: 'default' as const,
        label: t('market.publish.status.unpublished'),
        color: '#9ca3af'
      }
    default:
      return {
        type: 'info' as const,
        label: status,
        color: '#3b82f6'
      }
  }
})

const isSuccess = computed(() => {
  return props.result && ['PENDING_REVIEW', 'PUBLISHED'].includes(props.result.status)
})
</script>

<template>
  <div class="publish-result-card">
    <!-- 成功状态 -->
    <NResult
      v-if="isSuccess"
      status="success"
      :title="t('market.publish.publishSuccessTitle')"
      :description="t('market.publish.publishSuccessDesc')"
      class="mb-4"
    >
      <template #footer>
        <NSpace justify="center">
          <NButton @click="emit('close')">
            {{ t('common.backToList') }}
          </NButton>
          <NButton type="primary" @click="emit('publishAnother')">
            {{ t('market.publish.publishAnother') }}
          </NButton>
        </NSpace>
      </template>
    </NResult>

    <!-- 失败状态 -->
    <NResult
      v-else-if="error"
      status="error"
      :title="t('market.publish.publishFailedTitle')"
      :description="error"
      class="mb-4"
    >
      <template #footer>
        <NSpace justify="center">
          <NButton @click="emit('close')">
            {{ t('common.close') }}
          </NButton>
          <NButton type="primary" @click="emit('publishAnother')">
            {{ t('common.retry') }}
          </NButton>
        </NSpace>
      </template>
    </NResult>

    <!-- 结果详情 -->
    <NCard v-if="result" :title="t('market.publish.resultDetails')" size="small">
      <div class="result-grid">
        <div class="result-item">
          <span class="result-label">{{ t('market.publish.bundleKey') }}:</span>
          <span class="result-value">{{ result.bundleKey }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">{{ t('market.publish.version') }}:</span>
          <NTag type="info" size="small">{{ result.version }}</NTag>
        </div>
        <div class="result-item">
          <span class="result-label">{{ t('market.publish.status.label') }}:</span>
          <NTag :type="statusConfig.type" size="small">
            {{ statusConfig.label }}
          </NTag>
        </div>
        <div class="result-item">
          <span class="result-label">{{ t('market.publish.contentHash') }}:</span>
          <code class="result-hash">{{ result.contentHash }}</code>
        </div>
        <div v-if="result.publishedAt" class="result-item">
          <span class="result-label">{{ t('market.publish.publishedAt') }}:</span>
          <span class="result-value">{{ new Date(result.publishedAt).toLocaleString() }}</span>
        </div>
        <div v-if="result.reviewedAt" class="result-item">
          <span class="result-label">{{ t('market.publish.reviewedAt') }}:</span>
          <span class="result-value">{{ new Date(result.reviewedAt).toLocaleString() }}</span>
        </div>
        <div v-if="result.reviewComment" class="result-item full-width">
          <span class="result-label">{{ t('market.publish.reviewComment') }}:</span>
          <NAlert type="info" class="mt-2">
            {{ result.reviewComment }}
          </NAlert>
        </div>
      </div>
    </NCard>

    <!-- 提示信息 -->
    <NAlert type="info" class="mt-4">
      {{ t('market.publish.publishTip') }}
    </NAlert>
  </div>
</template>

<style scoped>
.publish-result-card {
  min-height: 300px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.result-item.full-width {
  grid-column: 1 / -1;
}

.result-label {
  color: var(--n-text-color-3);
  font-size: 14px;
  white-space: nowrap;
}

.result-value {
  color: var(--n-text-color);
  font-size: 14px;
  word-break: break-all;
}

.result-hash {
  font-family: monospace;
  font-size: 12px;
  background: var(--n-color-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
}
</style>
