<script setup>
import { ref, inject, onMounted, onBeforeUnmount } from 'vue'
import { createBoardRuntime } from './board-runtime.js'
const context = inject('mp-device')
const host = ref(null),
  phase = ref('loading'),
  error = ref(''),
  warning = ref('')
let runtime,
  frame,
  listener,
  timer,
  fallback,
  generation = 0,
  suspended = false
function dispose() {
  generation++
  clearTimeout(timer)
  clearTimeout(fallback)
  fallback = null
  runtime?.stop()
  runtime = null
  if (listener) window.removeEventListener('message', listener)
  frame?.remove()
  frame = null
}
async function load() {
  dispose()
  const current = generation
  phase.value = 'loading'
  error.value = warning.value = ''
  let dataReady = false,
    renderReady = false,
    supportsRenderReady = false
  const reveal = () => {
    if (dataReady && renderReady && current === generation) {
      clearTimeout(timer)
      phase.value = 'ready'
    }
  }
  const fail = message => {
    if (current !== generation) return
    dispose()
    phase.value = 'error'
    error.value = message
  }
  try {
    runtime = createBoardRuntime({
      context,
      addresses: {
        thingsPanelApiBase: location.origin + '/api/v1',
        thingsVisApiBase: location.origin + '/thingsvis-api',
        thingsVisPageUrl: location.origin + '/main/'
      },
      onMessage(message) {
        if (current === generation)
          frame?.contentWindow?.postMessage(JSON.parse(JSON.stringify(message)), location.origin)
      },
      onState(state) {
        if (current !== generation) return
        if (state.status === 'ready') {
          dataReady = true
          reveal()
        } else if (state.status === 'error') fail(state.message)
        else if (state.status === 'warning') warning.value = state.message
      }
    })
    const result = await runtime.start()
    if (!result || current !== generation) return
    document.title = result.name || '看板'
    frame = document.createElement('iframe')
    frame.title = result.name || '看板'
    frame.referrerPolicy = 'no-referrer'
    frame.setAttribute('allow', 'fullscreen')
    listener = event => {
      if (event.source !== frame?.contentWindow || event.origin !== location.origin || current !== generation) return
      const message = event.data
      if (!message || typeof message !== 'object') return
      if (message.payload?.renderReadyModes?.includes(result.canvas?.mode === 'grid' ? 'grid' : 'fixed'))
        supportsRenderReady = true
      if (message.type === 'tv:render-ready') {
        clearTimeout(fallback)
        renderReady = true
        reveal()
      }
      if (['LOADED', 'tv:loaded'].includes(message.type) && !supportsRenderReady && !fallback)
        fallback = setTimeout(() => {
          renderReady = true
          reveal()
        }, 800)
      if (['ERROR', 'tv:error'].includes(message.type)) {
        fail('看板加载失败，请重试')
        return
      }
      runtime?.handleMessage(message).catch(cause => fail(cause.message))
    }
    window.addEventListener('message', listener)
    frame.src = result.url
    host.value.append(frame)
    timer = setTimeout(() => fail('看板加载超时，请重试'), 60000)
  } catch (cause) {
    fail(cause.message)
  }
}
function visibility() {
  if (document.hidden) {
    suspended = true
    dispose()
  } else if (suspended) {
    suspended = false
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
  <main class="mp-board">
    <div ref="host" class="mp-board-frame" :class="{ 'mp-board-hidden': phase !== 'ready' }" />
    <div v-if="phase === 'loading'" class="mp-board-state" role="status" aria-label="加载中">
      <span class="mp-board-spinner" />
    </div>
    <div v-else-if="phase === 'error'" class="mp-board-state" role="alert">
      <p>{{ error }}</p>
      <button @click="load">重试</button>
    </div>
    <p v-if="warning && phase === 'ready'" class="mp-board-warning" role="status">{{ warning }}</p>
  </main>
</template>
<style scoped>
.mp-board {
  position: fixed;
  inset: 0;
  background: #f2f2f7;
}
.mp-board-frame,
.mp-board-frame :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.mp-board-hidden {
  opacity: 0;
  pointer-events: none;
}
.mp-board-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #73737d;
  font-size: 14px;
  padding: 24px;
  text-align: center;
}
.mp-board-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-top-color: #8e8e93;
  border-radius: 50%;
  animation: mp-board-spin 0.8s linear infinite;
}
.mp-board-warning {
  position: absolute;
  bottom: 8px;
  left: 12px;
  right: 12px;
  padding: 8px;
  background: #fff;
  color: #a15c00;
  border-radius: 6px;
  font-size: 12px;
}
@keyframes mp-board-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mp-board-spinner {
    animation: none;
  }
}
</style>
