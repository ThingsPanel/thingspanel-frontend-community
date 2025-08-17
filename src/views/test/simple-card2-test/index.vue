<template>
  <div class="simple-card2-test">
    <n-card title="简单Card2.1测试" style="margin: 20px">
      <n-space vertical>
        <!-- 初始化状态 -->
        <n-alert v-if="isLoading" type="info">正在初始化Card2.1系统...</n-alert>

        <!-- 错误状态 -->
        <n-alert v-if="error" type="error">初始化失败: {{ error }}</n-alert>

        <!-- 成功状态 -->
        <div v-if="!isLoading && !error">
          <!-- 测试结果显示 -->
          <n-descriptions title="测试结果" bordered size="small" style="margin-bottom: 16px">
            <n-descriptions-item label="Card2系统初始化">
              {{ isInitialized ? '✅ 成功' : '❌ 失败' }}
            </n-descriptions-item>
            <n-descriptions-item label="组件总数">{{ availableComponents.length }}</n-descriptions-item>
            <n-descriptions-item label="simple-test-component">
              {{ hasSimpleTestComponent ? '✅ 找到' : '❌ 未找到' }}
            </n-descriptions-item>
            <n-descriptions-item label="配置组件">
              {{ simpleTestHasConfig ? '✅ 有配置' : '❌ 无配置' }}
            </n-descriptions-item>
          </n-descriptions>

          <!-- 详细调试信息 -->
          <n-card title="调试信息" style="margin-bottom: 16px">
            <n-space vertical>
              <div>
                <strong>simple-test-component 详情:</strong>
                <n-code
                  :code="JSON.stringify(simpleTestComponentInfo, null, 2)"
                  language="json"
                  style="margin-top: 8px"
                />
              </div>

              <div v-if="simpleTestComponentInfo">
                <strong>配置组件测试:</strong>
                <n-space>
                  <n-tag v-if="simpleTestComponentInfo.definition" type="success">定义存在</n-tag>
                  <n-tag v-if="simpleTestComponentInfo.definition?.configComponent" type="success">配置组件存在</n-tag>
                  <n-tag v-if="simpleTestComponentInfo.definition?.component" type="success">主组件存在</n-tag>
                </n-space>
              </div>

              <!-- 手动测试配置组件 -->
              <div v-if="simpleTestComponentInfo?.definition?.configComponent">
                <n-divider title-placement="left">配置组件测试</n-divider>
                <div style="border: 1px solid var(--border-color); padding: 16px; border-radius: 6px">
                  <component
                    :is="simpleTestComponentInfo.definition.configComponent"
                    :widget="mockWidget"
                    :config="testConfig"
                    @update="handleConfigUpdate"
                  />
                </div>
              </div>

              <!-- 组件预览 -->
              <div v-if="simpleTestComponentInfo?.definition?.component">
                <n-divider title-placement="left">组件预览</n-divider>
                <div style="border: 2px dashed var(--border-color); padding: 20px; border-radius: 6px">
                  <component :is="simpleTestComponentInfo.definition.component" :config="testConfig" />
                </div>
              </div>

              <!-- 当前配置 -->
              <div>
                <n-divider title-placement="left">当前配置</n-divider>
                <n-code :code="JSON.stringify(testConfig, null, 2)" language="json" />
              </div>
            </n-space>
          </n-card>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单的Card2.1测试页面
 * 专门测试simple-test-component的配置加载
 */

import { ref, reactive, computed, onMounted } from 'vue'
import { useVisualEditorIntegration } from '@/card2.1/hooks/useVisualEditorIntegration'

// 状态
const isLoading = ref(true)
const error = ref<string | null>(null)
const isInitialized = ref(false)

// Card2集成
const card2Integration = useVisualEditorIntegration({ autoInit: true })

// 测试配置数据
const testConfig = reactive({
  title: '简单测试组件',
  showTitle: true,
  content: '这是配置测试内容',
  backgroundColor: '#f0f8ff',
  textColor: '#333333',
  showButton: true,
  buttonText: '测试按钮',
  buttonType: 'primary',
  fontSize: 14,
  padding: 16,
  borderRadius: 8
})

// 模拟Widget对象
const mockWidget = {
  type: 'simple-test-component',
  name: '简单测试组件',
  properties: testConfig,
  metadata: {
    isCard2Component: true
  }
}

// 计算属性
const availableComponents = computed(() => {
  return card2Integration.availableComponents?.value || []
})

const hasSimpleTestComponent = computed(() => {
  return availableComponents.value.some(comp => comp.type === 'simple-test-component')
})

const simpleTestComponentInfo = computed(() => {
  const component = availableComponents.value.find(comp => comp.type === 'simple-test-component')
  console.log('[SimpleCard2Test] simple-test-component 信息:', component)
  return component || null
})

const simpleTestHasConfig = computed(() => {
  return !!simpleTestComponentInfo.value?.definition?.configComponent
})

/**
 * 处理配置更新
 */
const handleConfigUpdate = (newConfig: any) => {
  console.log('[SimpleCard2Test] 配置更新:', newConfig)

  // 更新测试配置
  Object.keys(testConfig).forEach(key => {
    delete testConfig[key]
  })
  Object.assign(testConfig, newConfig)
}

/**
 * 初始化
 */
const initialize = async () => {
  try {
    console.log('[SimpleCard2Test] 开始初始化...')

    // 等待Card2集成初始化完成
    await card2Integration.initialize()

    console.log('[SimpleCard2Test] Card2系统初始化完成')
    console.log('[SimpleCard2Test] 可用组件:', availableComponents.value)

    isInitialized.value = true
    isLoading.value = false

    // 测试获取组件定义
    const componentDef = card2Integration.getComponentDefinition('simple-test-component')
    console.log('[SimpleCard2Test] getComponentDefinition 结果:', componentDef)
  } catch (err) {
    console.error('[SimpleCard2Test] 初始化失败:', err)
    error.value = err?.message || '未知错误'
    isLoading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  initialize()
})

console.log('[SimpleCard2Test] 🧪 简单Card2.1测试页面加载完成')
</script>

<style scoped>
.simple-card2-test {
  padding: 20px;
  background: var(--body-color);
  min-height: 100vh;
}
</style>
