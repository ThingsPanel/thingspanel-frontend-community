<script setup lang="ts">
/**
 * InstallWizard - 安装向导组件
 *
 * 完整的安装流程：
 * 1. 确认安装 (显示 Bundle 详情和预览)
 * 2. 设备绑定 (映射 bindingKeys 到本地设备)
 * 3. 安装中 (显示进度)
 * 4. 结果 (显示安装结果)
 */
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NModal,
  NCard,
  NAlert,
  NButton,
  NSpin,
  NSteps,
  NStep,
  NProgress,
  NSpace,
  NGrid,
  NGi,
  NTag,
  NIcon,
  NEmpty,
  NTooltip,
  useMessage,
  useDialog
} from 'naive-ui'
import {
  CloudDownloadOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
  OpenOutline,
  ArrowBackOutline
} from '@vicons/ionicons5'
import { $t } from '@/locales'
import { useDeviceBinding, type DashboardBindingInfo, type DeviceBinding } from './composables/use-device-binding'
import DeviceBindingWizard from './DeviceBindingWizard.vue'
import {
  installBundle,
  pollInstallationStatus,
  getBundlePrecheckInfo,
  type MarketBundleDetail,
  type InstallResult,
  getErrorDisplayMessage,
  type MarketApiError
} from '@/service/api/market-bundle'

// ========== Types ==========

export interface InstallWizardExpose {
  open: (params: InstallParams) => void
  close: () => void
}

export interface InstallParams {
  /** Bundle 详情 */
  bundle: MarketBundleDetail
  /** 选择的版本 */
  version: string
  /** 看板绑定预览 */
  dashboardBindings: DashboardBindingInfo[]
  /** 安装完成回调 */
  onInstalled?: (result: InstallResult) => void
}

/** 安装向导步骤 */
type WizardStep = 'confirm' | 'binding' | 'installing' | 'result'

/** 安装状态信息 */
interface StatusInfo {
  label: string
  description?: string
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

// ========== Props & Emits ==========

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  installed: [result: InstallResult]
  error: [error: MarketApiError]
}>()

// ========== Router ==========

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// ========== Composable ==========

const {
  bindings,
  isLoading: isLoadingDevices,
  loadAllCompatibleDevices,
  initializeBindings,
  generateDashboardSelections,
  reset: resetBindings
} = useDeviceBinding()

// ========== Local State ==========

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

/** 向导步骤 */
const step = ref<WizardStep>('confirm')

/** Bundle 详情 */
const bundleDetail = ref<MarketBundleDetail | null>(null)

/** 选择的版本 */
const selectedVersion = ref('')

/** 看板绑定预览 */
const dashboardBindings = ref<DashboardBindingInfo[]>([])

/** 绑定向导可见性 */
const bindingWizardVisible = ref(false)

/** 是否正在安装 */
const isInstalling = ref(false)

/** 安装结果 */
const installResult = ref<InstallResult | null>(null)

/** 安装错误 */
const installError = ref<MarketApiError | null>(null)

/** 轮询定时器 */
let pollTimer: ReturnType<typeof setTimeout> | null = null

/** 预检信息加载中 */
const isLoadingPrecheck = ref(false)

// ========== Computed ==========

/** 步骤索引 */
const stepIndex = computed(() => {
  const steps: WizardStep[] = ['confirm', 'binding', 'installing', 'result']
  return steps.indexOf(step.value)
})

/** 当前版本信息 */
const currentVersionInfo = computed(() => {
  if (!bundleDetail.value || !selectedVersion.value) return null
  return bundleDetail.value.versions.find(v => v.version === selectedVersion.value)
})

/** 安装状态列表 */
const installStatusList = computed((): StatusInfo[] => {
  return [
    {
      label: $t('market.install.status.downloading'),
      description: $t('market.install.status.downloadingDesc'),
      progress: 0,
      status: 'pending'
    },
    {
      label: $t('market.install.status.verifying'),
      description: $t('market.install.status.verifyingDesc'),
      progress: 0,
      status: 'pending'
    },
    {
      label: $t('market.install.status.installingModels'),
      description: $t('market.install.status.installingModelsDesc'),
      progress: 0,
      status: 'pending'
    },
    {
      label: $t('market.install.status.creatingDashboards'),
      description: $t('market.install.status.creatingDashboardsDesc'),
      progress: 0,
      status: 'pending'
    }
  ]
})

