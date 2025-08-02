<!--
  Visual Editor 与 Card 2.0 集成演示
-->
<template>
  <div class="card2-integration-demo">
    <n-card title="Visual Editor + Card 2.0 集成演示">
      <n-space vertical size="large">
        
        <!-- 状态信息 -->
        <n-card title="集成状态" size="small">
          <n-space vertical size="small">
            <n-tag :type="card2Integration.isInitialized.value ? 'success' : 'warning'">
              Card 2.0 初始化: {{ card2Integration.isInitialized.value ? '已完成' : '未完成' }}
            </n-tag>
            
            <n-tag v-if="card2Integration.isLoading.value" type="info">
              正在加载中...
            </n-tag>
            
            <n-tag v-if="card2Integration.error.value" type="error">
              错误: {{ card2Integration.error.value }}
            </n-tag>
            
            <div v-if="card2Integration.isInitialized.value">
              <n-text depth="2">
                可用组件数量: {{ card2Integration.availableComponents.value.length }}
              </n-text>
            </div>
          </n-space>
        </n-card>

        <!-- 组件分类展示 -->
        <n-card v-if="card2Integration.isInitialized.value" title="可用组件" size="small">
          <n-collapse>
            <n-collapse-item 
              v-for="(widgets, category) in card2Integration.getComponentsByCategory.value" 
              :key="category" 
              :title="`${getCategoryDisplayName(category)} (${widgets.length})`"
            >
              <n-space>
                <n-tag 
                  v-for="widget in widgets" 
                  :key="widget.type"
                  :title="widget.description"
                >
                  {{ widget.name }} v{{ widget.version || '1.0.0' }}
                </n-tag>
              </n-space>
            </n-collapse-item>
          </n-collapse>
        </n-card>

        <!-- 快速测试 -->
        <n-card title="快速测试" size="small">
          <n-space vertical size="small">
            <n-text depth="2">选择一个 Card 2.0 组件进行测试:</n-text>
            
            <n-select
              v-model:value="selectedComponentType"
              :options="componentOptions"
              placeholder="选择组件类型"
              clearable
            />
            
            <n-space>
              <n-button 
                type="primary" 
                :disabled="!selectedComponentType || !card2Integration.isInitialized.value"
                @click="testCreateComponent"
              >
                测试创建组件
              </n-button>
              
              <n-button 
                :disabled="!card2Integration.isInitialized.value"
                @click="testCreateAllComponents"
              >
                测试所有组件
              </n-button>
              
              <n-button 
                type="error" 
                secondary
                @click="clearTestResults"
              >
                清空测试结果
              </n-button>
            </n-space>
          </n-space>
        </n-card>

        <!-- 测试结果 -->
        <n-card v-if="testResults.length > 0" title="测试结果" size="small">
          <n-space vertical size="small">
            <div v-for="result in testResults" :key="result.id" class="test-result">
              <n-tag :type="result.success ? 'success' : 'error'">
                {{ result.componentType }}: {{ result.success ? '成功' : '失败' }}
              </n-tag>
              <n-text v-if="!result.success" type="error" depth="2">
                {{ result.error }}
              </n-text>
            </div>
          </n-space>
        </n-card>

        <!-- 编辑器演示 -->
        <n-card title="编辑器演示" size="small">
          <div class="editor-demo">
            <PanelEditor panel-id="demo-panel" />
          </div>
        </n-card>

      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { PanelEditor } from '../index'
import { useCard2Integration } from '../hooks/useCard2Integration'

const message = useMessage()

// Card 2.0 集成
const card2Integration = useCard2Integration({
  autoInit: true,
  devMode: true
})

// 测试状态
const selectedComponentType = ref<string>()
const testResults = ref<Array<{
  id: string
  componentType: string
  success: boolean
  error?: string
}>>([])

// 组件选项
const componentOptions = computed(() => {
  return card2Integration.availableComponents.value.map(widget => ({
    label: `${widget.name} (${widget.type})`,
    value: widget.type
  }))
})

