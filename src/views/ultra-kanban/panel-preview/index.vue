<script setup lang="ts">
/**
 * Ultra看板预览页面
 * 使用Visual Editor的PanelEditor组件实现只读预览功能
 */

import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NSpace, useMessage, NSpin, NBackTop, NButton } from 'naive-ui'
import { $t } from '@/locales'
import { useThemeStore } from '@/store/modules/theme'
import { useRouterPush } from '@/hooks/common/router'
import { getBoard } from '@/service/api'

// 导入Visual Editor核心组件
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'

// 路由和消息管理
const route = useRoute()
const message = useMessage()
const { routerPushByKey } = useRouterPush()

// 主题系统集成
const themeStore = useThemeStore()

// 页面状态管理
const loading = ref(true)
const panelData = ref<Panel.Board>()
const error = ref<string>('')
const isUnmounted = ref(false)

/**
 * 获取看板ID
 */
const panelId = computed(() => {
  return route.query.id as string || ''
})

/**
 * 获取看板数据
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
      console.log('🚀 Ultra看板预览数据加载完成:', data)
    } else {
      error.value = $t('common.dataNotFound')
    }
  } catch (err) {
    console.error('获取看板数据失败:', err)
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
  console.log('🎯 Ultra看板预览页面初始化, ID:', panelId.value)
  await fetchBoardData()
})

/**
 * 页面销毁时的清理工作
 */
onUnmounted(() => {
  isUnmounted.value = true
  console.log('🧹 Ultra看板预览页面已销毁')
})

/**
 * 错误重试
 */
const retryLoad = async () => {
  error.value = ''
  await fetchBoardData()
}

/**
 * 跳转到编辑模式
 */
const goToEdit = () => {
  routerPushByKey('ultra-kanban_kanban-details', { query: { id: panelId.value } })
}

/**
 * 返回列表页面
 */
const goBack = () => {
  routerPushByKey('ultra-kanban_index')
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
          <NSpace>
            <NButton type="primary" @click="retryLoad">
              {{ $t('common.retry') }}
            </NButton>
            <NButton @click="goBack">
              {{ $t('common.back') }}
            </NButton>
          </NSpace>
        </NSpace>
      </NCard>
    </div>

    <!-- 主内容区域 - 集成Visual Editor预览模式 -->
    <div v-else-if="panelData && !isUnmounted" class="main-content">
      <!-- 预览工具栏 -->
      <div class="preview-toolbar">
        <NSpace justify="space-between" align="center">
          <NSpace align="center">
            <NButton quaternary circle @click="goBack">
              <template #icon>
                <icon-material-symbols:arrow-back-outline class="text-20px" />
              </template>
            </NButton>
            <div class="panel-title">
              <span class="text-16px font-medium">{{ panelData.name }}</span>
              <span class="text-12px text-gray-500 ml-2">({{ $t('generate.preview') }})</span>
            </div>
          </NSpace>
          <NSpace>
            <NButton type="primary" @click="goToEdit">
              <template #icon>
                <icon-material-symbols:edit-outline class="text-16px" />
              </template>
              {{ $t('common.edit') }}
            </NButton>
          </NSpace>
        </NSpace>
      </div>

      <!-- Visual Editor容器 - 预览模式 -->
      <div class="visual-editor-container">
        <PanelEditor
          :key="`ultra-panel-preview-${panelId}`"
          :panel-id="panelId"
          mode="preview"
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
  background-color: var(--body-color);
  display: flex;
  flex-direction: column;
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
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 预览工具栏 */
.preview-toolbar {
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-title {
  display: flex;
  align-items: center;
  color: var(--text-color);
}

/* Visual Editor容器 */
.visual-editor-container {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 60px); /* 减去toolbar高度 */
  background-color: var(--body-color);
  overflow: hidden;
}

/* 响应主题变化 */
[data-theme="dark"] .ultra-kanban-preview {
  background-color: var(--body-color);
}

[data-theme="dark"] .preview-toolbar {
  background-color: var(--card-color);
  border-bottom-color: var(--border-color);
}

[data-theme="dark"] .visual-editor-container {
  background-color: var(--body-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-card {
    min-width: 280px;
    margin: 0 10px;
  }
  
  .preview-toolbar {
    padding: 8px 12px;
  }
  
  .panel-title .text-16px {
    font-size: 14px;
  }
  
  .panel-title .text-12px {
    font-size: 10px;
  }
}
</style>