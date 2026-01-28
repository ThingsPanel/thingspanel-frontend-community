<script setup lang="ts">
/**
 * ThingsVis Editor Component
 * 嵌入 ThingsVis Studio 编辑器/查看器的通用组件
 * 支持编辑模式和预览模式，通过 PostMessage 进行通信
 */

import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { NSpin } from 'naive-ui'
import { buildThingsVisUrl, type ThingsVisUrlOptions } from '@/utils/thingsvis/url-builder'
import type { PlatformField } from '@/utils/thingsvis/types'

interface Props {
  /** 编辑器模式: editor=完整编辑器, viewer=预览模式 */
  mode?: 'editor' | 'viewer'
  /** 初始配置数据(ThingsVis项目格式) */
  initialConfig?: any
  /** 平台字段列表 */
  platformFields?: PlatformField[]
  /** 是否显示加载状态 */
  loading?: boolean
  /** iframe高度 */
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'editor',
  initialConfig: null,
  platformFields: () => [],
  loading: false,
  height: '600px'
})

interface Emits {
  /** 保存事件 - 当编辑器请求保存时触发 */
  (e: 'save', payload: any): void
  /** 保存成功事件 */
  (e: 'save-success'): void
  /** 保存失败事件 */
  (e: 'save-error', error: any): void
  /** 编辑器加载完成 */
  (e: 'ready'): void
}

const emit = defineEmits<Emits>()

// iframe 引用
const iframeRef = ref<HTMLIFrameElement>()
const iframeLoading = ref(true)
const editorReady = ref(false)

// 编辑器 URL state
const editorUrl = ref<string>('')
const urlLoadError = ref<string | null>(null)

// 待保存的请求ID映射(用于响应)
const pendingSaveRequests = new Map<string, { resolve: Function; reject: Function }>()

/**
 * 构建编辑器 URL (支持 SSO)
 */
const buildEditorUrl = async () => {
  try {
    iframeLoading.value = true
    urlLoadError.value = null

    // 根据模式设置 UI 显示选项
    const isEditor = props.mode === 'editor'
    
    const options: ThingsVisUrlOptions = {
      mode: props.mode,
      config: props.initialConfig,
      platformFields: props.platformFields,
      saveTarget: 'host', // 保存到宿主平台
      // 编辑功能：组件库、属性面板、工具栏
      showLibrary: isEditor,
      showProps: isEditor,
      showToolbar: isEditor,
      // 暂时隐藏左上角和右上角（项目名称、用户头像等）
      showTopLeft: false,
      showTopRight: false
    }

    const url = await buildThingsVisUrl(options)
    editorUrl.value = url
  } catch (error) {
    console.error('Failed to build editor URL:', error)
    urlLoadError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    // 注意：不在这里设置 iframeLoading.value = false
    // 这会在 iframe onload 事件中处理
  }
}

/**
 * 处理来自编辑器的消息
 */
const handleMessage = async (event: MessageEvent) => {
  // 安全检查：只接受来自 ThingsVis 的消息
  // TODO: 在生产环境中应该检查 event.origin
  const { data } = event

  if (!data || typeof data !== 'object') return

  // 处理保存请求 (标准格式)
  if (data.type === 'thingsvis:requestSave') {
    const { requestId, payload } = data

    console.log('[ThingsVisEditor] 收到保存请求 (requestSave):', { requestId, payload })

    try {
      emit('save', payload)
      console.log('[ThingsVisEditor] save 事件已触发')
      
      sendSaveResponse(requestId, { success: true })
      console.log('[ThingsVisEditor] 发送保存响应')
      emit('save-success')
    } catch (error) {
      console.error('[ThingsVisEditor] 保存失败:', error)
      sendSaveResponse(requestId, { success: false, error: String(error) })
      emit('save-error', error)
    }
  }

  // 处理保存请求 (旧格式，兼容 ThingsVis Studio)
  if (data.type === 'thingsvis:host-save') {
    const payload = data.payload

    console.log('[ThingsVisEditor] 收到保存请求 (host-save):', payload)

    try {
      emit('save', payload)
      console.log('[ThingsVisEditor] save 事件已触发')
      emit('save-success')
    } catch (error) {
      console.error('[ThingsVisEditor] 保存失败:', error)
      emit('save-error', error)
    }
  }

  // 处理编辑器就绪事件 (Editor 模式)
  if (data.type === 'thingsvis:ready') {
    editorReady.value = true
    iframeLoading.value = false
    emit('ready')
    
    // 发送初始配置到编辑器
    if (props.initialConfig && iframeRef.value?.contentWindow) {
      console.log('[ThingsVisEditor] Editor就绪，发送初始配置(thingsvis:editor-init):', props.initialConfig)
      
      try {
        const pureConfig = JSON.parse(JSON.stringify(props.initialConfig))
        iframeRef.value.contentWindow.postMessage({
          type: 'thingsvis:editor-init',
          payload: pureConfig
        }, '*')
      } catch (e) {
        console.error('[ThingsVisEditor] 配置序列化失败:', e)
      }
    }
  }

  // 处理 EmbedPage 就绪事件 (Viewer 模式)
  if (data.type === 'READY') {
    console.log('[ThingsVisEditor] EmbedPage就绪 (READY 消息)')
    editorReady.value = true
    iframeLoading.value = false
    emit('ready')

    if (props.initialConfig && iframeRef.value?.contentWindow) {
      console.log('[ThingsVisEditor] 发送仪表板配置(LOAD_DASHBOARD):', props.initialConfig)
      
      try {
        const pureConfig = JSON.parse(JSON.stringify(props.initialConfig))
        iframeRef.value.contentWindow.postMessage({
          type: 'LOAD_DASHBOARD',
          payload: pureConfig
        }, '*')
      } catch (e) {
        console.error('[ThingsVisEditor] 配置序列化失败:', e)
      }
    }
  }
}

