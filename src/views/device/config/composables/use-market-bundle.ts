/**
 * Market Bundle Composable - 市场解决方案包发布状态管理
 */

import { ref, computed, reactive } from 'vue'
import { useMarketAuth } from './use-market-auth'
import type {
  BundleMetadata,
  BundleSource,
  PrecheckResult,
  PublishDraftResponse,
  PublishedBundle,
  InstallResult
} from '@/service/api/market-bundle'
import {
  createPublishDraft,
  confirmPublish,
  cancelDraft,
  getBundleVersions,
  installBundle,
  checkBundleVersionExists,
  getErrorDisplayMessage,
  isBlockingResult,
  canPublish,
  categorizePrecheckResults,
  type MarketApiError
} from '@/service/api/market-bundle'
import type { Locale } from '~/src/locales/locale'

// ========== Constants ==========

const CONTRACT_VERSION = '1.0'
const BUNDLE_KIND = 'solution-bundle'

// ========== Publish Wizard State ==========

export interface PublishWizardState {
  step: 'select-resources' | 'metadata' | 'precheck' | 'confirm' | 'result'
  selectedResources: {
    deviceTemplateIds: string[]
    dashboardIds: string[]
  }
  metadata: BundleMetadata
  draftId: string | null
  idempotencyKey: string | null
  precheckResults: PublishDraftResponse | null
  publishResult: PublishedBundle | null
  isLoading: boolean
  isSubmitting: boolean
  error: MarketApiError | null
}

const initialWizardState: PublishWizardState = {
  step: 'select-resources',
  selectedResources: {
    deviceTemplateIds: [],
    dashboardIds: []
  },
  metadata: {
    name: '',
    category: '',
    description: ''
  },
  draftId: null,
  idempotencyKey: null,
  precheckResults: null,
  publishResult: null,
  isLoading: false,
  isSubmitting: false,
  error: null
}

// ========== Composable ==========

