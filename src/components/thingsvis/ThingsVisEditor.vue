<script setup lang="ts">
/**
 * ThingsVis Editor Component
 * 嵌入 ThingsVis Studio 编辑器/查看器的通用组件
 * 支持编辑模式和预览模式，通过 PostMessage 进行通信
 */

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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

// 待保存的请求ID映射(用于响应)
const pendingSaveRequests = new Map<string, { resolve: Function; reject: Function }>()

/**
 * 构建编辑器 URL
 */
const editorUrl = computed(() => {
  const options: ThingsVisUrlOptions = {
    mode: props.mode,
    config: props.initialConfig,
    platformFields: props.platformFields,
    saveTarget: 'host' // 保存到宿主平台
  }
  return buildThingsVisUrl(options)
})

/**
 * 处理来自编辑器的消息
 */
const handleMessage = async (event: MessageEvent) => {
  // 安全检查：只接受来自 ThingsVis 的消息
  // TODO: 在生产环境中应该检查 event.origin
  const { data } = event

  if (!data || typeof data !== 'object') return

  // 处理保存请求
  if (data.type === 'thingsvis:requestSave') {
    const { requestId, payload } = data

    try {
      // 触发保存事件，让父组件处理实际保存逻辑
      emit('save', payload)

      // 发送成功响应
      sendSaveResponse(requestId, { success: true })
      emit('save-success')
    } catch (error) {
      console.error('保存失败:', error)
      sendSaveResponse(requestId, { success: false, error: String(error) })
      emit('save-error', error)
    }
  }

  // 处理编辑器就绪事件
  if (data.type === 'thingsvis:ready') {
    editorReady.value = true
    iframeLoading.value = false
    emit('ready')
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
  if (!iframeRef.value?.contentWindow) return

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

// 监听 initialConfig 变化，重新加载 iframe
watch(
  () => props.initialConfig,
  () => {
    // 配置变化时，iframe会通过URL参数自动重新加载
    iframeLoading.value = true
    editorReady.value = false
  }
)

// 生命周期
onMounted(() => {
  window.addEventListener('message', handleMessage)
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
      <iframe
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
</style>
