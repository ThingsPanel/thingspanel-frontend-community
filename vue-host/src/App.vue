<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// --- Types ---
type IntegrationLevel = 'full' | 'minimal'

interface PlatformField {
  id: string
  name: string
  type: 'number' | 'string' | 'boolean' | 'json'
  dataType: 'attribute' | 'telemetry' | 'command'
  unit?: string
  description?: string
}

// --- State ---
const studioUrl = ref('http://localhost:3000/main')
const integrationLevel = ref<IntegrationLevel>('full')
const showComponentLibrary = ref(true)
const showPropsPanel = ref(true)
const showTopLeft = ref(true)
const showToolbar = ref(true)
const showTopRight = ref(true)
const injectDefaultProject = ref(false)
const iframeKey = ref(0)
const events = ref<string[]>([])
const iframeRef = ref<HTMLIFrameElement | null>(null)

// 平台字段功能
const enablePlatformFields = ref(true)
const saveTarget = ref<'self' | 'host'>('host')
const dataPushInterval = ref<number | null>(null)

// Sidebar collapse state
const sidebarCollapsed = ref(false)

// --- Platform Fields ---
const platformFields: PlatformField[] = [
  { id: 'temp', name: '温度', type: 'number', dataType: 'telemetry', unit: '°C', description: '设备当前温度' },
  { id: 'humi', name: '湿度', type: 'number', dataType: 'telemetry', unit: '%', description: '设备当前湿度' },
  { id: 'status', name: '运行状态', type: 'string', dataType: 'attribute', description: '设备运行状态' },
  { id: 'power', name: '功率', type: 'number', dataType: 'telemetry', unit: 'W', description: '设备功率' },
]

// --- Constants ---
const SAMPLE_PROJECT = {
  meta: {
    version: '1.0.0',
    id: 'injected-demo-project',
    name: 'Embed Valid Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  canvas: {
    mode: 'infinite',
    width: 1920,
    height: 1080,
    background: '#1e1e2e',
    gridEnabled: true,
    gridSize: 40,
  },
  nodes: [
    {
      id: "node-demo-1",
      type: "basic/text",
      position: { x: 400, y: 300 },
      size: { width: 300, height: 100 },
      props: { text: "Hello from Vue Host!", fontSize: 32, color: "#ffffff" }
    }
  ],
  dataSources: []
}

// --- Computed ---
const iframeSrc = computed(() => {
  // Build URL with hash routing support
  const baseUrl = studioUrl.value.replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('mode', 'embedded') // Fixed to embedded for this host
  params.set('integration', integrationLevel.value)
  
  // 平台字段集成参数
  if (enablePlatformFields.value) {
    params.set('saveTarget', saveTarget.value)
    params.set('platformFields', JSON.stringify(platformFields))
  }
  
  if (integrationLevel.value === 'full') {
    if (!showComponentLibrary.value) params.set('showLibrary', '0')
    if (!showPropsPanel.value) params.set('showProps', '0')
    if (!showTopLeft.value) params.set('showTopLeft', '0')
    if (!showToolbar.value) params.set('showToolbar', '0')
    if (!showTopRight.value) params.set('showTopRight', '0')
  }

  if (injectDefaultProject.value) {
    const json = JSON.stringify(SAMPLE_PROJECT)
    // Simple base64url encoding
    const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    params.set('defaultProject', b64)
  }

  return `${baseUrl}#/editor?${params.toString()}`
})

// --- Methods ---
function reload() {
  iframeKey.value++
  events.value.unshift(`[${new Date().toLocaleTimeString()}] Reloading iframe...`)
}

// 推送平台数据
function pushPlatformData() {
  if (!iframeRef.value?.contentWindow) {
    events.value.unshift(`[${new Date().toLocaleTimeString()}] ⚠️ Iframe not ready`)
    return
  }

  const mockData = {
    temp: (20 + Math.random() * 10).toFixed(1),
    humi: (50 + Math.random() * 30).toFixed(1),
    status: Math.random() > 0.5 ? '正常' : '告警',
    power: (100 + Math.random() * 200).toFixed(0)
  }

  Object.entries(mockData).forEach(([fieldId, value]) => {
    iframeRef.value!.contentWindow!.postMessage({
      type: 'thingsvis:platformData',
      payload: { fieldId, value, timestamp: Date.now() }
    }, '*')
  })

  events.value.unshift(
    `[${new Date().toLocaleTimeString()}] 📊 Pushed: temp=${mockData.temp}°C, humi=${mockData.humi}%, status=${mockData.status}, power=${mockData.power}W`
  )
}

