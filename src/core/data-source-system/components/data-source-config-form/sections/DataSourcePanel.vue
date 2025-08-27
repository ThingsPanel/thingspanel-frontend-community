<!--
  数据源面板组件 - 单个数据源的配置面板
  拆分后的独立组件，用于折叠面板内容
-->
<template>
  <div class="data-source-panel">
    <!-- 数据源描述信息 -->
    <div v-if="dataSourceInfo.description" class="data-source-description">
      <n-alert type="info" size="small" :show-icon="false">
        <template #icon><span>📋</span></template>
        {{ dataSourceInfo.description }}
      </n-alert>
    </div>

    <!-- 数据源配置区域 -->
    <n-space vertical :size="20">
      <!-- rawDataList 管理区域 - 简化版本 -->
      <div class="raw-data-section">
        <div class="section-header">
          <n-space align="center" justify="space-between">
            <h4 class="section-title">
              <n-icon class="section-icon"><ServerOutline /></n-icon>
              数据项管理
            </h4>
            <n-space>
              <n-button type="success" size="small" @click="generateTestData">
                <template #icon>
                  <n-icon><CodeOutline /></n-icon>
                </template>
                生成测试数据
              </n-button>
              <n-button type="primary" size="small" @click="openAddDataModal">
                <template #icon>
                  <n-icon><AddOutline /></n-icon>
                </template>
                添加数据项
              </n-button>
            </n-space>
          </n-space>
        </div>

        <!-- 数据项列表 - 简化显示 -->
        <div v-if="dataSourceConfig.rawDataList && dataSourceConfig.rawDataList.length > 0" class="data-items-list">
          <div v-for="(item, index) in dataSourceConfig.rawDataList" :key="index" class="data-item-row">
            <div class="item-info">
              <span class="item-name">{{ item.name || `数据项 ${index + 1}` }}</span>
              <span class="item-type">{{ item.type || 'unknown' }}</span>
            </div>
            <n-space :size="8">
              <n-button size="tiny" quaternary @click="viewDataItem(index)">查看</n-button>
              <n-button size="tiny" quaternary @click="editDataItem(index)">编辑</n-button>
            </n-space>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-empty size="small" description="暂无数据项，点击上方按钮添加" />
        </div>
      </div>

      <!-- 数据源最终处理区域 -->
      <div class="final-processing-section">
        <div class="section-header">
          <h4 class="section-title">
            <n-icon class="section-icon"><CodeOutline /></n-icon>
            数据最终处理
          </h4>
        </div>

        <!-- 使用现成的 FinalDataProcessing 组件 -->
        <FinalDataProcessing
          :data-source-key="dataSourceKey"
          :data-value="dataSourceConfig"
          @update:finalProcessingType="handleFinalProcessingTypeUpdate"
          @update:finalProcessingScript="handleFinalProcessingScriptUpdate"
          @execution-result="handleExecutionResult"
        />
      </div>
    </n-space>

    <!-- 添加数据项弹窗 -->
    <AddRawDataModal v-model:visible="showAddModal" @submit="handleAddRawData" @cancel="closeAddModal" />
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源面板组件
 * 管理单个数据源的所有配置项
 */
import { computed } from 'vue'
import { ServerOutline, CodeOutline, AddOutline } from '@vicons/ionicons5'
import { ref } from 'vue'

// 导入现成的子组件
import FinalDataProcessing from './FinalDataProcessing.vue'
import AddRawDataModal from '../modals/AddRawDataModal.vue'

// 组件接口
interface Props {
  dataSourceKey: string
  dataSourceConfig: {
    rawDataList?: any[]
    finalProcessingType?: string
    finalProcessingScript?: string
  }
  dataSourceInfo: {
    label: string
    value: string
    description: string
    type: string
  }
}

interface Emits {
  'update:config': [dataSourceKey: string, config: any]
}

// Props 和 Emits
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 弹窗状态管理 ==========

// 添加数据项弹窗显示状态
const showAddModal = ref(false)

// ========== 弹窗操作方法 ==========

/**
 * 打开添加数据项弹窗
 */
const openAddDataModal = () => {
  showAddModal.value = true
}

/**
 * 关闭添加数据项弹窗
 */
const closeAddModal = () => {
  showAddModal.value = false
}

/**
 * 查看数据项详情
 */
const viewDataItem = (index: number) => {
  // TODO: 实现查看功能
  console.log('查看数据项:', index)
}

/**
 * 编辑数据项
 */
const editDataItem = (index: number) => {
  // TODO: 实现编辑功能
  console.log('编辑数据项:', index)
}