// 获取分类显示名称
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'chart': '📊 图表组件',
    'control': '🎛️ 控制组件',
    'display': '📱 显示组件',
    'media': '🎥 媒体组件',
    'other': '🔧 其他组件'
  }
  
  return categoryMap[category] || `📦 ${category.charAt(0).toUpperCase() + category.slice(1)}`
}

// 测试创建单个组件
const testCreateComponent = async () => {
  if (!selectedComponentType.value) return

  try {
    message.loading('正在测试组件创建...', { duration: 0, key: 'test' })
    
    const definition = card2Integration.getCard2Definition(selectedComponentType.value as any)
    if (!definition) {
      throw new Error('找不到组件定义')
    }

    // 创建测试容器
    const testContainer = document.createElement('div')
    testContainer.id = `test-container-${Date.now()}`
    testContainer.style.width = '200px'
    testContainer.style.height = '150px'
    testContainer.style.border = '1px solid #ccc'
    testContainer.style.margin = '10px'
    document.body.appendChild(testContainer)

    // 创建组件实例
    const result = await card2Integration.createCard2Instance(
      definition.meta.id,
      definition.config.defaultConfig,
      testContainer.id
    )

    testResults.value.push({
      id: result.instance.id,
      componentType: selectedComponentType.value,
      success: true
    })

    message.success(`组件 ${selectedComponentType.value} 创建成功`, { key: 'test' })

    // 5秒后清理
    setTimeout(() => {
      if (testContainer.parentNode) {
        testContainer.parentNode.removeChild(testContainer)
      }
      card2Integration.destroyCard2Instance(result.instance.id)
    }, 5000)

  } catch (error) {
    testResults.value.push({
      id: `error-${Date.now()}`,
      componentType: selectedComponentType.value,
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })

    message.error(`组件 ${selectedComponentType.value} 创建失败: ${error}`, { key: 'test' })
    console.error('测试组件创建失败:', error)
  }
}

// 测试所有组件
const testCreateAllComponents = async () => {
  const components = card2Integration.availableComponents.value
  
  message.loading(`正在测试 ${components.length} 个组件...`, { duration: 0, key: 'test-all' })

  for (const widget of components) {
    try {
      const definition = widget.definition
      
      // 创建测试容器
      const testContainer = document.createElement('div')
      testContainer.id = `test-container-${widget.type}-${Date.now()}`
      testContainer.style.width = '200px'
      testContainer.style.height = '150px'
      testContainer.style.border = '1px solid #ccc'
      testContainer.style.margin = '5px'
      testContainer.style.display = 'inline-block'
      document.body.appendChild(testContainer)

      // 创建组件实例
      const result = await card2Integration.createCard2Instance(
        definition.meta.id,
        definition.config.defaultConfig,
        testContainer.id
      )

      testResults.value.push({
        id: result.instance.id,
        componentType: widget.type,
        success: true
      })

      // 短暂延迟后清理
      setTimeout(() => {
        if (testContainer.parentNode) {
          testContainer.parentNode.removeChild(testContainer)
        }
        card2Integration.destroyCard2Instance(result.instance.id)
      }, 3000)

    } catch (error) {
      testResults.value.push({
        id: `error-${widget.type}-${Date.now()}`,
        componentType: widget.type,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      })
      console.error(`测试组件 ${widget.type} 失败:`, error)
    }
  }

  const successCount = testResults.value.filter(r => r.success).length
  message.success(`测试完成: ${successCount}/${components.length} 个组件创建成功`, { key: 'test-all' })
}

// 清空测试结果
const clearTestResults = () => {
  testResults.value = []
  message.success('测试结果已清空')
}

onMounted(() => {
  console.log('🎭 Card 2.0 集成演示页面已加载')
})
</script>

<style scoped>
.card2-integration-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.editor-demo {
  height: 600px;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  overflow: hidden;
}
</style>