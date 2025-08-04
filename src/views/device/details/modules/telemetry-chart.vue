<!-- eslint-disable prettier/prettier -->
<script setup lang="tsx">
import { onMounted, onUnmounted, ref } from 'vue'
import type { ICardView } from '@/components/panel/card'
import type { ICardRender } from '@/utils/websocketUtil'
import { localStg } from '@/utils/storage'
import { deviceDetail, deviceTemplateDetail } from '@/service/api/device'
import { useWebsocketUtil } from '@/utils/websocketUtil'
const props = defineProps<{
  id: string
}>()

const token = localStg.get('token')

// CardRender相关
const layout = ref<ICardView[]>([])
const showDefaultCards = ref(true)
const showAppChart = ref(false)
const cr = ref<ICardRender>()
const { updateComponentsData, closeAllSockets } = useWebsocketUtil(cr, token)

const initTemplateData = async (deviceTemplateId: string) => {
  if (deviceTemplateId) {
    const res = await deviceTemplateDetail({ id: deviceTemplateId })
    if (res.data && res.data.web_chart_config) {
      const configJson = JSON.parse(res.data.web_chart_config)
      if (configJson.length > 0) {
        configJson.forEach(item => {
          item.data?.dataSource?.deviceSource?.forEach(device => {
            device.deviceId = props.id
          })
        })
        layout.value = [...configJson]
        if (configJson.length > 0) {
          showDefaultCards.value = false
          showAppChart.value = true
          updateComponentsData(layout)
        }
      } else {
        showDefaultCards.value = true
      }
    } else {
      showDefaultCards.value = true
    }
  } else {
    showDefaultCards.value = true
  }
}
const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(props.id)
  if (!error) {
    if (data.device_config !== undefined) {
      initTemplateData(data.device_config.device_template_id)
    }
  }
}

onMounted(() => {
  getDeviceDetail()
})

onUnmounted(() => {
  closeAllSockets()
})
</script>

<template>
  <n-card class="w-full">
    <template v-if="showAppChart">
      <div style="width: calc(100% + 20px); margin-left: -10px">
        <CardRender
          ref="cr"
          class="card-render"
          :layout="layout"
          :is-preview="true"
          :col-num="4"
          :default-card-col="4"
          :row-height="85"
          :breakpoints="{ lg: 780, md: 500, sm: 0 }"
          :cols="{ lg: 12, md: 6, sm: 4 }"
        />
      </div>
    </template>
  </n-card>
</template>
