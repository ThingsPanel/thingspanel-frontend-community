<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeMount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLoading } from '@sa/hooks'
import { useWebSocket } from '@vueuse/core'
import Telemetry from '@/views/device/details/modules/telemetry/telemetry.vue'
import TelemetryChart from '@/views/device/details/modules/telemetry-chart.vue'
import Join from '@/views/device/details/modules/join.vue'
import DeviceAnalysis from '@/views/device/details/modules/device-analysis.vue'
import Message from '@/views/device/details/modules/message.vue'
import Stats from '@/views/device/details/modules/stats.vue'
import EventReport from '@/views/device/details/modules/event-report.vue'
import CommandDelivery from '@/views/device/details/modules/command-delivery.vue'
import ExpectMessage from '@/views/device/details/modules/expect-message.vue'
import Automate from '@/views/device/details/modules/automate.vue'
import GiveAnAlarm from '@/views/device/details/modules/give-an-alarm.vue'
import Settings from '@/views/device/details/modules/settings.vue'
import DeviceStatusHistory from '@/views/device/details/modules/device-status.vue'
import DeviceDiagnosis from '@/views/device/details/modules/device-diagnosis.vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import { deviceAlarmStatus, deviceDetail, deviceUpdate } from '@/service/api/device'
import { localStg } from '@/utils/storage'
import { useRouterPush } from '@/hooks/common/router'
import { getWebsocketServerUrl } from '@/utils/common/tool'
import { createLogger } from '@/utils/logger'
import { message } from '@/utils/common/discrete'
const logger = createLogger('Detail')
const route = useRoute()
const { query } = useRoute()
const appStore = useAppStore()
let { d_id } = query

const getDeviceId = () => {
  return (Array.isArray(d_id) ? d_id[0] : d_id) || ''
}

const { loading, startLoading, endLoading } = useLoading()

type TabComponent = {
  key: string
  name: () => string
  component: any
  refreshKey: number
}

const baseComponents: TabComponent[] = [
  {
    key: 'chart',
    name: () => $t('custom.device_details.chart'),
    component: TelemetryChart,
    refreshKey: 0
  },
  {
    key: 'telemetry',
    name: () => $t('custom.device_details.telemetry'),
    component: Telemetry,
    refreshKey: 0
  },
  {
    key: 'join',
    name: () => $t('custom.device_details.join'),
    component: Join,
    refreshKey: 0
  },
  {
    key: 'device-analysis',
    name: () => $t('custom.device_details.subdevice'),
    component: DeviceAnalysis,
    refreshKey: 0
  },
  {
    key: 'message',
    name: () => $t('custom.device_details.AdditionalDetails'),
    component: Message,
    refreshKey: 0
  },
  {
    key: 'stats',
    name: () => $t('custom.device_details.attributes'),
    component: Stats,
    refreshKey: 0
  },
  {
    key: 'event-report',
    name: () => $t('custom.device_details.eventReport'),
    component: EventReport,
    refreshKey: 0
  },
  {
    key: 'command-delivery',
    name: () => $t('custom.device_details.commandDelivery'),
    component: CommandDelivery,
    refreshKey: 0
  },
  {
    key: 'expect-message',
    name: () => $t('custom.device_details.expectMessage'),
    component: ExpectMessage,
    refreshKey: 0
  },
  {
    key: 'automate',
    name: () => $t('custom.device_details.automate'),
    component: Automate,
    refreshKey: 0
  },
  {
    key: 'give-an-alarm',
    name: () => $t('custom.device_details.giveAnAlarm'),
    component: GiveAnAlarm,
    refreshKey: 0
  },
  {
    key: 'device-diagnosis',
    name: () => $t('custom.device_details.deviceDiagnosis'),
    component: DeviceDiagnosis,
    refreshKey: 0
  },
  {
    key: 'settings',
    name: () => $t('custom.device_details.settings'),
    component: Settings,
    refreshKey: 0
  }
]

const components = ref<TabComponent[]>([])

const tabsRenderKey = ref(0)
let lastTabsSig = ''

function getPreferredTabKey() {
  const keys = components.value.map(item => item.key)

  // Prefer chart first, otherwise telemetry, otherwise the first available.
  if (keys.includes('chart')) return 'chart'
  if (keys.includes('telemetry')) return 'telemetry'
  return components.value[0]?.key || ''
}

function ensureActiveTab() {
  const preferredKey = getPreferredTabKey()
  if (!preferredKey) {
    tabValue.value = ''
    return
  }

  const exists = components.value.some(item => item.key === tabValue.value)
  if (!exists) tabValue.value = preferredKey
}

function bumpRefreshKey(targetKey: string) {
  const current = components.value.find(item => item.key === targetKey)
  if (current) current.refreshKey += 1
}

// Default active: will be set by ensureActiveTab after data loads
const tabValue = ref<string>('')
const showDialog = ref(false)
const showStatusHistoryDialog = ref(false)
const labels = ref<string[]>([])

