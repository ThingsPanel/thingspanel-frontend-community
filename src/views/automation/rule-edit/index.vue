<script setup lang="ts">
/**
 * Rule editor.
 *
 * One screen, one save. The old form already worked that way and adding a
 * draft/publish step would have made the common case ("change the threshold")
 * three clicks longer, so the save button does the whole job:
 *
 *   local pre-flight -> server validation -> change preview -> save with token
 *
 * Only the preview needs explaining: when a change would touch devices, the
 * dialog lists them before anything is written. It is not a required step for
 * a small edit — an edit that touches one device still shows the dialog, but the
 * dialog is a confirmation, not a wizard.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDivider,
  NFlex,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useDialog,
  useMessage
} from 'naive-ui'
import { useTabStore } from '@/store/modules/tab'
import { useAuthStore } from '@/store/modules/auth'
import { AutomationNativeError, automationNative, createAutomationRequestId } from '@/service/api/automation-native'
import { automationRulePermissionMessage, canManageAutomationRules } from '@/service/api/automation-rule-permissions'
import {
  AutomationApiError,
  createRule,
  getRule,
  listRules,
  previewRuleChange,
  setRuleEnabled,
  updateRule,
  validateRule,
  type ChangePreviewResponse,
  type RuleDefinition,
  type RuleKind
} from '@/service/api/automation-rules'
import {
  definitionToForm,
  changeFormKind,
  emptyForm,
  formToDefinition,
  issuesToFieldMap,
  mergeDefinition,
  validateForm
} from '@/utils/automation/form'
import { firstIssueMessage, summarizeDefinition, toFormFieldErrors } from '@/utils/automation/summary'
import {
  createScopedCreateState,
  resolveScopedEnableReadback,
  restoreScopedCreateState,
  runScopedCreateFlow,
  type AutomationScope,
  type ScopedCreateState
} from '@/utils/automation/scoped-create-flow'
import ConditionEditor from '../modules/condition-editor.vue'
import StepEditor from '../modules/step-editor.vue'
import SimulateDrawer from '../modules/simulate-drawer.vue'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const tabStore = useTabStore()
const authStore = useAuthStore()
const canManage = computed(() => canManageAutomationRules(authStore.userInfo.roles))

const ruleId = ref(String(route.query.id ?? ''))
const backType = ref(String(route.query.backType ?? ''))
const deviceId = ref(String(route.query.device_id ?? ''))
const deviceConfigId = ref(String(route.query.device_config_id ?? ''))
const queryKindValue = String(route.query.kind ?? '')
const requestedKind: RuleKind | undefined =
  queryKindValue === 'automation' || queryKindValue === 'scene' || queryKindValue === 'alarm_policy'
    ? queryKindValue
    : undefined

const form = ref(
  emptyForm({
    kind: requestedKind,
    deviceID: deviceId.value || undefined,
    deviceConfigID: deviceConfigId.value || undefined
  })
)
/**
 * What was loaded, kept so a save cannot drop the parts this form does not edit
 * (parameter slots, recovery trigger, queue limits, budget, alarm spec).
 */
const originalDefinition = ref<RuleDefinition | null>(null)
const version = ref(0)
const savedEnabled = ref(true)
const loading = ref(false)
const saving = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const formError = ref('')
const alarmPolicies = ref<{ label: string; value: string }[]>([])
const simulateVisible = ref(false)
const impact = ref<ChangePreviewResponse | null>(null)
const impactVisible = ref(false)
type FrozenCreateInput = { name: string; definition: RuleDefinition; enabled: boolean }
const createFlow = ref<ScopedCreateState | null>(null)
const frozenCreateInput = ref<FrozenCreateInput | null>(null)
const attachMessage = ref('')
const attachLoading = ref(false)

const isEdit = computed(() => Boolean(ruleId.value))
const isAlarm = computed(() => form.value.kind === 'alarm_policy')
const deviceLocked = computed(() => Boolean(deviceId.value) || Boolean(deviceConfigId.value))
const hasScopedCreatedRule = computed(() => Boolean(createFlow.value?.ruleId && createFlow.value.scope))
const createOutcomeUnknown = computed(() => createFlow.value?.phase === 'create-unknown')

function requestedScope(): AutomationScope | undefined {
  if (backType.value === 'device' && deviceId.value) return { type: 'device', id: deviceId.value }
  if (backType.value === 'config' && deviceConfigId.value) return { type: 'device_config', id: deviceConfigId.value }
  return undefined
}

function changeKind(kind: RuleKind) {
  if (requestedKind) return
  form.value = changeFormKind(form.value, kind)
}

function authStorageOwner() {
  const userInfo = authStore.userInfo
  const owner = String(userInfo.userId || userInfo.id || '').trim()
  return owner || null
}

function attachStorageKey(scope: AutomationScope, id: string) {
  const owner = authStorageOwner()
  return owner ? `automation-rule-attach:${owner}:${scope.type}:${scope.id}:${id}` : null
}

