<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NEmpty, NFlex, NInput, NSelect, NTag } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  AutomationNativeError,
  automationNative,
  createAutomationRequestId,
  type AutomationBinding,
  type AutomationIssue,
  type AutomationRule,
  type EffectiveAutomationRule,
  type TemplateBindingsResponse
} from '@/service/api/automation-native'

const props = defineProps<{
  scope: 'device' | 'template'
  targetId: string
  kind: 'automation' | 'alarm_policy'
}>()

const authStore = useAuthStore()
const router = useRouter()
const canManage = computed(() => authStore.userInfo.roles?.includes('TENANT_ADMIN') ?? false)
const loading = ref(false)
const writing = ref(false)
const readError = ref('')
const optionsError = ref('')
const issues = ref<AutomationIssue[]>([])
const errorIssues = ref<AutomationIssue[]>([])
const deviceRules = ref<EffectiveAutomationRule[]>([])
const templateData = ref<TemplateBindingsResponse | null>(null)
const rules = ref<AutomationRule[]>([])
const totalRules = ref(0)
const ruleOffset = ref(0)
const selectedRuleId = ref('')
const parameterValues = reactive<Record<string, string>>({})
const pendingKeys = new Map<string, string>()
let requestGeneration = 0

const selectedRule = computed(() => rules.value.find(rule => rule.id === selectedRuleId.value) ?? null)
const parameters = computed(() => selectedRule.value?.definition.params ?? [])
const hasMoreRules = computed(() => rules.value.length < totalRules.value)
const candidateOptions = computed(() => rules.value.map(rule => ({ label: rule.name, value: rule.id })))
const ruleKinds = computed(() => new Map(rules.value.map(rule => [rule.id, rule.kind])))
const bindingKind = (binding: AutomationBinding) => binding.kind || ruleKinds.value.get(binding.rule_id)
const templatesBindings = computed(() => {
  if (!templateData.value) return []
  return templateData.value.bindings.filter(binding => bindingKind(binding) === props.kind)
})
const unresolvedBindings = computed(() => templateData.value?.bindings.filter(binding => !bindingKind(binding)) ?? [])
const otherKindBindings = computed(
  () =>
    templateData.value?.bindings.filter(binding => {
      const kind = bindingKind(binding)
      return kind && kind !== props.kind
    }) ?? []
)
const bindingKindSummary = computed(() => {
  const counts = new Map<string, number>()
  for (const binding of templateData.value?.bindings ?? []) {
    const kind = bindingKind(binding) || 'unknown'
    counts.set(kind, (counts.get(kind) ?? 0) + 1)
  }
  return [...counts.entries()]
})
const isPartial = computed(() => issues.value.length > 0)
const visibleDeviceRules = computed(() => deviceRules.value.filter(rule => rule.kind === props.kind))

const sourceLabel = (source: string) =>
  ({ template: '来自设备模板', device: '本设备绑定', condition: '条件匹配' })[source] || source
const ruleName = (id: string) => rules.value.find(rule => rule.id === id)?.name || '规则名称暂不可用'

function operationKey(fingerprint: string): string {
  const existing = pendingKeys.get(fingerprint)
  if (existing) return existing
  const key = createAutomationRequestId()
  pendingKeys.set(fingerprint, key)
  return key
}

function createRule() {
  const query =
    props.scope === 'device'
      ? { device_id: props.targetId, backType: 'device', kind: props.kind }
      : { device_config_id: props.targetId, backType: 'config', kind: props.kind }
  void router.push({ path: '/automation/rule-edit', query })
}

function visibleError(error: unknown): string {
  if (error instanceof AutomationNativeError) return `${error.code ? `[${error.code}] ` : ''}${error.message}`
  return error instanceof Error ? error.message : '自动化服务请求失败。'
}

async function loadRulePage(generation: number, append: boolean) {
  const offset = append ? ruleOffset.value : 0
  const result = await automationNative.rules({ kind: props.kind, limit: 200, offset })
  if (generation !== requestGeneration) return
  rules.value = append ? [...rules.value, ...result.rules] : result.rules
  totalRules.value = result.total
  ruleOffset.value = offset + result.rules.length
}

