<script setup>
import { computed, ref, inject, onMounted, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import { rowsOf } from './schema.js'
import History from './History.vue'
import Sheet from './Sheet.vue'
const props = defineProps({ device: { type: Object, required: true }, fields: { type: Array, default: () => [] } })
const emit = defineEmits(['notify'])
const { api, session } = inject('mp-device')
const items = ref([]),
  loading = ref(true),
  error = ref(''),
  stream = ref(''),
  selected = ref(null),
  mode = ref('history'),
  deleting = ref(null),
  busy = ref(false)
let socket,
  heartbeat,
  reconnect,
  disposed = false,
  version = 0
const metadata = computed(() => new Map(props.fields.map(field => [field.id, field])))
function apply(rows) {
  const values = new Map(items.value.map(item => [item.key, item]))
  for (const row of rows) {
    const key = row.key || row.label
    if (!key || key === 'systime') continue
    const previous = values.get(key) || {},
      field = metadata.value.get(key) || {}
    values.set(key, {
      ...previous,
      key,
      name: field.name || key,
      unit: field.unit || '',
      options: field.options || [],
      value: row.value !== undefined ? row.value : previous.value,
      ts: row.ts || row.time || row.timestamp || previous.ts || null
    })
  }
  items.value = [...values.values()]
}
function format(value) {
  if (value == null || value === '') return '--'
  return typeof value === 'object'
    ? JSON.stringify(value)
    : typeof value === 'boolean'
      ? value
        ? '是'
        : '否'
      : String(value)
}
function display(item) {
  return item.options.find(option => option.value === item.value)?.label || format(item.value)
}
function open(item, kind) {
  selected.value = item
  mode.value = kind
}
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const result = await api('telemetry/datas/current/' + encodeURIComponent(props.device.id))
    if (current === version && !disposed) {
      items.value = []
      apply(rowsOf(result))
    }
  } catch (cause) {
    if (!disposed && current === version) error.value = cause.message
  } finally {
    if (!disposed && current === version) loading.value = false
  }
}
function connect() {
  if (disposed || document.hidden) return
  const current = new WebSocket(location.origin.replace(/^http/, 'ws') + '/api/v1/telemetry/datas/current/ws')
  socket = current
  current.onopen = () => {
    if (socket !== current) return
    stream.value = ''
    current.send(JSON.stringify({ device_id: props.device.id, token: session.token }))
    heartbeat = setInterval(() => {
      if (current.readyState === 1) current.send('ping')
    }, 8000)
  }
  current.onmessage = event => {
    if (socket !== current || ['ping', 'pong'].includes(event.data)) return
    try {
      const message = JSON.parse(event.data),
        source = message.data ?? message.payload ?? message.fields ?? message
      if (Array.isArray(source)) apply(source)
      else if (source?.key) apply([source])
      else if (source && typeof source === 'object')
        apply(
          Object.entries(source).map(([key, value]) => ({
            key,
            value: value?.value ?? value,
            ts: value?.ts || message.ts || message.time || message.timestamp || message.systime
          }))
        )
    } catch {
      stream.value = '实时数据解析异常'
    }
  }
  current.onclose = () => {
    if (socket !== current) return
    clearInterval(heartbeat)
    socket = null
    if (!disposed && !document.hidden) {
      stream.value = '实时数据重连中'
      reconnect = setTimeout(() => {
        load()
        connect()
      }, 3000)
    }
  }
  current.onerror = () => current.close()
}
function disconnect() {
  clearInterval(heartbeat)
  clearTimeout(reconnect)
  const previous = socket
  socket = null
  previous?.close()
}
function visibility() {
  if (document.hidden) disconnect()
  else {
    load()
    connect()
  }
}
async function remove() {
  if (busy.value) return
  busy.value = true
  try {
    const key = deleting.value.key
    await api('telemetry/datas', { device_id: props.device.id, key }, 'DELETE')
    items.value = items.value.filter(item => item.key !== key)
    deleting.value = null
    emit('notify', '已删除')
  } catch (cause) {
    emit('notify', cause.message)
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  load()
  connect()
  document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => {
  disposed = true
  version++
  disconnect()
  document.removeEventListener('visibilitychange', visibility)
})
</script>
<template>
  <div class="mp-telemetry">
    <p v-if="stream" class="mp-warning">{{ stream }}</p>
    <div v-if="loading" class="mp-state">正在加载遥测数据…</div>
    <div v-else-if="error" class="mp-state mp-error" role="alert">
      {{ error }}
      <button @click="load">重试</button>
    </div>
    <div v-else-if="!items.length" class="mp-state">暂无遥测数据</div>
    <article v-for="item in items" v-else :key="item.key" class="mp-telemetry-card">
      <div class="mp-row-heading">
        <div class="mp-field-name">
          <strong>{{ item.name }}</strong>
          <small v-if="item.name !== item.key">{{ item.key }}</small>
        </div>
        <div class="mp-inline-actions">
          <button @click="open(item, 'history')">历史列表</button>
          <button :disabled="typeof item.value !== 'number' || item.options.length > 0" @click="open(item, 'trend')">
            趋势
          </button>
          <button class="muted" @click="deleting = item">更多</button>
        </div>
      </div>
      <p class="mp-telemetry-value" :title="display(item)">
        {{ display(item) }}
        <small>{{ item.unit }}</small>
      </p>
      <p class="mp-muted">{{ item.ts ? '更新于 ' + dayjs(item.ts).format('MM-DD HH:mm:ss') : '暂无上报时间' }}</p>
    </article>
    <History v-if="selected" :device-id="device.id" :field="selected" :mode="mode" @close="selected = null" />
    <Sheet v-if="deleting" title="删除遥测字段" @close="!busy && (deleting = null)">
      <p>确认删除 {{ deleting.name }} 的遥测数据？此操作不可撤销。</p>
      <div class="mp-actions">
        <button :disabled="busy" @click="deleting = null">取消</button>
        <button class="mp-error" :disabled="busy" @click="remove">{{ busy ? '删除中' : '删除' }}</button>
      </div>
    </Sheet>
  </div>
</template>
