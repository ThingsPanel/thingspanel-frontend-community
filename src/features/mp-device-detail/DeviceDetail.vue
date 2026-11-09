<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref } from 'vue'
import dayjs from 'dayjs'
import Overview from './Overview.vue'
import Automation from './Automation.vue'
import Alarms from './Alarms.vue'
import Information from './Information.vue'
import Sheet from './Sheet.vue'
import { mainTabs, navigateMini, miniProgramSdk } from './bridge.js'
import fallbackImage from './assets/default-device-hub.png'
import editIcon from './assets/device-edit.svg?url'
import dashboardIcon from './assets/dashboard.png'
import boardsIcon from './assets/boards.png'
import devicesIcon from './assets/devices-selected.png'
import automationIcon from './assets/automation.png'
import accountIcon from './assets/account.png'
const props = defineProps({ session: { type: Object, required: true } })
const context = inject('mp-device')
const device = ref(null),
  error = ref(''),
  loading = ref(false),
  active = ref('overview'),
  editing = ref(false),
  name = ref(''),
  saving = ref(false),
  nameError = ref(''),
  toast = ref(''),
  imageFailed = ref(false)
const inMiniProgram = ref(/miniProgram/i.test(navigator.userAgent) || window.__wxjs_environment === 'miniprogram')
const tabs = [
  { key: 'overview', label: '概览' },
  { key: 'automation', label: '自动化' },
  { key: 'alarm', label: '告警' },
  { key: 'information', label: '信息' }
]
const icons = [dashboardIcon, boardsIcon, devicesIcon, automationIcon, accountIcon]
let version = 0,
  toastTimer
function notify(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 3500)
}
const contextItems = computed(() =>
  [
    { 1: '直连设备', 2: '网关设备', 3: '子设备' }[
      device.value?.device_config?.device_type || device.value?.device_type
    ],
    device.value?.device_config_name,
    device.value?.group_name || device.value?.device_group_name
  ].filter(Boolean)
)
const image = computed(() => {
  const source = device.value?.image_url || device.value?.device_config?.image_url
  if (!source || imageFailed.value) return fallbackImage
  try {
    const url = new URL(source, location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : fallbackImage
  } catch {
    return fallbackImage
  }
})
const lastReported = computed(() => {
  const value = device.value?.ts || device.value?.t
  return value && dayjs(value).isValid()
    ? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
    : device.value?.latest_ts_name || '--'
})
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const result = await context.api('device/detail/' + encodeURIComponent(props.session.deviceId))
    if (current !== version) return
    if (!result || result.id !== props.session.deviceId) throw new Error('设备详情数据无效')
    device.value = result
    imageFailed.value = false
  } catch (cause) {
    if (current === version) error.value = cause.message
  } finally {
    if (current === version) loading.value = false
  }
}
function editName() {
  name.value = device.value.name || ''
  nameError.value = ''
  editing.value = true
}
async function saveName() {
  if (saving.value) return
  const value = name.value.trim()
  if (!value) {
    nameError.value = '请输入设备名称'
    return
  }
  saving.value = true
  nameError.value = ''
  try {
    await context.api('device', { id: props.session.deviceId, name: value }, 'PUT')
    device.value = { ...device.value, name: value }
    editing.value = false
    notify('已保存')
  } catch (cause) {
    nameError.value = cause.message
  } finally {
    saving.value = false
  }
}
async function navigate(path) {
  try {
    await navigateMini(path, true)
  } catch (cause) {
    notify(cause.message)
  }
}
function resume() {
  if (!document.hidden && device.value) load()
}
onMounted(() => {
  load()
  miniProgramSdk()
    .then(sdk =>
      sdk.getEnv(env => {
        inMiniProgram.value = Boolean(env.miniprogram)
      })
    )
    .catch(() => {})
  document.addEventListener('visibilitychange', resume)
})
onBeforeUnmount(() => {
  version++
  clearTimeout(toastTimer)
  document.removeEventListener('visibilitychange', resume)
})
</script>
<template>
  <main class="mp-device-page">
    <header v-if="!inMiniProgram" class="mp-web-heading"><h1>设备详情</h1></header>
    <div class="mp-page-scroll">
      <div v-if="error" class="mp-state mp-error" role="alert">
        {{ error }}
        <button @click="load">重试</button>
      </div>
      <div v-if="loading && !device" class="mp-state" role="status">正在加载设备信息…</div>
      <template v-if="device">
        <section class="mp-device-summary">
          <img class="mp-device-image" :src="image" alt="设备图片" @error="imageFailed = true" />
          <div class="mp-device-main">
            <div class="mp-title-line">
              <h1>{{ device.name || '未命名设备' }}</h1>
              <span
                class="mp-status-dot"
                :class="{ online: Number(device.is_online) === 1 }"
                role="img"
                :aria-label="device.is_online == null ? '状态未知' : Number(device.is_online) === 1 ? '在线' : '离线'"
              />
            </div>
            <div class="mp-context">
              <span v-for="item in contextItems" :key="item" :title="item">{{ item }}</span>
              <button class="mp-edit-name" aria-label="编辑设备名称" @click="editName">
                <img :src="editIcon" alt="" />
              </button>
            </div>
            <p class="mp-last-report">
              最后上报
              <time>{{ lastReported }}</time>
            </p>
          </div>
        </section>
        <nav class="mp-detail-tabs" role="tablist" aria-label="设备详情">
          <button
            v-for="tab in tabs"
            :id="'tab-' + tab.key"
            :key="tab.key"
            role="tab"
            :aria-selected="active === tab.key"
            :class="{ active: active === tab.key }"
            @click="active = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>
        <section class="mp-tab-content" role="tabpanel" :aria-labelledby="'tab-' + active">
          <Overview v-if="active === 'overview'" :key="device.id" :device="device" @notify="notify" />
          <Automation v-else-if="active === 'automation'" :device-id="device.id" @notify="notify" />
          <Alarms v-else-if="active === 'alarm'" :device-id="device.id" @notify="notify" />
          <Information v-else :device="device" @saved="load" @notify="notify" />
        </section>
      </template>
    </div>
    <nav class="mp-bottom-nav" aria-label="主导航">
      <button
        v-for="(tab, index) in mainTabs"
        :key="tab.path"
        :class="{ active: index === 2 }"
        :aria-current="index === 2 ? 'page' : undefined"
        @click="navigate(tab.path)"
      >
        <img :src="icons[index]" alt="" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>
    <div v-if="toast" class="mp-toast" role="status">{{ toast }}</div>
    <Sheet v-if="editing" title="设备名称" @close="!saving && (editing = false)">
      <form @submit.prevent="saveName">
        <label class="mp-field">
          设备名称
          <input v-model="name" maxlength="255" :disabled="saving" autocomplete="off" />
        </label>
        <p v-if="nameError" class="mp-error" role="alert">{{ nameError }}</p>
        <div class="mp-actions">
          <button type="button" :disabled="saving" @click="editing = false">取消</button>
          <button :disabled="saving">{{ saving ? '保存中' : '保存' }}</button>
        </div>
      </form>
    </Sheet>
  </main>
</template>