// 切换自动推送
function toggleAutoPush() {
  if (dataPushInterval.value) {
    clearInterval(dataPushInterval.value)
    dataPushInterval.value = null
    events.value.unshift(`[${new Date().toLocaleTimeString()}] ⏸️ Auto-push stopped`)
  } else {
    pushPlatformData() // 立即推送一次
    dataPushInterval.value = setInterval(pushPlatformData, 5000) as unknown as number
    events.value.unshift(`[${new Date().toLocaleTimeString()}] ▶️ Auto-push started (5s interval)`)
  }
}

// 触发Studio保存
function triggerSave() {
  if (!iframeRef.value?.contentWindow) {
    events.value.unshift(`[${new Date().toLocaleTimeString()}] ⚠️ Iframe not ready`)
    return
  }
  
  iframeRef.value.contentWindow.postMessage({
    type: 'thingsvis:editor-trigger-save',
    payload: {}
  }, '*')
  
  events.value.unshift(`[${new Date().toLocaleTimeString()}] 💾 Triggered save request to editor`)
}

function handleMessage(event: MessageEvent) {
  // 处理保存请求
  if (event.data?.type === 'thingsvis:requestSave') {
    const payload = event.data.payload
    const requestId = event.data.requestId
    
    events.value.unshift(
      `[${new Date().toLocaleTimeString()}] 💾 SAVE received! Nodes: ${payload.nodes?.length || 0}, DataSources: ${payload.dataSources?.length || 0}`
    )
    
    // 模拟保存到数据库
    setTimeout(() => {
      iframeRef.value?.contentWindow?.postMessage({
        type: 'thingsvis:saveResponse',
        requestId,
        payload: {
          success: true,
          data: { savedAt: new Date().toISOString(), templateId: `tpl_${Date.now()}` }
        }
      }, '*')
      events.value.unshift(`[${new Date().toLocaleTimeString()}] ✅ Save confirmed to editor`)
    }, 500)
    
    return
  }

  // 处理字段数据请求
  if (event.data?.type === 'thingsvis:requestFieldData') {
    events.value.unshift(`[${new Date().toLocaleTimeString()}] 🔄 Field data requested`)
    // 立即推送一次数据
    setTimeout(pushPlatformData, 100)
    return
  }

  // 旧的保存处理（兼容）
  if (event.data?.type === 'thingsvis:host-save') {
    const payload = event.data.payload
    console.log('📦 [Vue Host] Received save data:', payload)
    
    // 安全地读取数据
    const projectName = payload?.meta?.name || payload?.canvasConfig?.name || 'Unnamed Project'
    const nodesCount = payload?.nodes?.length ?? 0
    const dataSourcesCount = payload?.dataSources?.length ?? 0
    const bindingsCount = payload?.dataBindings?.length ?? 0
    
    events.value.unshift(
      `[${new Date().toLocaleTimeString()}] 💾 SAVE received! Project: "${projectName}" (Nodes: ${nodesCount}, DataSources: ${dataSourcesCount}, Bindings: ${bindingsCount})`
    )
    
    // 这里可以将数据保存到后端
    // 例如: await api.saveVisualization(payload)
  }
}

// --- Lifecycle ---
onMounted(() => {
  window.addEventListener('message', handleMessage)
})
onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  if (dataPushInterval.value) {
    clearInterval(dataPushInterval.value)
  }
})
</script>