/** 是否显示绑定步骤 */
const hasBindings = computed(() => {
  return dashboardBindings.value.some(d => d.bindings.length > 0)
})

/** 已绑定的数量 */
const boundCount = computed(() => {
  return bindings.value.filter(b => b.selectedDeviceId !== null).length
})

/** 是否可以开始安装 */
const canStartInstall = computed(() => {
  if (!hasBindings.value) return true
  return boundCount.value > 0
})

/** 看板列表 */
const dashboardList = computed(() => {
  return dashboardBindings.value.map(d => ({
    key: d.dashboardKey,
    name: d.dashboardName,
    bindingCount: d.bindings.length
  }))
})

// ========== Watch ==========

watch(
  () => props.modelValue,
  newVal => {
    if (!newVal) {
      handleClose()
    }
  }
)

// ========== Methods ==========

/**
 * 打开向导
 */
function open(params: InstallParams) {
  bundleDetail.value = params.bundle
  selectedVersion.value = params.version
  dashboardBindings.value = params.dashboardBindings
  step.value = 'confirm'
  visible.value = true

  // 初始化绑定
  const allBindings = dashboardBindings.value.flatMap(d => d.bindings)
  initializeBindings(allBindings)
}

/**
 * 关闭向导
 */
function handleClose() {
  visible.value = false
  stopPolling()
  resetState()
}

/**
 * 重置状态
 */
function resetState() {
  step.value = 'confirm'
  bundleDetail.value = null
  selectedVersion.value = ''
  dashboardBindings.value = []
  isInstalling.value = false
  installResult.value = null
  installError.value = null
  resetBindings()
}

/**
 * 加载预检信息
 */
async function loadPrecheckInfo() {
  if (!bundleDetail.value) return

  isLoadingPrecheck.value = true
  try {
    const result = await getBundlePrecheckInfo(bundleDetail.value.bundleKey, {
      version: selectedVersion.value
    })

    if (result.data) {
      // 更新绑定预览
      if (result.data.bindingPreview) {
        dashboardBindings.value = result.data.bindingPreview
        initializeBindings(result.data.bindingPreview.flatMap(d => d.bindings))
      }
    }
  } catch (err) {
    console.error('Failed to load precheck info:', err)
  } finally {
    isLoadingPrecheck.value = false
  }
}

/**
 * 进入绑定步骤
 */
async function goToBinding() {
  step.value = 'binding'

  // 加载兼容设备
  await loadAllCompatibleDevices()
  bindingWizardVisible.value = true
}

/**
 * 返回确认步骤
 */
function goBackToConfirm() {
  step.value = 'confirm'
}

/**
 * 处理绑定完成
 */
function handleBindingComplete(completedBindings: Array<{ bindingKey: string; deviceId: string }>) {
  bindingWizardVisible.value = false
  step.value = 'installing'

  // 开始安装
  void startInstallation()
}

/**
 * 处理绑定取消
 */
function handleBindingCancel() {
  bindingWizardVisible.value = false
}

/**
 * 开始安装
 */
async function startInstallation() {
  if (!bundleDetail.value) return

  isInstalling.value = true
  installError.value = null

  try {
    // 生成看板选择数据
    const dashboardSelections = generateDashboardSelections()

    // 调用安装 API
    const result = await installBundle({
      bundleKey: bundleDetail.value.bundleKey,
      version: selectedVersion.value,
      dashboardSelections: dashboardSelections.length > 0 ? dashboardSelections : undefined
    })

    if (result.error) {
      installError.value = result.error
      step.value = 'result'
      return
    }

    installResult.value = result.data

    // 根据状态处理
    if (result.data?.status === 'WAITING_FOR_BINDINGS') {
      // 需要继续绑定
      step.value = 'result'
    } else if (result.data?.status === 'COMPLETED') {
      // 安装完成
      step.value = 'result'
      emit('installed', result.data!)
    } else if (result.data?.status === 'FAILED') {
      // 安装失败
      step.value = 'result'
    } else {
      // 轮询状态
      if (result.data?.installationId) {
        startPolling(result.data.installationId)
      }
    }
  } catch (err: any) {
    installError.value = {
      code: 'INSTALL_ERROR',
      message: err.message || 'Installation failed',
      httpStatus: 500
    }
    step.value = 'result'
  } finally {
    isInstalling.value = false
  }
}

