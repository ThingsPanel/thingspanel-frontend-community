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
      :properties="config"
      :metadata="{ card2Data: data, dataSource: dataSource }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, type Component } from 'vue'
import { useEditor } from '../../hooks'

interface Props {
  componentType: string
  config?: any
  data?: any // data prop暂时保留，但目前未使用
  dataSource?: any // 数据源配置
  nodeId: string
}

const props = defineProps<Props>()

const editor = useEditor()
const card2Integration = editor.card2Integration

console.log('🔍 Card2Wrapper - useEditor 结果:', editor)
console.log('🔍 Card2Wrapper - card2Integration:', card2Integration)

// State
const hasError = ref(false)
const errorMessage = ref('')
const componentToRender = shallowRef<Component | null>(null)

const loadComponent = async () => {
  try {
    hasError.value = false
    errorMessage.value = ''
    
    console.log(`🔍 Card2Wrapper - 加载组件: ${props.componentType}`)
    console.log(`🔍 Card2Wrapper - card2Integration:`, card2Integration)
    
    // 尝试多种组件类型格式
    let definition = card2Integration.getComponentDefinition(props.componentType)
    
    // 如果直接类型找不到，尝试去掉前缀
    if (!definition && props.componentType.startsWith('card21-')) {
      const cleanType = props.componentType.replace('card21-', '')
      console.log(`🔍 Card2Wrapper - 尝试清理类型: ${cleanType}`)
      definition = card2Integration.getComponentDefinition(cleanType)
    }
    
    // 如果还是找不到，尝试从 metadata 中获取
    if (!definition) {
      console.log(`🔍 Card2Wrapper - 尝试从 metadata 获取组件定义`)
      // 这里可以添加从 metadata 获取的逻辑
    }
    
    console.log(`🔍 Card2Wrapper - 组件定义:`, definition)
    
    if (!definition || !definition.component) {
      throw new Error(`组件 [${props.componentType}] 的定义或组件实现不存在。`)
    }

    // definition.component 是一个异步组件 (defineAsyncComponent)
    // 我们可以直接使用它
    componentToRender.value = definition.component
    console.log(`✅ Card2Wrapper - 组件加载成功: ${props.componentType}`)

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
