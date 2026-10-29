<script setup lang="ts">
/**
 * "What actually applies to this object, and where does it come from?"
 *
 * The device tab used to show only rules whose target named the device, so a
 * rule inherited from the device template was invisible there — the page said
 * "no automation" while the device was being switched by one. This panel reads
 * the reconciled answer instead: template bindings, device overrides and the
 * legacy "condition matches any device" rules, each labelled with its source.
 *
 * It is a read of the same rows the editor writes, so the two cannot disagree.
 */
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NCard, NEmpty, NFlex, NSpin, NTable, NTag } from 'naive-ui'
import { useRouter } from 'vue-router'
import {
  AutomationApiError,
  getDeviceAutomation,
  getTemplateBindings,
  type DeviceAutomation,
  type TemplateBindings
} from '@/service/api/automation-rules'

const props = defineProps<{
  deviceId?: string
  deviceConfigId?: string
}>()

const router = useRouter()
const loading = ref(false)
const failure = ref('')
const device = ref<DeviceAutomation | null>(null)
const template = ref<TemplateBindings | null>(null)

const isDevice = computed(() => Boolean(props.deviceId))

async function load() {
  loading.value = true
  failure.value = ''
  device.value = null
  template.value = null
  try {
    if (props.deviceId) {
      device.value = await getDeviceAutomation(props.deviceId)
    } else if (props.deviceConfigId) {
      template.value = await getTemplateBindings(props.deviceConfigId)
    }
  } catch (error) {
    const apiError = error as AutomationApiError
    failure.value = apiError.message || '生效规则加载失败'
  } finally {
    loading.value = false
  }
}

watch(() => [props.deviceId, props.deviceConfigId], load, { immediate: true })

function sourceLabel(source: string) {
  if (source === 'template') return '来自设备模板'
  if (source === 'device') return '本设备专属'
  if (source === 'condition') return '条件匹配（不限设备）'
  return source
}

function sourceTone(source: string) {
  if (source === 'template') return 'info'
  if (source === 'device') return 'success'
  return 'warning'
}

function openRule(ruleId: string) {
  router.push({ path: '/automation/rule-edit', query: { id: ruleId } })
}

function paramText(params: Record<string, string> | undefined, overridden: string[] | undefined) {
  if (!params || Object.keys(params).length === 0) return '—'
  const marks = new Set(overridden ?? [])
  return Object.entries(params)
    .map(([key, value]) => (marks.has(key) ? `${key}=${value}（本设备覆盖）` : `${key}=${value}`))
    .join('，')
}

const directoryIssue = computed(() =>
  (device.value?.issues ?? []).find(issue => issue.code === 'directory_unavailable')
)
</script>

<template>
  <NCard size="small" :bordered="false" class="mb-4">
    <template #header>
      <NFlex align="center" :size="10">
        <span class="title">对这个对象生效的规则</span>
        <NTag v-if="isDevice" size="small" :bordered="false">设备 {{ deviceId }}</NTag>
        <NTag v-else size="small" :bordered="false">设备模板 {{ deviceConfigId }}</NTag>
        <NButton text type="primary" size="tiny" @click="load">刷新</NButton>
      </NFlex>
    </template>

    <NAlert v-if="failure" type="error" :bordered="false" class="mb-3">
      {{ failure }}
      <NButton text type="primary" size="tiny" class="ml-2" @click="load">重试</NButton>
    </NAlert>

    <NAlert v-if="directoryIssue" type="warning" :bordered="false" class="mb-3">
      {{ directoryIssue.message }}。下面没有列出模板来源的规则，不代表它们不存在。
    </NAlert>

    <NSpin :show="loading">
      <template v-if="isDevice">
        <NEmpty v-if="(device?.rules ?? []).length === 0" size="small" description="这台设备目前没有生效的规则" />
        <NTable v-else size="small" :bordered="false" :single-line="false">
          <thead>
            <tr>
              <th>规则</th>
              <th class="w-160px">来源</th>
              <th class="w-80px">状态</th>
              <th>生效参数</th>
              <th class="w-80px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in device?.rules ?? []" :key="rule.rule_id">
              <td>{{ rule.rule_name }}</td>
              <td>
                <NTag size="small" :type="sourceTone(rule.source)" :bordered="false">
                  {{ sourceLabel(rule.source) }}
                </NTag>
              </td>
              <td>
                <NTag size="small" :type="rule.enabled ? 'success' : 'default'" :bordered="false">
                  {{ rule.enabled ? '已启用' : '已停用' }}
                </NTag>
              </td>
              <td class="params">{{ paramText(rule.effective_params, rule.overridden) }}</td>
              <td>
                <NButton text type="primary" size="tiny" @click="openRule(rule.rule_id)">查看</NButton>
              </td>
            </tr>
          </tbody>
        </NTable>
      </template>

      <template v-else>
        <NFlex v-if="template" :size="12" class="mb-3">
          <NTag :bordered="false" type="info">已绑定 {{ template.attached }} 条</NTag>
          <NTag :bordered="false">已脱离 {{ template.detached }} 条</NTag>
          <NTag :bordered="false" :type="template.device_count > 0 ? 'success' : 'warning'">
            影响 {{ template.device_count }} 台设备
          </NTag>
          <span v-if="template.device_count === 0" class="hint">模板上配了规则，但还没有设备使用这个模板</span>
        </NFlex>
        <NEmpty v-if="(template?.bindings ?? []).length === 0" size="small" description="这个模板还没有绑定规则" />
        <NTable v-else size="small" :bordered="false" :single-line="false">
          <thead>
            <tr>
              <th>规则</th>
              <th>参数</th>
              <th class="w-100px">状态</th>
              <th class="w-80px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="binding in template?.bindings ?? []" :key="binding.id">
              <td>{{ binding.rule_id }}</td>
              <td class="params">{{ paramText(binding.params, []) }}</td>
              <td>
                <NTag size="small" :type="binding.detached_at ? 'warning' : 'success'" :bordered="false">
                  {{ binding.detached_at ? '已脱离' : '生效中' }}
                </NTag>
              </td>
              <td>
                <NButton text type="primary" size="tiny" @click="openRule(binding.rule_id)">查看</NButton>
              </td>
            </tr>
          </tbody>
        </NTable>
      </template>
    </NSpin>
  </NCard>
</template>

<style scoped>
.title {
  font-weight: 600;
}

.params {
  color: var(--text-color-2);
  font-size: 12px;
  word-break: break-all;
}

.hint {
  color: var(--text-color-3);
  font-size: 12px;
}
</style>
