<!--
  多数据源配置表单
  支持组件声明多个数据源需求，提供折叠面板+卡片式的用户界面
-->
<template>
  <div class="multi-data-source-config">
    <!-- 标题和统计信息 -->
    <div class="header">
      <div class="title">
        <n-text class="title-text">数据源配置</n-text>
        <n-tag 
          v-if="requirements"
          :type="hasRequiredDataSources ? 'success' : 'warning'"
          size="small"
          class="status-tag"
        >
          {{ configuredCount }}/{{ dataSourceCount }} 已配置
        </n-tag>
      </div>
      
      <!-- 组件信息 -->
      <div class="component-info" v-if="requirements">
        <n-text depth="3" class="component-name">
          {{ requirements.componentName }}
        </n-text>
        <n-text depth="2" class="limits">
          ({{ requirements.minDataSources }}-{{ requirements.maxDataSources }} 个数据源)
        </n-text>
      </div>
    </div>

    <!-- 数据源列表 -->
    <div class="data-sources-container" v-if="requirements">
      <n-collapse 
        :default-expanded-names="getDefaultExpandedNames()"
        accordion
      >
        <!-- 必需数据源 -->
        <n-collapse-item 
          v-for="requirement in requiredDataSources"
          :key="requirement.id"
          :name="requirement.id"
          class="data-source-item required"
        >
          <template #header>
            <DataSourceCardHeader 
              :requirement="requirement"
              :config="dataSourceConfigs[requirement.id]"
              :is-required="true"
            />
          </template>
          
          <DataSourceConfigPanel
            :requirement="requirement" 
            :config="dataSourceConfigs[requirement.id]"
            @update="handleDataSourceUpdate"
            @data-change="handleDataChange"
          />
        </n-collapse-item>

        <!-- 可选数据源 -->
        <n-collapse-item 
          v-for="requirement in optionalDataSources"
          :key="requirement.id"
          :name="requirement.id"
          class="data-source-item optional"
        >
          <template #header>
            <DataSourceCardHeader 
              :requirement="requirement"
              :config="dataSourceConfigs[requirement.id]"
              :is-required="false"
              @remove="handleRemoveDataSource"
            />
          </template>
          
          <DataSourceConfigPanel
            :requirement="requirement"
            :config="dataSourceConfigs[requirement.id]" 
            @update="handleDataSourceUpdate"
            @data-change="handleDataChange"
          />
        </n-collapse-item>
      </n-collapse>

      <!-- 添加数据源按钮 -->
      <div class="add-data-source-section" v-if="canAddMoreDataSources">
        <n-dropdown 
          :options="availableDataSourceOptions"
          @select="handleAddDataSource"
        >
          <n-button 
            dashed 
            block 
            class="add-button"
            :disabled="!canAddMoreDataSources"
          >
            <template #icon>
              <n-icon><PlusOutlined /></n-icon>
            </template>
            添加数据源 ({{ remainingSlots }} 个可用)
          </n-button>
        </n-dropdown>
      </div>

      <!-- 验证提示 -->
      <div class="validation-messages" v-if="validationResult && !validationResult.isValid">
        <n-alert 
          type="error" 
          :title="`配置验证失败 (${validationResult.errors.length} 个错误)`"
          class="validation-alert"
        >
          <ul class="error-list">
            <li v-for="error in validationResult.errors" :key="error">
              {{ error }}
            </li>
          </ul>
        </n-alert>
        
        <n-alert 
          v-if="validationResult.warnings.length > 0"
          type="warning"
          :title="`${validationResult.warnings.length} 个警告`"
          class="validation-alert"
        >
          <ul class="warning-list">
            <li v-for="warning in validationResult.warnings" :key="warning">
              {{ warning }}
            </li>
          </ul>
        </n-alert>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-state" v-else>
      <n-spin size="large">
        <div class="loading-content">
          <n-text>正在加载组件数据需求...</n-text>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  NCollapse, NCollapseItem, NButton, NDropdown, NTag, NText, 
  NAlert, NIcon, NSpin, useMessage 
} from 'naive-ui'
import { PlusOutlined } from '@vicons/antd'
import type {
  ComponentDataRequirements,
  DataSourceRequirement,
  DataSourceConfig,
  DataSourceValidationResult
} from '@/components/visual-editor/core/multi-data-source-types'
import { MultiDataSourceManager } from '@/components/visual-editor/core/MultiDataSourceManager'
import { getComponentDataRequirements } from '@/components/visual-editor/core/component-data-requirements'
import DataSourceCardHeader from './components/DataSourceCardHeader.vue'
import DataSourceConfigPanel from './components/DataSourceConfigPanel.vue'