<template>
  <div class="host-app">
    <header>
      <h1>Vue Host App</h1>
      <p>Simulating an embedding platform (ThingsPanel)</p>
    </header>

    <main>
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '▶' : '◀' }}
        </button>
        
        <template v-if="!sidebarCollapsed">
        <div class="control-group">
          <h3>Connection</h3>
          <label>
            Studio URL:
            <input v-model="studioUrl" type="text" />
          </label>
        </div>

        <div class="control-group">
          <h3>Integration</h3>
          <div class="radio-group">
            <label>
              <input type="radio" v-model="integrationLevel" value="full" /> Full
            </label>
            <label>
              <input type="radio" v-model="integrationLevel" value="minimal" /> Minimal
            </label>
          </div>
        </div>

        <div class="control-group" :class="{ disabled: integrationLevel === 'minimal' }">
          <h3>UI Visibility (Full Mode)</h3>
          <label><input type="checkbox" v-model="showComponentLibrary" /> Show Library</label>
          <label><input type="checkbox" v-model="showPropsPanel" /> Show Properties</label>
          <hr />
          <label><input type="checkbox" v-model="showTopLeft" /> Show Top-Left</label>
          <label><input type="checkbox" v-model="showToolbar" /> Show Toolbar</label>
          <label><input type="checkbox" v-model="showTopRight" /> Show Top-Right</label>
        </div>

        <!-- 新增：平台字段集成 -->
        <div class="control-group platform-fields">
          <h3>🆕 Platform Fields</h3>
          <label><input type="checkbox" v-model="enablePlatformFields" /> Enable Platform Fields</label>
          <template v-if="enablePlatformFields">
            <div class="field-list">
              <div v-for="field in platformFields" :key="field.id" class="field-item">
                <span class="field-name">{{ field.name }}</span>
                <span class="field-badge">{{ field.dataType }}</span>
              </div>
            </div>
            <div class="button-group">
              <button class="action-btn" @click="pushPlatformData">📊 Push Data Once</button>
              <button class="action-btn" @click="toggleAutoPush">
                {{ dataPushInterval ? '⏸️ Stop Auto' : '▶️ Start Auto (5s)' }}
              </button>
              <button class="action-btn primary" @click="triggerSave">💾 Trigger Save</button>
            </div>
            <label>
              Save Target:
              <select v-model="saveTarget">
                <option value="self">ThingsVis</option>
                <option value="host">ThingsPanel (Host)</option>
              </select>
            </label>
          </template>
        </div>

        <div class="control-group">
          <h3>Data Injection</h3>
          <label><input type="checkbox" v-model="injectDefaultProject" /> Inject Default Project</label>
        </div>

        <button class="reload-btn" @click="reload">Reload Editor</button>

        <div class="events-log">
          <h3>Host Log</h3>
          <ul>
            <li v-for="(ev, i) in events" :key="i">{{ ev }}</li>
          </ul>
        </div>
        </template>
      </div>

      <div class="preview-area">
        <iframe 
          ref="iframeRef"
          :key="iframeKey"
          :src="iframeSrc" 
          frameborder="0"
          title="ThingsVis Editor"
        ></iframe>
      </div>
    </main>
  </div>
</template>

<style scoped>
.host-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  color: #333;
  background: #f4f4f5;
}

header {
  padding: 0 0.75rem;
  background: #fff;
  border-bottom: 1px solid #e4e4e7;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 36px;
  flex-shrink: 0;
}

header h1 {
  font-size: 0.9rem;
  margin: 0;
}

header p {
  font-size: 0.75rem;
  color: #71717a;
  margin: 0;
}

main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  min-width: 240px;
  background: #fff;
  border-right: 1px solid #e4e4e7;
  padding: 0.75rem;
  padding-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  position: relative;
  transition: width 0.2s, min-width 0.2s, padding 0.2s;
}

.sidebar.collapsed {
  width: 32px;
  min-width: 32px;
  padding: 0.25rem;
  padding-top: 0.25rem;
}

.collapse-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 24px;
  height: 24px;
  border: 1px solid #e4e4e7;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: #71717a;
  z-index: 10;
}

.sidebar.collapsed .collapse-btn {
  position: static;
  margin: 0 auto;
}

.collapse-btn:hover {
  background: #f4f4f5;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.control-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.control-group h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #71717a;
  margin: 0 0 0.15rem 0;
}

input[type="text"] {
  width: 100%;
  padding: 0.3rem;
  border: 1px solid #d4d4d8;
  border-radius: 4px;
  font-size: 0.85rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.reload-btn {
  background: #000;
  color: #fff;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
}

.reload-btn:hover {
  background: #27272a;
}

.preview-area {
  flex: 1;
  background: #fff;
  position: relative;
}

iframe {
  width: 100%;
  height: 100%;
  display: block;
}

.events-log {
  margin-top: auto;
  border-top: 1px solid #eee;
  padding-top: 0.5rem;
}

.events-log h3 {
  font-size: 0.7rem;
}

.events-log ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-family: monospace;
  font-size: 0.7rem;
  max-height: 120px;
  overflow-y: auto;
}

.events-log li {
  margin-bottom: 0.25rem;
  border-bottom: 1px dashed #eee;
  padding-bottom: 0.15rem;
}

/* 平台字段样式 */
.platform-fields {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 0.5rem !important;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0.5rem 0;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.4rem;
  background: #fff;
  border: 1px solid #e0f2fe;
  border-radius: 4px;
  font-size: 0.75rem;
}

.field-name {
  font-weight: 500;
}

.field-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  background: #0ea5e9;
  color: #fff;
  border-radius: 10px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0.5rem 0;
}

.action-btn {
  padding: 0.4rem;
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
}

.action-btn:hover {
  background: #0284c7;
}

select {
  width: 100%;
  padding: 0.3rem;
  border: 1px solid #d4d4d8;
  border-radius: 4px;
  font-size: 0.85rem;
  background: #fff;
  margin-top: 0.2rem;
}
</style>
