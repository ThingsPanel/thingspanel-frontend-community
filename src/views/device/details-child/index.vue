<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLoading } from '@sa/hooks'
import { useDeviceDataStore } from '@/store/modules/device'
import Telemetry from '@/views/device/details/modules/telemetry/telemetry.vue'
import Join from '@/views/device/details/modules/join.vue'
import DeviceAnalysis from '@/views/device/details/modules/device-analysis.vue'
import Message from '@/views/device/details/modules/message.vue'
import Stats from '@/views/device/details/modules/stats.vue'
import EventReport from '@/views/device/details/modules/event-report.vue'
import CommandDelivery from '@/views/device/details/modules/command-delivery.vue'
import Automate from '@/views/device/details/modules/automate.vue'
import GiveAnAlarm from '@/views/device/details/modules/give-an-alarm.vue'
import User from '@/views/device/details/modules/user.vue'
import Settings from '@/views/device/details/modules/settings.vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import { deviceDetail, deviceUpdate } from '@/service/api/device'
import { useRouterPush } from '@/hooks/common/router'

const { query } = useRoute()
const appStore = useAppStore()
const { d_id } = query
const { loading, startLoading, endLoading } = useLoading()
const deviceDataStore = useDeviceDataStore()
let components = [
  { key: 'telemetry', name: () => "遥测", component: Telemetry },
  { key: 'join', name: () => "连接", component: Join },
  { key: 'device-analysis', name: () => "子设备", component: DeviceAnalysis },
  { key: 'message', name: () => "信息", component: Message },
  { key: 'stats', name: () => "属性", component: Stats },
  { key: 'event-report', name: () => "事件(上报)", component: EventReport },
  { key: 'command-delivery', name: () => "命令(下发)", component: CommandDelivery },
  { key: 'automate', name: () => "自动化", component: Automate },
  { key: 'give-an-alarm', name: () => "告警", component: GiveAnAlarm },
  { key: 'user', name: () => "用户", component: User },
  { key: 'settings', name: () => "设置", component: Settings }
]

const tabValue = ref<any>('telemetry')
const showDialog = ref(false)
const labels = ref<string[]>([])
const device_color = ref('#ccc')
const device_type = ref('')
const icon_type = ref('')
const device_number = ref('')

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
const close = async () => {
  showDialog.value = false
  deviceDataStore.fetchData(d_id as string)
}
const save = async () => {
  if (!deviceDataStore?.deviceData?.name) {
    window.NMessage.error("请输入设备名称")
    return
  }
  if (!deviceDataStore?.deviceData?.device_number) {
    window.NMessage.error("请输入设备编码")
    return
  }
  if (deviceDataStore?.deviceData?.device_number.length > 100) {
    window.NMessage.error("设备编码不能超过100位")
    return
  }
  device_number.value = deviceDataStore.deviceData.device_number
  queryParams.id = deviceDataStore?.deviceData?.id
  queryParams.name = deviceDataStore?.deviceData?.name
  queryParams.device_number = deviceDataStore?.deviceData?.device_number
  queryParams.label = labels.value.join(',')
  queryParams.description = deviceDataStore?.deviceData?.description

  const { error } = await deviceUpdate(queryParams)
  if (!error) {
    showDialog.value = false
    deviceDataStore.fetchData(d_id as string)
  }
}
const rules = {
  name: {
    required: true,
    message: "请输入设备名称",
    trigger: 'blur'
  },
  device_number: {
    required: true,
    message: "请输入设备编码",
    trigger: 'blur'
  }
}
const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(d_id)
  if (!error) {
    device_number.value = data.device_number
    if (data.is_online !== 0) {
      device_color.value = 'rgb(2,153,52)'
      icon_type.value = 'rgb(2,153,52)'
    }
    if (data.device_config !== undefined) {
      device_type.value = data.device_config.device_type
      if (device_type.value !== '2') {
        components = components.filter(item => item.key !== 'device-analysis')
      }
      if (device_type.value === '3') {
        components = components.filter(item => item.key !== 'join')
      }
    } else {
      components = components.filter(item => item.key !== 'device-analysis')
    }
  }
}

const { routerPushByKey } = useRouterPush()
const clickConfig = () => {
  routerPushByKey('device_config-detail', {
    query: {
      id: deviceDataStore?.deviceData?.device_config_id
    }
  })
}
onMounted(() => {
  getDeviceDetail()
  deviceDataStore.fetchData(d_id as string)
})
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
</script>

<template>
  <div>
    <n-card>
      <div>
        <div style="display: flex; margin-top: -5px">
          <span style="margin-right: 20px">{{ deviceDataStore?.deviceData?.name || '--' }}</span>
          <NButton v-show="true" type="primary" style="margin-top: -5px" @click="editConfig">
            {{ "编辑" }}
          </NButton>
        </div>

        <n-modal v-model:show="showDialog" :title="下发属性" class="w-[400px]">
          <n-card>
            <n-form :model="deviceDataStore.deviceData" :rules="rules">
              <div>
                <NH3>{{ "修改设备信息" }}</NH3>
              </div>
              <n-form-item :label="设备名称" path="name">
                <n-input v-model:value="deviceDataStore.deviceData.name" aria-required="true" />
              </n-form-item>
              <n-form-item :label="设备编号" path="device_number">
                <n-input v-model:value="deviceDataStore.deviceData.device_number" />
              </n-form-item>
              <n-form-item :label="标签" path="label">
                <n-dynamic-tags v-model:value="labels" />
              </n-form-item>
              <n-form-item :label="设备描述">
                <!-- <n-input v-model:value="queryParams.deviceDescribe" type="textarea"/> -->
                <NInput v-model:value="deviceDataStore.deviceData.description" type="textarea" />
              </n-form-item>
              <n-space>
                <n-button @click="close">{{ "取消" }}</n-button>
                <n-button @click="save">{{ "保存" }}</n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-modal>

        <NFlex style="margin-top: 8px">
          <div class="mr-4">
            <span class="mr-2" style="color: #ccc">ID:</span>
            <span style="color: #ccc">{{ device_number || '--' }}</span>
          </div>
          <div class="mr-4" style="color: #ccc">
            <span class="mr-2">{{ "设备模板" }}:</span>
            <span style="color: blue; cursor: pointer" @click="clickConfig">
              {{ deviceDataStore?.deviceData?.device_config_name || '--' }}
            </span>
          </div>
          <div class="mr-4" style="display: flex">
            <!-- <span class="mr-2">{{ "状态" }}:</span> -->
            <SvgIcon
              local-icon="CellTowerRound"
              style="color: #ccc; margin-right: 5px"
              class="text-20px text-primary"
              :stroke="icon_type"
            />
            <span :style="{ color: device_color }">
              {{
                deviceDataStore?.deviceData?.is_online === 1
                  ? "在线"
                  : "离线"
              }}
            </span>
          </div>
          <div class="mr-4" style="display: flex">
            <SvgIcon
              local-icon="AlertFilled"
              style="color: #ccc; margin-right: 5px"
              class="text-20px text-primary"
              :stroke="icon_type"
            />
            <!-- <span style="color: #ccc" class="mr-2">{{ "告警" }}:</span> -->

            <span style="color: #ccc">
              {{ "无告警" }}
            </span>
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
                :device-config-id="deviceDataStore?.deviceData?.device_config_id || ''"
              />
            </n-spin>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-card>
  </div>
</template>

<style scoped></style>