/**
 * 开始轮询状态
 */
function startPolling(installationId: string) {
  const poll = async () => {
    try {
      const result = await pollInstallationStatus(installationId)

      if (result.error) {
        stopPolling()
        installError.value = result.error
        step.value = 'result'
        return
      }

      if (result.data) {
        // 更新状态
        if (result.data.status === 'COMPLETED') {
          stopPolling()
          // 获取完整结果
          installResult.value = {
            ...(installResult.value || {}),
            status: 'COMPLETED'
          } as InstallResult
          step.value = 'result'
          emit('installed', installResult.value!)
        } else if (result.data.status === 'FAILED' || result.data.status === 'WAITING_FOR_BINDINGS') {
          stopPolling()
          installResult.value = {
            ...(installResult.value || {}),
            status: result.data.status
          } as InstallResult
          step.value = 'result'
        }
      }
    } catch (err) {
      console.error('Poll error:', err)
    }

    // 继续轮询
    if (step.value === 'installing') {
      pollTimer = setTimeout(poll, 2000)
    }
  }

  pollTimer = setTimeout(poll, 1000)
}

/**
 * 停止轮询
 */
function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

/**
 * 跳转到看板
 */
function goToDashboard(dashboardId: string) {
  handleClose()
  router.push({
    name: 'visualization_thingsvis',
    query: { id: dashboardId }
  })
}

/**
 * 跳转到设备模板
 */
function goToTemplate(templateId: string) {
  handleClose()
  router.push({
    name: 'device_template',
    query: { id: templateId }
  })
}

/**
 * 继续绑定
 */
function continueBinding() {
  step.value = 'binding'
  bindingWizardVisible.value = true
}

/**
 * 打开看板
 */
function openDashboard() {
  if (installResult.value?.resourceMap?.dashboards?.[0]) {
    goToDashboard(installResult.value.resourceMap.dashboards[0].localId)
  }
}

/**
 * 查看已安装列表
 */
function viewInstalledList() {
  handleClose()
  router.push({ name: 'device_market-installed' })
}

/**
 * 获取错误消息
 */
function getErrorMessage(error: MarketApiError | null): string {
  if (!error) return ''
  const display = getErrorDisplayMessage(error, 'zh')
  return display.description || error.message
}

// ========== Expose ==========

