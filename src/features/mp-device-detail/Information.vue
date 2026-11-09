<script setup>
import { computed, inject, ref, watch, onBeforeUnmount } from 'vue'
import { buildAdditionalInfo, validateCoordinates, parseExtensionDefinitions } from './information.js'
import LocationMap from './LocationMap.vue'
const props = defineProps({ device: Object })
const emit = defineEmits(['saved', 'notify'])
const { api } = inject('mp-device')
const loading = ref(false),
  saving = ref(false),
  error = ref(''),
  editing = ref(false),
  longitude = ref(''),
  latitude = ref(''),
  fields = ref([])
let original = {},
  snapshot,
  version = 0
const visibleFields = computed(() => fields.value.filter(field => field.enable === true))
const hasCoordinates = computed(
  () =>
    longitude.value !== '' &&
    latitude.value !== '' &&
    Number.isFinite(Number(longitude.value)) &&
    Number.isFinite(Number(latitude.value))
)
function parse(value, fallback) {
  return typeof value === 'string' ? (value.trim() ? JSON.parse(value) : fallback) : (value ?? fallback)
}
async function initialize() {
  const current = ++version
  loading.value = true
  error.value = ''
  editing.value = false
  try {
    const location = String(props.device.location || '').split(',')
    longitude.value = location[0] || ''
    latitude.value = location[1] || ''
    original = parse(props.device.additional_info, {})
    if (!original || typeof original !== 'object') throw new Error('设备扩展信息格式异常，无法安全编辑')
    const config = props.device.device_config_id
      ? await api('device_config/' + encodeURIComponent(props.device.device_config_id))
      : null
    if (current !== version) return
    const definitions = parseExtensionDefinitions(config?.additional_info),
      stored = original.extendedInfo ?? original,
      values = Array.isArray(stored) ? Object.fromEntries(stored.map(item => [item.name, item.value])) : stored
    fields.value = definitions.map(field => {
      const value = Object.hasOwn(values, field.name) ? values[field.name] : field.default_value
      return {
        ...field,
        value: field.type === 'Boolean' ? [true, 'true', 1].includes(value) : value == null ? '' : value
      }
    })
  } catch (cause) {
    if (current === version) error.value = cause.message
  } finally {
    if (current === version) loading.value = false
  }
}
function begin() {
  snapshot = { longitude: longitude.value, latitude: latitude.value, fields: JSON.parse(JSON.stringify(fields.value)) }
  editing.value = true
}
function pick(point) {
  longitude.value = String(point.longitude)
  latitude.value = String(point.latitude)
}
function cancel() {
  longitude.value = snapshot.longitude
  latitude.value = snapshot.latitude
  fields.value = snapshot.fields
  editing.value = false
}
function display(field) {
  return field.type === 'Boolean'
    ? field.value
      ? '是'
      : '否'
    : field.type === 'Enum'
      ? field.options?.find(item => item.value === field.value)?.label || field.value || '未设置'
      : field.value === ''
        ? '未设置'
        : field.value
}
async function save() {
  if (saving.value) return
  try {
    const location = validateCoordinates(longitude.value, latitude.value),
      additional = buildAdditionalInfo(original, fields.value)
    saving.value = true
    await api('device', { id: props.device.id, location, additional_info: JSON.stringify(additional) }, 'PUT')
    editing.value = false
    original = additional
    emit('notify', '保存成功')
    emit('saved')
  } catch (cause) {
    emit('notify', cause.message)
  } finally {
    saving.value = false
  }
}
watch(() => props.device, initialize, { immediate: true })
onBeforeUnmount(() => {
  version++
})
</script>
<template>
  <div class="mp-business-tab mp-information">
    <div v-if="loading" class="mp-state">加载中…</div>
    <div v-else-if="error" class="mp-state mp-error" role="alert">
      {{ error }}
      <button @click="initialize">重试</button>
    </div>
    <template v-else>
      <div class="mp-row-heading">
        <h2>设备位置</h2>
        <div v-if="editing">
          <button :disabled="saving" @click="cancel">取消</button>
          <button :disabled="saving" @click="save">{{ saving ? '保存中' : '保存' }}</button>
        </div>
        <button v-else @click="begin">编辑</button>
      </div>
      <LocationMap
        v-if="editing || hasCoordinates"
        :longitude="longitude"
        :latitude="latitude"
        :interactive="editing && !saving"
        @pick="pick"
      />
      <p v-else class="mp-state">未设置位置</p>
      <template v-if="editing">
        <label class="mp-field">
          经度
          <input v-model.trim="longitude" inputmode="decimal" :disabled="saving" placeholder="-180 至 180" />
        </label>
        <label class="mp-field">
          纬度
          <input v-model.trim="latitude" inputmode="decimal" :disabled="saving" placeholder="-90 至 90" />
        </label>
      </template>
      <p v-else-if="hasCoordinates" class="mp-muted">{{ longitude }}, {{ latitude }}</p>
      <h2 class="mp-extension-heading">扩展信息</h2>
      <p v-if="!visibleFields.length" class="mp-state">暂无扩展信息</p>
      <label v-for="field in visibleFields" :key="field.name" class="mp-field">
        <span>{{ field.name }}</span>
        <small v-if="field.desc">{{ field.desc }}</small>
        <span v-if="!editing">{{ display(field) }}</span>
        <input v-else-if="field.type === 'Boolean'" v-model="field.value" type="checkbox" :disabled="saving" />
        <select v-else-if="field.type === 'Enum'" v-model="field.value" :disabled="saving">
          <option v-for="option in field.options || []" :key="String(option.value)" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <input
          v-else
          v-model="field.value"
          :inputmode="field.type === 'Number' ? 'decimal' : 'text'"
          :disabled="saving"
        />
      </label>
    </template>
  </div>
</template>