const deviceData: any = ref({})
const device_type = ref('')
const icon_type = ref('')
const name = ref('')
const device_number = ref('')
const device_is_online = ref(0)
const device_loop = ref(false)
let wsUrl = getWebsocketServerUrl()

wsUrl += `/device/online/status/ws`
const { send } = useWebSocket(wsUrl, {
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
  },
  onMessage(ws: WebSocket, event: MessageEvent) {
    logger.info(ws)
    if (event.data && event.data !== 'pong') {
      const info = JSON.parse(event.data)
      device_is_online.value = info.is_online
    }
  }
})

const queryParams = reactive({
  label: '',
  id: '',
  name: '',
  device_number: '',
  description: ''
})
const changeTabs = v => {
  startLoading()

  tabValue.value = String(v)
  setTimeout(() => {
    endLoading()
  }, 500)
}
const editConfig = () => {
  showDialog.value = true
}

const rules = {
  name: {
    required: true,
    message: $t('custom.devicePage.enterDeviceName'),
    trigger: 'blur'
  },
  device_number: {
    required: true,
    message: $t('custom.devicePage.enterDeviceNumber'),
    trigger: 'blur'
  }
}
const getDeviceDetail = async () => {
  device_loop.value = false
  const { error, data } = await deviceDetail(getDeviceId())
  device_loop.value = true
  deviceData.value = data
  labels.value.length = 0

  if (data.label) {
    if (data.label.includes(',')) {
      labels.value = data.label.split(',')
    } else {
      labels.value.push(data.label)
    }
  }
  if (!error) {
    device_number.value = data.device_number
    device_is_online.value = data.is_online
    name.value = data.name

    // 构建过滤后的组件列表（一次性赋值，避免多次触发响应式更新）
    let filtered = baseComponents.map(item => ({ ...item }))

    if (data?.device_config) {
      device_type.value = data.device_config.device_type
      if (device_type.value !== '2' || !data?.device_config_name) {
          filtered = filtered.filter(item => item.key !== 'device-analysis')
      }
      if (device_type.value === '3') {
          filtered = filtered.filter(item => item.key !== 'join')
      }
      if (!data.device_config.device_template_id) {
          filtered = filtered.filter(item => item.key !== 'chart')
      }
    } else if (!data?.device_config_name) {
        filtered = filtered.filter(item => item.key !== 'device-analysis')
        filtered = filtered.filter(item => item.key !== 'chart')
    }

    // 一次性赋值
    components.value = filtered

    ensureActiveTab()

    const nextSig = components.value.map(item => item.key).join('|')
    if (nextSig !== lastTabsSig) {
      const isFirstRender = lastTabsSig === ''
      lastTabsSig = nextSig
      if (!isFirstRender) {
        await nextTick()
        tabsRenderKey.value += 1
      }
    }

    send(
      JSON.stringify({
        device_id: getDeviceId(),
        token: localStg.get('token')
      })
    )
  }
}
const closeModal = async () => {
  await getDeviceDetail()
  showDialog.value = false
}
const { routerPushByKey } = useRouterPush()
const clickConfig: () => void = () => {
  routerPushByKey('device_config-detail', {
    query: {
      id: deviceData.value?.device_config_id
    }
  })
}
const clickGateway = () => {
  routerPushByKey('device_details', {
    query: {
      d_id: deviceData.value?.parent_id
    }
  })
}
const alarmStatus = ref(false)
const getAlarmStatus = async () => {
  const { data } = await deviceAlarmStatus({ device_id: getDeviceId() })
  alarmStatus.value = data.alarm
}

onBeforeMount(() => {
  getDeviceDetail()
  getAlarmStatus()
})

watch(
  () => route.query.d_id,
  async newVal => {
    d_id = newVal
    await getDeviceDetail()
    bumpRefreshKey(tabValue.value)
    await getAlarmStatus()
  },
  { deep: true }
)

const save = async () => {
  if (!deviceData.value?.name) {
    message.error($t('custom.devicePage.enterDeviceName'))
    return
  }
  if (!deviceData.value?.device_number) {
    message.error($t('custom.devicePage.enterDeviceNumber'))
    return
  }
  if (deviceData.value?.device_number.length > 100) {
    message.error($t('custom.devicePage.deviceNumberMax'))
    return
  }
  device_number.value = deviceData.value.device_number
  queryParams.id = deviceData.value?.id
  queryParams.name = deviceData.value?.name
  queryParams.device_number = deviceData.value?.device_number
  queryParams.label = labels.value.join(',')
  queryParams.description = deviceData.value?.description

  const { error } = await deviceUpdate(queryParams)
  if (!error) {
    showDialog.value = false
    getDeviceDetail()
  }
}
watch(
  () => appStore.locale,
  () => {
    let temporary: any
    // eslint-disable-next-line prefer-const
    temporary = tabValue.value
    tabValue.value = ''
    setTimeout(() => {
      tabValue.value = temporary
    }, 50)
  }
)
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
</script>