export function useMarketBundle() {
  const { isLoggedIn, getToken, clearToken } = useMarketAuth()

  // Wizard state
  const wizardState = reactive<PublishWizardState>({ ...initialWizardState })

  // Computed
  const hasSelectedResources = computed(() => {
    return (
      wizardState.selectedResources.deviceTemplateIds.length > 0 ||
      wizardState.selectedResources.dashboardIds.length > 0
    )
  })

  const canProceedFromResources = computed(() => {
    return hasSelectedResources.value
  })

  const canProceedFromMetadata = computed(() => {
    const { metadata } = wizardState
    return metadata.name.trim().length > 0 && metadata.category.trim().length > 0
  })

  const precheckErrors = computed(() => {
    if (!wizardState.precheckResults) return []
    return categorizePrecheckResults(wizardState.precheckResults.checks).errors
  })

  const precheckWarnings = computed(() => {
    if (!wizardState.precheckResults) return []
    return categorizePrecheckResults(wizardState.precheckResults.checks).warnings
  })

  const precheckPasses = computed(() => {
    if (!wizardState.precheckResults) return []
    return categorizePrecheckResults(wizardState.precheckResults.checks).passes
  })

  const canConfirmPublish = computed(() => {
    if (!wizardState.precheckResults) return false
    return canPublish(wizardState.precheckResults.checks)
  })

  const hasBlockingErrors = computed(() => {
    return precheckErrors.value.some(isBlockingResult)
  })

  // Actions

  /**
   * 重置发布向导状态
   */
  function resetWizard() {
    Object.assign(wizardState, { ...initialWizardState })
  }

  /**
   * 设置选中的资源
   */
  function setSelectedResources(source: BundleSource) {
    wizardState.selectedResources = { ...source }
  }

  /**
   * 添加设备模板
   */
  function addDeviceTemplate(id: string) {
    if (!wizardState.selectedResources.deviceTemplateIds.includes(id)) {
      wizardState.selectedResources.deviceTemplateIds.push(id)
    }
  }

  /**
   * 移除设备模板
   */
  function removeDeviceTemplate(id: string) {
    const index = wizardState.selectedResources.deviceTemplateIds.indexOf(id)
    if (index > -1) {
      wizardState.selectedResources.deviceTemplateIds.splice(index, 1)
    }
  }

  /**
   * 添加看板
   */
  function addDashboard(id: string) {
    if (!wizardState.selectedResources.dashboardIds.includes(id)) {
      wizardState.selectedResources.dashboardIds.push(id)
    }
  }

  /**
   * 移除看板
   */
  function removeDashboard(id: string) {
    const index = wizardState.selectedResources.dashboardIds.indexOf(id)
    if (index > -1) {
      wizardState.selectedResources.dashboardIds.splice(index, 1)
    }
  }

  /**
   * 更新元数据
   */
  function updateMetadata(updates: Partial<BundleMetadata>) {
    Object.assign(wizardState.metadata, updates)
  }

  /**
   * 生成 bundleKey
   */
  function generateBundleKey(): string {
    const name = wizardState.metadata.name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    const timestamp = Date.now().toString(36)
    return `${name}-${timestamp}`
  }

  /**
   * 创建发布草稿
   */
  async function createDraft(locale: Locale = 'zh'): Promise<boolean> {
    if (!isLoggedIn()) {
      wizardState.error = {
        code: 'UNAUTHORIZED',
        message: locale === 'zh' ? '请先登录市场' : 'Please login to market first',
        httpStatus: 401
      }
      return false
    }

    wizardState.isLoading = true
    wizardState.error = null

    try {
      const bundleKey = generateBundleKey()
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      const result = await createPublishDraft({
        contractVersion: CONTRACT_VERSION,
        bundleKind: BUNDLE_KIND,
        bundleKey,
        version: '1.0.0',
        metadata: wizardState.metadata,
        source: wizardState.selectedResources
      })

      if (result.error) {
        wizardState.error = result.error
        const errorDisplay = getErrorDisplayMessage(result.error, locale)
        wizardState.error.message = errorDisplay.description
        return false
      }

      wizardState.draftId = result.data!.draftId
      wizardState.idempotencyKey = idempotencyKey
      wizardState.precheckResults = result.data!
      wizardState.step = 'precheck'
      return true
    } catch (err) {
      console.error('[MarketBundle] Failed to create draft:', err)
      wizardState.error = {
        code: 'NETWORK_ERROR',
        message: locale === 'zh' ? '网络请求失败，请检查网络连接' : 'Network request failed',
        httpStatus: 0
      }
      return false
    } finally {
      wizardState.isLoading = false
    }
  }

  /**
   * 确认发布
   */
  async function confirmPublishAction(locale: Locale = 'zh'): Promise<boolean> {
    if (!wizardState.draftId) {
      wizardState.error = {
        code: 'INVALID_STATE',
        message: 'No draft ID found',
        httpStatus: 0
      }
      return false
    }

    if (!canConfirmPublish.value) {
      return false
    }

    wizardState.isSubmitting = true
    wizardState.error = null

    try {
      const result = await confirmPublish({
        draftId: wizardState.draftId,
        idempotentKey: wizardState.idempotencyKey || undefined
      })

      if (result.error) {
        wizardState.error = result.error
        const errorDisplay = getErrorDisplayMessage(result.error, locale)
        wizardState.error.message = errorDisplay.description
        return false
      }

      wizardState.publishResult = result.data!
      wizardState.step = 'result'
      return true
    } catch (err) {
      console.error('[MarketBundle] Failed to publish:', err)
      wizardState.error = {
        code: 'NETWORK_ERROR',
        message: locale === 'zh' ? '网络请求失败，请检查网络连接' : 'Network request failed',
        httpStatus: 0
      }
      return false
    } finally {
      wizardState.isSubmitting = false
    }
  }

  /**
   * 取消草稿
   */
  async function cancelCurrentDraft(): Promise<void> {
    if (wizardState.draftId) {
      await cancelDraft(wizardState.draftId)
    }
    resetWizard()
  }

  /**
   * 检查版本是否已存在
   */
  async function checkVersionExists(bundleKey: string, version: string): Promise<boolean> {
    const result = await checkBundleVersionExists(bundleKey, version)
    return result.exists
  }

  /**
   * 获取 Bundle 版本列表
   */
  async function fetchBundleVersions(bundleKey: string, page = 1, pageSize = 10): Promise<PublishedBundle[]> {
    const result = await getBundleVersions(bundleKey, { page, pageSize })
    return result.data || []
  }

  /**
   * 安装 Bundle
   */
  async function install(
    params: { bundleKey: string; version?: string; dashboardSelections?: InstallResult['status'] },
    locale: Locale = 'zh'
  ): Promise<{ success: boolean; result: InstallResult | null; error: MarketApiError | null }> {
    if (!isLoggedIn()) {
      return {
        success: false,
        result: null,
        error: {
          code: 'UNAUTHORIZED',
          message: locale === 'zh' ? '请先登录市场' : 'Please login to market first',
          httpStatus: 401
        }
      }
    }

    const result = await installBundle(params)

    if (result.error) {
      const errorDisplay = getErrorDisplayMessage(result.error, locale)
      return {
        success: false,
        result: null,
        error: {
          ...result.error,
          message: errorDisplay.description
        }
      }
    }

    return {
      success: true,
      result: result.data,
      error: null
    }
  }

  /**
   * 导航步骤
   */
  function goToStep(step: PublishWizardState['step']) {
    wizardState.step = step
  }

  function nextStep() {
    const steps: PublishWizardState['step'][] = ['select-resources', 'metadata', 'precheck', 'confirm', 'result']
    const currentIndex = steps.indexOf(wizardState.step)
    if (currentIndex < steps.length - 1) {
      wizardState.step = steps[currentIndex + 1]
    }
  }

  function prevStep() {
    const steps: PublishWizardState['step'][] = ['select-resources', 'metadata', 'precheck', 'confirm', 'result']
    const currentIndex = steps.indexOf(wizardState.step)
    if (currentIndex > 0) {
      wizardState.step = steps[currentIndex - 1]
    }
  }

  return {
    // State
    wizardState,

    // Computed
    hasSelectedResources,
    canProceedFromResources,
    canProceedFromMetadata,
    precheckErrors,
    precheckWarnings,
    precheckPasses,
    canConfirmPublish,
    hasBlockingErrors,

    // Actions
    resetWizard,
    setSelectedResources,
    addDeviceTemplate,
    removeDeviceTemplate,
    addDashboard,
    removeDashboard,
    updateMetadata,
    createDraft,
    confirmPublishAction,
    cancelCurrentDraft,
    checkVersionExists,
    fetchBundleVersions,
    install,
    goToStep,
    nextStep,
    prevStep
  }
}

