<!-- Property Exposure System Test Page -->
<template>
  <div class="property-exposure-test">
    <n-space vertical size="large">
      <!-- 页面头部 -->
      <n-card>
        <template #header>
          <h2>组件属性暴露系统测试</h2>
        </template>
        <n-text>测试组件属性暴露机制和交互配置中的属性选择功能</n-text>
      </n-card>

      <!-- 注册表状态检查 -->
      <n-card>
        <template #header>
          <n-space justify="space-between">
            <span>注册表状态</span>
            <n-button size="small" @click="refreshRegistryStatus">刷新状态</n-button>
          </n-space>
        </template>

        <n-space vertical>
          <div>
            <strong>已注册的组件类型 ({{ registeredComponentTypes.length }}):</strong>
            <br />
            <n-space size="small" style="margin-top: 8px">
              <n-tag
                v-for="type in registeredComponentTypes"
                :key="type"
                size="small"
                type="info"
                style="cursor: pointer"
                @click="selectedComponentType = type"
              >
                {{ type }}
              </n-tag>
            </n-space>
          </div>

          <div v-if="registeredComponentTypes.length === 0" class="empty-state">
            <n-alert type="warning" style="max-width: 400px">
              暂无组件注册属性暴露配置。组件需要在 onMounted 中调用 propertyExposureRegistry.register()
            </n-alert>
          </div>
        </n-space>
      </n-card>

      <!-- 组件属性详情 -->
      <n-card>
        <template #header>
          <span>组件属性详情</span>
        </template>

        <n-form>
          <n-form-item label="选择组件类型">
            <n-select
              v-model:value="selectedComponentType"
              :options="componentTypeOptions"
              placeholder="选择一个组件类型查看其属性"
              clearable
            />
          </n-form-item>
        </n-form>

        <div v-if="selectedComponentType && componentProperties.length > 0">
          <h4>{{ selectedComponentType }} 可监听属性 ({{ componentProperties.length }} 个):</h4>
          <n-data-table
            :columns="propertyColumns"
            :data="componentProperties"
            size="small"
            max-height="400"
            :scroll-x="800"
          />
        </div>

        <n-alert v-else-if="selectedComponentType" type="info" style="margin-top: 16px">
          {{ selectedComponentType }} 组件暂无可监听属性
        </n-alert>
      </n-card>

      <!-- 实际组件测试区域 -->
      <n-card>
        <template #header>
          <span>实际组件测试</span>
        </template>

        <n-alert type="info" style="margin-bottom: 16px">以下组件应该会在挂载时自动注册属性暴露配置</n-alert>

        <n-space vertical size="large">
          <!-- SimpleTestComponent 测试 -->
          <div class="component-test-section">
            <h4>SimpleTestComponent 测试</h4>
            <div class="component-container">
              <SimpleTestComponent
                :component-id="'test-simple-1'"
                :config="{
                  title: '测试组件标题',
                  content: '这是测试内容',
                  buttonText: '测试按钮',
                  backgroundColor: '#f0f8ff',
                  textColor: '#333333',
                  fontSize: 14
                }"
                :show-interaction-indicator="true"
              />
            </div>
          </div>

          <!-- DataDisplayCard 测试 -->
          <!-- <div class="component-test-section">
            <h4>DataDisplayCard 测试</h4>
            <div class="component-container">
              <DataDisplayCard
                :component-id="'test-data-1'"
                :config="{
                  title: '数据卡片',
                  mainValue: 99,
                  mainUnit: '°C',
                  description: '温度传感器数据',
                  showTrend: true,
                  trendText: '较昨日 +2.5°C',
                  backgroundColor: '#ffffff',
                  textColor: '#333333'
                }"
                :show-interaction-indicator="true"
              />
            </div>
          </div> -->
        </n-space>
      </n-card>

      <!-- 交互配置测试 -->
      <n-card>
        <template #header>
          <span>交互配置界面测试</span>
        </template>

        <n-form>
          <n-form-item label="测试组件类型">
            <n-select
              v-model:value="testComponentType"
              :options="componentTypeOptions"
              placeholder="选择组件类型进行交互配置测试"
            />
          </n-form-item>
        </n-form>

        <div v-if="testComponentType">
          <h4>{{ testComponentType }} 交互配置:</h4>
          <div class="interaction-config-container">
            <InteractionSettingsForm
              v-model="testInteractionConfigs"
              :component-id="'test-interaction'"
              :component-type="testComponentType"
              @change="handleInteractionChange"
            />
          </div>

          <n-alert v-if="testInteractionConfigs.length > 0" type="success" style="margin-top: 16px">
            成功创建了 {{ testInteractionConfigs.length }} 个交互配置
          </n-alert>
        </div>
      </n-card>

      <!-- 调试信息 -->
      <n-card v-if="showDebugInfo">
        <template #header>
          <n-space justify="space-between">
            <span>调试信息</span>
            <n-button size="small" @click="showDebugInfo = !showDebugInfo">
              {{ showDebugInfo ? '隐藏' : '显示' }}
            </n-button>
          </n-space>
        </template>

        <n-space vertical>
          <div>
            <strong>当前测试配置:</strong>
            <pre>{{ JSON.stringify(testInteractionConfigs, null, 2) }}</pre>
          </div>

          <div v-if="selectedComponentType">
            <strong>{{ selectedComponentType }} 组件完整暴露信息:</strong>
            <pre>{{ JSON.stringify(componentExposureInfo, null, 2) }}</pre>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件属性暴露系统测试页面
 * 用于验证组件属性注册和交互配置系统
 */