function createStorageKey(scope: AutomationScope) {
  const owner = authStorageOwner()
  return owner ? `automation-rule-create:${owner}:${scope.type}:${scope.id}` : null
}

function storeCreateFlowState(state: ScopedCreateState | null, input: FrozenCreateInput | null) {
  const key = state?.scope ? createStorageKey(state.scope) : null
  if (!state?.scope || state.phase === 'attached' || !input || !key) return
  try {
    sessionStorage.setItem(key, JSON.stringify({ state, input }))
  } catch {
    // The current page still retains the request key in memory.
  }
}

function loadCreateFlowState(scope: AutomationScope) {
  try {
    const key = createStorageKey(scope)
    if (!key) return null
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const saved = JSON.parse(raw) as { state?: ScopedCreateState; input?: FrozenCreateInput }
    const state = saved.state
    const input = saved.input
    if (!state || !input || state.scope?.type !== scope.type || state.scope.id !== scope.id) return null
    if (!state.fingerprint || !state.createRequestId || JSON.stringify(input) !== state.fingerprint) return null
    if (
      typeof input.name !== 'string' ||
      typeof input.enabled !== 'boolean' ||
      !input.definition ||
      typeof input.definition !== 'object'
    )
      return null
    if (state.desiredEnabled !== input.enabled || typeof state.bindingConfirmed !== 'boolean') return null
    if (
      ![
        'ready',
        'create-failed',
        'create-unknown',
        'attach-failed',
        'attach-unknown',
        'enable-failed',
        'enable-unknown'
      ].includes(state.phase)
    )
      return null
    return {
      state: {
        ...state,
        phase: state.ruleId ? state.phase : state.phase === 'create-failed' ? 'create-failed' : 'create-unknown'
      },
      input
    }
  } catch {
    return null
  }
}

function clearCreateFlowState(scope: AutomationScope) {
  try {
    const key = createStorageKey(scope)
    if (key) sessionStorage.removeItem(key)
  } catch {
    // No stored state to clear.
  }
}

function storeAttachRequestId(scope: AutomationScope, id: string, requestId: string) {
  try {
    const key = attachStorageKey(scope, id)
    if (key) sessionStorage.setItem(key, requestId)
  } catch {
    // The current page still retains the key in memory; the API remains protected by idempotency.
  }
}

function loadAttachRequestId(scope: AutomationScope, id: string) {
  try {
    const key = attachStorageKey(scope, id)
    return key ? sessionStorage.getItem(key) || '' : ''
  } catch {
    return ''
  }
}

function clearAttachRequestId(scope: AutomationScope, id: string) {
  try {
    const key = attachStorageKey(scope, id)
    if (key) sessionStorage.removeItem(key)
  } catch {
    // No stored key to clear.
  }
}

async function isScopeRuleAttached(ruleId: string, scope: AutomationScope) {
  if (scope.type === 'device') {
    const result = await automationNative.deviceAutomation(scope.id)
    return result.rules.some(rule => rule.rule_id === ruleId && rule.source === 'device' && Boolean(rule.binding_id))
  }
  const result = await automationNative.templateBindings(scope.id)
  return result.bindings.some(binding => binding.rule_id === ruleId && binding.enabled && !binding.detached_at)
}

async function attachAndConfirmScope(ruleId: string, scope: AutomationScope, requestId: string) {
  const result = await automationNative.attach(ruleId, {
    scope_type: scope.type,
    scope_id: scope.id,
    params: {},
    request_id: requestId
  })
  if (!(await isScopeRuleAttached(ruleId, scope))) {
    throw new Error('当前关联已发生变化，请返回设备或模板检查后重新关联。')
  }
  return result
}

async function finishScopeAttachment() {
  const state = createFlow.value
  if (!state?.ruleId || !state.scope || !state.enabledConfirmed) return
  clearAttachRequestId(state.scope, state.ruleId)
  clearCreateFlowState(state.scope)
  createFlow.value = { ...state, phase: 'attached' }
  attachMessage.value = ''
  message.success('规则已创建并关联。')
  await tabStore.removeTab(route.path)
  goBack()
}

