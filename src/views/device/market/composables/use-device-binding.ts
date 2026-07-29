/**
 * Device Binding Composable - 设备绑定逻辑
 *
 * 用于市场解决方案包的设备绑定流程
 */

import { ref, reactive, computed } from 'vue'
import { deviceList, deviceTemplate } from '@/service/api/device'

// ========== Types ==========

/** 设备模板 */
export interface DeviceTemplateItem {
  id: string
  name: string
  deviceType: string
  description?: string
}

/** 本地设备项 */
export interface LocalDevice {
  id: string
  name: string
  templateId: string
  templateName: string
  online: boolean
  status?: string
}

/** 绑定定义 */
export interface BindingDefinition {
  bindingKey: string
  displayName: string
  description?: string
  required: boolean
  deviceTemplateKey?: string
  deviceTemplateName?: string
  compatibilityHint?: string
}

/** 设备绑定项 */
export interface DeviceBinding {
  bindingKey: string
  displayName: string
  description?: string
  required: boolean
  selectedDeviceId: string | null
  selectedDevice: LocalDevice | null
  compatibleDevices: LocalDevice[]
  skipped: boolean
  skipReason?: string
}

/** 看板选择 */
export interface DashboardSelection {
  dashboardKey: string
  dashboardName: string
  bindings: DeviceBinding[]
}

/** 绑定验证结果 */
export interface BindingValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/** 安装状态 */
export type InstallStatus =
  | 'DOWNLOADED'
  | 'VERIFIED'
  | 'MODELS_INSTALLED'
  | 'DASHBOARDS_CREATED'
  | 'WAITING_FOR_BINDINGS'
  | 'COMPLETED'
  | 'FAILED'
  | 'COMPENSATION_REQUIRED'

/** 资源映射 */
export interface ResourceMap {
  deviceTemplates: Array<{ resourceKey: string; localId: string }>
  dashboards: Array<{ resourceKey: string; localId: string }>
}

// ========== Composable ==========

