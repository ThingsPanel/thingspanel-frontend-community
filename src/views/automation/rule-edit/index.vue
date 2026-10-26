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
  emptyForm,
  formToDefinition,
  issuesToFieldMap,
  mergeDefinition,
  validateForm
} from '@/utils/automation/form'
import { firstIssueMessage, summarizeDefinition, toFormFieldErrors } from '@/utils/automation/summary'
import ConditionEditor from '../modules/condition-editor.vue'
import StepEditor from '../modules/step-editor.vue'
import SimulateDrawer from '../modules/simulate-drawer.vue'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const tabStore = useTabStore()

const ruleId = ref(String(route.query.id ?? ''))
const backType = ref(String(route.query.backType ?? ''))
const deviceId = ref(String(route.query.device_id ?? ''))
const deviceConfigId = ref(String(route.query.device_config_id ?? ''))

const form = ref(
  emptyForm({ deviceID: deviceId.value || undefined, deviceConfigID: deviceConfigId.value || undefined })
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

const isEdit = computed(() => Boolean(ruleId.value))
const isAlarm = computed(() => form.value.kind === 'alarm_policy')
const deviceLocked = computed(() => Boolean(deviceId.value) || Boolean(deviceConfigId.value))

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
  loading.value = true
  try {
    const rule = await getRule(ruleId.value)
    form.value = definitionToForm(rule.definition, rule.name, rule.enabled)
    originalDefinition.value = rule.definition
    version.value = rule.version
    savedEnabled.value = rule.enabled
  } catch (error) {
    formError.value = (error as AutomationApiError).message || '规则加载失败'
  } finally {
    loading.value = false
  }
}

async function loadAlarmPolicies() {
  try {
    const result = await listRules({ kind: 'alarm_policy', limit: 100 })
    alarmPolicies.value = (result.rules ?? []).map(rule => ({ label: rule.name, value: rule.id }))
  } catch {
    // The alarm step falls back to a free-text id, which still works.
    alarmPolicies.value = []
  }
}

async function toggleEnabled(next: boolean) {
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
    message.error(apiError.message || '启停失败')
  }
}

/** The payload for every check and save: the form, plus what it does not own. */
function buildDefinition(): RuleDefinition {
  return mergeDefinition(originalDefinition.value, formToDefinition(form.value))
}

function goBack() {
  if (backType.value === 'device' && deviceId.value) {
    router.replace({ path: '/device/details', query: { d_id: deviceId.value } })
    return
  }
  if (backType.value === 'config' && deviceConfigId.value) {
    router.replace({ path: '/device/template/detail', query: { id: deviceConfigId.value } })
    return
  }
  router.replace({ path: '/automation/rule-manage' })
}

async function persist(options: { force?: boolean; previewToken?: string } = {}) {
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
      const created = await createRule({
        name: form.value.name,
        definition,
        enabled: form.value.enabled
      })
      ruleId.value = created.id
      version.value = created.version
      message.success('已创建')
      await tabStore.removeTab(route.path)
      router.replace({ path: '/automation/rule-edit', query: { id: created.id } })
    }
  } catch (error) {
    handleSaveError(error as AutomationApiError, options)
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
  if (saving.value) return
  fieldErrors.value = {}
  formError.value = ''

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
    if (preview.device_count > 0) {
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
  if (!impact.value) return
  const token = impact.value.token
  impactVisible.value = false
  await persist({ previewToken: token })
}

onMounted(() => {
  if (isEdit.value) loadRule()
  loadAlarmPolicies()
})
</script>

<template>
  <div class="rule-edit">
    <NCard :bordered="false" :title="isEdit ? '编辑规则' : '新建规则'">
      <NAlert v-if="formError" type="error" :bordered="false" class="mb-4" closable @close="formError = ''">
        {{ formError }}
      </NAlert>

      <NForm label-placement="left" label-width="90" size="small">
        <NFlex>
          <NFormItem label="名称" required class="w-160">
            <NInput v-model:value="form.name" placeholder="例如：高温开风机" />
            <div v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</div>
          </NFormItem>
          <NFormItem label="类型" class="w-160">
            <NSelect
              v-model:value="form.kind"
              :options="kindOptions"
              :disabled="isEdit"
              @update:value="(value: RuleKind) => (form.kind = value)"
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

        <NFormItem label="就执行" class="w-100%">
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
        <NButton :disabled="!isEdit" @click="simulateVisible = true">试运行（不会真的执行）</NButton>
        <NButton type="primary" :loading="saving" @click="save">保存</NButton>
        <NButton quaternary @click="goBack">返回</NButton>
      </NFlex>
    </NCard>

    <SimulateDrawer v-if="isEdit" v-model:visible="simulateVisible" :rule-id="ruleId" :rule-name="form.name" />

    <NModal
      v-model:show="impactVisible"
      preset="card"
      :style="{ width: '640px' }"
      :bordered="false"
      title="这次改动会影响这些设备"
    >
      <template v-if="impact">
        <NSpace vertical :size="8">
          <div>
            共
            <strong>{{ impact.device_count }}</strong>
            台设备会按新规则执行。
          </div>
          <div class="hint">下面最多列出 50 台；实际范围以服务端计算为准。</div>
          <NSpace :size="6">
            <NTag v-for="device in impact.devices.slice(0, 50)" :key="device.device_id" size="small" :bordered="false">
              {{ device.device_id }}（{{
                device.source === 'template' ? '来自模板' : device.source === 'device' ? '设备专属' : '条件匹配'
              }}）
            </NTag>
          </NSpace>
          <NAlert v-if="impact.issues?.length" type="warning" :bordered="false">
            <div v-for="(issue, index) in impact.issues" :key="index">{{ issue.message }}</div>
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
