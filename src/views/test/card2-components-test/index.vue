<template>
  <div class="card2-components-test">
    <n-page-header
      title="Card2.1 组件集成测试"
      subtitle="测试新创建的三个组件：simple-display、dual-data-display、triple-data-display"
    >
      <template #extra>
        <n-space>
          <n-button size="small" @click="refreshComponents">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            刷新组件列表
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <!-- 组件注册状态 -->
    <n-card title="组件注册状态" size="small" style="margin-bottom: 16px">
      <n-descriptions :column="2" size="small">
        <n-descriptions-item label="初始化状态">
          <n-tag :type="card2Integration.isInitialized.value ? 'success' : 'warning'">
            {{ card2Integration.isInitialized.value ? '已初始化' : '未初始化' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="可用组件数量">
          <n-text>{{ availableWidgets.length }}</n-text>
        </n-descriptions-item>
        <n-descriptions-item label="初始化错误">
          <n-text v-if="card2Integration.initializationError.value" type="error">
            {{ card2Integration.initializationError.value }}
          </n-text>
          <n-text v-else>无</n-text>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 组件列表 -->
    <n-card title="可用组件列表" size="small" style="margin-bottom: 16px">
      <n-space v-if="availableWidgets.length > 0" :size="12" style="margin-bottom: 16px">
        <n-card
          v-for="widget in availableWidgets"
          :key="widget.type"
          size="small"
          hoverable
          style="min-width: 200px"
          @click="testComponent(widget)"
        >
          <template #header>
            <n-space align="center">
              <n-text strong>{{ widget.name }}</n-text>
              <n-tag size="tiny" type="info">{{ widget.type }}</n-tag>
            </n-space>
          </template>
          <n-text depth="2" style="font-size: 12px">{{ widget.description }}</n-text>
          <template #footer>
            <n-space justify="space-between">
              <n-tag size="tiny">{{ widget.category }}</n-tag>
              <n-tag v-if="widget.isCard2Component" size="tiny" type="success">Card2.1</n-tag>
            </n-space>
          </template>
        </n-card>
      </n-space>
      <n-empty v-else description="没有找到可用的组件" />
    </n-card>

    <!-- 重点关注的组件测试 -->
    <n-card title="新创建组件测试" size="small" style="margin-bottom: 16px">
      <n-space vertical :size="12">
        <div v-for="componentType in targetComponents" :key="componentType">
          <n-space align="center" style="margin-bottom: 8px">
            <n-text strong>{{ componentType }}</n-text>
            <n-tag :type="getComponentStatus(componentType) === 'found' ? 'success' : 'error'" size="small">
              {{ getComponentStatus(componentType) === 'found' ? '✅ 已注册' : '❌ 未找到' }}
            </n-tag>
          </n-space>

          <!-- 如果找到组件，显示详细信息 -->
          <n-card v-if="getComponentWidget(componentType)" size="tiny" style="margin-left: 20px">
            <pre style="font-size: 12px; max-height: 200px; overflow-y: auto">{{
              JSON.stringify(getComponentWidget(componentType), null, 2)
            }}</pre>
          </n-card>
        </div>
      </n-space>
    </n-card>

    <!-- 测试结果 -->
    <n-card v-if="testResults.length > 0" title="测试结果" size="small">
      <n-timeline>
        <n-timeline-item
          v-for="result in testResults"
          :key="result.timestamp"
          :type="result.success ? 'success' : 'error'"
        >
          <template #header>
            <n-text>{{ result.componentType }} - {{ result.action }}</n-text>
          </template>
          <n-text depth="2">{{ result.message }}</n-text>
          <n-text depth="3" style="font-size: 12px">{{ result.timestamp }}</n-text>
        </n-timeline-item>
      </n-timeline>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Card2.1 组件集成测试页面
 * 用于验证新创建的三个组件是否正确注册和加载
 */

import { ref, computed, onMounted } from 'vue'
import { RefreshOutline } from '@vicons/ionicons5'
import { useVisualEditorIntegration as useCard2Integration } from '@/card2.1/hooks/useVisualEditorIntegration'

// Card2集成hook
const card2Integration = useCard2Integration({ autoInit: true })

// 目标测试组件
const targetComponents = ['simple-display', 'dual-data-display', 'triple-data-display']

// 测试结果
interface TestResult {
  componentType: string
  action: string
  success: boolean
  message: string
  timestamp: string
}

const testResults = ref<TestResult[]>([])

// 可用组件列表
const availableWidgets = computed(() => {
  return card2Integration.availableWidgets.value || []
})

/**
 * 获取组件状态
 */
const getComponentStatus = (componentType: string): 'found' | 'not-found' => {
  return availableWidgets.value.some(widget => widget.type === componentType) ? 'found' : 'not-found'
}

/**
 * 获取组件Widget信息
 */
const getComponentWidget = (componentType: string) => {
  return availableWidgets.value.find(widget => widget.type === componentType)
}

/**
 * 刷新组件列表
 */
const refreshComponents = async () => {
  try {
    await card2Integration.initialize()
    addTestResult('system', '刷新组件列表', true, '组件列表已刷新')
  } catch (error) {
    addTestResult('system', '刷新组件列表', false, `刷新失败: ${error}`)
  }
}

/**
 * 测试组件
 */
const testComponent = (widget: any) => {
  console.log('🎯 [ComponentTest] 测试组件:', widget)
  addTestResult(widget.type, '点击测试', true, `组件信息: ${widget.name} - ${widget.description}`)
}

/**
 * 添加测试结果
 */
const addTestResult = (componentType: string, action: string, success: boolean, message: string) => {
  testResults.value.unshift({
    componentType,
    action,
    success,
    message,
    timestamp: new Date().toLocaleString()
  })
}

// 组件挂载时初始化
onMounted(async () => {
  console.log('🎯 [Card2ComponentsTest] 组件测试页面加载')

  try {
    if (!card2Integration.isInitialized.value) {
      await card2Integration.initialize()
    }

    // 记录初始状态
    addTestResult('system', '页面初始化', true, `找到 ${availableWidgets.value.length} 个组件`)

    // 检查目标组件
    targetComponents.forEach(componentType => {
      const status = getComponentStatus(componentType)
      addTestResult(
        componentType,
        '注册检查',
        status === 'found',
        status === 'found' ? '组件已成功注册' : '组件未找到，可能注册失败'
      )
    })
  } catch (error) {
    console.error('❌ [Card2ComponentsTest] 初始化失败:', error)
    addTestResult('system', '页面初始化', false, `初始化失败: ${error}`)
  }
})
</script>

<style scoped>
.card2-components-test {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.n-card {
  margin-bottom: 16px;
}
</style>
