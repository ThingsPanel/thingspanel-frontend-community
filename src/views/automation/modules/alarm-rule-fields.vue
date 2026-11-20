<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NButton, NFlex, NInput, NSelect, NRadio, NRadioGroup, NRadioButton, NSwitch } from 'naive-ui'
import type { RuleDefinition } from '@/service/api/automation-rules'
import { deviceNative } from '@/service/api/device-native'
import { templateNative } from '@/service/api/template-native'
import { thingModelNative } from '@/service/api/thingmodel-native'
import type { ModelField } from '@/service/api/thingmodel-native-transport'
import { getNotificationDefaultPolicy, type NotificationDefaultPolicyView } from '@/service/api/notification'
import { notificationV2 } from '@/service/api/notification-v2'
import { newAlarmTrigger } from '@/utils/automation/device-alarm'
import AlarmTriggerFields from './alarm-trigger-fields.vue'
const definition = defineModel<RuleDefinition>({ required: true })
const name = defineModel<string>('name', { required: true })
const props = defineProps<{ locked: boolean; enabled: boolean; editing: boolean }>()
defineEmits<{ enabled: [value: boolean] }>()
const alarm = computed(() => definition.value.alarm!)
const detector = computed(() => alarm.value.sources.includes('detector'))
const scope = computed(() => definition.value.trigger_scope)
const devices = computed(() => scope.value?.device_ids ?? [])
const templates = computed(() => scope.value?.device_config_ids ?? [])
const names = ref<Record<string, string>>({})
const fields = ref<ModelField[]>([])
const metadataError = ref('')
const changedScope = ref(false)
const scopeKind = ref<'device' | 'template'>('device')
const searchOptions = ref<{ label: string; value: string }[]>([])
let searchGeneration = 0
async function search(input = '') {
  const generation = ++searchGeneration
  try {
    const params = { page: 1, pageSize: 40, search: input }
    const { items } = scopeKind.value === 'device' ? await deviceNative.list(params) : await templateNative.list(params)
    if (generation === searchGeneration)
      searchOptions.value = items.map(item => ({
        value: item.id,
        label: item.name + ('deviceNumber' in item ? ' · ' + item.deviceNumber : '')
      }))
  } catch {
    if (generation === searchGeneration) searchOptions.value = []
  }
}
function changeScope(id: string) {
  definition.value.trigger_scope = scopeKind.value === 'device' ? { device_ids: [id] } : { device_config_ids: [id] }
  definition.value.targets = { ...definition.value.trigger_scope, max_targets: scopeKind.value === 'device' ? 1 : 200 }
  changedScope.value = true
}
const specificDevices = computed(() => [
  ...new Set(
    [...(definition.value.trigger.groups ?? []), ...(definition.value.recovery?.groups ?? [])].flatMap(g =>
      g.conditions.map(c => c.device_id).filter((id): id is string => !!id)
    )
  )
])
const scopeText = computed(
  () =>
    [...devices.value, ...templates.value].map(id => names.value[id] || '名称读取中').join('、') ||
    (specificDevices.value.length
      ? specificDevices.value.map(id => names.value[id] || '指定设备').join('、')
      : '按规则条件匹配')
)
watch(
  () => [...devices.value, ...templates.value, ...specificDevices.value],
  async (_, __, cleanup) => {
    let current = true
    cleanup(() => {
      current = false
    })
    fields.value = []
    metadataError.value = ''
    const found: Record<string, string> = {}
    try {
      const bindings = await Promise.all([
        ...[...new Set([...devices.value, ...specificDevices.value])].map(async id => {
          const { device } = await deviceNative.get(id)
          found[id] = device.name
          return device.modelBinding
        }),
        ...templates.value.map(async id => {
          const { template } = await templateNative.get(id)
          found[id] = template.name
          return template.configuration.model
        })
      ])
      const unique = new Map(bindings.filter(b => b?.modelId).map(b => [b!.modelId + ':' + b!.publishedRevision, b!]))
      const snapshots = await Promise.all(
        [...unique.values()].map(b => thingModelNative.version(b.modelId, b.publishedRevision))
      )
      if (current) {
        fields.value =
          snapshots[0]?.model.fields.filter(
            f =>
              (f.kind === 'EVENT' ? f.access.observe : f.access.read) &&
              snapshots.every(s =>
                s.model.fields.some(
                  other =>
                    other.kind === f.kind &&
                    other.identifier === f.identifier &&
                    other.unit === f.unit &&
                    other.valueType?.kind === f.valueType?.kind
                )
              )
          ) ?? []
        if (!fields.value.length && bindings.length) metadataError.value = '未找到可选的已发布指标'
      }
    } catch {
      if (current) metadataError.value = '设备或物模型读取失败'
    } finally {
      if (current)
        names.value = Object.fromEntries(
          [...new Set([...devices.value, ...templates.value, ...specificDevices.value])].map(id => [
            id,
            found[id] || '名称不可用'
          ])
        )
    }
  },
  { immediate: true }
)
const directory = ref<NotificationDefaultPolicyView | null>(null)
const policyError = ref('')
async function loadPolicies() {
  try {
    const res = await getNotificationDefaultPolicy()
    if (!res.data || res.error) throw Error()
    directory.value = res.data
    policyError.value = ''
  } catch {
    policyError.value = '通知策略读取失败'
  }
}
onMounted(() => void loadPolicies())
const notifyMode = ref('none')
watch(
  () => [alarm.value.notify_use_default, alarm.value.notify_policy_id, alarm.value.notify_alias_id],
  () => {
    if (alarm.value.notify_use_default) notifyMode.value = 'default'
    else if (alarm.value.notify_policy_id || alarm.value.notify_alias_id) notifyMode.value = 'policy'
  },
  { immediate: true }
)
function mode(value: string) {
  notifyMode.value = value
  delete alarm.value.notify_alias_id
  delete alarm.value.notify_policy_id
  delete alarm.value.notify_revision
  alarm.value.notify_use_default = value === 'default'
}
const policies = computed(() => directory.value?.availablePolicies ?? [])
const selected = computed(() =>
  notifyMode.value === 'default'
    ? directory.value?.selected
    : policies.value.find(
        p =>
          p.nativeGroupId === alarm.value.notify_policy_id ||
          (p.aliasGroupId && p.aliasGroupId === alarm.value.notify_alias_id)
      )
)
function choosePolicy(id: string) {
  const policy = policies.value.find(p => p.nativeGroupId === id)
  if (!policy) return
  mode('policy')
  alarm.value.notify_policy_id = id
  alarm.value.notify_revision = policy.groupRevision
}
const recipients = ref('')
watch(
  () => [selected.value?.nativeGroupId, alarm.value.notify_revision, selected.value?.groupRevision],
  async (_, __, cleanup) => {
    let current = true
    cleanup(() => {
      current = false
    })
    recipients.value = ''
    const policy = selected.value
    if (!policy) return
    try {
      const { data } = await notificationV2.getGroup(policy.nativeGroupId)
      if (!current) return
      if (data.revision !== (alarm.value.notify_revision || policy.groupRevision)) {
        recipients.value = '按生效版本发送'
        return
      }
      recipients.value = [
        ...new Set(
          data.bindings.map(b => {
            const r = b.recipientSource
            if (r.kind !== 'literal') return '策略指定成员'
            const address = r.recipient.address
            return address.includes('@') ? address.slice(0, 1) + '***@' + address.split('@').pop() : '策略指定地址'
          })
        )
      ].join('、')
    } catch {
      if (current) recipients.value = '收件对象暂不可见'
    }
  },
  { immediate: true }
)
function validation() {
  if (!name.value.trim()) return '请填写规则名称'
  if (!props.editing && !devices.value.length && !templates.value.length) return '请选择适用设备或模板'
  if (notifyMode.value === 'policy' && !alarm.value.notify_policy_id && !alarm.value.notify_alias_id)
    return '请选择通知策略'
  if (notifyMode.value === 'default' && directory.value && !directory.value.selected?.ready)
    return '请先设置可用的租户默认通知策略'
  for (const [label, t] of [
    ['触发', definition.value.trigger],
    ['恢复', definition.value.recovery]
  ] as const) {
    for (const [groupIndex, g] of (t?.groups ?? []).entries())
      for (const [index, c] of g.conditions.entries()) {
        const location = label + '条件（第' + (groupIndex + 1) + '组，第' + (index + 1) + '项）'
        if (!c.key) return location + '请选择指标或事件'
        if (!c.value?.trim() && c.operator !== 'exists') return location + '请填写比较值或选择状态'
        if (
          changedScope.value &&
          c.signal !== 'status' &&
          !fields.value.some(f => f.identifier === c.key && f.kind.toLowerCase() === c.signal)
        )
          return '适用范围已变更，请重新选择匹配的指标'
      }
  }
  return ''
}
defineExpose({ validation, names })
</script>
<template>
  <div class="alarm-editor">
    <header>
      <h2>{{ editing ? '编辑' : '新建' }}告警规则</h2>
      <label>
        启用
        <NSwitch :value="enabled" @update:value="v => $emit('enabled', v)" />
      </label>
    </header>
    <section>
      <div class="basic">
        <label class="form-field">
          规则名称
          <NInput v-model:value="name" placeholder="例如：温室高温告警" />
        </label>
        <div class="form-field">
          适用范围
          <template v-if="locked || editing">
            <span class="scope">{{ scopeText }}</span>
          </template>
          <NFlex v-else :wrap="false">
            <NSelect
              v-model:value="scopeKind"
              style="width: 100px; flex: none"
              :options="[
                { label: '设备', value: 'device' },
                { label: '模板', value: 'template' }
              ]"
              @update:value="
                () => {
                  definition.trigger_scope = {}
                  definition.targets = {}
                  changedScope = true
                  searchOptions = []
                  search()
                }
              "
            />
            <NSelect
              :value="(scopeKind === 'device' ? devices : templates)[0] ?? null"
              remote
              filterable
              :options="searchOptions"
              :fallback-option="(id: string) => ({ value: id, label: names[id] || '已选择' })"
              placeholder="按名称搜索"
              @search="search"
              @update:show="v => v && search()"
              @update:value="changeScope"
            />
          </NFlex>
        </div>
      </div>
      <label v-if="definition.description || !detector" class="form-field">
        说明
        <NInput v-model:value="definition.description" placeholder="填写告警说明" />
      </label>
      <div class="form-field">
        告警级别
        <NRadioGroup v-model:value="alarm.level">
          <NRadioButton value="L">低</NRadioButton>
          <NRadioButton value="M">中</NRadioButton>
          <NRadioButton value="H">高</NRadioButton>
        </NRadioGroup>
      </div>
    </section>
    <section v-if="detector">
      <h3>告警条件</h3>
      <p v-if="metadataError">{{ metadataError }}</p>
      <AlarmTriggerFields :trigger="definition.trigger" :fields="fields" title="触发" :device-names="names" />
      <AlarmTriggerFields
        v-if="definition.recovery"
        :trigger="definition.recovery"
        :fields="fields"
        title="恢复"
        :device-names="names"
      />
      <NButton
        text
        size="small"
        @click="definition.recovery ? delete definition.recovery : (definition.recovery = newAlarmTrigger())"
      >
        {{ definition.recovery ? '移除自定义恢复条件' : '＋ 添加恢复条件' }}
      </NButton>
    </section>
    <section v-else>
      <h3>触发方式</h3>
      由事件触发
    </section>
    <section>
      <h3>通知</h3>
      <NRadioGroup :value="notifyMode" aria-label="通知方式" @update:value="mode">
        <NFlex align="center" :size="[16, 8]">
          <NRadio value="none">仅记录告警</NRadio>
          <NRadio value="default">使用租户默认策略</NRadio>
          <NRadio value="policy">指定通知策略</NRadio>
        </NFlex>
      </NRadioGroup>
      <div v-if="notifyMode !== 'none'" class="policy">
        <NSelect
          v-if="notifyMode === 'policy'"
          :value="selected?.nativeGroupId || alarm.notify_policy_id || alarm.notify_alias_id || null"
          :options="policies.filter(p => p.ready).map(p => ({ label: p.name, value: p.nativeGroupId }))"
          :fallback-option="(id: string) => ({ value: id, label: '原策略（当前不可选）' })"
          filterable
          placeholder="选择通知策略"
          @update:value="choosePolicy"
        />
        <span v-else>{{ selected?.name || (directory ? '尚未设置默认通知策略' : '正在读取') }}</span>
        <span v-if="recipients">收件对象 {{ recipients }}</span>
      </div>
      <p v-if="policyError && notifyMode !== 'none'">
        {{ policyError }}
        <NButton text @click="loadPolicies">重试</NButton>
      </p>
    </section>
  </div>
</template>
<style scoped>
.alarm-editor {
  max-width: 1080px;
  margin: 0 auto;
}
.alarm-editor header,
.basic,
.policy {
  display: flex;
  align-items: center;
  gap: 18px;
}
.alarm-editor header {
  justify-content: space-between;
}
.alarm-editor h2 {
  font-size: 22px;
}
.alarm-editor h3 {
  font-size: 16px;
  margin: 0 0 12px;
}
.alarm-editor section {
  padding: 18px 0;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}
.alarm-editor .form-field {
  display: grid;
  gap: 6px;
}
.basic {
  align-items: start;
  margin-bottom: 14px;
}
.basic .form-field {
  flex: 1;
  min-width: 0;
}
.alarm-editor header > label {
  display: flex;
  align-items: center;
}
.scope {
  padding: 6px 10px;
  background: var(--body-color);
  border-radius: 4px;
}
.policy {
  margin-top: 12px;
  flex-wrap: wrap;
}
.policy .n-select {
  max-width: 400px;
}
.alarm-editor p,
.policy span {
  font-size: 13px;
}
@media (max-width: 700px) {
  .basic {
    display: grid;
  }
  .alarm-editor section {
    padding: 14px 0;
  }
}
</style>
