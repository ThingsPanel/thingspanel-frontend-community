<script setup lang="tsx">
import { createApp, onMounted, ref, watch, watchEffect } from 'vue'
import { NCard } from 'naive-ui'
import { useScriptTag } from '@vueuse/core'
import dayjs from 'dayjs'
import { TENCENT_MAP_SDK_URL } from '@/constants/map-sdk'
import { $t } from '@/locales'
import { telemetryLatestApi } from '@/service/api/system-data'
import { createLogger } from '@/utils/logger'

const logger = createLogger('GaodeMap')
defineOptions({ name: 'TencentMap' })

const props = defineProps<{ devices: any[] }>()

const { load } = useScriptTag(TENCENT_MAP_SDK_URL)

const domRef = ref<HTMLDivElement | null>(null)
let map: any = null
let multiMarker: any = null
let infoWindow: any = null

const renderInfoWindow = (evt: any, _res: any) => {
  const statusText = {
    1: $t('custom.devicePage.online'),
    0: $t('custom.devicePage.offline')
  } as const

  return (
    <NCard
      header-style="padding:10px"
      title={`${$t('custom.devicePage.deviceName')}：${evt.geometry.data.name}`}
      class="min-h-130px min-w-200px"
    >
      <div>
        {$t('custom.devicePage.lastPushTime')}：
        {evt.geometry.data.ts ? dayjs(evt.geometry.data.ts).format('YYYY-MM-DD HH:mm:ss') : '-'}
      </div>
      <div v-html={evt.geometry.dom}></div>
      <div>
        {$t('generate.status')}：{statusText[evt.geometry.data.is_online]}
      </div>
    </NCard>
  )
}

const showMarker = (markerArr, bounds) => {
  // 如果没有标记点，直接使用默认中心点
  if (!markerArr || markerArr.length === 0) {
    const defaultCenter = new TMap.LatLng(39.98412, 116.307484)
    bounds.extend(defaultCenter)
    map.setCenter(defaultCenter)
    map.setZoom(11)
    return
  }

  // 过滤掉无效的标记点
  const validMarkers = markerArr.filter(marker => {
    const position = marker?.position
    return (
      position &&
      typeof position.lat === 'number' &&
      typeof position.lng === 'number' &&
      !Number.isNaN(position.lat) &&
      !Number.isNaN(position.lng) &&
      position.lat !== 0 &&
      position.lng !== 0
    )
  })

  if (validMarkers.length === 0) {
    // 如果没有有效的标记点，使用默认中心点
    const defaultCenter = new TMap.LatLng(39.98412, 116.307484)
    bounds.extend(defaultCenter)
    map.setCenter(defaultCenter)
    map.setZoom(11)
  } else {
    // 判断标注点是否在范围内
    validMarkers.forEach(item => {
      if (bounds.isEmpty() || !bounds.contains(item.position)) {
        bounds.extend(item.position)
      }
    })
    // 设置地图可视范围
    map.fitBounds(bounds, {
      padding: 100 // 自适应边距
    })
  }
}
let ignoreMapClick = false

async function renderMap() {
  await load(true)
  if (!domRef.value) return

  // 初始化地图
  if (!map) {
    map = new TMap.Map(domRef.value, {
      center: new TMap.LatLng(39.98412, 116.307484),
      zoom: 11,
      maxZoom: 13,
      minZoom: 3,
      viewMode: '3D'
    })
    map.on('click', async () => {
      if (ignoreMapClick) {
        ignoreMapClick = false
        return
      }
      if (infoWindow) {
        infoWindow.close()
      }
    })
  }

  // 清理旧的标记
  if (multiMarker) {
    multiMarker.setMap(null)
  }

  // 处理设备数据
  const markers: any = []
  if (props.devices && props.devices.length > 0) {
    props.devices.forEach(device => {
      if (device?.location) {
        const locations = device.location.split(',')
        const latitude = Number(locations[1] || 0)
        const longitude = Number(locations[0] || 0)

        // 验证经纬度是否有效
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude) && latitude !== 0 && longitude !== 0) {
          markers.push({
            position: new TMap.LatLng(latitude, longitude),
            id: device.id,
            data: device
          })
        }
      }
    })
  }

  // 只有在有有效标记点时才创建 MultiMarker
  if (markers.length > 0) {
    multiMarker = new TMap.MultiMarker({
      map,
      styles: {
        marker: new TMap.MarkerStyle({
          width: 20,
          height: 30,
          anchor: { x: 10, y: 30 },
          color: '#333'
        })
      },
      geometries: markers
    })

    // 添加点击事件
    multiMarker.on('click', (evt: any) => {
      if (!evt?.geometry?.data?.id) return

      telemetryLatestApi(evt.geometry.data.id).then((res: any) => {
        if (!res?.data) return

        const arr = res.data.filter((item: any) => item.label || item.key)
        let dom = ``
        arr.filter(item => {
          if (item.label) {
            dom = `${dom}<div class='item_label'>${item?.label ?? ''}(${item?.key ?? ''})：<span class='card_val'>${item?.value ?? ''} </span> ${item?.unit ?? ''}</div>`
          } else if (item.key) {
            dom = `${dom}<div class='item_label'>${item?.key ?? ''}：<span class='card_val'>${item?.value ?? ''} </span> ${item?.unit ?? ''}</div>`
          }
        })
        evt.geometry.dom = dom

        ignoreMapClick = true
        setTimeout(() => {
          ignoreMapClick = false
        }, 10)

        // 创建信息窗口
        if (!infoWindow) {
          infoWindow = new TMap.InfoWindow({
            map,
            position: new TMap.LatLng(39.984104, 116.307503),
            offset: { x: 0, y: -32 },
            enableCustom: true
          })
        }

        // 创建并显示信息窗口内容
        const app = createApp({
          setup() {
            return () => renderInfoWindow(evt, res)
          }
        })

        const html = app.mount(document.createElement('div')).$el.outerHTML
        infoWindow.open()
        infoWindow.setPosition(evt.geometry.position)
        infoWindow.setContent(html)
        evt.originalEvent.stopPropagation()
      })
    })
  }

  const bounds = new TMap.LatLngBounds()
  showMarker(markers, bounds)
}

onMounted(() => {
  renderMap()
})

watch(
  () => props.devices,
  newValue => {
    logger.info(newValue)
    renderMap()
    infoWindow.close()
  },
  { deep: true }
)

watchEffect(() => {
  renderMap()
})
</script>

<template>
  <div ref="domRef" class="h-full w-full"></div>
</template>

<style lang="scss" scoped>
:deep(.n-card) {
  display: flex;
  align-items: flex-start;
  border: 0;
  padding: 0 15px;
}

:deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: 10px;
}

.card_map {
  padding: 10px !important;
}

:deep(.card_val) {
  color: rgb(var(--nprogress-color)) !important;
}

:deep(.item_label) {
  display: flex;
}
</style>