// Props
interface Props {
  /** 当前选中的组件 */
  widget?: any
  /** 组件ID，用于获取数据需求 */
  componentId?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'data-updated': [data: { [key: string]: any }]
  'config-changed': [config: any]
}>()

// 响应式状态
const message = useMessage()
const multiDataSourceManager = ref<MultiDataSourceManager>()
const requirements = ref<ComponentDataRequirements>()
const dataSourceConfigs = ref<Record<string, DataSourceConfig>>({})
const validationResult = ref<DataSourceValidationResult>()
const isInitialized = ref(false)

// 计算属性
const requiredDataSources = computed(() => {
  return requirements.value?.dataSources.filter(ds => ds.required) || []
})

const optionalDataSources = computed(() => {
  return requirements.value?.dataSources.filter(ds => !ds.required) || []
})

const dataSourceCount = computed(() => {
  return Object.keys(dataSourceConfigs.value).length
})

const configuredCount = computed(() => {
  return Object.values(dataSourceConfigs.value)
    .filter(config => config.status === 'configured').length
})

const hasRequiredDataSources = computed(() => {
  return requiredDataSources.value.every(req => {
    const config = dataSourceConfigs.value[req.id]
    return config && config.enabled && config.status === 'configured'
  })
})

const canAddMoreDataSources = computed(() => {
  if (!requirements.value) return false
  return dataSourceCount.value < requirements.value.maxDataSources
})

const remainingSlots = computed(() => {
  if (!requirements.value) return 0
  return requirements.value.maxDataSources - dataSourceCount.value
})

const availableDataSourceOptions = computed(() => {
  if (!requirements.value) return []
  
  const existingIds = new Set(Object.keys(dataSourceConfigs.value))
  const available = requirements.value.dataSources.filter(req => 
    !req.required && !existingIds.has(req.id)
  )
  
  return available.map(req => ({
    label: req.label,
    key: req.id,
    props: {
      requirement: req
    }
  }))
})

// 获取默认展开的面板名称
const getDefaultExpandedNames = () => {
  // 默认展开第一个必需数据源或第一个数据源
  if (requiredDataSources.value.length > 0) {
    return [requiredDataSources.value[0].id]
  }
  if (requirements.value?.dataSources && requirements.value.dataSources.length > 0) {
    return [requirements.value.dataSources[0].id]
  }
  return []
}

// 初始化多数据源管理器
const initializeManager = async () => {
  if (!props.widget && !props.componentId) {
    console.warn('⚠️ [MultiDataSourceConfigForm] 缺少组件信息')
    return
  }

  const componentId = props.componentId || props.widget?.type || 'unknown'
  console.log('🔧 [MultiDataSourceConfigForm] 初始化多数据源管理器:', componentId)

  // 获取组件数据需求
  const componentRequirements = getComponentDataRequirements(componentId)
  if (!componentRequirements) {
    console.warn(`⚠️ [MultiDataSourceConfigForm] 组件 ${componentId} 没有声明数据需求`)
    return
  }

  requirements.value = componentRequirements
  
  // 创建并初始化管理器
  const manager = new MultiDataSourceManager()
  await manager.initialize(componentRequirements)
  
  multiDataSourceManager.value = manager
  
  // 获取初始配置
  dataSourceConfigs.value = manager.getAllDataSources()
  
  // 监听管理器更新
  manager.onUpdate((event) => {
    console.log('📡 [MultiDataSourceConfigForm] 管理器更新事件:', event)
    dataSourceConfigs.value = manager.getAllDataSources()
    validateConfiguration()
    emitDataUpdate()
  })
  
  isInitialized.value = true
  validateConfiguration()
  
  console.log('✅ [MultiDataSourceConfigForm] 初始化完成')
}