async function reload() {
  const generation = ++requestGeneration
  if (!props.targetId) {
    deviceRules.value = []
    templateData.value = null
    rules.value = []
    totalRules.value = 0
    readError.value = ''
    issues.value = []
    return
  }
  loading.value = true
  readError.value = ''
  optionsError.value = ''
  errorIssues.value = []
  try {
    if (props.scope === 'device') {
      const [responseResult, rulesResult] = await Promise.allSettled([
        automationNative.deviceAutomation(props.targetId),
        loadRulePage(generation, false)
      ])
      if (generation !== requestGeneration) return
      if (responseResult.status === 'fulfilled') {
        deviceRules.value = responseResult.value.rules
        issues.value = responseResult.value.issues ?? []
      } else {
        readError.value = visibleError(responseResult.reason)
        deviceRules.value = []
      }
      if (rulesResult.status === 'rejected')
        optionsError.value = `规则选择列表不可用：${visibleError(rulesResult.reason)}`
    } else {
      const [bindingsResult, rulesResult] = await Promise.allSettled([
        automationNative.templateBindings(props.targetId),
        loadRulePage(generation, false)
      ])
      if (generation !== requestGeneration) return
      if (bindingsResult.status === 'fulfilled') {
        templateData.value = bindingsResult.value
        issues.value = bindingsResult.value.issues ?? []
      } else {
        readError.value = visibleError(bindingsResult.reason)
        templateData.value = null
      }
      if (rulesResult.status === 'rejected') optionsError.value = `规则列表不可用：${visibleError(rulesResult.reason)}`
    }
  } catch (error) {
    if (generation === requestGeneration) {
      readError.value = visibleError(error)
      errorIssues.value = error instanceof AutomationNativeError ? error.fieldIssues : []
      issues.value = []
    }
  } finally {
    if (generation === requestGeneration) loading.value = false
  }
}

async function loadMoreRules() {
  if (loading.value || !hasMoreRules.value) return
  const generation = requestGeneration
  loading.value = true
  try {
    await loadRulePage(generation, true)
  } catch (error) {
    if (generation === requestGeneration) optionsError.value = visibleError(error)
  } finally {
    if (generation === requestGeneration) loading.value = false
  }
}

function resetParameters(ruleId: string | null) {
  for (const key of Object.keys(parameterValues)) delete parameterValues[key]
  const selectedId = ruleId ?? ''
  const rule = rules.value.find(item => item.id === selectedId)
  for (const param of rule?.definition.params ?? []) parameterValues[param.key] = ''
  selectedRuleId.value = selectedId
  errorIssues.value = []
}

function setParameterValue(key: string, value: string | null) {
  parameterValues[key] = value ?? ''
}

function fieldIssue(field: string) {
  return errorIssues.value.find(issue => issue.field === field || issue.field.endsWith(`.${field}`))?.message
}

function paramsForSubmit(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(parameterValues).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== ''
    )
  )
}

function isCurrentOperation(generation: number, scope: 'device' | 'template', targetId: string, kind: string) {
  return generation === requestGeneration && props.scope === scope && props.targetId === targetId && props.kind === kind
}

async function attachRule() {
  if (!canManage.value || writing.value || !selectedRule.value) return
  const generation = requestGeneration
  const scope = props.scope
  const targetId = props.targetId
  const kind = props.kind
  const ruleId = selectedRule.value.id
  const params = paramsForSubmit()
  const bodyBase = {
    scope_type: scope === 'device' ? ('device' as const) : ('device_config' as const),
    scope_id: targetId,
    params
  }
  const fingerprint = JSON.stringify({ ruleId, scope, targetId, kind, ...bodyBase })
  writing.value = true
  errorIssues.value = []
  try {
    await automationNative.attach(ruleId, { ...bodyBase, request_id: operationKey(fingerprint) })
    if (!isCurrentOperation(generation, scope, targetId, kind)) return
    pendingKeys.delete(fingerprint)
    resetParameters('')
    writing.value = false
    await reload()
  } catch (error) {
    if (!isCurrentOperation(generation, scope, targetId, kind)) return
    if (error instanceof AutomationNativeError) errorIssues.value = error.fieldIssues
    const outcome =
      error instanceof AutomationNativeError && error.outcomeUnknown
        ? ' 结果暂不确定，请先刷新核实；重试会沿用本次提交。'
        : ''
    readError.value = `${visibleError(error)}${outcome}`
  } finally {
    if (isCurrentOperation(generation, scope, targetId, kind)) writing.value = false
  }
}

