<script setup lang="ts">
/**
 * 设备模板详情页主入口
 * 支持三种模式：新增、编辑、预览
 * - 新增/编辑：使用 Editor 组件（3步流程）
 * - 预览：使用 Viewer 组件（Tab布局）
 */

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TemplateEditor from './editor/index.vue'
import TemplateViewer from './viewer/index.vue'

const route = useRoute()
const router = useRouter()

/**
 * 当前显示模式
 * - 'add': 新增模式
 * - 'edit': 编辑模式
 * - 'preview': 预览模式
 */
const currentMode = ref<'add' | 'edit' | 'preview'>('add')

/**
 * 模板ID（编辑或预览时使用）
 */
const templateId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

/**
 * 根据路由参数初始化模式
 */
const initMode = () => {
  const { id, mode } = route.query

  if (mode === 'add') {
    // 新增模式
    currentMode.value = 'add'
  } else if (mode === 'edit') {
    // 编辑模式
    currentMode.value = 'edit'
  } else if (id) {
    // 有 id 但没有指定mode，或者 mode === 'preview'，默认预览模式
    currentMode.value = 'preview'
  } else {
    // 没有任何参数，默认新增模式
    currentMode.value = 'add'
  }
}

/**
 * 切换到预览模式
 */
const handleSwitchToPreview = () => {
  if (templateId.value) {
    currentMode.value = 'preview'
    router.replace({
      name: 'device_new-device-template_template-details',
      query: { id: templateId.value, mode: 'preview' }
    })
  }
}

/**
 * 切换到编辑模式
 */
const handleSwitchToEdit = () => {
  if (templateId.value) {
    currentMode.value = 'edit'
    router.replace({
      name: 'device_new-device-template_template-details',
      query: { id: templateId.value, mode: 'edit' }
    })
  }
}

/**
 * 保存成功后的处理
 */
const handleSaved = (data: any) => {
  console.log('Template saved:', data)
  // 保存成功后可以跳转到预览或列表
  // router.push({ name: 'device_new-device-template_template-list' })
}

/**
 * 监听路由变化
 */
watch(
  () => route.query,
  () => {
    initMode()
  },
  { immediate: true }
)
</script>

<template>
  <div class="template-details-container">
    <!-- 新增或编辑模式 - 显示编辑器（3步流程） -->
    <TemplateEditor
      v-if="currentMode === 'add' || currentMode === 'edit'"
      :template-id="templateId"
      :mode="currentMode"
      @preview="handleSwitchToPreview"
      @saved="handleSaved"
    />

    <!-- 预览模式 - 显示查看器（Tab布局） -->
    <TemplateViewer v-else-if="currentMode === 'preview'" :template-id="templateId" @edit="handleSwitchToEdit" />
  </div>
</template>

<style scoped lang="scss">
.template-details-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 200px);
}
</style>
