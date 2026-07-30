<script setup lang="ts">
/**
 * InstallationDetail - 已安装 Bundle 详情页面
 *
 * 功能：
 * - 显示已安装 Bundle 的详细信息
 * - 显示设备绑定状态
 * - 允许更新绑定
 * - 显示关联的设备和看板
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NButton,
  NTag,
  NAlert,
  NSpin,
  NEmpty,
  NSpace,
  NGrid,
  NGi,
  NIcon,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NTooltip,
  useMessage
} from 'naive-ui'
import {
  ArrowBackOutline,
  OpenOutline,
  RefreshOutline,
  LinkOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  CloudDownloadOutline
} from '@vicons/ionicons5'
import { $t } from '@/locales'
import {
  getInstallationDetail,
  updateInstallationBindings,
  retryInstallation,
  compensateInstallation,
  type InstalledBundle,
  type MarketApiError,
  getErrorDisplayMessage
} from '@/service/api/market-bundle'
import DeviceBindingWizard from './DeviceBindingWizard.vue'
import type { BindingDefinition } from './composables/use-device-binding'

// ========== Router ==========

const router = useRouter()
const message = useMessage()

// ========== State ==========

/** 加载状态 */
const loading = ref(false)

/** 安装详情 */
const installation = ref<InstalledBundle | null>(null)

/** 安装ID */
const installationId = ref('')

/** 绑定向导可见性 */
const bindingWizardVisible = ref(false)

const bindingDefinitions = computed<BindingDefinition[]>(() =>
  (installation.value?.bindings ?? []).map(binding => ({
    bindingKey: binding.bindingKey,
    displayName: binding.displayName,
    required: binding.required !== false
  }))
)

const initialDeviceBindings = computed(() =>
  (installation.value?.bindings ?? [])
    .filter(binding => Boolean(binding.deviceId))
    .map(binding => ({
      bindingKey: binding.bindingKey,
      deviceId: binding.deviceId!
    }))
)

/** 是否正在更新 */
const isUpdating = ref(false)

/** 错误信息 */
const error = ref<string | null>(null)

// ========== Computed ==========

/** 状态显示信息 */
const statusDisplay = computed(() => {
  if (!installation.value) return null

  const statusMap: Record<string, { type: 'success' | 'info' | 'warning' | 'error'; label: string }> = {
    DOWNLOADED: { type: 'info', label: $t('market.install.status.downloaded') },
    VERIFIED: { type: 'info', label: $t('market.install.status.verified') },
    MODELS_INSTALLED: { type: 'info', label: $t('market.install.status.modelsInstalled') },
    DASHBOARDS_CREATED: { type: 'info', label: $t('market.install.status.dashboardsCreated') },
    WAITING_FOR_BINDINGS: { type: 'warning', label: $t('market.install.status.waitingForBindings') },
    COMPLETED: { type: 'success', label: $t('market.install.status.completed') },
    FAILED: { type: 'error', label: $t('market.install.status.failed') },
    COMPENSATION_REQUIRED: { type: 'error', label: $t('market.install.status.compensationRequired') }
  }

  return statusMap[installation.value.status] || { type: 'info', label: installation.value.status }
})

/** 绑定状态显示 */
const bindingStatusDisplay = computed(() => {
  if (!installation.value) return null

  const statusMap: Record<string, { type: 'success' | 'info' | 'warning' | 'error'; label: string }> = {
    BOUND: { type: 'success', label: $t('market.install.bindingStatus.bound') },
    UNBOUND: { type: 'warning', label: $t('market.install.bindingStatus.unbound') },
    PARTIAL: { type: 'warning', label: $t('market.install.bindingStatus.partial') }
  }

  return statusMap[installation.value.bindingStatus] || { type: 'info', label: installation.value.bindingStatus }
})

/** 是否可以更新绑定 */
const canUpdateBindings = computed(() => {
  return (
    installation.value?.status === 'WAITING_FOR_BINDINGS' ||
    installation.value?.status === 'COMPLETED' ||
    installation.value?.bindingStatus === 'PARTIAL'
  )
})

/** 设备模板列表 */
const deviceTemplateList = computed(() => {
  return installation.value?.deviceTemplates || []
})

/** 看板列表 */
const dashboardList = computed(() => {
  return installation.value?.dashboards || []
})

