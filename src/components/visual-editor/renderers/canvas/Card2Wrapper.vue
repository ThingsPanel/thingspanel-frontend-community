<template>
  <div ref="containerRef" class="card2-wrapper" :class="{ 'has-error': hasError }">
    <!-- 错误状态 -->
    <div v-if="hasError" class="error-overlay">
      <n-alert type="error" :title="'渲染失败'" size="small">
        {{ errorMessage }}
      </n-alert>
    </div>

    <!-- Card2.1 组件渲染 -->
    <ConfigProvider
      v-else-if="componentToRender"
      :config="config || {}"
    >
      <component :is="componentToRender" />
    </ConfigProvider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, type Component } from 'vue'
import ConfigProvider from '@/card2.1/utils/ConfigProvider.vue'

interface Props {
  componentType: string
  config?: any
  data?: any // data prop暂时保留，但目前未使用
  nodeId: string
}

const props = defineProps<Props>()

// State
const hasError = ref(false)
const errorMessage = ref('')
const componentToRender = shallowRef<Component | null>(null)

const loadComponent = async () => {
  try {
    hasError.value = false
    errorMessage.value = ''
    
    // 处理 card21- 前缀
    let componentType = props.componentType
    if (componentType.startsWith('card21-')) {
      componentType = componentType.replace('card21-', '')
    }
    
    // 从 Card2.1 注册表获取组件
    const { getCard21MainComponent } = await import('@/card2.1/integrations/visual-editor')
    const card21Component = getCard21MainComponent(componentType)
    
    if (card21Component) {
      componentToRender.value = card21Component
      console.log(`✅ 成功加载Card2.1组件: ${componentType}`)
      return
    }

    throw new Error(`Card2.1 组件 [${componentType}] 不存在。`)

  } catch (error: any) {
    console.error(`❌ Card2.1 组件加载失败 [${props.componentType}]:`, error)
    hasError.value = true
    errorMessage.value = error.message || '未知错误'
    componentToRender.value = null
  }
}

// 监听组件类型变化，例如在编辑器中切换组件类型
watch(() => props.componentType, loadComponent, { immediate: true })

onMounted(() => {
  if (!componentToRender.value) {
    loadComponent()
  }
})
</script>

<style scoped>
.card2-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.error-overlay {
  padding: 8px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
