<script setup lang="ts">
/**
 * DeviceBindingWizard - 设备绑定向导组件
 * 
 * 用于在安装市场解决方案包时，将 bundle 中的设备绑定映射到本地设备
 */
import { ref, computed, watch } from 'vue'
import {
  NCard,
  NAlert,
  NButton,
  
  NInput,
  NIcon,
  NSpin,
  NEmpty,
  NSpace,
  NTag,
  
  
  
} from 'naive-ui'
import { SearchOutline, LinkOutline, AlertCircleOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import { useDeviceBinding, type LocalDevice, type DeviceBinding, type DashboardSelection } from './composables/use-device-binding'

// ========== Props & Emits ==========

export interface BindingWizardExpose {
  open: (params: BindingWizardParams) => void
  close: () => void
}

export interface BindingWizardParams {
  /** 看板选择列表 */
  dashboardSelections: DashboardSelection[]
  /** 是否允许跳过非必填项 */
  allowSkip?: boolean
  /** 完成回调 */
  onComplete?: (bindings: Array<{ bindingKey: string; deviceId: string }>) => void
  /** 取消回调 */
  onCancel?: () => void
}

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {
  allowSkip: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'complete': [bindings: Array<{ bindingKey: string; deviceId: string }>]
  'cancel': []
}>()

// ========== Composable ==========

const {
  isLoading,
  bindings,
  error,
  boundCount,
  unboundCount,
  skippedCount,
  hasRequiredUnbound,
  canProceed,
  bindingSummary,
  loadAllCompatibleDevices,
  selectDevice,
  skipBinding,
  unskipBinding,
  validateBindings,
  generateBindingsRequest,
  reset
} = useDeviceBinding()

// ========== Local State ==========

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 搜索关键词 */
const searchKeywords = ref<Record<string, string>>({})

/** 选中的设备ID */
const selectedDeviceIds = ref<Record<string, string | null>>({})

/** 当前展开的看板 */
const expandedDashboards = ref<string[]>([])

/** 初始化状态 */
const isInitialized = ref(false)

// ========== Computed ==========

/** 所有必填项是否已绑定 */
const allRequiredBound = computed(() => !hasRequiredUnbound.value)

/** 绑定进度 */
const bindingProgress = computed(() => {
  const total = bindings.value.length
  const bound = boundCount.value
  const skipped = skippedCount.value
  return total > 0 ? Math.round(((bound + skipped) / total) * 100) : 0
})

/** 是否可以完成 */
const canComplete = computed(() => {
  return canProceed.value && boundCount.value > 0
})

// ========== Watch ==========

watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      isInitialized.value = true
      await loadAllCompatibleDevices()
      initializeSelections()
    } else {
      handleClose()
    }
  }
)

// ========== Methods ==========

/**
 * 初始化选择状态
 */
function initializeSelections() {
  selectedDeviceIds.value = {}
  searchKeywords.value = {}
  
  for (const binding of bindings.value) {
    selectedDeviceIds.value[binding.bindingKey] = binding.selectedDeviceId
    searchKeywords.value[binding.bindingKey] = ''
    
    // 默认展开第一个看板
    if (expandedDashboards.value.length === 0 && binding.compatibleDevices.length > 0) {
      const dashboard = bindings.value.find(b => b.bindingKey === binding.bindingKey)
      if (dashboard) {
        const parentDashboard = findParentDashboard(binding.bindingKey)
        if (parentDashboard && !expandedDashboards.value.includes(parentDashboard.dashboardKey)) {
          expandedDashboards.value.push(parentDashboard.dashboardKey)
        }
      }
    }
  }
}

/**
 * 查找父看板
 */
function findParentDashboard(bindingKey: string): DashboardSelection | undefined {
  // 这里假设 bindings 包含对 dashboardSelections 的引用
  // 实际实现中可能需要通过其他方式关联
  return undefined
}

/**
 * 获取绑定的兼容设备（过滤后）
 */
