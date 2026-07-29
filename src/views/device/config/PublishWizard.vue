<script setup lang="ts">
/**
 * PublishWizard - 市场解决方案包发布向导
 *
 * 多步骤发布流程:
 * 1. 选择资源 (设备模板/看板)
 * 2. 填写元数据 (名称/分类/描述)
 * 3. 预检结果
 * 4. 确认发布
 * 5. 发布结果
 */
import { ref, reactive, computed, watch } from 'vue'
import {
  NModal,
  NCard,
  NSteps,
  NStep,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NGrid,
  NGi,
  NAlert,
  NSpin,
  useMessage,
  useDialog
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import ResourceSelector from './components/market/ResourceSelector.vue'
import PrecheckResultDisplay from './components/market/PrecheckResultDisplay.vue'
import PublishResultCard from './components/market/PublishResultCard.vue'
import { useMarketBundle, formatPrecheckResults } from './composables/use-market-bundle'
import { useMarketAuth } from './composables/use-market-auth'
import type { Locale } from '@/locales/locale'

// ========== Props & Emits ==========

export interface PublishWizardExpose {
  open: (params?: OpenParams) => void
  close: () => void
}

export interface OpenParams {
  /** 预选的设备模板 ID */
  deviceTemplateIds?: string[]
  /** 预选的看板 ID */
  dashboardIds?: string[]
}

const props = defineProps<{
  /** 是否显示 */
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  published: [result: unknown]
}>()

// ========== Composable ==========

const { t, locale } = useI18n()
const message = useMessage()
const dialog = useDialog()
const { isLoggedIn } = useMarketAuth()

const {
  wizardState,
  canProceedFromMetadata,
  canConfirmPublish,
  precheckErrors,
  precheckWarnings,
  precheckPasses,
  hasBlockingErrors,
  resetWizard,
  setSelectedResources,
  updateMetadata,
  createDraft,
  confirmPublishAction,
  cancelCurrentDraft
} = useMarketBundle()

// ========== Local State ==========

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// 步骤索引
const stepIndex = computed(() => {
  const steps = ['select-resources', 'metadata', 'precheck', 'confirm', 'result']
  return steps.indexOf(wizardState.step)
})

// 元数据表单
const metadataForm = reactive({
  name: '',
  category: '',
  description: '',
  tags: '',
  author: '',
  contact: ''
})

// 类别选项
const categoryOptions = [
  { label: () => t('market.category.smartHome'), value: 'smart-home' },
  { label: () => t('market.category.industrial'), value: 'industrial' },
  { label: () => t('market.category.agriculture'), value: 'agriculture' },
  { label: () => t('market.category.smartCity'), value: 'smart-city' },
  { label: () => t('market.category.energy'), value: 'energy' },
  { label: () => t('market.category.healthcare'), value: 'healthcare' },
  { label: () => t('market.category.retail'), value: 'retail' },
  { label: () => t('market.category.other'), value: 'other' }
]

// 选中的资源
const selectedDeviceTemplateIds = ref<string[]>([])
const selectedDashboardIds = ref<string[]>([])

// 预检结果格式化
const formattedResults = computed(() => {
  if (!wizardState.precheckResults) return []
  return formatPrecheckResults(wizardState.precheckResults.checks, locale.value as Locale)
})

const formattedErrors = computed(() => formattedResults.value.filter(r => r.level === 'error'))
const formattedWarnings = computed(() => formattedResults.value.filter(r => r.level === 'warning'))
const formattedPasses = computed(() => formattedResults.value.filter(r => r.level === 'success' || r.level === 'info'))

// Bundle 预览
const bundlePreview = computed(() => wizardState.precheckResults?.bundlePreview)

// ========== Watch ==========

watch(
  () => props.modelValue,
  newVal => {
    if (!newVal) {
      resetWizard()
    }
  }
)

// 同步 metadataForm 到 wizardState
watch(metadataForm, newVal => {
  updateMetadata({
    name: newVal.name,
    category: newVal.category,
    description: newVal.description,
    tags: newVal.tags
      ? newVal.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
      : [],
    author: newVal.author,
    contact: newVal.contact
  })
})

// ========== Methods ==========

/**
 * 打开向导
 */
function open(params?: OpenParams) {
  resetWizard()
  if (params?.deviceTemplateIds) {
    selectedDeviceTemplateIds.value = params.deviceTemplateIds
  }
  if (params?.dashboardIds) {
    selectedDashboardIds.value = params.dashboardIds
  }
  visible.value = true
}

/**
 * 关闭向导
 */
function close() {
  visible.value = false
  resetWizard()
}

/**
 * 处理资源选择完成
 */
function handleResourceSelectionConfirm(deviceTemplateIds: string[], dashboardIds: string[]) {
  setSelectedResources({ deviceTemplateIds, dashboardIds })
  wizardState.step = 'metadata'
}

/**
 * 处理元数据下一步
 */
function handleMetadataNext() {
  if (!canProceedFromMetadata.value) {
    message.warning(t('market.publish.fillRequiredFields'))
    return
  }
  wizardState.step = 'precheck'
  void runPrecheck()
}

/**
 * 运行预检
 */
async function runPrecheck() {
  wizardState.isLoading = true
  const success = await createDraft(locale.value as Locale)
  if (!success && wizardState.error) {
    message.error(wizardState.error.message)
  }
  wizardState.isLoading = false
}

/**
 * 处理确认发布
 */
async function handleConfirmPublish() {
  if (!canConfirmPublish.value) {
    message.warning(t('market.publish.cannotPublishWithErrors'))
    return
  }

  // 确认对话框
  dialog.warning({
    title: t('market.publish.confirmPublishTitle'),
    content: t('market.publish.confirmPublishMessage'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      wizardState.isSubmitting = true
      const success = await confirmPublishAction(locale.value as Locale)
      if (success) {
        message.success(t('market.publish.publishInitiated'))
        emit('published', wizardState.publishResult)
      } else if (wizardState.error) {
        message.error(wizardState.error.message)
      }
      wizardState.isSubmitting = false
    }
  })
}

/**
 * 处理发布另一个
 */
function handlePublishAnother() {
  resetWizard()
  metadataForm.name = ''
  metadataForm.category = ''
  metadataForm.description = ''
  metadataForm.tags = ''
  metadataForm.author = ''
  metadataForm.contact = ''
  selectedDeviceTemplateIds.value = []
  selectedDashboardIds.value = []
}

/**
 * 处理取消
 */
async function handleCancel() {
  if (wizardState.draftId && wizardState.step !== 'result') {
    const confirmed = await new Promise<boolean>(resolve => {
      dialog.warning({
        title: t('market.publish.confirmCancel'),
        content: t('market.publish.confirmCancelMessage'),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false)
      })
    })
    if (confirmed) {
      await cancelCurrentDraft()
      close()
    }
  } else {
    close()
  }
}