async function attachCreatedRule() {
  if (!canManage.value || attachLoading.value) return
  let current = createFlow.value
  if (!current?.ruleId || !current.scope) return
  attachLoading.value = true
  attachMessage.value = ''
  try {
    if (current.phase === 'enable-unknown' || current.phase === 'enable-failed') {
      const actual = await getRule(current.ruleId)
      const bindingConfirmed = await isScopeRuleAttached(current.ruleId, current.scope)
      if (!bindingConfirmed) {
        current = { ...current, bindingConfirmed: false, phase: 'attach-unknown' }
        createFlow.value = current
        storeCreateFlowState(current, frozenCreateInput.value)
        attachMessage.value = '规则已创建，但当前未读到关联。为防止未绑定规则触发，请先确认关联状态。'
        return
      }
      const readback = resolveScopedEnableReadback(current, actual)
      if (readback.kind === 'confirmed') {
        createFlow.value = { ...readback.state, bindingConfirmed: true }
        await finishScopeAttachment()
        return
      }
      if (readback.kind === 'changed') {
        attachMessage.value =
          '规则已关联，但版本已变化且仍处于禁用状态。请到规则管理检查后再启用，避免覆盖其他人的修改。'
        return
      }
      current = { ...readback.state, bindingConfirmed: true }
      createFlow.value = current
    } else if (!current.bindingConfirmed) {
      const bindingConfirmed = await isScopeRuleAttached(current.ruleId, current.scope)
      current = { ...current, bindingConfirmed }
      createFlow.value = current
    }
    const operations = {
      create: async () => {
        throw new Error('规则已经创建，不能再次提交创建请求。')
      },
      attach: attachAndConfirmScope,
      enable: async (id: string, expectedVersion: number) => {
        const updated = await setRuleEnabled(id, true, expectedVersion)
        return { version: updated.version, enabled: updated.enabled }
      },
      isOutcomeUnknown: (error: unknown) =>
        (error instanceof AutomationApiError && error.outcomeUnknown) ||
        (error instanceof AutomationNativeError && error.outcomeUnknown)
    }
    let result = await runScopedCreateFlow(current, operations)
    createFlow.value = result.state
    storeCreateFlowState(result.state, frozenCreateInput.value)
    if (result.state.phase === 'attach-unknown' || result.state.phase === 'attach-failed') {
      try {
        if (await isScopeRuleAttached(result.state.ruleId!, result.state.scope!)) {
          current = { ...result.state, bindingConfirmed: true, phase: 'ready' }
          result = await runScopedCreateFlow(current, operations)
          createFlow.value = result.state
          storeCreateFlowState(result.state, frozenCreateInput.value)
        }
      } catch (readError) {
        attachMessage.value = `规则已创建；暂时无法确认关联状态。${readError instanceof Error ? readError.message : ''}`
        return
      }
    }
    if (result.state.phase === 'attached') {
      await finishScopeAttachment()
      return
    }
    if (result.state.phase === 'enable-unknown' || result.state.phase === 'enable-failed') {
      attachMessage.value =
        result.state.phase === 'enable-unknown'
          ? '规则已关联，但启用结果尚未确认。重试前会先读取规则状态。'
          : `规则已关联，但启用未确认。${result.error instanceof Error ? result.error.message : '请重试启用。'}`
      return
    }
    attachMessage.value =
      result.state.phase === 'attach-unknown'
        ? '规则已创建，但关联结果尚未确认。重试前会先读取当前绑定。'
        : `规则已创建，但尚未关联。${result.error instanceof Error ? result.error.message : '请重试关联。'}`
  } catch (error) {
    attachMessage.value = current.bindingConfirmed
      ? `规则已关联，但启用未确认。${error instanceof Error ? error.message : '请重试读取状态。'}`
      : `规则已创建，但关联状态尚未确认。${error instanceof Error ? error.message : '请重试读取状态。'}`
  } finally {
    attachLoading.value = false
  }
}

const kindOptions = [
  { label: '自动化（条件触发）', value: 'automation' },
  { label: '场景（手动执行）', value: 'scene' },
  { label: '告警策略', value: 'alarm_policy' }
]

const modeOptions = [
  { label: '忽略（还在执行时忽略新的触发）', value: 'single' },
  { label: '重来（中止旧的，重新开始）', value: 'restart' },
  { label: '排队（等这次跑完再跑）', value: 'queued' },
  { label: '并行（各跑一份）', value: 'parallel' }
]

const summary = computed(() => summarizeDefinition(buildDefinition()))

function addGroup() {
  form.value.groups = [
    ...form.value.groups,
    {
      conditions: [{ source: 'self', device_id: '', signal: 'telemetry', key: '', operator: '>', value: '', unit: '' }]
    }
  ]
}

function removeGroup(index: number) {
  if (form.value.groups.length <= 1) return
  form.value.groups = form.value.groups.filter((_, position) => position !== index)
}