<template>
  <div>
    <n-card>
      <div class="mb-4">
        <div style="display: flex; margin-top: -5px">
          <span style="margin-right: 20px; font-size:18px">{{ name || '--' }}</span>
          <NButton v-show="true" type="primary" style="margin-top: -5px" @click="editConfig">
            {{ $t('common.edit') }}
          </NButton>
        </div>

        <n-modal
          v-model:show="showDialog"
          :title="$t('generate.issue-attribute')"
          :class="getPlatform ? 'w-90%' : 'w-400px'"
        >
          <n-card>
            <n-form :model="deviceData" :rules="rules">
              <div>
                <NH3>{{ $t('generate.modify-device-info') }}</NH3>
              </div>
              <n-form-item :label="$t('page.irrigation.group.deviceName')" path="name">
                <n-input v-model:value="deviceData.name" aria-required="true" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-code')" path="device_number">
                <n-input v-model:value="deviceData.device_number" />
              </n-form-item>
              <n-form-item :label="$t('custom.devicePage.label')" path="label">
                <n-dynamic-tags v-model:value="labels" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-description')">
                <!-- <n-input v-model:value="queryParams.deviceDescribe" type="textarea"/> -->
                <NInput v-model:value="deviceData.description" type="textarea" />
              </n-form-item>
              <n-space>
                <n-button @click="closeModal">{{ $t('generate.cancel') }}</n-button>
                <n-button @click="save">{{ $t('common.save') }}</n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-modal>

        <DeviceStatusHistory
          v-model:visible="showStatusHistoryDialog"
          :device-id="getDeviceId()"
        />

        <NFlex style="margin-top: 8px">
          <div class="mr-4">
            <span class="mr-2">ID:</span>
            <span>{{ getDeviceId() || '--' }}</span>
          </div>
          <div class="mr-4">
            <span class="mr-2">{{ $t('custom.devicePage.configTemplate') }} :</span>
            <span v-if="deviceData?.device_config_name" style="color: blue; cursor: pointer" @click="clickConfig">
              {{ deviceData?.device_config_name }}
            </span>
            <span v-else>--</span>
          </div>
          <div v-if="device_type === '3'" class="mr-4">
            <span class="mr-2">{{ $t('generate.gateway') }}:</span>
            <span style="color: blue; cursor: pointer" @click="clickGateway">
              {{ deviceData?.gateway_device_name || '--' }}
            </span>
          </div>
          <!-- 在线/离线，弹窗展示详情 -->
          <div
            class="mr-4"
            style="display: flex; cursor: pointer; align-items: center;"
            @click="showStatusHistoryDialog = true"
          >
            <!-- <span class="mr-2">{{ $t('generate.status') }}:</span> -->
            <SvgIcon
              local-icon="CellTowerRound"
              style="color: #ccc; margin-right: 5px"
              class="text-20px text-primary"
              :stroke="device_is_online === 1 ? 'rgb(2,153,52)' : '#ccc'"
            />
            <span
              :style="{
                color: device_is_online === 1 ? 'rgb(2,153,52)' : '#ccc'
              }"
            >
              {{ device_is_online === 1 ? $t('custom.device_details.online') : $t('custom.device_details.offline') }}
            </span>

            <!-- 历史记录 -->
            <SvgIcon
              local-icon="history"
              style="margin-left: 5px;"
              class="text-18px text-primary"
            />
          </div>
          <div class="mr-4" style="display: flex">
            <template v-if="alarmStatus === true">
              <SvgIcon
                local-icon="AlertFilled"
                style="color: #ee0808; margin-right: 5px"
                class="text-20px text-primary"
                :stroke="icon_type"
              />
              <span style="color: #ee0808">{{ $t('custom.device_details.alarm') }}</span>
            </template>
            <template v-if="alarmStatus === false">
              <SvgIcon
                local-icon="AlertFilled"
                style="color: #ccc; margin-right: 5px"
                class="text-20px text-primary"
                :stroke="icon_type"
              />
              <span style="color: #ccc">{{ $t('custom.device_details.noAlarm') }}</span>
            </template>
          </div>
        </NFlex>
      </div>
      <div>
        <n-tabs :key="tabsRenderKey" v-model:value="tabValue" animated type="line" @update:value="changeTabs">
          <n-tab-pane v-for="component in components" :key="component.key" :tab="component.name()" :name="component.key">
            <n-spin size="small" :show="loading">
              <component
                :is="component.component"
                :id="getDeviceId()"
                :key="component.refreshKey"
                :online="device_is_online"
                :device-data="deviceData"
                :device-config-id="deviceData?.device_config_id || ''"
                :device-template-id="deviceData?.device_config?.device_template_id"
                @change="getDeviceDetail"
              />
            </n-spin>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-card>
  </div>
</template>

<style scoped></style>