// ========== Precheck Display Helpers ==========

export interface PrecheckDisplayItem {
  code: string
  level: 'success' | 'error' | 'warning' | 'info'
  title: string
  description: string
  resource?: string
  details?: Record<string, unknown>
}

const PRECHECK_CODE_TITLES: Record<string, { zh: string; en: string }> = {
  NO_SECRET: { zh: '敏感信息检查', en: 'Sensitive Information Check' },
  FIELD_BINDING_VALID: { zh: '字段绑定检查', en: 'Field Binding Check' },
  RESOURCE_PERMISSION: { zh: '资源权限检查', en: 'Resource Permission Check' },
  PLUGIN_COMPATIBILITY: { zh: '插件兼容性检查', en: 'Plugin Compatibility Check' },
  BUNDLE_SIZE: { zh: '包大小检查', en: 'Bundle Size Check' },
  DEVICE_TEMPLATE_VALID: { zh: '设备模板验证', en: 'Device Template Validation' },
  DASHBOARD_VALID: { zh: '看板验证', en: 'Dashboard Validation' },
  FIELD_BINDING_INVALID: { zh: '无效的字段绑定', en: 'Invalid Field Binding' },
  SECRET_DETECTED: { zh: '检测到敏感信息', en: 'Sensitive Data Detected' },
  RESOURCE_FORBIDDEN: { zh: '资源无权限', en: 'Resource Access Forbidden' },
  PLUGIN_INCOMPATIBLE: { zh: '插件不兼容', en: 'Plugin Incompatible' },
  BUNDLE_VERSION_CONFLICT: { zh: '版本冲突', en: 'Version Conflict' }
}

const LEVEL_ICONS: Record<string, string> = {
  PASS: 'success',
  FAIL: 'error',
  WARN: 'warning',
  INFO: 'info'
}

/**
 * 格式化预检结果为显示项
 */
export function formatPrecheckResults(results: PrecheckResult[], locale: Locale = 'zh'): PrecheckDisplayItem[] {
  return results.map(result => {
    const titles = PRECHECK_CODE_TITLES[result.code] || { zh: result.code, en: result.code }

    return {
      code: result.code,
      level: LEVEL_ICONS[result.level] || 'info',
      title: titles[locale] || titles.zh,
      description: result.message,
      resource: result.resource ? `${result.resource.type}: ${result.resource.name}` : undefined,
      details: result.details
    }
  })
}
