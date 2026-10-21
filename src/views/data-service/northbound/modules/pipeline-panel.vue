<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { $t } from '@/locales'
import {
  createPipeline,
  deletePipeline,
  fetchConnections,
  fetchPipelines,
  previewPipeline,
  setPipelineState,
  testSendPipeline,
  updatePipeline
} from '@/service/api/northbound'
import { formatDateTime } from '@/utils/common/datetime'

const emit = defineEmits<{ (e: 'changed'): void }>()
const message = useMessage()

const loading = ref(false)
const rows = ref<Northbound.Pipeline[]>([])
const connections = ref<Northbound.Connection[]>([])
const visible = ref(false)
const editing = ref<Northbound.Pipeline | null>(null)
const formRef = ref<FormInst | null>(null)
const previewResult = ref<Northbound.PreviewResult | null>(null)
const previewing = ref(false)
const sampleText = ref('')
const testResult = ref('')

const eventTypeOptions = [
  { label: 'telemetry', value: 'telemetry' },
  { label: 'attribute', value: 'attribute' },
  { label: 'event', value: 'event' }
]

const form = reactive({
  name: '',
  connectionId: '',
  eventTypes: ['telemetry'] as string[],
  deviceIds: '',
  include: '',
  exclude: '',
  mask: '',
  wrapAs: '',
  renameText: '{}',
  constantsText: '{}',
  topic: ''
})

const connectionOptions = computed(() =>
  connections.value
    .filter(c => c.state === 'active')
    .map(c => ({ label: c.name, value: c.id }))
)

const columns: DataTableColumns<Northbound.Pipeline> = [
  { title: $t('page.northbound.name'), key: 'name', width: 180, ellipsis: { tooltip: true } },
  { title: $t('page.northbound.target'), key: 'connectionName', width: 160, ellipsis: { tooltip: true } },
  {
    title: $t('page.northbound.state'),
    key: 'state',
    width: 110,
    render(row) {
      const map: Record<string, [string, string]> = {
        active: ['success', $t('page.northbound.pipeActive')],
        paused: ['warning', $t('page.northbound.pipePaused')],
        draft: ['default', $t('page.northbound.pipeDraft')],
        disabled: ['error', $t('page.northbound.pipeDisabled')]
      }
      const [type, text] = map[row.state] ?? ['default', row.state]
      return h(NTag, { size: 'small', type: type as any }, { default: () => text })
    }
  },
  {
    title: $t('page.northbound.backlog'),
    key: 'backlog',
    width: 190,
    render(row) {
      const b = row.backlog
      return h('span', { class: 'text-12px' }, [
        h(NTag, { size: 'tiny', class: 'mr-4px' }, { default: () => `${$t('page.northbound.pending')} ${b.pending}` }),
        h(NTag, { size: 'tiny', type: b.retryWait ? 'warning' : 'default', class: 'mr-4px' }, { default: () => `${$t('page.northbound.retryWait')} ${b.retryWait}` }),
        h(NTag, { size: 'tiny', type: b.unknown ? 'warning' : 'default', class: 'mr-4px' }, { default: () => `${$t('page.northbound.unknown')} ${b.unknown}` }),
        h(NTag, { size: 'tiny', type: b.dead ? 'error' : 'default' }, { default: () => `${$t('page.northbound.dead')} ${b.dead}` })
      ])
    }
  },
  { title: $t('page.northbound.version'), key: 'activeVersion', width: 90, render: row => row.activeVersion ?? '-' },
  { title: $t('page.northbound.updatedAt'), key: 'updatedAt', width: 170, render: row => formatDateTime(row.updatedAt) },
  {
    title: $t('page.northbound.actions'),
    key: 'actions',
    width: 330,
    render(row) {
      const buttons = [
        h(NButton, { size: 'tiny', onClick: () => openEdit(row) }, { default: () => $t('common.edit') }),
        h(NButton, { size: 'tiny', onClick: () => openPreview(row) }, { default: () => $t('page.northbound.preview') })
      ]
      if (row.state === 'active') {
        buttons.push(
          h(NButton, { size: 'tiny', type: 'warning', ghost: true, onClick: () => changeState(row, 'pause') }, { default: () => $t('page.northbound.pause') })
        )
      } else {
        buttons.push(
          h(NButton, { size: 'tiny', type: 'primary', ghost: true, onClick: () => changeState(row, 'activate') }, { default: () => $t('page.northbound.activate') })
        )
      }
      buttons.push(
        h(NButton, { size: 'tiny', ghost: true, onClick: () => changeState(row, 'disable') }, { default: () => $t('page.northbound.disable') })
      )
      // Only a draft can be deleted: once a task has run it owns delivery
      // records that must survive, so the backend refuses with 409. Hiding the
      // button keeps the page from offering an action that cannot succeed.
      if (row.state === 'draft') {
        buttons.push(
          h(
            NPopconfirm,
            { onPositiveClick: () => remove(row) },
            {
              trigger: () => h(NButton, { size: 'tiny', type: 'error', ghost: true }, { default: () => $t('common.delete') }),
              default: () => $t('page.northbound.deletePipelineConfirm')
            }
          )
        )
      }
      return h(NSpace, { size: 4 }, { default: () => buttons })
    }
  }
]