defineExpose({
  open,
  close: handleClose
} as InstallWizardExpose)
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('market.install.installTitle')"
    class="install-wizard-modal"
    :mask-closable="false"
    :closable="step !== 'installing'"
    style="width: 800px; max-width: 95vw"
    :trap-focus="true"
  >
    <div class="install-wizard">
      <!-- 步骤指示器 -->
      <NSteps v-if="step !== 'result'" :current="stepIndex" class="mb-6" status="process">
        <NStep :title="$t('market.install.stepConfirm')" />
        <NStep v-if="hasBindings" :title="$t('market.install.stepBinding')" />
        <NStep :title="$t('market.install.stepInstalling')" />
        <NStep :title="$t('market.install.stepResult')" />
      </NSteps>

      <!-- Step 1: 确认安装 -->
      <div v-if="step === 'confirm'" class="step-content">
        <NAlert type="info" class="mb-4">
          {{ $t('market.install.confirmTip') }}
        </NAlert>

        <!-- Bundle 详情卡片 -->
        <NCard :title="bundleDetail?.name" class="mb-4">
          <template #header-extra>
            <NTag type="success">{{ selectedVersion }}</NTag>
          </template>

          <div class="bundle-info">
            <div class="info-row">
              <span class="label">{{ $t('market.install.category') }}:</span>
              <span class="value">{{ bundleDetail?.category }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('market.install.author') }}:</span>
              <span class="value">{{ bundleDetail?.author || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('market.install.description') }}:</span>
              <span class="value">{{ bundleDetail?.description || '-' }}</span>
            </div>
          </div>

          <template v-if="currentVersionInfo">
            <NDivider>{{ $t('market.install.versionInfo') }}</NDivider>

            <div class="version-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">{{ $t('market.install.deviceTemplateCount') }}</span>
                  <span class="info-value">{{ currentVersionInfo.deviceTemplateCount }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('market.install.dashboardCount') }}</span>
                  <span class="info-value">{{ currentVersionInfo.dashboardCount }}</span>
                </div>
              </div>

              <!-- 插件要求 -->
              <div v-if="currentVersionInfo.compatibility.requiredPlugins?.length" class="plugins-section">
                <div class="section-title">{{ $t('market.install.requiredPlugins') }}</div>
                <NSpace>
                  <NTag
                    v-for="plugin in currentVersionInfo.compatibility.requiredPlugins"
                    :key="plugin.key"
                    :type="plugin.version ? 'info' : 'warning'"
                    size="small"
                  >
                    {{ plugin.name }}{{ plugin.version ? ` (≥${plugin.version})` : '' }}
                  </NTag>
                </NSpace>
              </div>
            </div>
          </template>
        </NCard>

        <!-- 看板预览 -->
        <NCard
          v-if="dashboardBindings.length > 0"
          :title="$t('market.install.dashboardPreview')"
          size="small"
          class="mb-4"
        >
          <div class="dashboard-list">
            <div v-for="db in dashboardBindings" :key="db.dashboardKey" class="dashboard-item">
              <div class="dashboard-name">{{ db.dashboardName }}</div>
              <div class="binding-count">
                {{ $t('market.install.bindingCount', { count: db.bindings.length }) }}
              </div>
              <div class="binding-list">
                <NTag
                  v-for="binding in db.bindings"
                  :key="binding.bindingKey"
                  size="tiny"
                  :type="binding.required ? 'error' : 'default'"
                >
                  {{ binding.displayName }}
                  <span v-if="binding.required" class="required-mark">*</span>
                </NTag>
              </div>
            </div>
          </div>
        </NCard>

        <div class="step-actions">
          <NButton @click="handleClose">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="hasBindings ? goToBinding() : ((step = 'installing'), startInstallation())">
            {{ hasBindings ? $t('market.install.startBinding') : $t('market.install.startInstall') }}
          </NButton>
        </div>
      </div>

      <!-- Step 2: 设备绑定 (通过 DeviceBindingWizard) -->
      <div v-if="step === 'binding'" class="step-content">
        <NAlert type="info" class="mb-4">
          {{ $t('market.install.bindingTip') }}
        </NAlert>

        <!-- 绑定摘要 -->
        <div class="binding-summary">
          <div class="summary-item">
            <span class="summary-value">{{ dashboardBindings.length }}</span>
            <span class="summary-label">{{ $t('market.install.dashboardCount') }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">{{ bindings.length }}</span>
            <span class="summary-label">{{ $t('market.install.totalBindings') }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">{{ bindings.filter(b => b.required).length }}</span>
            <span class="summary-label">{{ $t('market.install.requiredBindings') }}</span>
          </div>
        </div>

        <div class="step-actions">
          <NButton @click="goBackToConfirm">
            <template #icon>
              <NIcon><ArrowBackOutline /></NIcon>
            </template>
            {{ $t('common.back') }}
          </NButton>
          <NButton type="primary" @click="bindingWizardVisible = true">
            {{ $t('market.install.openBindingWizard') }}
          </NButton>
        </div>
      </div>

      <!-- Step 3: 安装中 -->
      <div v-if="step === 'installing'" class="step-content">
        <div class="installing-state">
          <NSpin :show="true" description="">
            <div class="installing-animation">
              <NIcon size="64" color="#18a058">
                <CloudDownloadOutline />
              </NIcon>
            </div>
            <div class="installing-text">{{ $t('market.install.installing') }}</div>
            <div class="installing-subtext">{{ $t('market.install.pleaseWait') }}</div>
          </NSpin>
        </div>
      </div>

      <!-- Step 4: 结果 -->
      <div v-if="step === 'result'" class="step-content">
        <!-- 成功状态 -->
        <div v-if="installResult?.status === 'COMPLETED'" class="result-content success">
          <div class="result-icon success">
            <NIcon size="64"><CheckmarkCircleOutline /></NIcon>
          </div>
          <div class="result-title">{{ $t('market.install.installSuccess') }}</div>
          <div class="result-subtitle">{{ $t('market.install.installSuccessDesc') }}</div>

          <!-- 资源映射 -->
          <NCard v-if="installResult.resourceMap" :title="$t('market.install.installedResources')" class="mt-4">
            <div class="resource-map">
              <div v-if="installResult.resourceMap.deviceTemplates.length > 0" class="resource-section">
                <div class="section-title">{{ $t('market.install.deviceTemplates') }}</div>
                <div v-for="t in installResult.resourceMap.deviceTemplates" :key="t.resourceKey" class="resource-item">
                  <span class="resource-name">{{ t.resourceKey }}</span>
                  <NButton size="tiny" quaternary @click="goToTemplate(t.localId)">
                    {{ $t('market.install.viewTemplate') }}
                  </NButton>
                </div>
              </div>
              <div v-if="installResult.resourceMap.dashboards.length > 0" class="resource-section">
                <div class="section-title">{{ $t('market.install.dashboards') }}</div>
                <div v-for="d in installResult.resourceMap.dashboards" :key="d.resourceKey" class="resource-item">
                  <span class="resource-name">{{ d.resourceKey }}</span>
                  <NButton size="tiny" type="primary" @click="goToDashboard(d.localId)">
                    {{ $t('market.install.openDashboard') }}
                  </NButton>
                </div>
              </div>
            </div>
          </NCard>

          <div class="result-actions">
            <NButton @click="viewInstalledList">{{ $t('market.install.viewInstalledList') }}</NButton>
            <NButton v-if="installResult.resourceMap?.dashboards?.[0]" type="primary" @click="openDashboard">
              <template #icon>
                <NIcon><OpenOutline /></NIcon>
              </template>
              {{ $t('market.install.openFirstDashboard') }}
            </NButton>
          </div>
        </div>

        <!-- 待绑定状态 -->
        <div v-else-if="installResult?.status === 'WAITING_FOR_BINDINGS'" class="result-content warning">
          <div class="result-icon warning">
            <NIcon size="64"><AlertCircleOutline /></NIcon>
          </div>
          <div class="result-title">{{ $t('market.install.waitingForBindings') }}</div>
          <div class="result-subtitle">{{ $t('market.install.waitingForBindingsDesc') }}</div>

          <NAlert type="warning" class="mt-4">
            {{ $t('market.install.bindingRequiredToUse') }}
          </NAlert>

          <div class="result-actions">
            <NButton @click="viewInstalledList">{{ $t('market.install.viewInstalledList') }}</NButton>
            <NButton type="primary" @click="continueBinding">
              {{ $t('market.install.continueBinding') }}
            </NButton>
          </div>
        </div>

        <!-- 失败状态 -->
        <div v-else class="result-content error">
          <div class="result-icon error">
            <NIcon size="64"><AlertCircleOutline /></NIcon>
          </div>
          <div class="result-title">{{ $t('market.install.installFailed') }}</div>
          <div class="result-subtitle">{{ getErrorMessage(installError) }}</div>

          <NAlert v-if="installError" type="error" class="mt-4">
            <template #header>{{ installError.code }}</template>
            {{ installError.message }}
          </NAlert>

          <div class="result-actions">
            <NButton @click="handleClose">{{ $t('common.close') }}</NButton>
            <NButton type="primary" @click="startInstallation">
              {{ $t('market.install.retry') }}
            </NButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备绑定向导 -->
    <DeviceBindingWizard
      v-model:model-value="bindingWizardVisible"
      @complete="handleBindingComplete"
      @cancel="handleBindingCancel"
    />
  </NModal>
</template>

<style scoped lang="scss">
.install-wizard-modal {
  :deep(.n-card__content) {
    padding: 16px;
  }
}

.install-wizard {
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

.bundle-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .label {
    flex-shrink: 0;
    color: #666;
    min-width: 80px;
  }

  .value {
    color: #333;
    word-break: break-word;
  }
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.plugins-section {
  margin-top: 8px;
}

.section-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.dashboard-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.dashboard-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.binding-count {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.binding-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.required-mark {
  color: #d03050;
  margin-left: 2px;
}

.binding-summary {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.summary-label {
  font-size: 12px;
  color: #666;
}

.installing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
}

.installing-animation {
  margin-bottom: 24px;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.installing-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.installing-subtext {
  font-size: 14px;
  color: #999;
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 0;
}

.result-icon {
  margin-bottom: 16px;

  &.success {
    color: #18a058;
  }

  &.warning {
    color: #f0a020;
  }

  &.error {
    color: #d03050;
  }
}

.result-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.result-subtitle {
  font-size: 14px;
  color: #666;
}

.resource-map {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-section {
  .section-title {
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }
}

.resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
}

.resource-name {
  font-size: 13px;
  color: #333;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}
</style>