function getFilteredDevices(binding: DeviceBinding): LocalDevice[] {
  const keyword = searchKeywords.value[binding.bindingKey] || ''
  if (!keyword) {
    return binding.compatibleDevices
  }
  
  const lowerKeyword = keyword.toLowerCase()
  return binding.compatibleDevices.filter(
    (d) =>
      d.name.toLowerCase().includes(lowerKeyword) ||
      d.templateName.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 处理设备选择
 */
function handleDeviceSelect(bindingKey: string, deviceId: string | null) {
  selectDevice(bindingKey, deviceId)
  selectedDeviceIds.value[bindingKey] = deviceId
}

/**
 * 处理跳过
 */
function handleSkip(binding: DeviceBinding) {
  if (binding.required) return
  
  const reason = $t('market.install.skipBindingReason') || 'Skipped by user'
  const success = skipBinding(binding.bindingKey, reason)
  if (success) {
    selectedDeviceIds.value[binding.bindingKey] = null
  }
}

/**
 * 处理取消跳过
 */
function handleUnskip(binding: DeviceBinding) {
  unskipBinding(binding.bindingKey)
}

/**
 * 处理完成
 */
function handleComplete() {
  const validation = validateBindings()
  
  if (!validation.isValid) {
    window.$message?.error($t('market.install.requiredBindingsNotBound'))
    return
  }
  
  const bindingsRequest = generateBindingsRequest()
  emit('complete', bindingsRequest)
  handleClose()
}

/**
 * 处理取消
 */
function handleCancel() {
  emit('cancel')
  handleClose()
}

/**
 * 关闭
 */
function handleClose() {
  visible.value = false
  reset()
  isInitialized.value = false
  searchKeywords.value = {}
  selectedDeviceIds.value = {}
  expandedDashboards.value = []
}

/**
 * 获取设备状态标签类型
 */
function getDeviceStatusType(online: boolean): 'success' | 'default' {
  return online ? 'success' : 'default'
}

/**
 * 获取设备状态文本
 */
function getDeviceStatusText(online: boolean): string {
  return online ? $t('device.online') : $t('device.offline')
}

/**
 * 获取设备选择选项
 */
function getDeviceOptions(binding: DeviceBinding) {
  const devices = getFilteredDevices(binding)
  return devices.map((device) => ({
    label: device.name,
    value: device.id,
    disabled: false
  }))
}

/**
 * 获取绑定状态图标
 */
function getBindingStatusIcon(binding: DeviceBinding): string {
  if (binding.skipped) return 'skip'
  if (binding.selectedDeviceId) return 'bound'
  return 'unbound'
}

/**
 * 获取绑定状态颜色
 */
function getBindingStatusColor(binding: DeviceBinding): string {
  if (binding.skipped) return 'warning'
  if (binding.selectedDeviceId) return 'success'
  if (binding.required) return 'error'
  return 'default'
}

// ========== Expose ==========

defineExpose({
  open: (params: BindingWizardParams) => {
    visible.value = true
  },
  close: handleClose
} as BindingWizardExpose)
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('market.install.bindDevices')"
    class="device-binding-wizard-modal"
    :mask-closable="false"
    :closable="true"
    style="width: 900px; max-width: 95vw"
    :trap-focus="true"
  >
    <div class="binding-wizard">
      <!-- 绑定进度 -->
      <div class="binding-progress">
        <div class="progress-info">
          <span class="progress-label">{{ $t('market.install.bindingProgress') }}</span>
          <span class="progress-value">
            {{ boundCount + skippedCount }} / {{ bindings.length }}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${bindingProgress}%` }"></div>
        </div>
        <div v-if="unboundCount > 0" class="progress-tip">
          <NIcon size="14" color="#f0a020"><AlertCircleOutline /></NIcon>
          <span>{{ $t('market.install.unboundCountTip', { count: unboundCount }) }}</span>
        </div>
      </div>

      <!-- 必填项警告 -->
      <NAlert v-if="hasRequiredUnbound" type="error" class="mb-4">
        {{ $t('market.install.requiredBindingsNotBound') }}
      </NAlert>

      <!-- 绑定列表 -->
      <NSpin :show="isLoading && isInitialized">
        <div v-if="bindings.length === 0 && !isLoading" class="empty-state">
          <NEmpty :description="$t('market.install.noBindingsRequired')">
            <template #extra>
              <NButton type="primary" @click="handleComplete">
                {{ $t('common.confirm') }}
              </NButton>
            </template>
          </NEmpty>
        </div>

        <div v-else class="binding-list">
          <NCard
            v-for="binding in bindings"
            :key="binding.bindingKey"
            :class="['binding-card', { 'is-skipped': binding.skipped, 'is-required': binding.required }]"
            size="small"
          >
            <div class="binding-header">
              <div class="binding-info">
                <div class="binding-name">
                  <span v-if="binding.required" class="required-mark">*</span>
                  {{ binding.displayName }}
                </div>
                <div v-if="binding.description" class="binding-description">
                  {{ binding.description }}
                </div>
                <div v-if="binding.compatibleDevices.length > 0" class="binding-hint">
                  <NIcon size="12"><LinkOutline /></NIcon>
                  <span>{{ $t('market.install.templateCompatibleTip', { template: binding.deviceTemplateName || 'Any' }) }}</span>
                </div>
              </div>
              <div class="binding-status">
                <NTag
                  v-if="binding.skipped"
                  type="warning"
                  size="small"
                >
                  {{ $t('market.install.skipped') }}
                </NTag>
                <NTag
                  v-else-if="binding.selectedDeviceId"
                  type="success"
                  size="small"
                >
                  {{ $t('market.install.bound') }}
                </NTag>
                <NTag
                  v-else-if="binding.required"
                  type="error"
                  size="small"
                >
                  {{ $t('market.install.unbound') }}
                </NTag>
                <NTag
                  v-else
                  type="default"
                  size="small"
                >
                  {{ $t('market.install.optional') }}
                </NTag>
              </div>
            </div>

            <!-- 设备选择 -->
            <div class="binding-content">
              <template v-if="binding.skipped">
                <div class="skipped-state">
                  <span class="skip-reason">{{ binding.skipReason }}</span>
                  <NButton size="small" @click="handleUnskip(binding)">
                    {{ $t('market.install.cancelSkip') }}
                  </NButton>
                </div>
              </template>
              
              <template v-else>
                <!-- 搜索框 -->
                <div v-if="binding.compatibleDevices.length > 0" class="device-search">
                  <NInput
                    v-model:value="searchKeywords[binding.bindingKey]"
                    :placeholder="$t('market.install.searchDevicePlaceholder')"
                    clearable
                    size="small"
                  >
                    <template #prefix>
                      <NIcon><SearchOutline /></NIcon>
                    </template>
                  </NInput>
                </div>

                <!-- 设备列表 -->
                <div v-if="binding.compatibleDevices.length > 0" class="device-list">
                  <div
                    v-for="device in getFilteredDevices(binding)"
                    :key="device.id"
                    :class="[
                      'device-item',
                      { 'is-selected': selectedDeviceIds[binding.bindingKey] === device.id }
                    ]"
                    @click="handleDeviceSelect(binding.bindingKey, device.id)"
                  >
                    <div class="device-info">
                      <div class="device-name">{{ device.name }}</div>
                      <div class="device-meta">
                        <span class="device-template">{{ device.templateName }}</span>
                      </div>
                    </div>
                    <div class="device-status">
                      <NTag :type="getDeviceStatusType(device.online)" size="tiny">
                        {{ getDeviceStatusText(device.online) }}
                      </NTag>
                    </div>
                    <div v-if="selectedDeviceIds[binding.bindingKey] === device.id" class="selected-indicator">
                      <NIcon color="#18a058"><CheckmarkCircleOutline /></NIcon>
                    </div>
                  </div>

                  <div v-if="getFilteredDevices(binding).length === 0 && searchKeywords[binding.bindingKey]" class="no-results">
                    {{ $t('market.install.noDeviceFound') }}
                  </div>
                </div>

                <!-- 无可用设备 -->
                <div v-else-if="binding.compatibleDevices.length === 0" class="no-devices">
                  <NEmpty size="small" :description="$t('market.install.noCompatibleDevice')">
                    <template #extra>
                      <NSpace v-if="allowSkip && !binding.required" :size="12">
                        <NButton size="small" @click="handleSkip(binding)">
                          {{ $t('market.install.skipForNow') }}
                        </NButton>
                      </NSpace>
                    </template>
                  </NEmpty>
                </div>

                <!-- 操作按钮 -->
                <div v-if="binding.compatibleDevices.length > 0 && allowSkip && !binding.required" class="binding-actions">
                  <NButton
                    v-if="selectedDeviceIds[binding.bindingKey]"
                    size="small"
                    quaternary
                    @click="handleDeviceSelect(binding.bindingKey, null)"
                  >
                    {{ $t('market.install.clearSelection') }}
                  </NButton>
                  <NButton
                    v-else
                    size="small"
                    quaternary
                    @click="handleSkip(binding)"
                  >
                    {{ $t('market.install.skipForNow') }}
                  </NButton>
                </div>
              </template>
            </div>
          </NCard>
        </div>
      </NSpin>

      <!-- 底部操作 -->
      <div class="wizard-footer">
        <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
        <NSpace>
          <NButton :disabled="!canComplete" @click="handleComplete">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </div>
    </div>
  </NModal>
</template>

<style scoped lang="scss">
.device-binding-wizard-modal {
  :deep(.n-card__content) {
    padding: 16px;
  }
}

.binding-wizard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.binding-progress {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #666;
}

.progress-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #18a058, #36ad6a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #f0a020;
}

.empty-state {
  padding: 48px 0;
  text-align: center;
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.binding-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #18a058;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.is-required {
    border-left: 3px solid #d03050;
  }

  &.is-skipped {
    opacity: 0.7;
    background: #fafafa;
  }
}

.binding-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.binding-info {
  flex: 1;
}

.binding-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;

  .required-mark {
    color: #d03050;
    margin-right: 4px;
  }
}

.binding-description {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.binding-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.binding-status {
  flex-shrink: 0;
}

.binding-content {
  position: relative;
}

.device-search {
  margin-bottom: 12px;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.device-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #18a058;
  }

  &.is-selected {
    background: #e8f5e9;
    border-color: #18a058;
  }
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.device-template {
  font-size: 12px;
  color: #999;
}

.device-status {
  flex-shrink: 0;
  margin-left: 12px;
}

.selected-indicator {
  flex-shrink: 0;
  margin-left: 8px;
}

.no-results {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
}

.no-devices {
  padding: 16px;
  text-align: center;
}

.skipped-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fff8e1;
  border-radius: 6px;
}

.skip-reason {
  font-size: 13px;
  color: #b76e00;
}

.binding-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
