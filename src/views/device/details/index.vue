<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeMount, reactive, ref, watch } from 'vue'
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
import User from '@/views/device/details/modules/user.vue'
import Settings from '@/views/device/details/modules/settings.vue'
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
const { loading, startLoading, endLoading } = useLoading()
let components = [
  {
    key: 'telemetry',
    name: () => $t('custom.device_details.telemetry'),
    component: Telemetry,
    refreshKey: 0
  },
  {
    key: 'chart',
    name: () => $t('custom.device_details.chart'),
    component: TelemetryChart,
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
    key: 'user',
    name: () => $t('custom.device_details.user'),
    component: User,
    refreshKey: 0
  },
  {
    key: 'settings',
    name: () => $t('custom.device_details.settings'),
    component: Settings,
    refreshKey: 0
  }
]

const tabValue = ref<any>('telemetry')
const showDialog = ref(false)
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

  tabValue.value = v
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
  const { error, data } = await deviceDetail(d_id)
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

    if (data?.device_config) {
      device_type.value = data.device_config.device_type
      if (device_type.value !== '2' || !data?.device_config_name) {
        components = components.filter(item => item.key !== 'device-analysis')
      }
      if (device_type.value === '3') {
        components = components.filter(item => item.key !== 'join')
      }
      if (!data.device_config.device_template_id) {
        components = components.filter(item => item.key !== 'chart')
      }
    } else if (!data?.device_config_name) {
      components = components.filter(item => item.key !== 'device-analysis')
      components = components.filter(item => item.key !== 'chart')
    }
    send(
      JSON.stringify({
        device_id: d_id,
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
  const { data } = await deviceAlarmStatus({ device_id: d_id })
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
    const currentComponent = components.find(c => c.key === tabValue.value)
    if (currentComponent) {
      currentComponent.refreshKey += 1
    }
    getDeviceDetail()
    getAlarmStatus()
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
      <div>
        <div style="display: flex; margin-top: -5px">
          <span style="margin-right: 20px">{{ name || '--' }}</span>
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

        <NFlex style="margin-top: 8px">
          <div class="mr-4">
            <span class="mr-2" style="color: #ccc">ID:</span>
            <span style="color: #ccc">{{ d_id || '--' }}</span>
          </div>
          <div class="mr-4" style="color: #ccc">
            <span class="mr-2">{{ $t('custom.devicePage.configTemplate') }} :</span>
            <span v-if="deviceData?.device_config_name" style="color: blue; cursor: pointer" @click="clickConfig">
              {{ deviceData?.device_config_name }}
            </span>
            <span v-else>--</span>
          </div>
          <div v-if="device_type === '3'" class="mr-4" style="color: #ccc">
            <span class="mr-2">{{ $t('generate.gateway') }}:</span>
            <span style="color: blue; cursor: pointer" @click="clickGateway">
              {{ deviceData?.gateway_device_name || '--' }}
            </span>
          </div>
          <div class="mr-4" style="display: flex">
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
      <n-divider title-placement="left"></n-divider>
      <div>
        <n-tabs v-model:value="tabValue" animated type="line" @update:value="changeTabs">
          <n-tab-pane v-for="component in components" :key="component.key" :tab="component.name" :name="component.key">
            <n-spin size="small" :show="loading">
              <component
                :is="component.component"
                :id="d_id as string"
                :key="component.refreshKey"
                :online="device_is_online"
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