async function loadRule() {
  if (!canManage.value) {
    formError.value = automationRulePermissionMessage()
    return
  }
  loading.value = true
  try {
    const rule = await getRule(ruleId.value)
    form.value = definitionToForm(rule.definition, rule.name, rule.enabled)
    originalDefinition.value = rule.definition
    version.value = rule.version
    savedEnabled.value = rule.enabled
    const scope = requestedScope()
    if (route.query.attach_pending === '1' && scope) {
      const restored = loadCreateFlowState(scope)
      const requestId = restored?.state.attachRequestId || loadAttachRequestId(scope, rule.id)
      try {
        const bindingConfirmed = await isScopeRuleAttached(rule.id, scope)
        if (restored?.state.ruleId === rule.id && requestId) {
          storeAttachRequestId(scope, rule.id, requestId)
          frozenCreateInput.value = restored.input
          form.value.enabled = restored.input.enabled
          createFlow.value = {
            ...restored.state,
            attachRequestId: requestId,
            bindingConfirmed
          }
          if (!bindingConfirmed) {
            createFlow.value.phase = 'attach-unknown'
            attachMessage.value = '规则已创建，但尚未读到关联。暂不继续启用，请先检查当前绑定。'
          } else if (!restored.state.desiredEnabled) {
            if (!rule.enabled) {
              createFlow.value = { ...createFlow.value, enabledConfirmed: true, phase: 'attached' }
              await finishScopeAttachment()
            } else {
              attachMessage.value = '规则已关联，但当前启用状态与保存时选择不同。请到规则管理检查。'
            }
          } else if (rule.enabled) {
            createFlow.value = resolveScopedEnableReadback(createFlow.value, rule).state
            await finishScopeAttachment()
          } else {
            const readback = resolveScopedEnableReadback(createFlow.value, rule)
            if (readback.kind === 'changed') {
              attachMessage.value = '规则已关联，但版本已变化且仍处于禁用状态。请到规则管理检查后再启用。'
            } else {
              createFlow.value = { ...readback.state, bindingConfirmed: true, phase: 'enable-failed' }
              await attachCreatedRule()
            }
          }
        } else if (bindingConfirmed && rule.enabled) {
          createFlow.value = restoreScopedCreateState({
            ruleId: rule.id,
            version: rule.version,
            scope,
            attachRequestId: '',
            desiredEnabled: true,
            bindingConfirmed: true
          })
          createFlow.value = { ...createFlow.value, enabledConfirmed: true, phase: 'attached' }
          await finishScopeAttachment()
        } else {
          attachMessage.value = rule.enabled
            ? '规则仍启用，但当前无法确认绑定；请暂停后到规则管理检查。'
            : '规则已创建并保持禁用，但当前身份无法恢复绑定/启用请求。请到规则管理检查。'
        }
      } catch (error) {
        attachMessage.value = `规则已创建；暂时无法确认关联状态。${error instanceof Error ? error.message : ''}`
      }
    }
  } catch (error) {
    formError.value = (error as AutomationApiError).message || '规则加载失败'
  } finally {
    loading.value = false
  }
}

async function loadAlarmPolicies() {
  if (isAlarm.value) {
    alarmPolicies.value = []
    return
  }
  if (!canManage.value) {
    alarmPolicies.value = []
    return
  }
  try {
    const result = await listRules({ kind: 'alarm_policy', limit: 100 })
    alarmPolicies.value = (result.rules ?? []).map(rule => ({ label: rule.name, value: rule.id }))
  } catch {
    // The alarm step falls back to a free-text id, which still works.
    alarmPolicies.value = []
  }
}

async function toggleEnabled(next: boolean) {
  if (!canManage.value) {
    formError.value = automationRulePermissionMessage()
    return
  }
  if (hasScopedCreatedRule.value || createOutcomeUnknown.value) return
  if (!isEdit.value) {
    form.value.enabled = next
    return
  }
  try {
    const updated = await setRuleEnabled(ruleId.value, next, version.value)
    version.value = updated.version
    savedEnabled.value = updated.enabled
    form.value.enabled = updated.enabled
    message.success(next ? '已启用' : '已停用')
  } catch (error) {
    const apiError = error as AutomationApiError
    form.value.enabled = savedEnabled.value
    if (apiError.outcomeUnknown) {
      message.warning('启停结果未知，请刷新规则确认后再操作。')
    } else {
      message.error(apiError.message || '启停失败')
    }
  }
}

/** The payload for every check and save: the form, plus what it does not own. */
function buildDefinition(): RuleDefinition {
  return mergeDefinition(originalDefinition.value, formToDefinition(form.value))
}

function goBack() {
  if (backType.value === 'device' && deviceId.value) {
    router.replace({
      path: '/device/details',
      query: { d_id: deviceId.value, tab: isAlarm.value ? 'give-an-alarm' : 'automate' }
    })
    return
  }
  if (backType.value === 'config' && deviceConfigId.value) {
    router.replace({
      path: '/device/template/detail',
      query: { id: deviceConfigId.value, tab: isAlarm.value ? 'alarm' : 'automate' }
    })
    return
  }
  router.replace({ path: '/automation/rule-manage' })
}