async function detach(binding: AutomationBinding | EffectiveAutomationRule) {
  const bindingId = 'id' in binding ? binding.id : binding.binding_id
  if (!canManage.value || writing.value || !bindingId) return
  const generation = requestGeneration
  const scope = props.scope
  const targetId = props.targetId
  const kind = props.kind
  const fingerprint = JSON.stringify({ op: 'detach', bindingId, scope, targetId, kind })
  writing.value = true
  errorIssues.value = []
  try {
    await automationNative.detach(bindingId, operationKey(fingerprint))
    if (!isCurrentOperation(generation, scope, targetId, kind)) return
    pendingKeys.delete(fingerprint)
    writing.value = false
    await reload()
  } catch (error) {
    if (!isCurrentOperation(generation, scope, targetId, kind)) return
    if (error instanceof AutomationNativeError) errorIssues.value = error.fieldIssues
    const outcome =
      error instanceof AutomationNativeError && error.outcomeUnknown
        ? ' 结果暂不确定，请先刷新核实；重试会沿用本次提交。'
        : ''
    readError.value = `${visibleError(error)}${outcome}`
  } finally {
    if (isCurrentOperation(generation, scope, targetId, kind)) writing.value = false
  }
}

watch(
  () => [props.scope, props.targetId, props.kind],
  () => {
    deviceRules.value = []
    templateData.value = null
    rules.value = []
    totalRules.value = 0
    ruleOffset.value = 0
    selectedRuleId.value = ''
    issues.value = []
    errorIssues.value = []
    readError.value = ''
    optionsError.value = ''
    writing.value = false
    void reload()
  },
  { immediate: true }
)
</script>

