<template>
  <div class="data-requirements-display">
    <!-- 组件信息头部 -->
    <div v-if="requirements" class="component-info">
      <div class="info-header">
        <n-icon size="16" class="info-icon">
          <DocumentTextOutline />
        </n-icon>
        <span class="info-title">数据需求</span>
      </div>
      
      <div class="component-details">
        <div class="detail-item">
          <span class="detail-label">组件名称：</span>
          <n-text class="detail-value">{{ requirements.componentName || requirements.componentId }}</n-text>
        </div>
        <div class="detail-item">
          <span class="detail-label">组件ID：</span>
          <n-text depth="3" class="detail-value">{{ requirements.componentId }}</n-text>
        </div>
      </div>
    </div>

    <!-- 数据源需求列表 -->
    <div v-if="requirements && requirements.dataSources.length > 0" class="data-sources-section">
      <div class="section-header">
        <n-text class="section-title">数据源需求 ({{ requirements.dataSources.length }}个)</n-text>
        <n-tag size="small" :type="limitsTagType">
          {{ requirements.minDataSources }}-{{ requirements.maxDataSources }}个
        </n-tag>
      </div>

      <div class="data-sources-list">
        <div v-for="(dataSource, index) in requirements.dataSources" :key="dataSource.id" class="data-source-item">
          <!-- 数据源基本信息 -->
          <div class="data-source-header">
            <div class="data-source-title">
              <n-icon size="14" class="data-source-icon">
                <ServerOutline />
              </n-icon>
              <span class="data-source-label">{{ dataSource.name || dataSource.label }}</span>
              <n-tag v-if="dataSource.required" type="warning" size="small" round>
                必需
              </n-tag>
            </div>
            <n-text depth="3" class="data-source-type">{{ dataSource.type }}</n-text>
          </div>

          <!-- 数据源详细信息 -->
          <div v-if="dataSource.description || dataSource.usage" class="data-source-details">
            <div v-if="dataSource.description" class="detail-row">
              <span class="detail-key">描述：</span>
              <n-text depth="2" class="detail-content">{{ dataSource.description }}</n-text>
            </div>
            <div v-if="dataSource.usage" class="detail-row">
              <span class="detail-key">用途：</span>
              <n-text depth="2" class="detail-content">{{ dataSource.usage }}</n-text>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无需求状态 -->
    <div v-else class="no-requirements">
      <n-empty size="small" description="该组件未声明数据源需求">
        <template #icon>
          <DocumentOutline />
        </template>
        <template #extra>
          <n-text depth="3" class="hint-text">
            Card2.1组件可以通过声明数据需求来描述所需的数据结构
          </n-text>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据需求显示组件
 * 用于在设置面板中显示组件声明的数据源需求信息
 * 纯展示组件，不涉及任何数据源配置功能
 */

import { computed } from 'vue'
import { NIcon, NText, NTag, NEmpty } from 'naive-ui'
import { DocumentTextOutline, DocumentOutline, ServerOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { getComponentDataRequirements } from '../../core/component-data-requirements'
import type { VisualEditorWidget } from '../../types'

// 定义组件属性
interface Props {
  /** 选中的组件 */
  selectedWidget: VisualEditorWidget | null
}

const props = defineProps<Props>()

// 国际化集成
const { t } = useI18n()

// 获取组件数据需求
const requirements = computed(() => {
  if (!props.selectedWidget) return null
  
  // 获取组件的数据需求声明
  const componentId = props.selectedWidget.type
  const dataRequirements = getComponentDataRequirements(componentId)
  
  console.log('🔍 [DataRequirementsDisplay] 获取组件数据需求:', {
    componentId,
    requirements: dataRequirements
  })
  
  return dataRequirements
})

// 数量限制标签类型
const limitsTagType = computed(() => {
  if (!requirements.value) return 'default'
  
  const { minDataSources, maxDataSources } = requirements.value
  
  if (minDataSources === maxDataSources) {
    return 'info' // 固定数量
  } else if (minDataSources === 0) {
    return 'success' // 可选
  } else {
    return 'warning' // 有最小要求
  }
})
</script>

<style scoped>
.data-requirements-display {
  padding: 0;
  color: var(--text-color);
}

/* === 组件信息区域 === */
.component-info {
  padding: 12px;
  background: var(--info-color-suppl);
  border-radius: 6px;
  margin-bottom: 16px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.info-icon {
  color: var(--info-color);
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.component-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.detail-label {
  color: var(--text-color-2);
  font-weight: 500;
  flex-shrink: 0;
}

.detail-value {
  font-family: monospace;
  font-size: 11px;
}

/* === 数据源需求区域 === */
.data-sources-section {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.data-sources-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* === 数据源项样式 === */
.data-source-item {
  padding: 10px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.data-source-item:hover {
  border-color: var(--primary-color-suppl);
  background: var(--hover-color);
}

.data-source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.data-source-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.data-source-icon {
  color: var(--primary-color);
  flex-shrink: 0;
}

.data-source-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.data-source-type {
  font-size: 11px;
  font-family: monospace;
  background: var(--code-color);
  padding: 2px 6px;
  border-radius: 3px;
}

/* === 详细信息区域 === */
.data-source-details {
  padding-top: 6px;
  border-top: 1px solid var(--divider-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
}

.detail-key {
  color: var(--text-color-2);
  font-weight: 500;
  flex-shrink: 0;
  min-width: 35px;
}

.detail-content {
  line-height: 1.4;
  word-break: break-word;
}

/* === 空状态样式 === */
.no-requirements {
  padding: 20px 0;
  text-align: center;
}

.hint-text {
  font-size: 11px;
  line-height: 1.4;
  max-width: 200px;
  margin: 0 auto;
  margin-top: 8px;
}

/* === 响应式设计 === */
@media (max-width: 320px) {
  .data-source-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 2px;
  }
  
  .detail-key {
    min-width: auto;
  }
}

/* === 主题适配 === */
[data-theme="dark"] .data-source-item {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme="dark"] .data-source-item:hover {
  border-color: var(--primary-color-suppl-dark);
  background: var(--hover-color-dark);
}
</style>