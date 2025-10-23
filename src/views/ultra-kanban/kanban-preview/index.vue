<script setup lang="ts">
/**
 * Ultra看板预览页面
 * 基于Visual Editor的PanelEditor组件实现看板预览功能，使用全局预览模式
 */

import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NSpace, useMessage, NSpin, NBackTop } from 'naive-ui'
import { $t } from '@/locales'
import { getBoard } from '@/service/api'

// 正式编辑器：基于 PanelEditorV2（预览模式）
import PanelEditorV2 from '@/components/visual-editor/PanelEditorV2.vue'
// 导入全局预览模式管理
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'

// 路由和消息管理
const route = useRoute()
const message = useMessage()

// 页面状态管理
const loading = ref(true)
const panelData = ref<Panel.Board>()
const error = ref<string>('')
const isUnmounted = ref(false)

// 🔥 编辑器配置状态
const editorConfig = ref<{ widgets: any[]; config: any } | undefined>()

/**
 * 获取看板ID和渲染器类型
 */
const panelId = computed(() => {
  return (route.query.id as string) || ''
})

/**
 * 获取渲染器类型，默认为gridstack（看板）
 */
const rendererType = computed(() => {
  return (route.query.renderer as string) || 'gridstack'
})

/**
 * 🔥 获取看板数据并解析配置
 */
const fetchBoardData = async () => {
  if (!panelId.value) {
    error.value = $t('common.invalidParameter')
    loading.value = false
    return
  }

  try {
    loading.value = true
    const { data } = await getBoard(panelId.value)

    if (data) {
      panelData.value = data

      // 🔥 解析看板配置为编辑器格式
      if (data.config) {
        try {
          const parsedConfig = JSON.parse(data.config)

          if (parsedConfig.widgets !== undefined || parsedConfig.config !== undefined) {
            // 标准格式：{widgets: [...], config: {...}}
            editorConfig.value = parsedConfig
          } else if (Array.isArray(parsedConfig)) {
            // 旧版数组格式
            editorConfig.value = {
              widgets: parsedConfig,
              config: { gridConfig: {}, canvasConfig: {} }
            }
          } else {
            // 空或未知格式，使用默认空配置
            editorConfig.value = {
              widgets: [],
              config: { gridConfig: {}, canvasConfig: {} }
            }
          }
        } catch (e) {
          console.error('❌ 解析看板配置失败:', e)
          // 解析失败，使用空配置
          editorConfig.value = {
            widgets: [],
            config: { gridConfig: {}, canvasConfig: {} }
          }
        }
      } else {
        // 没有配置，使用空配置
        editorConfig.value = {
          widgets: [],
          config: { gridConfig: {}, canvasConfig: {} }
        }
      }
    } else {
      error.value = $t('common.dataNotFound')
    }
  } catch (err) {
    console.error('❌ 加载看板数据失败:', err)
    error.value = $t('common.loadError')
    message.error($t('common.loadError'))
  } finally {
    loading.value = false
  }
}

/**
 * 页面初始化
 */
onMounted(async () => {
  // 设置为预览模式 - 这是关键！
  globalPreviewMode.setPreviewMode(true)

  await fetchBoardData()
})

/**
 * 页面销毁时的清理工作
 */
onUnmounted(() => {
  isUnmounted.value = true
  // 可选：离开页面时重置预览模式
  // globalPreviewMode.setPreviewMode(false)
})

/**
 * 错误重试
 */
const retryLoad = async () => {
  error.value = ''
  await fetchBoardData()
}
</script>

<template>
  <div class="ultra-kanban-preview">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <NSpin size="large">
        <template #description>
          {{ $t('common.loading') }}
        </template>
      </NSpin>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <NCard class="error-card">
        <NSpace vertical align="center">
          <icon-material-symbols:error-outline class="text-48px text-red" />
          <div class="text-16px font-medium">{{ error }}</div>
          <n-button type="primary" @click="retryLoad">
            {{ $t('common.retry') }}
          </n-button>
        </NSpace>
      </NCard>
    </div>

    <!-- 主内容区域 - 集成Visual Editor（预览模式） -->
    <div v-else-if="panelData && editorConfig && !isUnmounted" class="main-content">
      <!-- 预览模式编辑器（V2）集成 - 使用全局预览模式控制 -->
      <div class="visual-editor-container">
        <PanelEditorV2
          :key="`ultra-panel-preview-${panelId}-${rendererType}`"
          :panel-id="panelId"
          :initial-config="editorConfig"
          :show-toolbar="false"
          :show-page-header="false"
          :enable-header-area="false"
          :enable-toolbar-area="false"
          :enable-footer-area="true"
          :default-renderer="rendererType"
        />
      </div>
    </div>

    <!-- 回到顶部按钮 -->
    <NBackTop :right="40" />
  </div>
</template>

<style scoped>
/* 主容器样式 */
.ultra-kanban-preview {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--body-color);
  overflow: hidden;
}

/* 加载状态容器 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: var(--body-color);
}

/* 错误状态容器 */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  padding: 20px;
  background-color: var(--body-color);
}

.error-card {
  min-width: 300px;
  text-align: center;
}

/* 主内容区域 */
.main-content {
  width: 100%;
  height: 100vh;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/* Visual Editor容器 - 预览模式专用样式 */
.visual-editor-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  background-color: var(--card-color);
  position: relative;
}

/* 响应主题变化 */
[data-theme='dark'] .ultra-kanban-preview {
  background-color: var(--body-color);
}

[data-theme='dark'] .visual-editor-container {
  background-color: var(--card-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-card {
    min-width: 280px;
    margin: 0 10px;
  }
}
</style>