async function persist(options: { force?: boolean; previewToken?: string } = {}) {
  if (!canManage.value) {
    formError.value = automationRulePermissionMessage()
    return
  }
  if (hasScopedCreatedRule.value) {
    await attachCreatedRule()
    return
  }
  const definition = buildDefinition()
  saving.value = true
  try {
    if (isEdit.value) {
      const updated = await updateRule(ruleId.value, {
        name: form.value.name,
        definition,
        version: version.value,
        previewToken: options.previewToken,
        force: options.force
      })
      version.value = updated.version
      message.success('已保存')
      await tabStore.removeTab(route.path)
      goBack()
    } else {
      const scope = requestedScope()
      const input: FrozenCreateInput =
        createFlow.value?.phase === 'create-unknown' && frozenCreateInput.value
          ? frozenCreateInput.value
          : { name: form.value.name, definition, enabled: form.value.enabled }
      frozenCreateInput.value = input
      const fingerprint = JSON.stringify(input)
      const state = createScopedCreateState(createFlow.value, {
        fingerprint,
        scope,
        desiredEnabled: input.enabled,
        createRequestId: createAutomationRequestId
      })
      storeCreateFlowState(state, input)
      const result = await runScopedCreateFlow(state, {
        create: (requestId, enabled) => createRule({ ...input, enabled }, requestId),
        attach: attachAndConfirmScope,
        enable: async (id, expectedVersion) => {
          const updated = await setRuleEnabled(id, true, expectedVersion)
          return { version: updated.version, enabled: updated.enabled }
        },
        isOutcomeUnknown: error =>
          (error instanceof AutomationApiError && error.outcomeUnknown) ||
          (error instanceof AutomationNativeError && error.outcomeUnknown)
      })
      createFlow.value = result.state
      if (result.state.phase === 'create-unknown') {
        frozenCreateInput.value = input
        form.value = definitionToForm(input.definition, input.name, input.enabled)
        storeCreateFlowState(result.state, input)
        formError.value = '创建结果暂时未知。请保持内容不变并重试，系统会沿用同一请求确认结果。'
        return
      }
      if (result.state.phase === 'create-failed') {
        frozenCreateInput.value = null
        if (scope) clearCreateFlowState(scope)
        throw result.error
      }
      if (!result.state.ruleId) throw new Error('服务端没有返回规则编号。')
      ruleId.value = result.state.ruleId
      version.value = result.state.version ?? 1
      savedEnabled.value = form.value.enabled
      if (result.state.scope) {
        const target = result.state.scope
        frozenCreateInput.value = input
        storeCreateFlowState(result.state, input)
        const requestId = result.state.attachRequestId ?? createAutomationRequestId()
        storeAttachRequestId(target, result.state.ruleId, requestId)
        router.replace({
          path: '/automation/rule-edit',
          query: { ...route.query, id: result.state.ruleId, attach_pending: '1' }
        })
        if (result.state.phase === 'attached') {
          await finishScopeAttachment()
          return
        }
        attachMessage.value =
          result.state.phase === 'enable-unknown'
            ? '规则已关联，但启用结果尚未确认。重试前会先读取规则状态。'
            : result.state.phase === 'enable-failed'
              ? `规则已关联，但启用未确认。${result.error instanceof Error ? result.error.message : '请重试启用。'}`
              : result.state.phase === 'attach-unknown'
                ? '规则已创建，但关联结果尚未确认。重试前会先读取当前绑定。'
                : `规则已创建，但尚未关联。${result.error instanceof Error ? result.error.message : '请重试关联。'}`
        return
      }
      frozenCreateInput.value = null
      if (scope) clearCreateFlowState(scope)
      message.success('已创建')
      await tabStore.removeTab(route.path)
      router.replace({ path: '/automation/rule-edit', query: { id: result.state.ruleId } })
    }
  } catch (error) {
    if (error instanceof Error && !(error instanceof AutomationApiError) && !(error instanceof AutomationNativeError)) {
      formError.value = error.message
    } else {
      handleSaveError(error as AutomationApiError, options)
    }
  } finally {
    saving.value = false
  }
}

function handleSaveError(apiError: AutomationApiError, options: { force?: boolean; previewToken?: string }) {
  if (apiError.outcomeUnknown) {
    dialog.warning({
      title: '结果未知',
      content:
        '网络在保存过程中中断，规则可能已经保存成功。先刷新列表确认，不要直接再点保存，否则可能建出两条一样的规则。',
      positiveText: '去列表确认',
      negativeText: '留在这里',
      onPositiveClick: goBack
    })
    return
  }
  if (apiError.code === 'version_conflict' || apiError.httpStatus === 409) {
    dialog.warning({
      title: '这条规则刚被改过',
      content: '你打开之后，这条规则在别处被修改了。覆盖保存会丢掉别人的改动；刷新可以看到最新的内容。',
      positiveText: '以我的版本覆盖',
      negativeText: '刷新',
      onPositiveClick: async () => {
        try {
          const latest = await getRule(ruleId.value)
          version.value = latest.version
          await persist({ force: true, previewToken: options.previewToken })
        } catch (error) {
          message.error((error as AutomationApiError).message || '刷新失败')
        }
        return true
      },
      onNegativeClick: () => {
        loadRule()
      }
    })
    return
  }
  if (apiError.code === 'preview_stale' || apiError.code === 'preview_expired') {
    message.warning('预览已过期，正在重新计算影响范围')
    void save()
    return
  }
  if (apiError.code === 'binding_incompatible') {
    const affected = (apiError.detail as { affected?: number }).affected ?? 0
    dialog.warning({
      title: '设备上已存的值不再适用',
      content: `有 ${affected} 台设备按旧参数保存过值，新规则里没有对应的参数槽。强行保存不会改动设备上的值，但这些值将不再被使用。`,
      positiveText: '强行保存',
      negativeText: '返回修改',
      onPositiveClick: () => {
        void persist({ force: true, previewToken: options.previewToken })
        return true
      }
    })
    return
  }
  const mapped = apiError.fieldMap()
  if (Object.keys(mapped).length) {
    fieldErrors.value = { ...fieldErrors.value, ...mapped }
  }
  formError.value = apiError.message || '保存失败'
}