// 处理数据源更新
const handleDataSourceUpdate = async (dataSourceId: string, updates: Partial<DataSourceConfig>) => {
  if (!multiDataSourceManager.value) return
  
  try {
    await multiDataSourceManager.value.updateDataSource(dataSourceId, updates)
    message.success(`数据源 ${dataSourceId} 更新成功`)
  } catch (error) {
    console.error('数据源更新失败:', error)
    message.error(`数据源更新失败: ${error}`)
  }
}

// 处理数据变更
const handleDataChange = async (dataSourceId: string, data: any) => {
  if (!multiDataSourceManager.value) return
  
  try {
    await multiDataSourceManager.value.updateDataSourceData(dataSourceId, data)
    console.log(`📊 [MultiDataSourceConfigForm] 数据源 ${dataSourceId} 数据已更新`)
  } catch (error) {
    console.error('数据源数据更新失败:', error)
    message.error(`数据更新失败: ${error}`)
  }
}

// 处理添加数据源
const handleAddDataSource = async (key: string, option: any) => {
  if (!multiDataSourceManager.value) return
  
  const requirement = option.props.requirement as DataSourceRequirement
  
  try {
    await multiDataSourceManager.value.addDataSource(requirement)
    message.success(`数据源 ${requirement.label} 添加成功`)
  } catch (error) {
    console.error('添加数据源失败:', error)
    message.error(`添加数据源失败: ${error}`)
  }
}

// 处理移除数据源
const handleRemoveDataSource = async (dataSourceId: string) => {
  if (!multiDataSourceManager.value) return
  
  try {
    await multiDataSourceManager.value.removeDataSource(dataSourceId)
    message.success(`数据源已移除`)
  } catch (error) {
    console.error('移除数据源失败:', error)
    message.error(`移除数据源失败: ${error}`)
  }
}

// 验证配置
const validateConfiguration = () => {
  if (!multiDataSourceManager.value) return
  
  validationResult.value = multiDataSourceManager.value.validateConfiguration()
}

// 发射数据更新事件
const emitDataUpdate = () => {
  if (!multiDataSourceManager.value) return
  
  const allData = multiDataSourceManager.value.getAllDataSources()
  const boundData: { [key: string]: any } = {}
  
  // 收集所有数据源的数据
  Object.entries(allData).forEach(([id, config]) => {
    if (config.data) {
      boundData[id] = config.data
    }
  })
  
  emit('data-updated', boundData)
  emit('config-changed', multiDataSourceManager.value.getFullConfiguration())
}

// 监听属性变化
watch(
  () => [props.widget, props.componentId],
  () => {
    initializeManager()
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  console.log('🔧 [MultiDataSourceConfigForm] 组件挂载')
})

onUnmounted(() => {
  if (multiDataSourceManager.value) {
    multiDataSourceManager.value.cleanup()
  }
  console.log('🧹 [MultiDataSourceConfigForm] 组件卸载，资源已清理')
})
</script>

<style scoped>
.multi-data-source-config {
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
}

.header {
  margin-bottom: 16px;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
}

.status-tag {
  font-size: 12px;
}

.component-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.component-name {
  font-size: 14px;
}

.limits {
  font-size: 12px;
}

.data-sources-container {
  margin-bottom: 16px;
}

.data-source-item {
  margin-bottom: 8px;
}

.data-source-item.required {
  border-left: 3px solid var(--success-color);
}

.data-source-item.optional {
  border-left: 3px solid var(--warning-color);
}

.add-data-source-section {
  margin-top: 16px;
}

.add-button {
  border: 2px dashed var(--border-color);
  transition: all 0.2s ease;
}

.add-button:hover {
  border-color: var(--primary-color);
}

.validation-messages {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validation-alert {
  font-size: 14px;
}

.error-list,
.warning-list {
  margin: 8px 0 0 16px;
  padding: 0;
}

.error-list li,
.warning-list li {
  margin-bottom: 4px;
  font-size: 13px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.loading-content {
  text-align: center;
  margin-top: 16px;
}

/* 深色主题适配 */
[data-theme="dark"] .add-button {
  border-color: var(--border-color-dark);
}

[data-theme="dark"] .add-button:hover {
  border-color: var(--primary-color);
}
</style>