<template>
  <div class="native-automation-panel">
    <NAlert v-if="readError" class="mb-4" type="error" :show-icon="false">{{ readError }}</NAlert>
    <NAlert v-if="optionsError" class="mb-4" type="warning" :show-icon="false">{{ optionsError }}</NAlert>
    <NAlert
      v-for="issue in errorIssues"
      :key="`${issue.field}:${issue.code}`"
      class="mb-2"
      type="warning"
      :show-icon="false"
    >
      <strong>{{ issue.field || issue.code }}：</strong>
      {{ issue.message }}
    </NAlert>
    <NAlert
      v-for="issue in issues"
      :key="`${issue.field}:${issue.code}`"
      class="mb-4"
      type="warning"
      :show-icon="false"
    >
      <strong>{{ issue.field || issue.code }}：</strong>
      {{ issue.message }}
    </NAlert>

    <NCard v-if="canManage" size="small" class="mb-4">
      <NFlex align="center" wrap>
        <NSelect
          :value="selectedRuleId || null"
          :options="candidateOptions"
          filterable
          clearable
          class="min-w-260px flex-1"
          :placeholder="kind === 'automation' ? '选择已有自动化规则' : '选择已有告警策略'"
          @update:value="resetParameters"
        />
        <NButton type="primary" :disabled="!selectedRule || writing" :loading="writing" @click="attachRule">
          {{ scope === 'device' ? '绑定到本设备' : '绑定到模板' }}
        </NButton>
        <NButton @click="createRule">新建规则</NButton>
      </NFlex>
      <div v-if="selectedRule" class="mt-3 grid gap-3 md:grid-cols-2">
        <label v-for="param in parameters" :key="param.key" class="parameter-field">
          <span class="parameter-field__label">{{ param.description || param.key }} ({{ param.key }})</span>
          <NSelect
            v-if="param.type === 'bool'"
            :value="parameterValues[param.key] || null"
            clearable
            :options="[
              { label: 'true', value: 'true' },
              { label: 'false', value: 'false' }
            ]"
            :placeholder="`默认 ${param.default}`"
            @update:value="value => setParameterValue(param.key, value)"
          />
          <NInput
            v-else
            v-model:value="parameterValues[param.key]"
            :placeholder="`默认 ${param.default}${param.unit ? ` ${param.unit}` : ''}`"
            :status="fieldIssue(`params.${param.key}`) ? 'error' : undefined"
          />
          <small v-if="fieldIssue(`params.${param.key}`)" class="parameter-field__error">
            {{ fieldIssue(`params.${param.key}`) }}
          </small>
          <small v-else-if="param.min !== undefined || param.max !== undefined" class="parameter-field__hint">
            范围 {{ param.min ?? '不限' }} 至 {{ param.max ?? '不限' }}{{ param.unit ? ` ${param.unit}` : '' }}
          </small>
        </label>
        <NEmpty v-if="parameters.length === 0" size="small" description="此规则没有可配置参数。" />
      </div>
      <NFlex v-if="hasMoreRules" justify="end" class="mt-3">
        <span class="text-secondary">已载入 {{ rules.length }} / {{ totalRules }} 条规则</span>
        <NButton size="small" :loading="loading" @click="loadMoreRules">加载更多规则</NButton>
      </NFlex>
    </NCard>

    <div v-if="loading && !deviceRules.length && !templateData && !readError" class="py-8 text-center text-secondary">
      读取自动化状态中…
    </div>
    <template v-else-if="scope === 'device'">
      <NAlert v-if="isPartial && visibleDeviceRules.length === 0" class="mb-4" type="warning" :show-icon="false">
        依赖数据未能完整读取，当前没有可确认的规则清单。
      </NAlert>
      <NEmpty
        v-else-if="visibleDeviceRules.length === 0 && !isPartial && !readError"
        description="当前没有适用于此设备的规则。"
      />
      <div v-else class="native-rule-list">
        <NCard v-for="rule in visibleDeviceRules" :key="rule.rule_id" size="small" class="mb-3">
          <NFlex justify="space-between" align="center">
            <div>
              <strong>{{ rule.rule_name }}</strong>
              <NTag class="ml-2" :type="rule.enabled ? 'success' : 'default'">
                {{ rule.enabled ? '已启用' : '已停用' }}
              </NTag>
            </div>
            <NFlex v-if="canManage" align="center">
              <NButton
                size="small"
                @click="router.push({ path: '/automation/rule-manage', query: { rule_id: rule.rule_id } })"
              >
                管理规则
              </NButton>
              <NButton
                v-if="canManage && rule.source === 'device' && rule.binding_id"
                size="small"
                type="error"
                :disabled="writing"
                :loading="writing"
                @click="detach(rule)"
              >
                解绑
              </NButton>
            </NFlex>
          </NFlex>
          <div class="mt-2 text-secondary">来源：{{ sourceLabel(rule.source) }}</div>
          <div v-if="rule.effective_params && Object.keys(rule.effective_params).length" class="mt-2">
            <strong>生效参数</strong>
            <div v-for="[key, value] in Object.entries(rule.effective_params)" :key="key">{{ key }}：{{ value }}</div>
          </div>
          <div v-else class="mt-2 text-secondary">此响应未提供生效参数。</div>
          <div v-if="rule.overridden?.length" class="mt-2 text-secondary">
            本设备覆盖：{{ rule.overridden.join('、') }}
          </div>
          <div v-else-if="rule.source === 'template'" class="mt-2 text-secondary">本设备没有覆盖模板参数。</div>
          <div v-else-if="rule.source === 'condition'" class="mt-2 text-secondary">
            条件匹配规则没有设备绑定覆盖值。
          </div>
        </NCard>
      </div>
    </template>
    <template v-else>
      <NFlex v-if="bindingKindSummary.length" class="mb-3" align="center" wrap>
        <span class="text-secondary">模板绑定类型：</span>
        <NTag v-for="[kind, count] in bindingKindSummary" :key="kind" :type="kind === props.kind ? 'info' : 'default'">
          {{ kind === 'unknown' ? '类型未知' : kind }} · {{ count }}
        </NTag>
      </NFlex>
      <NAlert v-if="unresolvedBindings.length > 0" class="mb-4" type="warning" :show-icon="false">
        有 {{ unresolvedBindings.length }} 条绑定没有 kind，且当前规则页未能匹配；类型未知，不能据此认定此类绑定为空。
      </NAlert>
      <NAlert v-if="isPartial && templatesBindings.length === 0" class="mb-4" type="warning" :show-icon="false">
        依赖数据未能完整读取，当前没有可确认的模板规则清单。
      </NAlert>
      <NAlert
        v-if="templatesBindings.length === 0 && otherKindBindings.length > 0"
        class="mb-4"
        type="info"
        :show-icon="false"
      >
        已确认 {{ otherKindBindings.length }} 条绑定属于其他规则类型；本页仅显示 {{ kind }}。
      </NAlert>
      <NEmpty
        v-if="
          templatesBindings.length === 0 &&
          !isPartial &&
          !readError &&
          unresolvedBindings.length === 0 &&
          otherKindBindings.length === 0
        "
        description="此模板当前没有该类绑定规则。"
      />
      <div v-if="templatesBindings.length > 0" class="native-rule-list">
        <NCard v-for="binding in templatesBindings" :key="binding.id" size="small" class="mb-3">
          <NFlex justify="space-between" align="center">
            <div>
              <strong>{{ binding.rule_name || ruleName(binding.rule_id) }}</strong>
              <NTag class="ml-2" :type="binding.enabled && !binding.detached_at ? 'success' : 'default'">
                {{ binding.enabled && !binding.detached_at ? '已绑定' : '已解绑' }}
              </NTag>
            </div>
            <NFlex v-if="canManage" align="center">
              <NButton
                size="small"
                @click="router.push({ path: '/automation/rule-manage', query: { rule_id: binding.rule_id } })"
              >
                管理规则
              </NButton>
              <NButton
                v-if="canManage && binding.enabled && !binding.detached_at"
                size="small"
                type="error"
                :disabled="writing"
                :loading="writing"
                @click="detach(binding)"
              >
                解绑
              </NButton>
            </NFlex>
          </NFlex>
          <div class="mt-2 text-secondary">来源：{{ sourceLabel(binding.source) }}</div>
          <div class="mt-2 text-secondary">规则版本 {{ binding.revision }} · {{ binding.created_at }}</div>
          <div v-if="binding.effective_params && Object.keys(binding.effective_params).length" class="mt-2">
            <strong>模板生效参数</strong>
            <div v-for="[key, value] in Object.entries(binding.effective_params)" :key="key">
              {{ key }}：{{ value }}
            </div>
          </div>
          <div v-else class="mt-2 text-secondary">此绑定没有生效参数返回。</div>
        </NCard>
      </div>
      <div v-if="templateData" class="mt-3 text-secondary">
        已绑定 {{ templateData.attached }} 项，已解绑 {{ templateData.detached }} 项；当前模板设备数
        {{ templateData.device_count }}。
      </div>
    </template>
  </div>
</template>

<style scoped>
.native-automation-panel {
  min-width: 0;
}
.parameter-field {
  display: grid;
  gap: 6px;
}
.parameter-field__label {
  font-size: 13px;
  font-weight: 600;
}
.parameter-field__hint,
.parameter-field__error {
  font-size: 12px;
}
.parameter-field__hint {
  color: var(--text-color-3);
}
.parameter-field__error {
  color: var(--error-color);
}
.text-secondary {
  color: var(--text-color-3);
  font-size: 13px;
}
</style>