async function save() {
  if (hasScopedCreatedRule.value) {
    await attachCreatedRule()
    return
  }
  if (!canManage.value) {
    formError.value = automationRulePermissionMessage()
    return
  }
  if (saving.value) return
  fieldErrors.value = {}
  formError.value = ''

  if (createOutcomeUnknown.value) {
    await persist()
    return
  }

  const issues = validateForm(form.value)
  if (issues.length) {
    fieldErrors.value = issuesToFieldMap(issues)
    message.error(issues[0].message)
    return
  }

  const definition = buildDefinition()

  saving.value = true
  try {
    const validation = await validateRule(definition)
    if (!validation.valid) {
      fieldErrors.value = toFormFieldErrors(validation.issues)
      message.error(firstIssueMessage(validation.issues) ?? '规则没有通过校验')
      return
    }
  } catch (error) {
    const apiError = error as AutomationApiError
    fieldErrors.value = apiError.fieldMap()
    formError.value = apiError.message || '校验失败'
    return
  } finally {
    saving.value = false
  }

  if (!isEdit.value) {
    await persist()
    return
  }

  // Editing: show what the change would touch before writing it.
  try {
    const preview = await previewRuleChange(ruleId.value, definition)
    if (preview.issues.length) {
      fieldErrors.value = toFormFieldErrors(preview.issues)
      message.error(firstIssueMessage(preview.issues) ?? '规则没有通过保存前检查')
      return
    }
    if (preview.requiresConfirmation) {
      impact.value = preview
      impactVisible.value = true
      return
    }
    await persist({ previewToken: preview.token })
  } catch (error) {
    handleSaveError(error as AutomationApiError, {})
  }
}

async function confirmImpact() {
  if (!canManage.value) {
    formError.value = automationRulePermissionMessage()
    return
  }
  if (!impact.value) return
  const token = impact.value.token
  impactVisible.value = false
  await persist({ previewToken: token })
}

onMounted(() => {
  if (!canManage.value) return
  if (!isEdit.value) {
    const scope = requestedScope()
    if (scope) {
      const restored = loadCreateFlowState(scope)
      if (restored) {
        createFlow.value = restored.state
        frozenCreateInput.value = restored.input
        form.value = definitionToForm(restored.input.definition, restored.input.name, restored.input.enabled)
      }
    }
  }
  if (isEdit.value) void loadRule()
  void loadAlarmPolicies()
})
</script>

