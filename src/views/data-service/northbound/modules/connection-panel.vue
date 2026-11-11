<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { $t } from '@/locales'
import {
  createConnection,
  deleteConnection,
  fetchConnections,
  testConnection,
  updateConnection
} from '@/service/api/northbound'
import { formatDateTime } from '@/utils/common/datetime'

const props = defineProps<{ connectors: Northbound.Connector[] }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

const message = useMessage()
const loading = ref(false)
const rows = ref<Northbound.Connection[]>([])
const visible = ref(false)
const editing = ref<Northbound.Connection | null>(null)
const formRef = ref<FormInst | null>(null)
const checks = ref<Northbound.Check[]>([])
const testing = ref(false)

const form = reactive({
  name: '',
  connectorId: '',
  config: {} as Record<string, any>,
  secrets: {} as Record<string, string>
})

const readyConnectors = computed(() =>
  props.connectors
    .filter(c => c.state === 'ready')
    .map(c => ({ label: c.displayName, value: c.id }))
)

const activeConnector = computed(() => props.connectors.find(c => c.id === form.connectorId) ?? null)

/** 由插件自己的 JSON Schema 驱动的字段列表，页面不硬编码任何插件参数。 */
const schemaFields = computed(() => {
  const schema = activeConnector.value?.configSchema ?? {}
  const properties = (schema.properties ?? {}) as Record<string, any>
  const required: string[] = schema.required ?? []
  return Object.entries(properties).map(([key, def]) => ({
    key,
    def,
    required: required.includes(key)
  }))
})

const columns: DataTableColumns<Northbound.Connection> = [
  { title: $t('page.northbound.name'), key: 'name', width: 180, ellipsis: { tooltip: true } },
  { title: $t('page.northbound.connector'), key: 'connectorName', width: 160 },
  {
    title: $t('page.northbound.state'),
    key: 'state',
    width: 130,
    render(row) {
      const type = row.state === 'active' ? 'success' : row.state === 'needs_repair' ? 'error' : 'default'
      const text =
        row.state === 'active'
          ? $t('page.northbound.connActive')
          : row.state === 'needs_repair'
            ? $t('page.northbound.connRepair')
            : $t('page.northbound.connDisabled')
      return h(NTag, { size: 'small', type }, { default: () => text })
    }
  },
  {
    title: $t('page.northbound.secretsSet'),
    key: 'secretFieldsSet',
    width: 150,
    render: row =>
      row.secretFieldsSet.length
        ? row.secretFieldsSet.map(s => h(NTag, { size: 'small', class: 'mr-4px' }, { default: () => s }))
        : h('span', { class: 'text-gray-400' }, $t('page.northbound.none'))
  },
  { title: $t('page.northbound.revision'), key: 'revision', width: 80 },
  {
    title: $t('page.northbound.updatedAt'),
    key: 'updatedAt',
    width: 170,
    render: row => formatDateTime(row.updatedAt)
  },
  {
    title: $t('page.northbound.actions'),
    key: 'actions',
    width: 240,
    render(row) {
      return h(NSpace, { size: 4 }, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => runTest(row) }, { default: () => $t('page.northbound.test') }),
          h(NButton, { size: 'tiny', onClick: () => openEdit(row) }, { default: () => $t('common.edit') }),
          h(
            NPopconfirm,
            { onPositiveClick: () => remove(row) },
            {
              trigger: () => h(NButton, { size: 'tiny', type: 'error', ghost: true }, { default: () => $t('common.delete') }),
              default: () => $t('page.northbound.deleteConnectionConfirm')
            }
          )
        ]
      })
    }
  }
]