async function load() {
  loading.value = true
  try {
    const [p, c] = await Promise.all([fetchPipelines(), fetchConnections()])
    rows.value = p.data?.pipelines ?? []
    connections.value = c.data?.connections ?? []
  } finally {
    loading.value = false
  }
}

function splitList(text: string): string[] {
  return text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function parseJSONObject(text: string): Record<string, any> {
  const trimmed = text.trim()
  if (!trimmed) return {}
  const parsed = JSON.parse(trimmed)
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON object expected')
  }
  return parsed
}

function buildPayload() {
  const filter: Record<string, any> = {}
  if (form.eventTypes.length) filter.eventTypes = form.eventTypes
  const devices = splitList(form.deviceIds)
  if (devices.length) filter.deviceIds = devices

  const transform: Record<string, any> = {}
  const include = splitList(form.include)
  if (include.length) transform.include = include
  const exclude = splitList(form.exclude)
  if (exclude.length) transform.exclude = exclude
  const mask = splitList(form.mask)
  if (mask.length) transform.mask = mask
  if (form.wrapAs.trim()) transform.wrapAs = form.wrapAs.trim()
  const rename = parseJSONObject(form.renameText)
  if (Object.keys(rename).length) transform.rename = rename
  const constants = parseJSONObject(form.constantsText)
  if (Object.keys(constants).length) transform.constants = constants

  const serialization: Record<string, any> = { format: 'json' }
  if (form.topic.trim()) serialization.topic = form.topic.trim()

  return {
    name: form.name,
    connectionId: form.connectionId,
    filter,
    transform,
    serialization
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.connectionId = connectionOptions.value[0]?.value ?? ''
  form.eventTypes = ['telemetry']
  form.deviceIds = ''
  form.include = ''
  form.exclude = ''
  form.mask = ''
  form.wrapAs = ''
  form.renameText = '{}'
  form.constantsText = '{}'
  form.topic = ''
  previewResult.value = null
  testResult.value = ''
  visible.value = true
}

function openEdit(row: Northbound.Pipeline) {
  editing.value = row
  form.name = row.name
  form.connectionId = row.connectionId
  form.eventTypes = row.filter?.eventTypes ?? []
  form.deviceIds = (row.filter?.deviceIds ?? []).join(',')
  form.include = (row.transform?.include ?? []).join(',')
  form.exclude = (row.transform?.exclude ?? []).join(',')
  form.mask = (row.transform?.mask ?? []).join(',')
  form.wrapAs = row.transform?.wrapAs ?? ''
  form.renameText = JSON.stringify(row.transform?.rename ?? {}, null, 2)
  form.constantsText = JSON.stringify(row.transform?.constants ?? {}, null, 2)
  form.topic = row.serialization?.topic ?? ''
  previewResult.value = null
  testResult.value = ''
  visible.value = true
}

async function save() {
  await formRef.value?.validate()
  let payload: ReturnType<typeof buildPayload>
  try {
    payload = buildPayload()
  } catch {
    message.error($t('page.northbound.badJSON'))
    return
  }

  if (editing.value) {
    const { error } = await updatePipeline(editing.value.id, { ...payload, expectedRevision: editing.value.revision })
    if (error) return
    message.success($t('page.northbound.saved'))
  } else {
    const { error } = await createPipeline(payload)
    if (error) return
    message.success($t('page.northbound.created'))
  }
  visible.value = false
  await load()
  emit('changed')
}

function openPreview(row: Northbound.Pipeline) {
  openEdit(row)
}

async function runPreview() {
  if (!editing.value) {
    message.warning($t('page.northbound.saveFirst'))
    return
  }
  previewing.value = true
  try {
    let sample: Record<string, any>
    try {
      sample = JSON.parse(sampleText.value || '{}')
    } catch {
      message.error($t('page.northbound.badJSON'))
      return
    }
    const { data, error } = await previewPipeline(editing.value.id, sample)
    if (error) return
    previewResult.value = data ?? null
  } finally {
    previewing.value = false
  }
}

async function runTestSend() {
  if (!editing.value) {
    message.warning($t('page.northbound.saveFirst'))
    return
  }
  let sample: Record<string, any>
  try {
    sample = JSON.parse(sampleText.value || '{}')
  } catch {
    message.error($t('page.northbound.badJSON'))
    return
  }
  const { data, error } = await testSendPipeline(editing.value.id, sample)
  if (error) return
  testResult.value = data?.accepted
    ? `${$t('page.northbound.testAccepted')}：${data.deliveryId}`
    : `${$t('page.northbound.testRejected')}：${data?.message ?? ''}`
  await load()
  emit('changed')
}

async function changeState(row: Northbound.Pipeline, action: 'activate' | 'pause' | 'disable') {
  const { error } = await setPipelineState(row.id, action)
  if (error) return
  await load()
  emit('changed')
}

async function remove(row: Northbound.Pipeline) {
  const { error } = await deletePipeline(row.id)
  if (error) return
  message.success($t('page.northbound.deleted'))
  await load()
  emit('changed')
}

onMounted(load)
</script>

<template>
  <NCard size="small">
    <template #header>
      <div class="flex items-center justify-between">
        <span>{{ $t('page.northbound.tabPipelines') }}</span>
        <NButton size="small" type="primary" :disabled="!connectionOptions.length" @click="openCreate">
          {{ $t('page.northbound.newPipeline') }}
        </NButton>
      </div>
    </template>

    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Northbound.Pipeline) => r.id" size="small" />

    <NModal v-model:show="visible" preset="card" style="width: 720px" :title="editing ? $t('page.northbound.editPipeline') : $t('page.northbound.newPipeline')">
      <NForm ref="formRef" :model="form" label-placement="top">
        <NFormItem :label="$t('page.northbound.name')" path="name" :rule="{ required: true, message: $t('page.northbound.nameRequired') }">
          <NInput v-model:value="form.name" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.target')" path="connectionId" :rule="{ required: true, message: $t('page.northbound.targetRequired') }">
          <NSelect v-model:value="form.connectionId" :options="connectionOptions" :disabled="!!editing" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.eventTypes')">
          <NSelect v-model:value="form.eventTypes" multiple :options="eventTypeOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.deviceIds')">
          <NInput v-model:value="form.deviceIds" :placeholder="$t('page.northbound.commaHint')" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.include')">
          <NInput v-model:value="form.include" :placeholder="$t('page.northbound.commaHint')" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.exclude')">
          <NInput v-model:value="form.exclude" :placeholder="$t('page.northbound.commaHint')" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.mask')">
          <NInput v-model:value="form.mask" :placeholder="$t('page.northbound.commaHint')" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.rename')">
          <NInput v-model:value="form.renameText" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.constants')">
          <NInput v-model:value="form.constantsText" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.wrapAs')">
          <NInput v-model:value="form.wrapAs" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.topic')">
          <NInput v-model:value="form.topic" placeholder="northbound/{deviceId}/{eventType}" />
        </NFormItem>
      </NForm>

      <NCard size="small" :title="$t('page.northbound.preview')" class="mt-8px">
        <NInput
          v-model:value="sampleText"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 10 }"
          :placeholder="$t('page.northbound.sampleHint')"
        />
        <NSpace class="mt-8px">
          <NButton size="small" :loading="previewing" @click="runPreview">{{ $t('page.northbound.preview') }}</NButton>
          <NButton size="small" type="primary" ghost @click="runTestSend">{{ $t('page.northbound.testSend') }}</NButton>
        </NSpace>
        <div v-if="previewResult" class="mt-8px text-13px">
          <NTag size="small" :type="previewResult.matched ? 'success' : 'warning'" class="mr-8px">
            {{ previewResult.matched ? $t('page.northbound.matched') : $t('page.northbound.notMatched') }}
          </NTag>
          <span class="text-gray-500">{{ previewResult.matchReason }}</span>
          <pre v-if="previewResult.output" class="mt-8px overflow-auto rounded bg-gray-50 p-8px text-12px">{{ JSON.stringify(previewResult.output, null, 2) }}</pre>
          <div v-if="previewResult.warnings?.length" class="mt-4px text-orange-500">
            {{ previewResult.warnings.join('; ') }}
          </div>
        </div>
        <div v-if="testResult" class="mt-8px text-13px">{{ testResult }}</div>
      </NCard>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="save">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