export function useDeviceBinding() {
  // ========== State ==========

  /** 加载状态 */
  const isLoading = ref(false)

  /** 本地设备列表 */
  const localDevices = ref<LocalDevice[]>([])

  /** 本地设备模板列表 */
  const localTemplates = ref<DeviceTemplateItem[]>([])

  /** 当前绑定的设备 */
  const bindings = ref<DeviceBinding[]>([])

  /** 看板选择 */
  const dashboardSelections = ref<DashboardSelection[]>([])

  /** 错误信息 */
  const error = ref<string | null>(null)

  /** 跳过绑定的警告 */
  const skipWarningShown = ref(false)

  // ========== Computed ==========

  /** 已绑定的数量 */
  const boundCount = computed(() => {
    return bindings.value.filter(b => b.selectedDeviceId !== null && !b.skipped).length
  })

  /** 未绑定的数量 */
  const unboundCount = computed(() => {
    return bindings.value.filter(b => b.selectedDeviceId === null && !b.skipped).length
  })

  /** 跳过的数量 */
  const skippedCount = computed(() => {
    return bindings.value.filter(b => b.skipped).length
  })

  /** 必填未绑定的数量 */
  const requiredUnboundCount = computed(() => {
    return bindings.value.filter(b => b.required && b.selectedDeviceId === null && !b.skipped).length
  })

  /** 是否有必填项未绑定 */
  const hasRequiredUnbound = computed(() => requiredUnboundCount.value > 0)

  /** 是否可以继续 (所有必填项已绑定或已跳过) */
  const canProceed = computed(() => !hasRequiredUnbound.value)

  /** 绑定摘要 */
  const bindingSummary = computed(() => {
    const total = bindings.value.length
    const bound = boundCount.value
    const skipped = skippedCount.value
    return { total, bound, skipped, unbound: unboundCount.value }
  })

  // ========== Methods ==========

  /**
   * 加载本地设备列表
   */
  async function loadLocalDevices(templateId?: string): Promise<LocalDevice[]> {
    isLoading.value = true
    error.value = null

    try {
      const res = await deviceList({
        page: 1,
        page_size: 1000,
        template_id: templateId
      })

      if (!res.error) {
        const list = res.data?.list || []
        localDevices.value = list.map((device: any) => ({
          id: device.id,
          name: device.name,
          templateId: device.template_id || device.device_template_id,
          templateName: device.template_name || device.device_template_name || 'Unknown',
          online: device.online === 1 || device.online === true,
          status: device.status
        }))
        return localDevices.value
      } else {
        error.value = res.error?.message || 'Failed to load devices'
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load devices'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载本地设备模板列表
   */
  async function loadLocalTemplates(): Promise<DeviceTemplateItem[]> {
    isLoading.value = true
    error.value = null

    try {
      const res = await deviceTemplate({
        page: 1,
        page_size: 1000
      })

      if (!res.error) {
        const list = res.data?.list || []
        localTemplates.value = list.map((t: any) => ({
          id: t.id,
          name: t.name,
          deviceType: t.device_type,
          description: t.description
        }))
        return localTemplates.value
      } else {
        error.value = res.error?.message || 'Failed to load templates'
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load templates'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 初始化绑定定义
   */
  function initializeBindings(definitionList: BindingDefinition[]): void {
    bindings.value = definitionList.map(def => ({
      bindingKey: def.bindingKey,
      displayName: def.displayName,
      description: def.description,
      required: def.required,
      selectedDeviceId: null,
      selectedDevice: null,
      compatibleDevices: [],
      skipped: false,
      skipReason: undefined
    }))
  }

  /**
   * 为绑定项加载兼容设备
   */
  async function loadCompatibleDevices(bindingKey: string, templateKey?: string): Promise<void> {
    const binding = bindings.value.find(b => b.bindingKey === bindingKey)
    if (!binding) return

    isLoading.value = true

    try {
      let devices: LocalDevice[]

      if (templateKey) {
        // 按模板过滤设备
        devices = localDevices.value.filter(d => {
          // 匹配模板标识
          const match = d.templateId === templateKey || d.templateName.toLowerCase().includes(templateKey.toLowerCase())
          return match
        })

        // 如果本地设备列表为空，先加载
        if (localDevices.value.length === 0) {
          await loadLocalDevices()
          devices = localDevices.value.filter(d => {
            const match =
              d.templateId === templateKey || d.templateName.toLowerCase().includes(templateKey.toLowerCase())
            return match
          })
        }
      } else {
        // 不限制模板，返回所有设备
        if (localDevices.value.length === 0) {
          await loadLocalDevices()
        }
        devices = [...localDevices.value]
      }

      binding.compatibleDevices = devices
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载所有绑定的兼容设备
   */
  async function loadAllCompatibleDevices(): Promise<void> {
    for (const binding of bindings.value) {
      if (binding.deviceTemplateKey) {
        await loadCompatibleDevices(binding.bindingKey, binding.deviceTemplateKey)
      } else {
        binding.compatibleDevices = [...localDevices.value]
      }
    }
  }

  /**
   * 选择设备绑定
   */
  function selectDevice(bindingKey: string, deviceId: string | null): void {
    const binding = bindings.value.find(b => b.bindingKey === bindingKey)
    if (!binding) return

    if (deviceId === null) {
      binding.selectedDeviceId = null
      binding.selectedDevice = null
    } else {
      const device = binding.compatibleDevices.find(d => d.id === deviceId)
      binding.selectedDeviceId = deviceId
      binding.selectedDevice = device || null
    }

    // 清除跳过状态
    binding.skipped = false
    binding.skipReason = undefined
  }

  /**
   * 跳过绑定 (仅允许非必填项)
   */
  function skipBinding(bindingKey: string, reason?: string): boolean {
    const binding = bindings.value.find(b => b.bindingKey === bindingKey)
    if (!binding) return false

    if (binding.required) {
      error.value = 'Cannot skip required binding'
      return false
    }

    binding.skipped = true
    binding.skipReason = reason || 'Skipped by user'
    binding.selectedDeviceId = null
    binding.selectedDevice = null

    return true
  }

  /**
   * 取消跳过
   */
  function unskipBinding(bindingKey: string): void {
    const binding = bindings.value.find(b => b.bindingKey === bindingKey)
    if (!binding) return

    binding.skipped = false
    binding.skipReason = undefined
  }

  /**
   * 验证绑定
   */
  function validateBindings(): BindingValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必填项
    for (const binding of bindings.value) {
      if (binding.required && binding.selectedDeviceId === null && !binding.skipped) {
        errors.push(`Required binding "${binding.displayName}" is not bound`)
      }
    }

    // 检查兼容设备
    for (const binding of bindings.value) {
      if (binding.selectedDeviceId) {
        const isCompatible = binding.compatibleDevices.some(d => d.id === binding.selectedDeviceId)
        if (!isCompatible && binding.compatibleDevices.length > 0) {
          warnings.push(`Device for "${binding.displayName}" may not be compatible`)
        }
      }
    }

    // 检查部分绑定
    if (unboundCount.value > 0 && boundCount.value > 0) {
      warnings.push(`${unboundCount.value} binding(s) are not bound yet`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 生成绑定请求数据
   */
  function generateBindingsRequest(): Array<{ bindingKey: string; deviceId: string }> {
    return bindings.value
      .filter(b => b.selectedDeviceId !== null && !b.skipped)
      .map(b => ({
        bindingKey: b.bindingKey,
        deviceId: b.selectedDeviceId!
      }))
  }

  /**
   * 生成看板选择数据
   */
  function generateDashboardSelections(): Array<{
    dashboardKey: string
    deviceBindings: Array<{ bindingKey: string; deviceId: string }>
  }> {
    return dashboardSelections.value.map(selection => ({
      dashboardKey: selection.dashboardKey,
      deviceBindings: selection.bindings
        .filter(b => b.selectedDeviceId !== null && !b.skipped)
        .map(b => ({
          bindingKey: b.bindingKey,
          deviceId: b.selectedDeviceId!
        }))
    }))
  }

  /**
   * 重置状态
   */
  function reset(): void {
    bindings.value = []
    dashboardSelections.value = []
    error.value = null
    skipWarningShown.value = false
  }

  /**
   * 搜索兼容设备
   */
  function searchCompatibleDevices(bindingKey: string, keyword: string): LocalDevice[] {
    const binding = bindings.value.find(b => b.bindingKey === bindingKey)
    if (!binding) return []

    const lowerKeyword = keyword.toLowerCase()
    return binding.compatibleDevices.filter(
      d => d.name.toLowerCase().includes(lowerKeyword) || d.templateName.toLowerCase().includes(lowerKeyword)
    )
  }

  return {
    // State
    isLoading,
    localDevices,
    localTemplates,
    bindings,
    dashboardSelections,
    error,

    // Computed
    boundCount,
    unboundCount,
    skippedCount,
    requiredUnboundCount,
    hasRequiredUnbound,
    canProceed,
    bindingSummary,

    // Methods
    loadLocalDevices,
    loadLocalTemplates,
    initializeBindings,
    loadCompatibleDevices,
    loadAllCompatibleDevices,
    selectDevice,
    skipBinding,
    unskipBinding,
    validateBindings,
    generateBindingsRequest,
    generateDashboardSelections,
    reset,
    searchCompatibleDevices
  }
}

// ========== Helper Types ==========

/** 看板设备绑定信息 */
export interface DashboardBindingInfo {
  dashboardKey: string
  dashboardName: string
  bindings: Array<{
    bindingKey: string
    displayName: string
    description?: string
    required: boolean
    deviceTemplateKey?: string
    deviceTemplateName?: string
  }>
}

/** 安装向导状态 */
export interface InstallWizardState {
  step: 'browse' | 'confirm' | 'binding' | 'installing' | 'result'
  selectedBundle: {
    bundleKey: string
    version: string
    name: string
    description?: string
    dashboards: DashboardBindingInfo[]
  } | null
  installationId: string | null
  status: InstallStatus | null
  resourceMap: ResourceMap | null
  warnings: string[]
  errors: string[]
}

/** 初始向导状态 */
const initialWizardState: InstallWizardState = {
  step: 'browse',
  selectedBundle: null,
  installationId: null,
  status: null,
  resourceMap: null,
  warnings: [],
  errors: []
}

/** 安装向导 Composable */
export function useInstallWizard() {
  const wizardState = reactive<InstallWizardState>({ ...initialWizardState })

  const {
    loadLocalDevices,
    loadLocalTemplates,
    initializeBindings,
    loadAllCompatibleDevices,
    validateBindings,
    generateDashboardSelections,
    reset: resetBindingState
  } = useDeviceBinding()

  // Computed
  const isInstalling = computed(() => wizardState.step === 'installing')
  const isCompleted = computed(() => wizardState.status === 'COMPLETED')
  const isWaitingForBindings = computed(() => wizardState.status === 'WAITING_FOR_BINDINGS')
  const hasFailed = computed(() => wizardState.status === 'FAILED')

  // Methods
  function selectBundle(bundle: InstallWizardState['selectedBundle']): void {
    wizardState.selectedBundle = bundle
    wizardState.step = 'confirm'
  }

  async function startBinding(): Promise<void> {
    if (!wizardState.selectedBundle) return

    wizardState.step = 'binding'

    // 初始化绑定
    const allBindings = wizardState.selectedBundle.dashboards.flatMap(d => d.bindings)
    initializeBindings(allBindings)

    // 加载兼容设备
    await loadAllCompatibleDevices()
  }

  function goBackToBrowse(): void {
    wizardState.step = 'browse'
    wizardState.selectedBundle = null
  }

  function goBackToConfirm(): void {
    wizardState.step = 'confirm'
  }

  function updateStatus(status: InstallStatus): void {
    wizardState.status = status
  }

  function setInstallationResult(
    installationId: string,
    resourceMap: ResourceMap,
    warnings: string[] = [],
    errors: string[] = []
  ): void {
    wizardState.installationId = installationId
    wizardState.resourceMap = resourceMap
    wizardState.warnings = warnings
    wizardState.errors = errors
    wizardState.step = 'result'
  }

  function reset(): void {
    Object.assign(wizardState, { ...initialWizardState })
    resetBindingState()
  }

  return {
    wizardState,
    isInstalling,
    isCompleted,
    isWaitingForBindings,
    hasFailed,
    selectBundle,
    startBinding,
    goBackToBrowse,
    goBackToConfirm,
    updateStatus,
    setInstallationResult,
    reset
  }
}
