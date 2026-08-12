/**
 * Market Bundle Composable - 市场解决方案包发布状态管理
 */

import { computed, reactive } from 'vue'
import { useMarketAuth } from './use-market-auth'
import type { PrecheckResult, PublishDraftResponse, PublishedBundle, InstallBundleRequest } from '@/service/api/market-bundle'
import {
  createPublishDraft,
  getErrorDisplayMessage,
  isBlockingResult,
  canPublish,
  categorizePrecheckResults,
  mapPrecheckReportToResults,
  type MarketApiError
} from '@/service/api/market-bundle'
import type { Locale } from '~/src/locales/locale'

export interface BundleMetadata {
  name: string
  category: string
  description?: string
  version?: string
}

export interface BundleSource {
  deviceTemplateIds: string[]
  dashboardIds: string[]
}

export interface PublishWizardState {
  step: 'select-resources' | 'metadata' | 'precheck' | 'confirm' | 'result'
  selectedResources: BundleSource
  metadata: BundleMetadata
  precheckChecks: PrecheckResult[]
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
    description: '',
    version: '1.0.0'
  },
  precheckChecks: [],
  publishResult: null,
  isLoading: false,
  isSubmitting: false,
  error: null
}

export function useMarketBundle() {
  const { isLoggedIn, getToken } = useMarketAuth()
  const wizardState = reactive<PublishWizardState>({ ...initialWizardState })

  const hasSelectedResources = computed(() => {
    return (
      wizardState.selectedResources.deviceTemplateIds.length > 0 &&
      wizardState.selectedResources.dashboardIds.length > 0
    )
  })

  const canProceedFromResources = computed(() => hasSelectedResources.value)

  const canProceedFromMetadata = computed(() => {
    const { metadata } = wizardState
    return metadata.name.trim().length > 0 && metadata.category.trim().length > 0
  })

  const precheckErrors = computed(() => categorizePrecheckResults(wizardState.precheckChecks).errors)
  const precheckWarnings = computed(() => categorizePrecheckResults(wizardState.precheckChecks).warnings)
  const precheckPasses = computed(() => categorizePrecheckResults(wizardState.precheckChecks).passes)

  const canConfirmPublish = computed(() => canPublish(wizardState.precheckChecks))
  const hasBlockingErrors = computed(() => precheckErrors.value.some(isBlockingResult))

  function resetWizard() {
    Object.assign(wizardState, { ...initialWizardState, selectedResources: { deviceTemplateIds: [], dashboardIds: [] } })
  }

  function setSelectedResources(source: BundleSource) {
    wizardState.selectedResources = { ...source }
  }

  function addDeviceTemplate(id: string) {
    if (!wizardState.selectedResources.deviceTemplateIds.includes(id)) {
      wizardState.selectedResources.deviceTemplateIds.push(id)
    }
  }

  function removeDeviceTemplate(id: string) {
    const index = wizardState.selectedResources.deviceTemplateIds.indexOf(id)
    if (index > -1) {
      wizardState.selectedResources.deviceTemplateIds.splice(index, 1)
    }
  }

  function addDashboard(id: string) {
    if (!wizardState.selectedResources.dashboardIds.includes(id)) {
      wizardState.selectedResources.dashboardIds.push(id)
    }
  }

  function removeDashboard(id: string) {
    const index = wizardState.selectedResources.dashboardIds.indexOf(id)
    if (index > -1) {
      wizardState.selectedResources.dashboardIds.splice(index, 1)
    }
  }

  function updateMetadata(updates: Partial<BundleMetadata>) {
    Object.assign(wizardState.metadata, updates)
  }

  function generateBundleKey(): string {
    const name = wizardState.metadata.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const timestamp = Date.now().toString(36)
    const base = /^[a-z]/.test(name) ? name : `bundle-${name}`
    return `${base}-${timestamp}`.slice(0, 63)
  }

  /** 单步发布：publish-draft 直接完成发布 */
  async function createDraft(locale: Locale = 'zh'): Promise<boolean> {
    const marketToken = getToken()
    if (!marketToken) {
      wizardState.error = {
        code: 'UNAUTHORIZED',
        message: locale === 'zh' ? '请先登录资源中心' : 'Please login to the resource center first',
        httpStatus: 401
      }
      return false
    }

    wizardState.isLoading = true
    wizardState.error = null

    try {
      const result = await createPublishDraft({
        deviceTemplateIds: wizardState.selectedResources.deviceTemplateIds,
        dashboardIds: wizardState.selectedResources.dashboardIds,
        bundleKey: generateBundleKey(),
        version: wizardState.metadata.version || '1.0.0',
        marketToken,
        category: wizardState.metadata.category,
        description: wizardState.metadata.description
      })

      if (result.precheckReport) {
        wizardState.precheckChecks = mapPrecheckReportToResults(result.precheckReport)
        wizardState.step = 'precheck'
      }

      if (result.error) {
        wizardState.error = result.error
        const errorDisplay = getErrorDisplayMessage(result.error, locale)
        wizardState.error.message = errorDisplay.description
        return false
      }

      if (result.data) {
        wizardState.publishResult = result.data
        if (result.data.precheckReport) {
          wizardState.precheckChecks = mapPrecheckReportToResults(result.data.precheckReport)
        }
        wizardState.step = 'result'
        return true
      }

      return false
    } catch (err) {
      console.error('[MarketBundle] Failed to publish:', err)
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

  /** 发布已在 createDraft 一步完成，此方法仅用于向导步骤跳转 */
  async function confirmPublishAction(_locale: Locale = 'zh'): Promise<boolean> {
    if (wizardState.publishResult) {
      wizardState.step = 'result'
      return true
    }
    return createDraft(_locale)
  }

  async function cancelCurrentDraft(): Promise<void> {
    resetWizard()
  }

  async function install(
    params: Pick<InstallBundleRequest, 'bundleKey' | 'version' | 'deviceBindings' | 'marketToken'>,
    locale: Locale = 'zh'
  ) {
    if (!params.marketToken) {
      return {
        success: false,
        result: null,
        error: {
          code: 'UNAUTHORIZED',
          message: locale === 'zh' ? '请先登录资源中心' : 'Please login to the resource center first',
          httpStatus: 401
        } as MarketApiError
      }
    }

    const { installBundle } = await import('@/service/api/market-bundle')
    const result = await installBundle(params)

    if (result.error) {
      const errorDisplay = getErrorDisplayMessage(result.error, locale)
      return {
        success: false,
        result: null,
        error: { ...result.error, message: errorDisplay.description }
      }
    }

    return { success: true, result: result.data, error: null }
  }

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
    wizardState,
    hasSelectedResources,
    canProceedFromResources,
    canProceedFromMetadata,
    precheckErrors,
    precheckWarnings,
    precheckPasses,
    canConfirmPublish,
    hasBlockingErrors,
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
    install,
    goToStep,
    nextStep,
    prevStep
  }
}

export interface PrecheckDisplayItem {
  code: string
  level: 'success' | 'error' | 'warning' | 'info'
  title: string
  description: string
  resource?: string
  details?: Record<string, unknown>
}

const PRECHECK_CODE_TITLES: Record<string, { zh: string; en: string }> = {
  PRECHECK_PASSED: { zh: '预检通过', en: 'Precheck Passed' },
  FIELD_BINDING_INVALID: { zh: '无效的字段绑定', en: 'Invalid Field Binding' },
  SECRET_DETECTED: { zh: '检测到敏感信息', en: 'Sensitive Data Detected' },
  RESOURCE_FORBIDDEN: { zh: '资源无权限', en: 'Resource Access Forbidden' },
  BUNDLE_VERSION_CONFLICT: { zh: '版本冲突', en: 'Version Conflict' }
}

const LEVEL_ICONS: Record<string, string> = {
  PASS: 'success',
  FAIL: 'error',
  WARN: 'warning',
  INFO: 'info'
}

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
