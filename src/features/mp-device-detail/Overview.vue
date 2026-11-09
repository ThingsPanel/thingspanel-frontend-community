<script setup>
import { ref, inject, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { loadDeviceModel } from './model.js'
import { createDeviceRuntime } from './runtime.js'
import { attachFrameLayout } from './frame-layout.js'
import Telemetry from './Telemetry.vue'
const props = defineProps({ device: { type: Object, required: true } })
defineEmits(['notify'])
const context = inject('mp-device'),
  phase = ref('loading'),
  error = ref(''),
  warning = ref(''),
  model = ref(null),
  frameHost = ref(null)
let runtime,
  disposeFrameLayout,
  frame,
  resize,
  readyTimer,
  legacyReadyTimer,
  generation = 0,
  listener,
  visible = true
function dispose() {
  generation++
  clearTimeout(readyTimer)
  clearTimeout(legacyReadyTimer)
  legacyReadyTimer = null
  runtime?.stop()
  runtime = null
  resize?.disconnect()
  resize = null
  disposeFrameLayout?.()
  disposeFrameLayout = null
  if (listener) window.removeEventListener('message', listener)
  frame?.remove()
  frame = null
}
async function load() {
  dispose()
  const current = generation
  phase.value = 'loading'
  error.value = ''
  warning.value = ''
  try {
    model.value = await loadDeviceModel(props.device, context)
    if (current !== generation) return
    if (!model.value.config) {
      phase.value = 'empty'
      return
    }
    const addresses = {
      thingsPanelApiBase: location.origin + '/api/v1',
      thingsVisPageUrl: location.origin + '/main/',
      thingsVisApiBase: location.origin + '/thingsvis-api'
    }
    const pending = []
    runtime = createDeviceRuntime({
      device: props.device,
      deviceId: props.device.id,
      addresses,
      context,
      model: model.value,
      onMessage(message) {
        if (current !== generation) return
        if (frame?.contentWindow) frame.contentWindow.postMessage(JSON.parse(JSON.stringify(message)), location.origin)
        else pending.push(message)
      },
      onState(state) {
        if (current !== generation) return
        if (state.status === 'warning') warning.value = state.message || ''
        else if (state.status === 'empty') phase.value = 'empty'
        else if (state.status === 'error') {
          dispose()
          error.value = state.message
          phase.value = 'error'
        }
      }
    })
    const result = await runtime.start()
    if (current !== generation || !result?.url) return
    await nextTick()
    frame = document.createElement('iframe')
    frame.title = '设备可视化'
    frame.referrerPolicy = 'no-referrer'
    frame.setAttribute('allow', 'fullscreen')
    disposeFrameLayout = attachFrameLayout(frame, frameHost.value.closest('.mp-page-scroll'), {
      contentSized: result.canvas?.mode === 'grid'
    })
    let hostWidth = 0
    let supportsRenderReady = false
    const setHeight = () => {
      const width = frameHost.value?.clientWidth
      if (frame && width && width !== hostWidth) {
        hostWidth = width
        frame.style.height = `${result.canvas?.width > 0 && result.canvas?.height > 0 ? Math.max(160, (width * result.canvas.height) / result.canvas.width) : 480}px`
      }
    }
    listener = event => {
      if (current !== generation || event.source !== frame?.contentWindow || event.origin !== location.origin) return
      const message = event.data
      if (!message || typeof message !== 'object') return
      if (message.payload?.renderReadyModes?.includes(result.canvas?.mode === 'grid' ? 'grid' : 'fixed'))
        supportsRenderReady = true
      // Fixed canvases and older deployments only provide the schema-loaded handshake.
      if (['LOADED', 'tv:loaded'].includes(message.type) && !supportsRenderReady && !legacyReadyTimer) {
        legacyReadyTimer = setTimeout(() => {
          if (current !== generation) return
          clearTimeout(readyTimer)
          phase.value = 'ready'
        }, 800)
      }
      if (message.type === 'tv:content-height') {
        const height = Number(message.payload?.height)
        if (Number.isFinite(height) && height > 0) frame.style.height = `${Math.min(20000, Math.max(160, height))}px`
        return
      }
      if (message.type === 'tv:render-ready') {
        clearTimeout(readyTimer)
        clearTimeout(legacyReadyTimer)
        phase.value = 'ready'
      }
      if (['ERROR', 'tv:error'].includes(message.type)) {
        error.value = '设备可视化加载失败，请重试'
        phase.value = 'error'
        dispose()
        return
      }
      Promise.resolve(runtime?.handleMessage(message)).catch(cause => {
        warning.value = cause.message
      })
    }
    window.addEventListener('message', listener)
    frame.src = result.url
    frameHost.value.append(frame)
    setHeight()
    resize = new ResizeObserver(setHeight)
    resize.observe(frameHost.value)
    readyTimer = setTimeout(() => {
      if (current === generation) {
        dispose()
        error.value = '设备可视化加载超时，请重试'
        phase.value = 'error'
      }
    }, 60000)
    pending.forEach(message => frame.contentWindow?.postMessage(message, location.origin))
  } catch (cause) {
    if (current === generation) {
      dispose()
      error.value = cause.message
      phase.value = 'error'
    }
  }
}
function visibility() {
  if (document.hidden) {
    visible = false
    dispose()
  } else if (!visible) {
    visible = true
    load()
  }
}
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => {
  dispose()
  document.removeEventListener('visibilitychange', visibility)
})
</script>
<template>
  <div class="mp-overview">
    <div v-if="phase === 'loading'" class="mp-state" role="status">正在加载设备可视化…</div>
    <div v-if="phase === 'error'" class="mp-state mp-error" role="alert">
      {{ error }}
      <button @click="load">重新加载</button>
    </div>
    <p v-if="warning" class="mp-warning" role="status">{{ warning }}</p>
    <Telemetry
      v-if="phase === 'empty'"
      :device="device"
      :fields="model?.fields || []"
      @notify="$emit('notify', $event)"
    />
    <div ref="frameHost" class="mp-frame" :class="{ 'mp-frame-loading': phase !== 'ready' }" />
  </div>
</template>
