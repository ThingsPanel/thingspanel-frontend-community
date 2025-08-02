<template>
  <div ref="containerRef" class="card2-wrapper" :class="{ 'has-error': hasError }">
    <!-- 错误状态 -->
    <div v-if="hasError" class="error-overlay">
      <n-alert type="error" :title="'渲染失败'" size="small">
        {{ errorMessage }}
      </n-alert>
    </div>

    <!-- 动态组件渲染 -->
    <component
      :is="componentToRender"
      v-else-if="componentToRender"
      v-bind="config"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, type Component } from 'vue'
import { useEditor } from '../../hooks/useEditor'

interface Props {
  componentType: string
  config?: any
  data?: any // data prop暂时保留，但目前未使用
  nodeId: string
}

const props = defineProps<Props>()

const { card2Integration } = useEditor()

// State
const hasError = ref(false)
const errorMessage = ref('')
const componentToRender = shallowRef<Component | null>(null)

const loadComponent = async () => {
  try {
    hasError.value = false
    errorMessage.value = ''
    
    // 使用新的函数名获取组件定义
    const definition = card2Integration.getComponentDefinition(props.componentType)
    
    if (!definition || !definition.component) {
      throw new Error(`组件 [${props.componentType}] 的定义或组件实现不存在。`)
    }

    // definition.component 是一个异步组件 (defineAsyncComponent)
    // 我们可以直接使用它
    componentToRender.value = definition.component

  } catch (error: any) {
    console.error(`❌ Card 2.1 组件加载失败 [${props.componentType}]:`, error)
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