<template>
  <div class="rule-edit">
    <NAlert v-if="!canManage" type="warning" :bordered="false">
      {{ automationRulePermissionMessage() }}
    </NAlert>
    <NCard v-if="canManage" :bordered="false" :title="isEdit ? '编辑规则' : '新建规则'">
      <NAlert v-if="formError" type="error" :bordered="false" class="mb-4" closable @close="formError = ''">
        {{ formError }}
      </NAlert>

      <NForm
        label-placement="left"
        label-width="90"
        size="small"
        :disabled="createOutcomeUnknown || hasScopedCreatedRule || (saving && !isEdit)"
      >
        <NFlex>
          <NFormItem label="名称" required class="w-160">
            <NInput v-model:value="form.name" placeholder="例如：高温开风机" />
            <div v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</div>
          </NFormItem>
          <NFormItem label="类型" class="w-160">
            <NSelect
              v-model:value="form.kind"
              :options="kindOptions"
              :disabled="isEdit || Boolean(requestedKind) || createOutcomeUnknown || hasScopedCreatedRule"
              @update:value="changeKind"
            />
          </NFormItem>
          <NFormItem label="启用" class="w-100">
            <NSwitch :value="form.enabled" @update:value="toggleEnabled" />
          </NFormItem>
        </NFlex>

        <NFormItem v-if="form.kind !== 'scene'" label="如果" class="w-100%">
          <div class="w-100%">
            <div v-for="(group, index) in form.groups" :key="index" class="group">
              <div class="group__head">
                <NTag size="small" :bordered="false" type="info">条件组 {{ index + 1 }}</NTag>
                <span class="hint">组内条件同时满足；组与组之间满足任一组即可</span>
                <NButton v-if="form.groups.length > 1" text type="error" size="tiny" @click="removeGroup(index)">
                  删除本组
                </NButton>
              </div>
              <ConditionEditor
                v-model="group.conditions"
                :field-errors="fieldErrors"
                :path-prefix="`definition.trigger.groups[${index}].conditions`"
                :device-locked="deviceLocked"
              />
            </div>
            <NButton dashed size="small" @click="addGroup">加一组条件（或者）</NButton>
          </div>
        </NFormItem>

        <NFormItem v-if="isAlarm" label="告警等级" required class="w-100%">
          <NSelect
            v-model:value="form.alarmLevel"
            :options="[
              { label: '高', value: 'H' },
              { label: '中', value: 'M' },
              { label: '低', value: 'L' }
            ]"
            class="w-220px"
          />
        </NFormItem>

        <NFormItem label="持续时间" :required="isAlarm" class="w-100%">
          <div class="w-100%">
            <NFlex align="center">
              <NInput v-model:value="form.holdFor" placeholder="例如 5m；留空表示条件一满足就执行" class="w-220px" />
              <span class="hint">
                条件要连续满足这么久才执行。0 或留空表示立刻执行；{{
                  isAlarm ? '告警建议至少 1 分钟，避免临界值抖动' : '可以填 30s、5m、1h'
                }}
              </span>
            </NFlex>
            <div v-if="fieldErrors['definition.trigger.for']" class="field-error">
              {{ fieldErrors['definition.trigger.for'] }}
            </div>
          </div>
        </NFormItem>

        <NDivider dashed />

        <NFormItem v-if="isAlarm" label="告警信息" class="w-100%">
          <NFlex vertical :size="8" class="w-100%">
            <span class="hint">满足上面的条件时生成告警；默认使用条件检测来源。</span>
            <div>
              告警来源：{{
                form.alarmSources
                  .map(source => (source === 'event' ? '事件' : source === 'detector' ? '条件检测' : source))
                  .join('、') || '条件检测'
              }}
            </div>
            <div v-if="form.alarmAllowedSources.length" class="hint">
              允许的事件来源：{{ form.alarmAllowedSources.join('、') }}
            </div>
            <NCollapse>
              <NCollapseItem title="可选：业务键和维度" name="alarm-extra">
                <NFlex vertical :size="8">
                  <NInput v-model:value="form.alarmKey" placeholder="业务键（留空时使用规则编号）" />
                  <NInput v-model:value="form.alarmDimension" placeholder="维度（可选）" />
                </NFlex>
              </NCollapseItem>
            </NCollapse>
          </NFlex>
        </NFormItem>

        <NFormItem v-else label="就执行" class="w-100%">
          <StepEditor
            v-model="form.steps"
            :field-errors="fieldErrors"
            path-prefix="definition.steps"
            :allow-scene="form.kind === 'scene'"
            :alarm-policy-options="alarmPolicies"
          />
        </NFormItem>

        <NDivider dashed />

        <NCollapse>
          <NCollapseItem title="高级：执行方式、目标范围、数据新鲜度" name="advanced">
            <NFormItem label="重复触发">
              <NFlex align="center">
                <NSelect v-model:value="form.mode" :options="modeOptions" class="w-320px" />
                <span class="hint">同一条规则还在执行时又满足了条件，按这里处理</span>
              </NFlex>
            </NFormItem>

            <NFormItem label="目标设备">
              <div class="w-100%">
                <NFlex align="center">
                  <NInput
                    :value="form.deviceIDs.join(',')"
                    placeholder="设备 ID，多个用逗号分隔"
                    class="w-360px"
                    @update:value="
                      (value: string) =>
                        (form.deviceIDs = value
                          .split(',')
                          .map(item => item.trim())
                          .filter(Boolean))
                    "
                  />
                  <NInput
                    :value="form.deviceConfigIDs.join(',')"
                    placeholder="设备模板 ID（按模板批量）"
                    class="w-300px"
                    @update:value="
                      (value: string) =>
                        (form.deviceConfigIDs = value
                          .split(',')
                          .map(item => item.trim())
                          .filter(Boolean))
                    "
                  />
                </NFlex>
                <NFlex align="center" class="mt-2">
                  <NInput
                    :value="form.areaIDs.join(',')"
                    placeholder="区域 ID（区域里以后新增的设备也会纳入）"
                    class="w-360px"
                    @update:value="
                      (value: string) =>
                        (form.areaIDs = value
                          .split(',')
                          .map(item => item.trim())
                          .filter(Boolean))
                    "
                  />
                  <NInput
                    :value="form.labels.join(',')"
                    placeholder="设备标签"
                    class="w-240px"
                    @update:value="
                      (value: string) =>
                        (form.labels = value
                          .split(',')
                          .map(item => item.trim())
                          .filter(Boolean))
                    "
                  />
                  <NSelect
                    v-model:value="form.labelMatch"
                    :options="[
                      { label: '同时满足所有标签', value: 'and' },
                      { label: '满足任一标签', value: 'or' }
                    ]"
                    class="w-180px"
                  />
                </NFlex>
                <NFlex align="center" class="mt-2">
                  <span class="hint">一次最多影响</span>
                  <NInputNumber v-model:value="form.maxTargets" :min="1" :max="5000" class="w-120px" />
                  <span class="hint">台设备，超出会被服务端拒绝，避免误操作全场</span>
                </NFlex>
              </div>
            </NFormItem>

            <NFormItem label="数据新鲜度">
              <NFlex align="center">
                <span class="hint">读数最多</span>
                <NInput v-model:value="form.maxAge" class="w-100px" />
                <span class="hint">秒内有效；两次上报间隔超过</span>
                <NInput v-model:value="form.maxGap" class="w-100px" />
                <span class="hint">就按“没有数据”处理，而不是当作条件不成立</span>
              </NFlex>
            </NFormItem>
          </NCollapseItem>
        </NCollapse>
      </NForm>

      <NDivider />

      <div class="summary">
        <span class="summary__label">保存后它会这样做</span>
        <span class="summary__text">{{ summary }}</span>
      </div>

      <NFlex justify="center" :size="12" class="mt-4">
        <NButton :disabled="!isEdit || hasScopedCreatedRule || createOutcomeUnknown" @click="simulateVisible = true">
          试运行（不会真的执行）
        </NButton>
        <NButton type="primary" :loading="saving || attachLoading" @click="save">
          {{
            hasScopedCreatedRule
              ? attachLoading
                ? '正在处理'
                : createFlow?.phase === 'enable-failed' || createFlow?.phase === 'enable-unknown'
                  ? '重试启用'
                  : '重试关联'
              : createOutcomeUnknown
                ? '沿用原请求重试'
                : '保存'
          }}
        </NButton>
        <NButton quaternary @click="goBack">返回</NButton>
      </NFlex>
    </NCard>

    <SimulateDrawer
      v-if="canManage && isEdit"
      v-model:visible="simulateVisible"
      :rule-id="ruleId"
      :rule-name="form.name"
    />

    <NModal
      v-if="canManage"
      v-model:show="impactVisible"
      preset="card"
      :style="{ width: '640px' }"
      :bordered="false"
      title="这次改动的范围需要确认"
    >
      <template v-if="impact">
        <NSpace vertical :size="8">
          <div>
            影响范围：
            <strong>{{ impact.scope.deviceCount }}</strong>
            台设备，
            <strong>{{ impact.scope.templateDeviceCount }}</strong>
            台模板关联设备。
          </div>
          <div v-if="impact.scope.deviceIds.length || impact.scope.templateIds.length" class="hint">
            下面显示服务端返回的 ID；具体数量以服务端计数为准。
          </div>
          <NSpace :size="6">
            <NTag
              v-for="id in impact.scope.deviceIds.slice(0, 50)"
              :key="`device-${id}`"
              size="small"
              :bordered="false"
            >
              设备 {{ id }}
            </NTag>
            <NTag
              v-for="id in impact.scope.templateIds.slice(0, 50)"
              :key="`template-${id}`"
              size="small"
              :bordered="false"
            >
              模板 {{ id }}
            </NTag>
          </NSpace>
          <div v-if="impact.scope.truncated" class="hint">ID 列表已截断，服务端计数仍为准确数量。</div>
          <NAlert v-if="impact.bindingIssues.length" type="warning" :bordered="false">
            <div v-for="(issue, index) in impact.bindingIssues" :key="index">{{ issue.message }}</div>
          </NAlert>
          <NAlert v-if="impact.dependencies.some(item => !item.exists)" type="warning" :bordered="false">
            <div
              v-for="dependency in impact.dependencies.filter(item => !item.exists)"
              :key="`${dependency.kind}-${dependency.id}`"
            >
              缺少依赖：{{ dependency.name || dependency.id }}（{{ dependency.kind }}）
            </div>
          </NAlert>
        </NSpace>
      </template>
      <template #footer>
        <NFlex justify="end" :size="8">
          <NButton @click="impactVisible = false">返回修改</NButton>
          <NButton type="primary" :loading="saving" @click="confirmImpact">确认保存</NButton>
        </NFlex>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.group {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 10px;
}

.group__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hint {
  color: var(--text-color-3);
  font-size: 12px;
}

.field-error {
  margin-top: 4px;
  color: rgb(220 38 38);
  font-size: 12px;
}

.summary {
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--body-color);
  line-height: 1.7;
}

.summary__label {
  display: block;
  margin-bottom: 4px;
  color: var(--text-color-3);
  font-size: 12px;
}

.summary__text {
  color: var(--text-color);
  font-size: 14px;
}
</style>