/**
 * 获取步骤标题
 */
function getStepTitle(step: string): string {
  switch (step) {
    case 'select-resources':
      return t('market.publish.stepSelectResources')
    case 'metadata':
      return t('market.publish.stepMetadata')
    case 'precheck':
      return t('market.publish.stepPrecheck')
    case 'confirm':
      return t('market.publish.stepConfirm')
    case 'result':
      return t('market.publish.stepResult')
    default:
      return step
  }
}

// 暴露方法
defineExpose({ open, close } as PublishWizardExpose)
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="t('market.publish.wizardTitle')"
    class="publish-wizard-modal"
    :mask-closable="false"
    :closable="true"
    style="width: 800px; max-width: 90vw"
    :trap-focus="true"
  >
    <div class="publish-wizard">
      <!-- 步骤指示器 (非结果页面显示) -->
      <NSteps v-if="wizardState.step !== 'result'" :current="stepIndex" class="mb-6" status="process">
        <NStep :title="t('market.publish.stepSelectResources')" />
        <NStep :title="t('market.publish.stepMetadata')" />
        <NStep :title="t('market.publish.stepPrecheck')" />
        <NStep :title="t('market.publish.stepConfirm')" />
      </NSteps>

      <!-- Step 1: 选择资源 -->
      <div v-if="wizardState.step === 'select-resources'" class="step-content">
        <NAlert type="info" class="mb-4">
          {{ t('market.publish.selectResourcesTip') }}
        </NAlert>
        <ResourceSelector
          :device-templates="[]"
          :dashboards="[]"
          :selected-device-template-ids="selectedDeviceTemplateIds"
          :selected-dashboard-ids="selectedDashboardIds"
          @update:selected-device-template-ids="selectedDeviceTemplateIds = $event"
          @update:selected-dashboard-ids="selectedDashboardIds = $event"
          @confirm="handleResourceSelectionConfirm"
        />
        <div class="step-actions">
          <NButton @click="handleCancel">{{ t('common.cancel') }}</NButton>
          <NButton
            type="primary"
            :disabled="selectedDeviceTemplateIds.length === 0 && selectedDashboardIds.length === 0"
            @click="handleResourceSelectionConfirm(selectedDeviceTemplateIds, selectedDashboardIds)"
          >
            {{ t('common.nextStep') }}
          </NButton>
        </div>
      </div>

      <!-- Step 2: 填写元数据 -->
      <div v-else-if="wizardState.step === 'metadata'" class="step-content">
        <NAlert type="info" class="mb-4">
          {{ t('market.publish.metadataTip') }}
        </NAlert>
        <NForm :model="metadataForm" label-placement="left" label-width="100">
          <NGrid :cols="2" :x-gap="16">
            <NGi>
              <NFormItem :label="t('market.publish.bundleName')" path="name" required>
                <NInput
                  v-model:value="metadataForm.name"
                  :placeholder="t('market.publish.bundleNamePlaceholder')"
                  maxlength="50"
                  show-count
                />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem :label="t('market.publish.category')" path="category" required>
                <NSelect
                  v-model:value="metadataForm.category"
                  :options="categoryOptions"
                  :placeholder="t('market.publish.categoryPlaceholder')"
                />
              </NFormItem>
            </NGi>
          </NGrid>
          <NFormItem :label="t('market.publish.description')" path="description">
            <NInput
              v-model:value="metadataForm.description"
              type="textarea"
              :placeholder="t('market.publish.descriptionPlaceholder')"
              :autosize="{ minRows: 3, maxRows: 5 }"
              maxlength="500"
              show-count
            />
          </NFormItem>
          <NGrid :cols="2" :x-gap="16">
            <NGi>
              <NFormItem :label="t('market.publish.tags')" path="tags">
                <NInput v-model:value="metadataForm.tags" :placeholder="t('market.publish.tagsPlaceholder')" />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem :label="t('market.publish.author')" path="author">
                <NInput v-model:value="metadataForm.author" :placeholder="t('market.publish.authorPlaceholder')" />
              </NFormItem>
            </NGi>
          </NGrid>
          <NFormItem :label="t('market.publish.contact')" path="contact">
            <NInput v-model:value="metadataForm.contact" :placeholder="t('market.publish.contactPlaceholder')" />
          </NFormItem>
        </NForm>
        <div class="step-actions">
          <NButton @click="wizardState.step = 'select-resources'">
            {{ t('common.back') }}
          </NButton>
          <NButton type="primary" :disabled="!canProceedFromMetadata" @click="handleMetadataNext">
            {{ t('market.publish.runPrecheck') }}
          </NButton>
        </div>
      </div>

      <!-- Step 3: 预检结果 -->
      <div v-else-if="wizardState.step === 'precheck'" class="step-content">
        <NSpin :show="wizardState.isLoading">
          <PrecheckResultDisplay
            :results="formattedResults"
            :errors="formattedErrors"
            :warnings="formattedWarnings"
            :passes="formattedPasses"
            :loading="wizardState.isLoading"
          >
            <!-- Bundle 预览插槽 -->
            <template v-if="bundlePreview" #bundle-preview>
              <NCard :title="t('market.publish.bundlePreview')" size="small" class="mt-4">
                <div class="preview-grid">
                  <div class="preview-item">
                    <span class="preview-label">{{ t('market.publish.deviceTemplateCount') }}:</span>
                    <span class="preview-value">{{ bundlePreview.deviceTemplateCount }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">{{ t('market.publish.dashboardCount') }}:</span>
                    <span class="preview-value">{{ bundlePreview.dashboardCount }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">{{ t('market.publish.containsSecrets') }}:</span>
                    <span :class="['preview-value', bundlePreview.containsSecrets ? 'text-error' : 'text-success']">
                      {{ bundlePreview.containsSecrets ? t('common.yes') : t('common.no') }}
                    </span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">{{ t('market.publish.contentSize') }}:</span>
                    <span class="preview-value">{{ (bundlePreview.contentSize / 1024).toFixed(2) }} KB</span>
                  </div>
                </div>
              </NCard>
            </template>
          </PrecheckResultDisplay>
        </NSpin>
        <div class="step-actions">
          <NButton @click="wizardState.step = 'metadata'">
            {{ t('common.back') }}
          </NButton>
          <NButton
            type="primary"
            :disabled="!canConfirmPublish"
            :loading="wizardState.isSubmitting"
            @click="handleConfirmPublish"
          >
            {{ t('market.publish.confirmPublish') }}
          </NButton>
        </div>
      </div>

      <!-- Step 4: 确认发布 (简化版，主要在 Step 3 处理) -->
      <div v-else-if="wizardState.step === 'confirm'" class="step-content">
        <NAlert type="info">
          {{ t('market.publish.confirmTip') }}
        </NAlert>
        <div class="step-actions">
          <NButton @click="wizardState.step = 'precheck'">
            {{ t('common.back') }}
          </NButton>
          <NButton type="primary" :disabled="!canConfirmPublish" @click="handleConfirmPublish">
            {{ t('market.publish.confirmPublish') }}
          </NButton>
        </div>
      </div>

      <!-- Step 5: 发布结果 -->
      <div v-else-if="wizardState.step === 'result'" class="step-content">
        <PublishResultCard
          :result="wizardState.publishResult"
          :error="wizardState.error?.message"
          @close="close"
          @publish-another="handlePublishAnother"
        />
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.publish-wizard {
  min-height: 400px;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
}

.step-actions-right {
  display: flex;
  gap: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label {
  color: var(--n-text-color-3);
  font-size: 14px;
}

.preview-value {
  color: var(--n-text-color);
  font-size: 14px;
}

.text-error {
  color: #f87171;
}

.text-success {
  color: #22c55e;
}
</style>
