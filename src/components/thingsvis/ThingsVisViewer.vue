<script setup lang="ts">
/**
 * ThingsVis Viewer Component
 * 纯预览组件，直接嵌入 ThingsVis 的 /embed 路由
 * 不含任何编辑器 UI，只渲染仪表板
 */

import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { NSpin } from 'naive-ui'

interface Props {
  /** 仪表板配置数据 */
  config: any
  /** iframe高度 */
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '100%'
})

const emit = defineEmits<{
  (e: 'ready'): void
  (e: 'error', error: string): void
}>()

// iframe 引用
const iframeRef = ref<HTMLIFrameElement>()
const loading = ref(true)
const ready = ref(false)
const error = ref<string | null>(null)

/**
 * 获取 ThingsVis Embed URL
 */
const embedUrl = computed(() => {
  // 基础 URL - 直接指向 /embed 路由
  const baseUrl = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main.html'
  
  // 移除可能存在的 hash 部分
  const cleanBase = baseUrl.split('#')[0]
  
  // 确保以 .html 结尾
  const htmlBase = cleanBase.endsWith('.html') 
    ? cleanBase 
    : cleanBase.endsWith('/main') 
      ? cleanBase + '.html' 
      : cleanBase
  
  // 构建 embed URL - 不需要任何认证参数，数据通过 postMessage 传递
  return `${htmlBase}#/embed`
})

/**
 * 处理来自 iframe 的消息
 */
const handleMessage = (event: MessageEvent) => {
  const { data } = event
  
  if (!data || typeof data !== 'object') return

  // EmbedPage 就绪
  if (data.type === 'READY') {
    console.log('[ThingsVisViewer] EmbedPage 已就绪')
    ready.value = true
    loading.value = false
    
    // 发送仪表板数据
    sendConfig()
    emit('ready')
  }
  
  // 加载完成
  if (data.type === 'LOADED') {
    console.log('[ThingsVisViewer] 仪表板加载完成:', data.payload)
  }
  
  // 加载错误
  if (data.type === 'ERROR') {
    console.error('[ThingsVisViewer] 加载错误:', data.payload)
    error.value = data.payload
    emit('error', data.payload)
  }
}

/**
 * 发送配置到 EmbedPage
 */
const sendConfig = () => {
  if (!iframeRef.value?.contentWindow || !props.config) {
    console.warn('[ThingsVisViewer] 无法发送配置: iframe 或 config 不可用')
    return
  }

  try {
    // 深拷贝避免响应式数据问题
    const pureConfig = JSON.parse(JSON.stringify(props.config))
    
    console.log('[ThingsVisViewer] 发送 LOAD_DASHBOARD:', {
      nodeCount: pureConfig.nodes?.length ?? 0,
      canvasMode: pureConfig.canvas?.mode
    })

    iframeRef.value.contentWindow.postMessage({
      type: 'LOAD_DASHBOARD',
      payload: pureConfig
    }, '*')
  } catch (e) {
    console.error('[ThingsVisViewer] 配置序列化失败:', e)
    error.value = '配置数据无效'
    emit('error', '配置数据无效')
  }
}

/**
 * iframe 加载完成
 */
const handleIframeLoad = () => {
  console.log('[ThingsVisViewer] iframe onload')
  // 等待 READY 消息
}

// 监听配置变化，重新发送
watch(() => props.config, (newConfig) => {
  if (newConfig && ready.value) {
    sendConfig()
  }
}, { deep: true })

onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <div class="thingsvis-viewer-wrapper">
    <NSpin :show="loading">
      <!-- Error state -->
      <div v-if="error" class="error-state">
        <p class="error-message">⚠️ {{ error }}</p>
      </div>
      
      <!-- Viewer iframe -->
      <iframe
        v-else
        ref="iframeRef"
        :src="embedUrl"
        class="thingsvis-iframe"
        :style="{ height }"
        frameborder="0"
        @load="handleIframeLoad"
      />
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.thingsvis-viewer-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

:deep(.n-spin-container) {
  height: 100%;
}

:deep(.n-spin-content) {
  height: 100%;
}

.thingsvis-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #f5f5f5;
  display: block;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: #f5f5f5;

  .error-message {
    color: #d32f2f;
    font-size: 14px;
    text-align: center;
  }
}
</style>