/** 绑定列表 */
const bindingList = computed(() => {
  return installation.value?.bindings || []
})

/** 未绑定的必填项 */
const unboundRequiredCount = computed(() => {
  return bindingList.value.filter(b => b.required && !b.deviceId).length
})

// ========== Watch ==========

watch(installationId, id => {
  if (id) {
    void fetchInstallationDetail(id)
  }
})

// ========== Methods ==========

/**
 * 获取安装详情
 */
async function fetchInstallationDetail(id: string) {
  loading.value = true
  error.value = null

  try {
    const result = await getInstallationDetail(id)

    if (result.error) {
      error.value = result.error.message
      message.error(result.error.message)
      return
    }

    installation.value = result.data
  } catch (err: any) {
    error.value = err.message || 'Failed to load installation detail'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

/**
 * 跳转到看板
 */
function goToDashboard(dashboardId: string) {
  window.open(`/tv-preview?id=${encodeURIComponent(dashboardId)}`, '_blank', 'noopener,noreferrer')
}

/**
 * 跳转到设备模板
 */
function goToTemplate(templateId: string) {
  router.push({
    name: 'device_template',
    query: { id: templateId }
  })
}

/**
 * 打开绑定向导
 */
function openBindingWizard() {
  if (!installation.value) return

  bindingWizardVisible.value = true
}

/**
 * 处理绑定更新完成
 */
async function handleBindingUpdateComplete(completedBindings: Array<{ bindingKey: string; deviceId: string }>) {
  if (!installation.value) return

  isUpdating.value = true

  try {
    // 构建更新请求
    const updateBindings = installation.value.bindings.map(b => {
      const completedBinding = completedBindings.find(cb => cb.bindingKey === b.bindingKey)
      return {
        bindingKey: b.bindingKey,
        deviceId: completedBinding?.deviceId || null
      }
    })

    const result = await updateInstallationBindings(installation.value.installationId, updateBindings)

    if (result.error) {
      message.error(result.error.message)
      return
    }

    installation.value = result.data
    message.success($t('market.install.bindingUpdateSuccess'))
    bindingWizardVisible.value = false
  } catch (err: any) {
    message.error(err.message || 'Failed to update bindings')
  } finally {
    isUpdating.value = false
  }
}

async function handleRetry() {
  if (!installation.value) return
  const result = await retryInstallation(installation.value.installationId)
  if (result.error) {
    message.error(result.error.message)
    return
  }
  message.success('已重新提交安装')
  await refresh()
}

async function handleCompensate() {
  if (!installation.value) return
  const result = await compensateInstallation(installation.value.installationId)
  if (result.error) {
    message.error(result.error.message)
    return
  }
  message.success('残留资源清理完成')
  await refresh()
}

/**
 * 返回列表
 */
function goBack() {
  router.push({ name: 'device_market' })
}

/**
 * 刷新详情
 */
async function refresh() {
  if (installationId.value) {
    await fetchInstallationDetail(installationId.value)
  }
}

// ========== Props ==========

const props = defineProps<{
  id?: string
}>()

// ========== Lifecycle ==========

onMounted(() => {
  if (props.id) {
    installationId.value = props.id
  }
})

// ========== Expose ==========

defineExpose({
  load: (id: string) => {
    installationId.value = id
  }
})
</script>

<template>
  <div class="installation-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <NButton quaternary @click="goBack">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ $t('common.back') }}
        </NButton>
      </div>
      <div class="header-right">
        <NButton :loading="loading" @click="refresh">
          <template #icon>
            <NIcon><RefreshOutline /></NIcon>
          </template>
          {{ $t('common.refresh') }}
        </NButton>
      </div>
    </div>

    <!-- 加载状态 -->
    <NSpin :show="loading">
      <div v-if="error" class="error-state">
        <NAlert type="error">{{ error }}</NAlert>
      </div>

      <div v-else-if="installation" class="detail-content">
        <!-- 状态卡片 -->
        <NCard class="status-card mb-4">
          <div class="status-header">
            <div class="bundle-info">
              <h2 class="bundle-name">{{ installation.bundleName }}</h2>
              <div class="version-info">
                <NTag type="info" size="small">{{ installation.version }}</NTag>
                <NTag :type="statusDisplay?.type" size="small">
                  {{ statusDisplay?.label }}
                </NTag>
                <NTag :type="bindingStatusDisplay?.type" size="small">
                  {{ bindingStatusDisplay?.label }}
                </NTag>
              </div>
            </div>
            <div class="installed-time">
              {{ $t('market.install.installedAt') }}:
              {{ new Date(installation.installedAt).toLocaleString() }}
            </div>
          </div>

          <!-- 待绑定警告 -->
          <NAlert v-if="installation.status === 'WAITING_FOR_BINDINGS'" type="warning" class="mt-4">
            <template #header>
              <NIcon><AlertCircleOutline /></NIcon>
              {{ $t('market.install.bindingRequired') }}
            </template>
            {{ $t('market.install.bindingRequiredDesc') }}
          </NAlert>

          <!-- 部分绑定警告 -->
          <NAlert v-if="installation.bindingStatus === 'PARTIAL'" type="warning" class="mt-4">
            {{ $t('market.install.partialBindingsDesc') }}
          </NAlert>
        </NCard>

        <!-- 资源概览 -->
        <NGrid :cols="3" :x-gap="16" class="mb-4">
          <NGi>
            <NCard size="small">
              <div class="stat-card">
                <div class="stat-value">{{ deviceTemplateList.length }}</div>
                <div class="stat-label">{{ $t('market.install.deviceTemplates') }}</div>
              </div>
            </NCard>
          </NGi>
          <NGi>
            <NCard size="small">
              <div class="stat-card">
                <div class="stat-value">{{ dashboardList.length }}</div>
                <div class="stat-label">{{ $t('market.install.dashboards') }}</div>
              </div>
            </NCard>
          </NGi>
          <NGi>
            <NCard size="small">
              <div class="stat-card">
                <div class="stat-value">{{ bindingList.filter(b => b.deviceId).length }}/{{ bindingList.length }}</div>
                <div class="stat-label">{{ $t('market.install.bindings') }}</div>
              </div>
            </NCard>
          </NGi>
        </NGrid>

        <!-- 设备模板列表 -->
        <NCard v-if="deviceTemplateList.length > 0" :title="$t('market.install.deviceTemplates')" class="mb-4">
          <template #header-extra>
            <NTooltip>
              <template #trigger>
                <NTag type="info" size="small">{{ deviceTemplateList.length }}</NTag>
              </template>
              {{ $t('market.install.importedFromMarket') }}
            </NTooltip>
          </template>

          <div class="resource-list">
            <div v-for="template in deviceTemplateList" :key="template.resourceKey" class="resource-item">
              <div class="resource-info">
                <NIcon size="20" color="#18a058"><CheckmarkCircleOutline /></NIcon>
                <span class="resource-name">{{ template.name }}</span>
                <span class="resource-key">{{ template.resourceKey }}</span>
              </div>
              <NButton size="small" @click="goToTemplate(template.localId)">
                <template #icon>
                  <NIcon><OpenOutline /></NIcon>
                </template>
                {{ $t('market.install.view') }}
              </NButton>
            </div>
          </div>
        </NCard>

        <!-- 看板列表 -->
        <NCard v-if="dashboardList.length > 0" :title="$t('market.install.dashboards')" class="mb-4">
          <template #header-extra>
            <NTooltip>
              <template #trigger>
                <NTag type="info" size="small">{{ dashboardList.length }}</NTag>
              </template>
              {{ $t('market.install.importedFromMarket') }}
            </NTooltip>
          </template>

          <div class="resource-list">
            <div v-for="dashboard in dashboardList" :key="dashboard.resourceKey" class="resource-item">
              <div class="resource-info">
                <NIcon size="20" color="#18a058"><CheckmarkCircleOutline /></NIcon>
                <span class="resource-name">{{ dashboard.name }}</span>
                <span class="resource-key">{{ dashboard.resourceKey }}</span>
              </div>
              <NButton type="primary" size="small" @click="goToDashboard(dashboard.localId)">
                <template #icon>
                  <NIcon><OpenOutline /></NIcon>
                </template>
                {{ $t('market.install.open') }}
              </NButton>
            </div>
          </div>
        </NCard>

        <!-- 设备绑定列表 -->
        <NCard :title="$t('market.install.deviceBindings')">
          <template #header-extra>
            <NSpace>
              <NTooltip v-if="unboundRequiredCount > 0">
                <template #trigger>
                  <NTag type="error" size="small">
                    <NIcon><AlertCircleOutline /></NIcon>
                    {{ unboundRequiredCount }} {{ $t('market.install.requiredUnbound') }}
                  </NTag>
                </template>
                {{ $t('market.install.requiredUnboundTip') }}
              </NTooltip>
              <NButton v-if="canUpdateBindings" type="primary" size="small" @click="openBindingWizard">
                <template #icon>
                  <NIcon><LinkOutline /></NIcon>
                </template>
                {{ $t('market.install.updateBindings') }}
              </NButton>
            </NSpace>
          </template>

          <div v-if="bindingList.length === 0" class="empty-state">
            <NEmpty :description="$t('market.install.noBindings')" />
          </div>

          <div v-else class="binding-list">
            <div
              v-for="binding in bindingList"
              :key="binding.bindingKey"
              :class="['binding-item', { 'is-unbound': !binding.deviceId }]"
            >
              <div class="binding-info">
                <div class="binding-header">
                  <span class="binding-name">
                    {{ binding.displayName }}
                    <NTag v-if="binding.required" type="error" size="tiny">{{ $t('market.install.required') }}</NTag>
                  </span>
                </div>
                <div class="binding-meta">
                  <span class="binding-key">{{ binding.bindingKey }}</span>
                  <span class="dashboard-ref">
                    <NIcon size="12"><LinkOutline /></NIcon>
                    {{ binding.dashboardKey }}
                  </span>
                </div>
              </div>
              <div class="binding-status">
                <template v-if="binding.deviceId">
                  <NIcon size="16" color="#18a058"><CheckmarkCircleOutline /></NIcon>
                  <span class="device-name">{{ binding.deviceName }}</span>
                </template>
                <template v-else>
                  <NIcon size="16" color="#f0a020"><AlertCircleOutline /></NIcon>
                  <span class="unbound-text">{{ $t('market.install.notBound') }}</span>
                </template>
              </div>
            </div>
          </div>
        </NCard>

        <!-- 底部操作 -->
        <div class="page-actions">
          <NButton
            v-if="installation.status === 'FAILED' || installation.status === 'COMPENSATION_REQUIRED'"
            type="primary"
            @click="handleRetry"
          >
            重试安装
          </NButton>
          <NButton v-if="installation.status === 'COMPENSATION_REQUIRED'" type="warning" @click="handleCompensate">
            清理残留资源
          </NButton>
        </div>
      </div>

      <div v-else class="empty-state">
        <NEmpty :description="$t('market.install.noInstallation')">
          <template #extra>
            <NButton type="primary" @click="goBack">
              {{ $t('market.install.backToList') }}
            </NButton>
          </template>
        </NEmpty>
      </div>
    </NSpin>

    <!-- 绑定向导 -->
    <DeviceBindingWizard
      v-model:model-value="bindingWizardVisible"
      :allow-skip="false"
      :binding-definitions="bindingDefinitions"
      :initial-bindings="initialDeviceBindings"
      @complete="handleBindingUpdateComplete"
      @cancel="bindingWizardVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
.installation-detail {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-state {
  padding: 48px;
}

.status-card {
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .bundle-name {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 12px 0;
    color: #333;
  }

  .version-info {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .installed-time {
    font-size: 14px;
    color: #999;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.resource-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-name {
  font-weight: 500;
  color: #333;
}

.resource-key {
  font-size: 12px;
  color: #999;
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.binding-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #18a058;

  &.is-unbound {
    border-left-color: #f0a020;
    background: #fffbf0;
  }
}

.binding-info {
  flex: 1;
}

.binding-header {
  margin-bottom: 4px;
}

.binding-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333;
}

.binding-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.binding-key {
  font-family: monospace;
}

.dashboard-ref {
  display: flex;
  align-items: center;
  gap: 4px;
}

.binding-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  justify-content: flex-end;
}

.device-name {
  font-size: 14px;
  color: #333;
}

.unbound-text {
  font-size: 14px;
  color: #f0a020;
}

.empty-state {
  padding: 64px;
  text-align: center;
}

.page-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
