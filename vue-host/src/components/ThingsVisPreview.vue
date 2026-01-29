<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

// --- Props ---
const props = defineProps<{
  studioUrl: string
  token: string | null
}>()

// --- State ---
const webChartConfig = ref(`{
  "canvas": {
    "mode": "reflow",
    "width": 1920,
    "height": 1080,
    "background": "#1a1a1a"
  },
  "nodes": [
    {
      "id": "node-indicator-1",
      "type": "basic/indicator",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 200, "height": 80 },
      "props": {
        "title": "温度监测",
        "value": 25,
        "unit": "°C",
        "status": true
      },
      "grid": { "x": 0, "y": 0, "w": 6, "h": 2 },
      "data": [
        { "targetProp": "value", "expression": "{{ platform.temp }}" },
        { "targetProp": "title", "expression": "{{ platform.status }}" }
      ]
    }
  ]
}`)

const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeLoaded = ref(false)
const events = ref<string[]>([])
const autoPushInterval = ref<number | null>(null)

// --- Computed ---
const previewUrl = computed(() => {
  const baseUrl = props.studioUrl.replace(/\/$/, '')
  // 使用 embed 模式，不带 id，纯靠 postMessage
  const url = `${baseUrl}#/embed?mode=embedded`
  return props.token ? `${url}&token=${props.token}` : url
})

// --- Methods ---
function log(msg: string) {
  events.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`)
  if (events.value.length > 50) events.value.pop()
}

// 1. 加载配置到 ThingsVis
function loadConfig() {
  if (!iframeRef.value?.contentWindow) {
    log('⚠️ Iframe not ready')
    return
  }

  try {
    const config = JSON.parse(webChartConfig.value)
    
    // 发送加载消息
    iframeRef.value.contentWindow.postMessage({
      type: 'LOAD_DASHBOARD',
      payload: {
        canvas: config.canvas,
        nodes: config.nodes,
        name: 'Preview Dashboard'
      }
    }, '*')
    
    log('✅ Sent config to ThingsVis')
  } catch (e) {
    log('❌ JSON Parse Error: ' + (e as Error).message)
  }
}

// 2. 推送实时数据
function pushData() {
  if (!iframeRef.value?.contentWindow) return

  const mockData = {
    temp: (20 + Math.random() * 10).toFixed(1),
    humi: (50 + Math.random() * 30).toFixed(1),
    status: Math.random() > 0.5 ? '运行中' : '待机',
    uptime: Math.floor(Date.now() / 1000)
  }

  // ThingsVis 预览页支持 UPDATE_VARIABLES 消息
  // 这里我们假设组件绑定了 {{ platform.xxx }}，我们需要将这些变量传进去
  // 注意：目前 EmbedPage 支持的是 UPDATE_VARIABLES，我们需要确保 ThingsVis 端能正确解析数据绑定
  // 如果 ThingsVis 端还没实现变量解析，这里可能需要调整
  
  // 发送变量更新
  iframeRef.value.contentWindow.postMessage({
    type: 'UPDATE_VARIABLES',
    payload: {
      platform: mockData
    }
  }, '*')

  log(`📊 Pushed data: temp=${mockData.temp}, status=${mockData.status}`)
}

function toggleAutoPush() {
  if (autoPushInterval.value) {
    clearInterval(autoPushInterval.value)
    autoPushInterval.value = null
    log('⏸️ Stopped auto-push')
  } else {
    pushData()
    autoPushInterval.value = setInterval(pushData, 2000) as unknown as number
    log('▶️ Started auto-push (2s)')
  }
}

function onIframeLoad() {
  iframeLoaded.value = true
  log('Iframe loaded')
  // 自动加载一次
  setTimeout(loadConfig, 500)
}

// --- Lifecycle ---
onUnmounted(() => {
  if (autoPushInterval.value) clearInterval(autoPushInterval.value)
})
</script>

<template>
  <div class="preview-container">
    <div class="sidebar">
      <h3>Preview Control</h3>
      
      <div class="control-group">
        <label>Web Chart Config (JSON):</label>
        <textarea v-model="webChartConfig" rows="15"></textarea>
      </div>

      <div class="button-group">
        <button class="primary" @click="loadConfig">🚀 Load Config</button>
        <button @click="pushData">📊 Push Data Once</button>
        <button @click="toggleAutoPush">
          {{ autoPushInterval ? '⏸️ Stop Auto' : '▶️ Start Auto' }}
        </button>
      </div>

      <div class="logs">
        <h4>Logs</h4>
        <ul>
          <li v-for="(msg, i) in events" :key="i">{{ msg }}</li>
        </ul>
      </div>
    </div>

    <div class="preview-stage">
      <iframe 
        ref="iframeRef"
        :src="previewUrl" 
        @load="onIframeLoad"
        frameborder="0"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #eee;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-stage {
  flex: 1;
  background: #f0f2f5;
  position: relative;
}

iframe {
  width: 100%;
  height: 100%;
  display: block;
}

textarea {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

button {
  padding: 0.5rem;
  cursor: pointer;
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 4px;
}

button.primary {
  background: #0ea5e9;
  color: white;
  border: none;
}

button:hover {
  opacity: 0.9;
}

.logs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logs ul {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  font-family: monospace;
  font-size: 11px;
  background: #f9f9f9;
  padding: 0.5rem;
  border-radius: 4px;
}

.logs li {
  margin-bottom: 2px;
  border-bottom: 1px dashed #eee;
}
</style>
