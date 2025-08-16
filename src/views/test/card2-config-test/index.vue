<template>
  <div class="card2-config-test">
    <n-card title="Card2.1 配置系统测试" style="margin: 20px;">
      <!-- 初始化状态 -->
      <n-alert v-if="isLoading" type="info" style="margin-bottom: 16px;">
        正在初始化Card2.1系统...
      </n-alert>

      <!-- 错误状态 -->
      <n-alert v-if="error" type="error" style="margin-bottom: 16px;">
        初始化失败: {{ error }}
      </n-alert>

      <!-- 成功状态 -->
      <div v-if="!isLoading && !error">
        <!-- 组件统计信息 -->
        <n-descriptions title="系统状态" bordered size="small" style="margin-bottom: 16px;">
          <n-descriptions-item label="可用组件数量">{{ availableComponents.length }}</n-descriptions-item>
          <n-descriptions-item label="已注册Widget数量">{{ registeredWidgets.length }}</n-descriptions-item>
          <n-descriptions-item label="配置组件数量">{{ configComponentsCount }}</n-descriptions-item>
        </n-descriptions>

        <!-- 组件列表 -->
        <n-card title="可用组件列表" style="margin-bottom: 16px;">
          <n-space vertical>
            <div v-for="component in availableComponents" :key="component.type" class="component-item">
              <n-space align="center">
                <n-tag type="primary">{{ component.type }}</n-tag>
                <span>{{ component.name }}</span>
                <n-tag v-if="component.configComponent" type="success" size="small">有配置</n-tag>
                <n-tag v-else type="warning" size="small">无配置</n-tag>
                <n-button 
                  v-if="component.configComponent" 
                  size="small" 
                  @click="testComponentConfig(component)"
                >
                  测试配置
                </n-button>
              </n-space>
            </div>
          </n-space>
        </n-card>

        <!-- 配置测试区域 -->
        <n-card v-if="selectedComponent" title="配置测试" style="margin-bottom: 16px;">
          <n-space vertical>
            <n-descriptions bordered size="small">
              <n-descriptions-item label="组件类型">{{ selectedComponent.type }}</n-descriptions-item>
              <n-descriptions-item label="组件名称">{{ selectedComponent.name }}</n-descriptions-item>
              <n-descriptions-item label="有配置组件">{{ !!selectedComponent.configComponent }}</n-descriptions-item>
            </n-descriptions>

            <!-- 配置表单渲染 -->
            <div v-if="selectedComponent.configComponent" class="config-form-area">
              <n-divider title-placement="left">配置表单</n-divider>
              <component 
                :is="selectedComponent.configComponent"
                :widget="mockWidget"
                :config="mockConfig"
                @update="handleConfigUpdate"
              />
            </div>

            <!-- 当前配置数据 -->
            <div class="config-data-area">
              <n-divider title-placement="left">配置数据</n-divider>
              <n-code :code="JSON.stringify(mockConfig, null, 2)" language="json" />
            </div>
          </n-space>
        </n-card>

        <!-- 实时预览区域 -->
        <n-card v-if="selectedComponent" title="组件预览" style="margin-bottom: 16px;">
          <div class="preview-area">
            <component 
              v-if="selectedComponent.component"
              :is="selectedComponent.component"
              :config="mockConfig"
            />
          </div>
        </n-card>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Card2.1配置系统测试页面
 * 用于验证组件配置系统是否正常工作
 */

import { ref, reactive, computed, onMounted } from 'vue'
import { useVisualEditorIntegration as useCard2Integration } from '@/card2.1/hooks/useVisualEditorIntegration'
import type { ComponentDefinition } from '@/card2.1/core/types'

// Card2集成hook
const card2Integration = useCard2Integration({ autoInit: true })

// 状态
const isLoading = ref(true)
const error = ref<string | null>(null)
const selectedComponent = ref<ComponentDefinition | null>(null)
const mockConfig = reactive({})

// 模拟Widget对象
const mockWidget = computed(() => ({
  type: selectedComponent.value?.type || '',
  name: selectedComponent.value?.name || '',
  properties: mockConfig,
  metadata: {
    isCard2Component: true
  }
}))

// 计算属性
const availableComponents = computed(() => {
  return card2Integration.availableComponents?.value || []
})

const registeredWidgets = computed(() => {
  // 这里需要从widget store获取
  return []
})

const configComponentsCount = computed(() => {
  return availableComponents.value.filter(comp => comp.configComponent).length
})

/**
 * 测试组件配置
 */
const testComponentConfig = (component: ComponentDefinition) => {
  console.log('[Card2ConfigTest] 测试组件配置:', component.type)
  
  selectedComponent.value = component
  
  // 重置配置为默认值
  Object.keys(mockConfig).forEach(key => {
    delete mockConfig[key]
  })
  
  // 从组件定义中获取默认配置
  if (component.config) {
    Object.assign(mockConfig, component.config)
  }
  
  console.log('[Card2ConfigTest] 初始配置:', mockConfig)
}

/**
 * 处理配置更新
 */
const handleConfigUpdate = (newConfig: any) => {
  console.log('[Card2ConfigTest] 配置更新:', newConfig)
  
  // 更新配置
  Object.keys(mockConfig).forEach(key => {
    delete mockConfig[key]
  })
  Object.assign(mockConfig, newConfig)
}

/**
 * 初始化
 */
const initialize = async () => {
  try {
    console.log('[Card2ConfigTest] 开始初始化...')
    
    // 等待Card2集成初始化完成
    await card2Integration.initialize()
    
    console.log('[Card2ConfigTest] 初始化完成')
    console.log('[Card2ConfigTest] 可用组件:', availableComponents.value)
    
    isLoading.value = false
    
    // 自动选择第一个有配置的组件进行测试
    const firstComponentWithConfig = availableComponents.value.find(comp => comp.configComponent)
    if (firstComponentWithConfig) {
      testComponentConfig(firstComponentWithConfig)
    }
    
  } catch (err) {
    console.error('[Card2ConfigTest] 初始化失败:', err)
    error.value = err?.message || '未知错误'
    isLoading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  initialize()
})

console.log('[Card2ConfigTest] 🧪 Card2.1配置系统测试页面加载完成')
</script>

<style scoped>
.card2-config-test {
  padding: 20px;
  background: var(--body-color);
  min-height: 100vh;
}

.component-item {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}

.config-form-area {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  background: var(--card-color);
}

.config-data-area {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  background: var(--card-color);
}

.preview-area {
  border: 2px dashed var(--border-color);
  border-radius: 6px;
  padding: 20px;
  min-height: 200px;
  background: var(--body-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>