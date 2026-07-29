<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useScriptTag } from '@vueuse/core'
import { TENCENT_MAP_SDK_URL } from '@/constants/map-sdk'
import { isValidCoordinate, getCoordinateValidationError } from '@/utils/common/map-validator'

const { load } = useScriptTag(TENCENT_MAP_SDK_URL)
const emit = defineEmits(['position-selected'])

// 添加组件名称
defineOptions({ name: 'TencentMap' })

// 定义props类型
interface Props {
  longitude?: string | number
  latitude?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  longitude: '',
  latitude: ''
})
const domRef = ref<HTMLDivElement | null>(null)
let map
let currentMarker // 当前位置标记

async function renderMap() {
  await load(true)
  if (!domRef.value) return

  // 使用传入的经纬度或默认坐标作为地图中心点
  const lat = Number(props.latitude) || 39.98412
  const lng = Number(props.longitude) || 116.307484
  const hasValidCoords =
    props.latitude && props.longitude && props.latitude !== '' && props.longitude !== '' && isValidCoordinate(lat, lng)

  const center = new TMap.LatLng(lat, lng)

  map = new TMap.Map(domRef.value, {
    center,
    zoom: hasValidCoords ? 15 : 9, // 如果有坐标则放大显示，否则使用默认缩放
    maxZoom: 18,
    minZoom: 6
  })

  // 如果有有效的经纬度参数，在地图上显示当前位置标记
  if (hasValidCoords) {
    addCurrentLocationMarker(lat, lng)
  }

  map.on('click', event => {
    const lat = event.latLng.getLat()
    const lng = event.latLng.getLng()

    // 验证经纬度是否在有效范围内
    if (!isValidCoordinate(lat, lng)) {
      const error = getCoordinateValidationError(lat, lng)
      console.error('地图点击事件获取到无效的经纬度:', { lat, lng, error })
      return
    }

    // 移除之前的标记
    if (currentMarker) {
      currentMarker.setMap(null)
    }

    // 添加新的标记
    addCurrentLocationMarker(lat, lng)

    emit('position-selected', { lat, lng })
  })
}

// 添加当前位置标记
function addCurrentLocationMarker(lat: number, lng: number) {
  // 验证经纬度参数是否在有效范围内
  if (!isValidCoordinate(lat, lng)) {
    const error = getCoordinateValidationError(lat, lng)
    console.error('addCurrentLocationMarker接收到无效的经纬度参数:', { lat, lng, error })
    return
  }

  // 如果已存在标记，先移除
  if (currentMarker) {
    currentMarker.setMap(null)
  }

  const position = new TMap.LatLng(lat, lng)

  // 创建标记样式
  const markerStyle = new TMap.MarkerStyle({
    width: 30,
    height: 40,
    anchor: { x: 15, y: 40 },
    // 使用红色标记图标
    src:
      'data:image/svg+xml;base64,' +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="#ff4444"/>
        <circle cx="15" cy="15" r="8" fill="white"/>
        <circle cx="15" cy="15" r="5" fill="#ff4444"/>
      </svg>
    `)
  })

  // 创建多标记实例
  currentMarker = new TMap.MultiMarker({
    map,
    styles: {
      'current-location': markerStyle
    },
    geometries: [
      {
        id: 'current-position',
        styleId: 'current-location',
        position
      }
    ]
  })
}

onMounted(() => {
  renderMap()
})

// 监听props变化，当经纬度更新时重新添加标记
watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (map && newLat && newLng && newLat !== '' && newLng !== '') {
      const lat = Number(newLat)
      const lng = Number(newLng)
      if (isValidCoordinate(lat, lng)) {
        // 更新地图中心点
        const center = new TMap.LatLng(lat, lng)
        map.setCenter(center)
        // 添加或更新标记
        addCurrentLocationMarker(lat, lng)
      } else {
        const error = getCoordinateValidationError(lat, lng)
        console.warn('监听到无效的经纬度更新:', { lat, lng, error })
      }
    }
  },
  { immediate: false }
)
</script>

<template>
  <div ref="domRef" class="w-full h-full"></div>
</template>

<style scoped></style>