import { ref, computed, onMounted } from 'vue'
import {
  NCard,
  NSpace,
  NAlert,
  NTag,
  NSelect,
  NForm,
  NFormItem,
  NDataTable,
  NButton,
  NText,
  type DataTableColumns
} from 'naive-ui'

// 导入组件和系统
import { propertyExposureRegistry } from '@/card2.1/core/property-exposure'
import type { ListenableProperty, InteractionConfig } from '@/card2.1/core/interaction-types'
// import SimpleTestComponent from '@/card2.1/components/simple-test-component/SimpleTestComponent.vue'
// import DataDisplayCard from '@/card2.1/components/data-display-card/DataDisplayCard.vue'
import InteractionSettingsForm from '@/core/interaction-system/components/InteractionSettingsForm.vue'

// 响应式状态
const registeredComponentTypes = ref<string[]>([])
const selectedComponentType = ref<string>('')
const testComponentType = ref<string>('')
const testInteractionConfigs = ref<InteractionConfig[]>([])
const showDebugInfo = ref(false)

// 计算属性
const componentTypeOptions = computed(() => {
  return registeredComponentTypes.value.map(type => ({
    label: type,
    value: type
  }))
})

const componentProperties = computed(() => {
  if (!selectedComponentType.value) return []

  const exposure = propertyExposureRegistry.getComponentExposure(selectedComponentType.value)
  return exposure?.listenableProperties || []
})

const componentExposureInfo = computed(() => {
  if (!selectedComponentType.value) return null
  return propertyExposureRegistry.getComponentExposure(selectedComponentType.value)
})

// 属性表格列配置
const propertyColumns: DataTableColumns<ListenableProperty> = [
  {
    title: '属性名',
    key: 'name',
    width: 120,
    render: row => row.name
  },
  {
    title: '显示名称',
    key: 'label',
    width: 120,
    render: row => row.label
  },
  {
    title: '类型',
    key: 'type',
    width: 80,
    render: row => row.type
  },
  {
    title: '分组',
    key: 'group',
    width: 100,
    render: row => row.group || '未分组'
  },
  {
    title: '核心属性',
    key: 'isCore',
    width: 80,
    render: row => (row.isCore ? '是' : '否')
  },
  {
    title: '描述',
    key: 'description',
    minWidth: 150,
    render: row => row.description || '无描述'
  },
  {
    title: '默认值',
    key: 'defaultValue',
    width: 120,
    render: row => {
      const value = row.defaultValue
      if (value === undefined || value === null) return '无'
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
  }
]

// 事件处理
const handleInteractionChange = (configs: InteractionConfig[]) => {
  console.log('[PropertyExposureTest] 交互配置变化:', configs)
}

// 刷新注册表状态
const refreshRegistryStatus = () => {
  const oldTypes = [...registeredComponentTypes.value]
  registeredComponentTypes.value = propertyExposureRegistry.getAllComponentTypes()

  console.log('[PropertyExposureTest] 注册表状态刷新:', {
    previous: oldTypes,
    current: registeredComponentTypes.value,
    added: registeredComponentTypes.value.filter(t => !oldTypes.includes(t)),
    removed: oldTypes.filter(t => !registeredComponentTypes.value.includes(t))
  })

  // 输出每个组件的详细属性信息
  registeredComponentTypes.value.forEach(type => {
    const exposure = propertyExposureRegistry.getComponentExposure(type)
    console.log(`[PropertyExposureTest] ${type} 属性详情:`, {
      componentName: exposure?.componentName,
      propertyCount: exposure?.listenableProperties?.length || 0,
      properties: exposure?.listenableProperties?.map(p => `${p.name}(${p.type})`) || []
    })
  })
}

// 生命周期
onMounted(() => {
  console.log('[PropertyExposureTest] 页面挂载，开始监控组件注册')

  // 立即检查一次
  refreshRegistryStatus()

  // 延迟检查，确保组件已经注册
  setTimeout(() => {
    console.log('[PropertyExposureTest] 延迟检查组件注册状态')
    refreshRegistryStatus()
  }, 2000)

  // 定期刷新状态
  const interval = setInterval(refreshRegistryStatus, 3000)

  // 组件卸载时清理定时器
  // Vue 3 的 onBeforeUnmount 会自动处理
})
</script>

<style scoped>
.property-exposure-test {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.empty-state {
  padding: 16px 0;
}

.component-test-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--card-color);
}

.component-test-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 600;
}

.component-container {
  max-width: 400px;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 12px;
  background: var(--body-color);
}

.interaction-config-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--body-color);
  max-height: 600px;
  overflow-y: auto;
}

pre {
  background: var(--code-color);
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid var(--border-color);
}

/* 标签点击样式 */
.n-tag {
  transition: all 0.2s ease;
}

.n-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 滚动条样式 */
.interaction-config-container::-webkit-scrollbar {
  width: 6px;
}

.interaction-config-container::-webkit-scrollbar-track {
  background: var(--body-color);
  border-radius: 3px;
}

.interaction-config-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.interaction-config-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}
</style>
