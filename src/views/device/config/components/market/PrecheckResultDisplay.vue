<script setup lang="ts">
/**
 * PrecheckResultDisplay - 预检结果展示组件
 */
import { computed } from 'vue'
import { NAlert, NList, NListItem, NThing, NTag, NIcon, NTooltip } from 'naive-ui'
import { useI18n } from '@/locales'
import type { PrecheckDisplayItem } from '../../composables/use-market-bundle'

const props = defineProps<{
  results: PrecheckDisplayItem[]
  errors: PrecheckDisplayItem[]
  warnings: PrecheckDisplayItem[]
  passes: PrecheckDisplayItem[]
  loading?: boolean
}>()

const { t } = useI18n()

const hasBlockingErrors = computed(() => props.errors.length > 0)
const hasWarnings = computed(() => props.warnings.length > 0)
const isAllPass = computed(() => props.errors.length === 0 && props.warnings.length === 0)

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '!'
    default:
      return 'i'
  }
}

const getLevelTagType = (level: string): 'success' | 'error' | 'warning' | 'info' => {
  switch (level) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    default:
      return 'info'
  }
}
</script>

<template>
  <div class="precheck-display">
    <!-- 总体状态 -->
    <NAlert
      v-if="!loading"
      :type="hasBlockingErrors ? 'error' : hasWarnings ? 'warning' : 'success'"
      :title="
        hasBlockingErrors
          ? t('market.publish.precheckFailed')
          : hasWarnings
            ? t('market.publish.precheckWithWarnings')
            : t('market.publish.precheckPassed')
      "
      class="mb-4"
    >
      <template v-if="hasBlockingErrors">
        {{ t('market.publish.precheckFailedDesc') }}
      </template>
      <template v-else-if="hasWarnings">
        {{ t('market.publish.precheckWarningsDesc') }}
      </template>
      <template v-else>
        {{ t('market.publish.precheckAllPassed') }}
      </template>
    </NAlert>

    <NSpin v-else :show="true">
      <div class="loading-placeholder">
        {{ t('market.publish.runningPrecheck') }}
      </div>
    </NSpin>

    <!-- 错误列表 -->
    <NCard v-if="errors.length > 0" :title="t('market.publish.errors')" size="small" class="mb-4">
      <template #header-extra>
        <NTag type="error">{{ errors.length }}</NTag>
      </template>

      <NList hoverable clickable>
        <NListItem v-for="item in errors" :key="item.code + item.description">
          <NThing>
            <template #avatar>
              <div class="result-icon error-icon">
                {{ getLevelIcon(item.level) }}
              </div>
            </template>
            <template #header>
              <div class="result-header">
                <span class="result-title">{{ item.title }}</span>
                <NTag :type="getLevelTagType(item.level)" size="small">
                  {{ t('market.publish.blocking') }}
                </NTag>
              </div>
            </template>
            <template #description>
              <p class="result-message">{{ item.description }}</p>
              <p v-if="item.resource" class="result-resource">
                {{ t('market.publish.affectedResource') }}: {{ item.resource }}
              </p>
            </template>
          </NThing>
        </NListItem>
      </NList>
    </NCard>

    <!-- 警告列表 -->
    <NCard v-if="warnings.length > 0" :title="t('market.publish.warnings')" size="small" class="mb-4">
      <template #header-extra>
        <NTag type="warning">{{ warnings.length }}</NTag>
      </template>

      <NList hoverable clickable>
        <NListItem v-for="item in warnings" :key="item.code + item.description">
          <NThing>
            <template #avatar>
              <div class="result-icon warning-icon">
                {{ getLevelIcon(item.level) }}
              </div>
            </template>
            <template #header>
              <span class="result-title">{{ item.title }}</span>
            </template>
            <template #description>
              <p class="result-message">{{ item.description }}</p>
              <p v-if="item.resource" class="result-resource">
                {{ t('market.publish.affectedResource') }}: {{ item.resource }}
              </p>
            </template>
          </NThing>
        </NListItem>
      </NList>
    </NCard>

    <!-- 通过项 -->
    <NCard v-if="passes.length > 0" :title="t('market.publish.passedChecks')" size="small" :bordered="false">
      <template #header-extra>
        <NTag type="success">{{ passes.length }}</NTag>
      </template>

      <div class="pass-list">
        <div v-for="item in passes" :key="item.code + item.description" class="pass-item">
          <span class="pass-icon">✓</span>
          <span class="pass-title">{{ item.title }}</span>
        </div>
      </div>
    </NCard>

    <!-- Bundle 预览信息 -->
    <slot name="bundle-preview" />
  </div>
</template>

<style scoped>
.precheck-display {
  min-height: 200px;
}

.loading-placeholder {
  padding: 40px;
  text-align: center;
  color: var(--n-text-color-3);
}

.result-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.error-icon {
  background: #f87171;
}

.warning-icon {
  background: #fbbf24;
  color: #1f2937;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-title {
  font-weight: 500;
  color: var(--n-text-color);
}

.result-message {
  margin: 8px 0 0;
  color: var(--n-text-color-2);
  font-size: 14px;
}

.result-resource {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.pass-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pass-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-2);
}

.pass-icon {
  color: #22c55e;
  font-weight: bold;
}

.pass-title {
  font-size: 14px;
}
</style>
