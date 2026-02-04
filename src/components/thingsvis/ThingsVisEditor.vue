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
  /** 编辑器请求平台字段数据 */
  (e: 'request-field-data'): void
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

  // 🔍 调试：打印所有收到的消息
  if (data?.type?.startsWith?.('thingsvis:') || data?.type === 'READY') {
    console.log('[ThingsVisEditor] 📬 收到消息:', data.type, data)
  }

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

  // 处理字段数据请求
  if (data.type === 'thingsvis:requestFieldData') {
    console.log('[ThingsVisEditor] 收到字段数据请求 (requestFieldData)')
    emit('request-field-data')
  }

  // 🆕 处理编辑器请求初始数据（握手机制）
  if (data.type === 'thingsvis:request-init-data') {
    console.log('[ThingsVisEditor] 📨 收到编辑器初始数据请求 (request-init-data)')
    sendInitDataToEditor()
  }

  // 处理编辑器就绪事件 (Editor 模式)
  if (data.type === 'thingsvis:ready') {
    console.log('[ThingsVisEditor] ✅ 收到 thingsvis:ready 事件')
    editorReady.value = true
    iframeLoading.value = false
    emit('ready')

    // ✅ 不再在这里发送配置，等待编辑器主动请求 (request-init-data)
    console.log('[ThingsVisEditor] ⏳ 等待编辑器发送 request-init-data 请求')
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
 * 🆕 发送初始数据到编辑器（响应握手请求）
 */
const sendInitDataToEditor = () => {
  if (!iframeRef.value?.contentWindow) {
    console.warn('[ThingsVisEditor] ⚠️ iframe contentWindow 不可用，无法发送初始数据')
    return
  }

  if (!props.initialConfig) {
    console.warn('[ThingsVisEditor] ⚠️ initialConfig 为空，无法发送初始数据')
    return
  }

  try {
    const pureConfig = JSON.parse(JSON.stringify(props.initialConfig))

    // 🔧 处理画布模式：保留原数据中的模式，无数据时默认 grid
    // 同时将已废弃的 'reflow' 模式映射为 'grid'
    if (pureConfig.canvas) {
      // 如果模式是 reflow（已废弃），映射为 grid
      if (pureConfig.canvas.mode === 'reflow') {
        pureConfig.canvas.mode = 'grid'
      }
      // 如果没有设置模式，默认使用 grid
      if (!pureConfig.canvas.mode) {
        pureConfig.canvas.mode = 'grid'
      }
    } else {
      // 完全没有 canvas 配置，创建默认配置
      pureConfig.canvas = { mode: 'grid', width: 1920, height: 1080 }
    }

    // 🔧 确保所有节点都有 grid 属性，否则在 grid 模式下可能不显示
    if (pureConfig.nodes && Array.isArray(pureConfig.nodes)) {
      pureConfig.nodes.forEach((node: any, index: number) => {
        // Check if grid property is missing or valid coordinates are missing
        if (!node.grid || typeof node.grid.x !== 'number' || typeof node.grid.y !== 'number' || typeof node.grid.w !== 'number' || typeof node.grid.h !== 'number') {
          // 简单的自动布局：每行4个
          const col = index % 4
          const row = Math.floor(index / 4)
          node.grid = {
            x: col * 6,      // 假设每列宽6格 (总宽24)
            y: row * 4,      // 假设每行高4格
            w: 6,
            h: 4,
            i: node.id || `n-${index}`,
            static: false,
            isDraggable: true,
            isResizable: true
          }
        }
      })
    }

    console.log('[ThingsVisEditor] Sending init config with Grid forced:', pureConfig)

    iframeRef.value.contentWindow.postMessage(
      {
        type: 'thingsvis:editor-init',
        payload: { data: pureConfig }
      },
      '*'
    )
    console.log('[ThingsVisEditor] ✅ 发送初始配置(响应握手请求):', pureConfig)
  } catch (e) {
    console.error('[ThingsVisEditor] ❌ 配置序列化失败:', e)
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
  console.log('[ThingsVisEditor] 🌐 Iframe onload 事件触发')
  iframeLoading.value = false

  // ✅ 移除不可靠的延迟发送，改用握手机制
  // 编辑器准备好后会主动发送 'thingsvis:request-init-data' 消息
  console.log('[ThingsVisEditor] ⏳ 等待编辑器主动请求配置数据（握手机制）')
}

// 监听 initialConfig 变化
watch(
  () => props.initialConfig,
  (newConfig, oldConfig) => {
    console.log('[ThingsVisEditor] 🔄 initialConfig 变化检测:', {
      hasOld: !!oldConfig,
      hasNew: !!newConfig,
      mode: props.mode,
      editorReady: editorReady.value
    })
    // 如果是 viewer 模式且 iframe 已就绪，直接通过 postMessage 更新数据
    if (props.mode === 'viewer' && editorReady.value && iframeRef.value?.contentWindow) {
      console.log('[ThingsVisEditor] Config更新(Viewer模式)，发送新配置(LOAD_DASHBOARD):', newConfig)

      try {
        // 使用 JSON 序列化确保移除 Vue 响应式代理
        const pureConfig = JSON.parse(JSON.stringify(newConfig))

        iframeRef.value.contentWindow.postMessage({
          type: 'LOAD_DASHBOARD',
          payload: pureConfig
        }, '*')
        console.log('[ThingsVisEditor] ✅ Viewer配置更新成功')
      } catch (e) {
        console.error('[ThingsVisEditor] ❌ 配置序列化失败:', e)
      }
      return
    }

    // editor 模式且 iframe 已就绪，发送配置更新
    if (props.mode === 'editor' && editorReady.value && iframeRef.value?.contentWindow && newConfig) {
      console.log('[ThingsVisEditor] Config更新(Editor模式)，发送新配置(thingsvis:editor-init):', newConfig)

      try {
        const pureConfig = JSON.parse(JSON.stringify(newConfig))
        iframeRef.value.contentWindow.postMessage({
          type: 'thingsvis:editor-init',
          payload: { data: pureConfig }  // ✅ 修复：使用正确的格式
        }, '*')
        console.log('[ThingsVisEditor] ✅ Editor配置更新成功')
      } catch (e) {
        console.error('[ThingsVisEditor] ❌ 配置序列化失败:', e)
      }
      return
    }

    // iframe 未就绪，则重新构建 URL
    if (!editorReady.value) {
      buildEditorUrl()
    }
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  console.log('========================================')
  console.log('[ThingsVisEditor] 🚀 组件已挂载')
  console.log('[ThingsVisEditor] 📋 Props:', {
    mode: props.mode,
    hasInitialConfig: !!props.initialConfig,
    initialConfigType: typeof props.initialConfig,
    platformFieldsCount: props.platformFields?.length || 0
  })

  if (props.initialConfig) {
    console.log('[ThingsVisEditor] 📊 初始配置内容:', props.initialConfig)
  }

  console.log('[ThingsVisEditor] 📡 注册 message 监听器...')
  window.addEventListener('message', handleMessage)
  console.log('[ThingsVisEditor] ✅ Message 监听器已注册')

  // 初始化时构建 URL
  buildEditorUrl()
  console.log('========================================')
})

onBeforeUnmount(() => {
  console.log('[ThingsVisEditor] 🔴 组件卸载，移除 message 监听器')
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
