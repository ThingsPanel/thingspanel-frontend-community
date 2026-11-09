<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { TENCENT_MAP_SDK_URL } from '../../constants/map-sdk'
const props = defineProps({ longitude: [String, Number], latitude: [String, Number], interactive: Boolean })
const emit = defineEmits(['pick'])
const host = ref(null),
  error = ref(''),
  address = ref('')
let map,
  marker,
  disposed = false,
  addressVersion = 0
function coordinate() {
  const lng = Number(props.longitude),
    lat = Number(props.latitude)
  return props.longitude !== '' &&
    props.latitude !== '' &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) <= 90
    ? { lng, lat }
    : null
}
function update() {
  if (!map) return
  const point = coordinate()
  marker?.setMap(null)
  marker = null
  if (!point) return
  const position = new window.TMap.LatLng(point.lat, point.lng)
  map.setCenter(position)
  marker = new window.TMap.MultiMarker({ map, geometries: [{ id: 'device', position }] })
  resolveAddress(position)
}
async function resolveAddress(position) {
  const version = ++addressVersion
  address.value = ''
  if (props.interactive || !window.TMap?.service?.Geocoder) return
  let timer
  try {
    const result = await Promise.race([
      new window.TMap.service.Geocoder().getAddress({ location: position }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), 10000)
      })
    ])
    if (!disposed && version === addressVersion) address.value = result.status === 0 ? result.result?.address || '' : ''
  } catch {
    /* Coordinates remain available when reverse geocoding is unavailable. */
  } finally {
    clearTimeout(timer)
  }
}
onMounted(async () => {
  try {
    if (!window.TMap)
      await new Promise((resolve, reject) => {
        if (!TENCENT_MAP_SDK_URL || !new URL(TENCENT_MAP_SDK_URL).searchParams.get('key')) {
          reject(new Error('地图服务未配置，可直接输入经纬度'))
          return
        }
        const url = new URL(TENCENT_MAP_SDK_URL)
        url.searchParams.set('libraries', 'service')
        const script = document.createElement('script')
        script.src = url.href
        const timer = setTimeout(() => reject(new Error('地图加载超时，可直接输入经纬度')), 15000)
        script.onload = () => {
          clearTimeout(timer)
          resolve()
        }
        script.onerror = () => {
          clearTimeout(timer)
          reject(new Error('地图加载失败，可直接输入经纬度'))
        }
        document.head.append(script)
      })
    if (disposed) return
    const point = coordinate() || { lng: 116.307484, lat: 39.98412 }
    map = new window.TMap.Map(host.value, { center: new window.TMap.LatLng(point.lat, point.lng), zoom: 13 })
    map.on('click', event => {
      if (props.interactive && event.latLng)
        emit('pick', { longitude: Number(event.latLng.lng.toFixed(6)), latitude: Number(event.latLng.lat.toFixed(6)) })
    })
    update()
  } catch (cause) {
    if (!disposed) error.value = cause.message
  }
})
watch(() => [props.longitude, props.latitude, props.interactive], update)
onBeforeUnmount(() => {
  disposed = true
  marker?.setMap(null)
  map?.destroy()
})
</script>
<template>
  <div v-if="error" class="mp-state">{{ error }}</div>
  <div v-show="!error" ref="host" class="mp-location-map" aria-label="设备位置地图" />
  <p v-if="address && !interactive" class="mp-muted">{{ address }}</p>
</template>