/**
 * 生成测试数据 - 创建静态测试数据
 */
const generateTestData = () => {
  console.log('🧪 [DataSourcePanel] 生成静态测试数据 for:', props.dataSourceKey)

  // 生成JSON类型测试数据项
  const testDataItem = {
    name: `${props.dataSourceKey}_JSON测试数据`,
    type: 'json',
    config: {
      jsonContent: JSON.stringify(
        {
          sensor: props.dataSourceKey,
          temperature: Math.round(20 + Math.random() * 20),
          humidity: Math.round(40 + Math.random() * 40),
          pressure: Math.round(1000 + Math.random() * 50),
          status: 'normal',
          timestamp: new Date().toISOString(),
          location: `测试区域-${props.dataSourceKey.slice(-1)}`,
          phase2Test: true,
          randomId: Math.random().toString(36).substring(2, 10)
        },
        null,
        2
      )
    },
    enabled: true
  }

  // 更新配置，添加测试数据项
  const currentRawDataList = props.dataSourceConfig.rawDataList || []
  const updatedConfig = {
    ...props.dataSourceConfig,
    rawDataList: [...currentRawDataList, testDataItem],
    // 使用简单的数组合并处理
    finalProcessingType: 'concat-array'
  }

  console.log('🚀 [DataSourcePanel] 静态测试配置已生成:', {
    dataSourceKey: props.dataSourceKey,
    testData: testDataItem.config.data,
    rawDataListLength: updatedConfig.rawDataList.length
  })

  emit('update:config', props.dataSourceKey, updatedConfig)
}

// ========== 数据更新方法 ==========

/**
 * 处理添加数据项 - 来自弹窗提交
 */
const handleAddRawData = (data: any) => {
  const currentRawDataList = props.dataSourceConfig.rawDataList || []
  const updatedConfig = {
    ...props.dataSourceConfig,
    rawDataList: [...currentRawDataList, data]
  }
  emit('update:config', props.dataSourceKey, updatedConfig)
  closeAddModal() // 关闭弹窗
}

/**
 * 处理最终处理类型更新
 */
const handleFinalProcessingTypeUpdate = (type: string) => {
  const updatedConfig = {
    ...props.dataSourceConfig,
    finalProcessingType: type
  }
  emit('update:config', props.dataSourceKey, updatedConfig)
}

/**
 * 处理最终处理脚本更新
 */
const handleFinalProcessingScriptUpdate = (script: string) => {
  const updatedConfig = {
    ...props.dataSourceConfig,
    finalProcessingScript: script
  }
  emit('update:config', props.dataSourceKey, updatedConfig)
}

/**
 * 🆕 处理执行结果 - 将数据传递给组件显示
 */
const handleExecutionResult = (eventData: any) => {
  console.log('🎯 [DataSourcePanel] 接收到执行结果事件:', eventData)
  console.log('🎯 [DataSourcePanel] 结果数据:', eventData.result)
  console.log('🎯 [DataSourcePanel] 配置信息:', eventData.config)

  // 🔥 关键：更新当前数据源配置，包含执行结果
  const updatedConfig = {
    ...props.dataSourceConfig,
    ...eventData.config,
    // 确保最终结果被正确保存
    finalResult: eventData.result,
    lastExecuted: eventData.config?.executedAt,
    status: 'executed_successfully'
  }

  console.log('🚀 [DataSourcePanel] 准备更新配置:', updatedConfig)

  // 发出配置更新事件，这将触发整个数据流链
  emit('update:config', props.dataSourceKey, updatedConfig)

  console.log('✅ [DataSourcePanel] 配置更新事件已发出')
}
</script>

<style scoped>
.data-source-panel {
  /* 面板内容样式 */
}

.data-source-description {
  margin-bottom: 16px;
}

.raw-data-section,
.final-processing-section {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--card-color);
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.section-icon {
  color: var(--primary-color);
}

/* 数据项列表样式 */
.data-items-list {
  margin-top: 12px;
}

.data-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 8px;
  background-color: var(--card-color);
  transition: all 0.2s ease;
}

.data-item-row:hover {
  border-color: var(--primary-color-suppl);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: 500;
  color: var(--text-color);
}

.item-type {
  font-size: 12px;
  color: var(--text-color-3);
}

.empty-state {
  padding: 20px;
  text-align: center;
}

/* 主题适配 */
[data-theme='dark'] .raw-data-section,
[data-theme='dark'] .final-processing-section {
  background-color: var(--card-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .section-title {
  color: var(--text-color);
}

[data-theme='dark'] .data-item-row {
  background-color: var(--card-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .data-item-row:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
}
</style>