async function load() {
  loading.value = true
  try {
    const { data } = await fetchConnections()
    rows.value = data?.connections ?? []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.connectorId = readyConnectors.value[0]?.value ?? ''
  form.config = {}
  form.secrets = {}
  checks.value = []
  visible.value = true
}

function openEdit(row: Northbound.Connection) {
  editing.value = row
  form.name = row.name
  form.connectorId = row.connectorId
  form.config = { ...row.config }
  form.secrets = {}
  checks.value = []
  visible.value = true
}

function defaultFor(def: any) {
  if (def.default !== undefined) return def.default
  if (def.type === 'boolean') return false
  if (def.type === 'integer' || def.type === 'number') return null
  return ''
}

function ensureDefaults() {
  // 切换连接器类型时把新 schema 的默认值填上，避免提交空对象。
  const next: Record<string, any> = {}
  for (const f of schemaFields.value) {
    next[f.key] = form.config[f.key] !== undefined ? form.config[f.key] : defaultFor(f.def)
  }
  form.config = next
}

async function save() {
  await formRef.value?.validate()
  const body: any = {
    name: form.name,
    connectorId: form.connectorId,
    config: form.config
  }
  // 秘密字段留空表示"不修改"，空对象表示"没有秘密"，两者语义不同。
  if (Object.keys(form.secrets).length) body.secrets = form.secrets

  if (editing.value) {
    body.expectedRevision = editing.value.revision
    const { error } = await updateConnection(editing.value.id, body)
    if (error) return
    message.success($t('page.northbound.saved'))
  } else {
    const { error } = await createConnection(body)
    if (error) return
    message.success($t('page.northbound.created'))
  }
  visible.value = false
  await load()
  emit('changed')
}

async function runTest(row: Northbound.Connection) {
  testing.value = true
  checks.value = []
  try {
    const { data, error } = await testConnection(row.id)
    if (error || !data) {
      message.error($t('page.northbound.testFailed'))
      return
    }
    checks.value = data.checks
    if (data.ok) {
      message.success($t('page.northbound.testOk'))
    } else {
      message.error(data.message || $t('page.northbound.testFailed'))
    }
    await load()
    emit('changed')
  } finally {
    testing.value = false
  }
}

async function remove(row: Northbound.Connection) {
  const { error } = await deleteConnection(row.id)
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
        <span>{{ $t('page.northbound.tabConnections') }}</span>
        <NButton size="small" type="primary" :disabled="!readyConnectors.length" @click="openCreate">
          {{ $t('page.northbound.newConnection') }}
        </NButton>
      </div>
    </template>

    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Northbound.Connection) => r.id" size="small" />

    <NModal v-model:show="visible" preset="card" style="width: 640px" :title="editing ? $t('page.northbound.editConnection') : $t('page.northbound.newConnection')">
      <NForm ref="formRef" :model="form" label-placement="top">
        <NFormItem :label="$t('page.northbound.name')" path="name" :rule="{ required: true, message: $t('page.northbound.nameRequired') }">
          <NInput v-model:value="form.name" />
        </NFormItem>
        <NFormItem :label="$t('page.northbound.connector')" path="connectorId">
          <NSelect v-model:value="form.connectorId" :options="readyConnectors" :disabled="!!editing" @update:value="ensureDefaults" />
        </NFormItem>

        <template v-for="f in schemaFields" :key="f.key">
          <NFormItem :label="f.def.title || f.key" :path="`config.${f.key}`">
            <NInputNumber
              v-if="f.def.type === 'integer' || f.def.type === 'number'"
              v-model:value="form.config[f.key]"
              class="w-full"
              :min="f.def.minimum"
              :max="f.def.maximum"
              :placeholder="f.def.description"
            />
            <NSwitch v-else-if="f.def.type === 'boolean'" v-model:value="form.config[f.key]" />
            <NSelect
              v-else-if="f.def.enum"
              v-model:value="form.config[f.key]"
              :options="f.def.enum.map((v: any) => ({ label: String(v), value: v }))"
            />
            <NInput
              v-else
              v-model:value="form.config[f.key]"
              :placeholder="f.def.description"
              :type="f.key.toLowerCase().includes('password') ? 'password' : 'text'"
              show-password-on="click"
            />
          </NFormItem>
        </template>

        <template v-for="s in activeConnector?.secretFields ?? []" :key="s">
          <NFormItem :label="`${s}（${$t('page.northbound.secretHint')}）`">
            <NInput v-model:value="form.secrets[s]" type="password" show-password-on="click" :placeholder="editing ? $t('page.northbound.secretKeep') : ''" />
          </NFormItem>
        </template>
      </NForm>

      <div v-if="checks.length" class="mt-8px">
        <div v-for="c in checks" :key="c.name" class="text-13px">
          <NTag size="small" :type="c.ok ? 'success' : 'error'" class="mr-8px">{{ c.name }}</NTag>
          <span>{{ c.message }}</span>
        </div>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton :loading="testing" @click="editing && runTest(editing)">{{ $t('page.northbound.test') }}</NButton>
          <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="save">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