/**
 * 发送保存响应到编辑器
 */
const sendSaveResponse = (requestId: string, payload: any) => {
  if (!iframeRef.value?.contentWindow) return

  iframeRef.value.contentWindow.postMessage(
    {
      type: 'thingsvis:saveResponse',
      requestId,
      payload
    },
    '*'
  )
}

/**
 * 推送平台数据到编辑器(用于实时数据更新)
 */
const pushPlatformData = (fieldId: string, value: any) => {
  if (!iframeRef.value?.contentWindow || !editorReady.value) {
    console.warn('编辑器未就绪，无法推送数据')
    return
  }

  iframeRef.value.contentWindow.postMessage(
    {
      type: 'thingsvis:platformData',
      payload: {
        fieldId,
        value,
        timestamp: Date.now()
      }
    },
    '*'
  )
}

/**
 * 批量推送平台数据
 */
const pushPlatformDataBatch = (data: Record<string, any>) => {
  if (!iframeRef.value?.contentWindow || !editorReady.value) {
    console.warn('编辑器未就绪，无法推送数据')
    return
  }

  Object.entries(data).forEach(([fieldId, value]) => {
    pushPlatformData(fieldId, value)
  })
}

/**
 * 触发编辑器保存(从外部触发)
 */
const triggerSave = () => {
  console.log('[ThingsVisEditor] triggerSave 被调用')
  
  if (!iframeRef.value?.contentWindow) {
    console.error('[ThingsVisEditor] iframe contentWindow 不可用')
    return
  }

  console.log('[ThingsVisEditor] 发送 thingsvis:editor-trigger-save 消息')
  iframeRef.value.contentWindow.postMessage(
    {
      type: 'thingsvis:editor-trigger-save',
      payload: {}
    },
    '*'
  )
}

/**
 * iframe 加载完成
 */
const handleIframeLoad = () => {
  iframeLoading.value = false
  // 注意：编辑器内部应用加载完成后会发送 'thingsvis:ready' 消息
}

// 监听 initialConfig 变化
watch(
  () => props.initialConfig,
  (newConfig) => {
    // 如果是 viewer 模式且 iframe 已就绪，直接通过 postMessage 更新数据
    if (props.mode === 'viewer' && editorReady.value && iframeRef.value?.contentWindow) {
      console.log('[ThingsVisEditor]Config更新，发送新配置(LOAD_DASHBOARD):', newConfig)
      
      try {
        // 使用 JSON 序列化确保移除 Vue 响应式代理
        const pureConfig = JSON.parse(JSON.stringify(newConfig))
        
        iframeRef.value.contentWindow.postMessage({
          type: 'LOAD_DASHBOARD',
          payload: pureConfig
        }, '*')
      } catch (e) {
        console.error('[ThingsVisEditor] 配置序列化失败:', e)
      }
      return
    }

    // editor 模式或 iframe 未就绪，则重新构建 URL
    buildEditorUrl()
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  window.addEventListener('message', handleMessage)
  // 初始化时构建 URL
  buildEditorUrl()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})

// 暴露方法给父组件
defineExpose({
  pushPlatformData,
  pushPlatformDataBatch,
  triggerSave,
  editorReady
})
</script>

<template>
  <div class="thingsvis-editor-wrapper">
    <NSpin :show="loading || iframeLoading">
      <!-- Error state -->
      <div v-if="urlLoadError" class="error-state">
        <p class="error-message">⚠️ {{ $t('page.thingsvis.ssoError') }}: {{ urlLoadError }}</p>
        <button class="retry-button" @click="buildEditorUrl">{{ $t('page.thingsvis.retry') }}</button>
      </div>
      <!-- Editor iframe -->
      <iframe
        v-else-if="editorUrl"
        ref="iframeRef"
        :src="editorUrl"
        class="thingsvis-iframe"
        :style="{ height }"
        frameborder="0"
        @load="handleIframeLoad"
      />
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.thingsvis-editor-wrapper {
  width: 100%;
  position: relative;
}

.thingsvis-iframe {
  width: 100%;
  border: none;
  background: #fff;
  min-height: 400px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;

  .error-message {
    color: #d32f2f;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
  }

  .retry-button {
    padding: 8px 16px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #1565c0;
    }
  }
}
</style>
