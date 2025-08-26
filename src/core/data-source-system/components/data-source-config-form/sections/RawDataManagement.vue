<template>
  <div class="raw-data-management">
    <!-- 标题区域 -->
    <n-space align="center" justify="space-between" class="header-section">
      <n-space align="center" :size="8">
        <n-text strong>{{ $t('dataSource.rawData.title') }}</n-text>
        <n-badge 
          v-if="dataValue?.rawDataList?.length > 0"
          :value="dataValue.rawDataList.length" 
          type="info"
          :max="99"
        />
      </n-space>
      
      <!-- 批量操作区 -->
      <n-space :size="8" v-if="dataValue?.rawDataList?.length > 0">
        <n-button 
          size="small" 
          quaternary 
          type="info"
          @click="handleSelectAll"
        >
          {{ isAllSelected ? '取消全选' : '全选' }}
        </n-button>
        <n-button 
          size="small" 
          quaternary 
          type="warning"
          :disabled="selectedItems.length === 0"
          @click="handleBatchEdit"
        >
          批量编辑 ({{ selectedItems.length }})
        </n-button>
        <n-button 
          size="small" 
          quaternary 
          type="error"
          :disabled="selectedItems.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </n-button>
      </n-space>
    </n-space>

    <n-space vertical :size="12" style="margin-top: 12px">
      <!-- 主要添加按钮 - 显著提升 -->
      <n-button 
        type="primary" 
        size="medium" 
        class="add-data-btn primary-add-btn"
        @click="emit('openAddRawDataModal', dataSourceKey)"
      >
        <template #icon>
          <n-icon size="16">
            <AddOutline />
          </n-icon>
        </template>
        {{ $t('dataSource.rawData.addDataItem') }}
      </n-button>

      <!-- 快捷添加选项 -->
      <n-space :size="8" class="quick-add-section">
        <n-text depth="3" style="font-size: 12px">快速添加:</n-text>
        <n-button-group size="small">
          <n-button 
            quaternary
            @click="handleQuickAdd('json')"
          >
            <template #icon>
              <n-icon><CodeOutline /></n-icon>
            </template>
            JSON数据
          </n-button>
          <n-button 
            quaternary
            @click="handleQuickAdd('text')"
          >
            <template #icon>
              <n-icon><DocumentTextOutline /></n-icon>
            </template>
            文本数据
          </n-button>
          <n-button 
            quaternary
            @click="handleQuickAdd('number')"
          >
            <template #icon>
              <n-icon><Calculator /></n-icon>
            </template>
            数值数据
          </n-button>
        </n-button-group>
      </n-space>

      <!-- 原始数据列表 -->
      <div v-if="dataValue?.rawDataList?.length > 0" class="raw-data-list">
        <n-space vertical :size="8" style="margin-top: 8px">
          <n-card
            v-for="rawDataItem in dataValue.rawDataList" 
            :key="rawDataItem.id" 
            class="raw-data-item-card"
            :class="{ 'selected': selectedItems.includes(rawDataItem.id) }"
            size="small"
          >
            <n-space align="center" justify="space-between">
              <!-- 左侧：选择框和信息 -->
              <n-space align="center" :size="12">
                <n-checkbox 
                  :checked="selectedItems.includes(rawDataItem.id)"
                  @update:checked="handleItemSelect(rawDataItem.id, $event)"
                />
                
                <div class="item-info">
                  <n-space align="center" :size="8">
                    <span class="raw-data-name">{{ rawDataItem.name }}</span>
                    <n-tag :type="getDataItemTypeColor(rawDataItem.type)" size="small" round>
                      {{ rawDataItem.type?.toUpperCase() || 'JSON' }}
                    </n-tag>
                  </n-space>
                  
                  <!-- 数据预览 -->
                  <n-text depth="3" style="font-size: 11px; margin-top: 2px" v-if="rawDataItem.description">
                    {{ rawDataItem.description }}
                  </n-text>
                  <n-text depth="3" style="font-size: 11px; margin-top: 2px" v-else-if="rawDataItem.value">
                    {{ truncateText(String(rawDataItem.value), 50) }}
                  </n-text>
                </div>
              </n-space>
              
              <!-- 右侧：操作按钮 -->
              <n-space :size="6">
                <n-button
                  size="tiny"
                  quaternary
                  type="info"
                  class="action-btn"
                  @click="emit('viewRawDataDetail', dataSourceKey, rawDataItem.id)"
                >
                  <template #icon>
                    <n-icon><EyeOutline /></n-icon>
                  </template>
                </n-button>
                <n-button
                  size="tiny"
                  quaternary
                  type="warning"
                  class="action-btn"
                  @click="emit('editRawData', dataSourceKey, rawDataItem.id)"
                >
                  <template #icon>
                    <n-icon><CreateOutline /></n-icon>
                  </template>
                </n-button>
                <n-button
                  size="tiny"
                  quaternary
                  type="error"
                  class="action-btn"
                  @click="emit('deleteRawData', dataSourceKey, rawDataItem.id)"
                >
                  <template #icon>
                    <n-icon><TrashOutline /></n-icon>
                  </template>
                </n-button>
              </n-space>
            </n-space>
          </n-card>
        </n-space>
      </div>
      
      <!-- 空状态提示 -->
      <n-empty 
        v-else
        size="small" 
        :description="$t('dataSource.rawData.emptyState')"
        style="margin: 24px 0;"
      >
        <template #extra>
          <n-button 
            size="small"
            type="primary"
            @click="emit('openAddRawDataModal', dataSourceKey)"
          >
            立即添加数据项
          </n-button>
        </template>
      </n-empty>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { 
  NText, 
  NSpace, 
  NButton, 
  NIcon, 
  NTag, 
  NCard, 
  NCheckbox, 
  NBadge, 
  NButtonGroup,
  NEmpty
} from 'naive-ui'
import { 
  AddOutline,
  CodeOutline,
  DocumentTextOutline,
  Calculator,
  EyeOutline,
  CreateOutline,
  TrashOutline
} from '@vicons/ionicons5'

const props = defineProps({
  dataSourceKey: {
    type: String,
    required: true
  },
  dataValue: {
    type: Object,
    required: true
  },
  getDataItemTypeColor: {
    type: Function,
    required: true
  }
})

const emit = defineEmits([
  'openAddRawDataModal', 
  'viewRawDataDetail', 
  'editRawData', 
  'deleteRawData',
  'quickAddDataItem',
  'batchEditItems',
  'batchDeleteItems'
])

const { t } = useI18n()
const message = useMessage()

// 选中的数据项
const selectedItems = ref<string[]>([])

// 计算属性
const isAllSelected = computed(() => {
  const itemsCount = props.dataValue?.rawDataList?.length || 0
  return itemsCount > 0 && selectedItems.value.length === itemsCount
})

// 工具函数
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 事件处理函数
const handleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = props.dataValue?.rawDataList?.map((item: any) => item.id) || []
  }
}

const handleItemSelect = (itemId: string, checked: boolean) => {
  if (checked) {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  } else {
    selectedItems.value = selectedItems.value.filter(id => id !== itemId)
  }
}

const handleQuickAdd = (dataType: 'json' | 'text' | 'number') => {
  emit('quickAddDataItem', props.dataSourceKey, dataType)
  message.info(`准备添加${dataType.toUpperCase()}类型数据项`)
}

const handleBatchEdit = () => {
  emit('batchEditItems', props.dataSourceKey, selectedItems.value)
  message.info(`批量编辑 ${selectedItems.value.length} 个数据项`)
}

const handleBatchDelete = () => {
  emit('batchDeleteItems', props.dataSourceKey, selectedItems.value)
}
</script>

<style scoped>
/* 容器样式 */
.raw-data-management {
  width: 100%;
}

.header-section {
  margin-bottom: 8px;
}

/* 主要添加按钮样式 */
.primary-add-btn {
  width: 100%;
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--n-box-shadow);
  transition: all 0.2s ease;
}

.primary-add-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--n-box-shadow-hover);
}

/* 快速添加区域 */
.quick-add-section {
  padding: 8px 0;
  border-top: 1px solid var(--n-border-color);
  border-bottom: 1px solid var(--n-border-color);
}

/* 原始数据列表 */
.raw-data-list {
  width: 100%;
}

.raw-data-item-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.raw-data-item-card:hover {
  border-color: var(--n-color-target);
  box-shadow: var(--n-box-shadow-hover);
}

.raw-data-item-card.selected {
  border-color: var(--n-color-primary);
  background-color: var(--n-color-primary-suppl);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.raw-data-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color);
}

.action-btn {
  width: 32px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .quick-add-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .raw-data-item-card {
    margin: 4px 0;
  }
  
  .item-info {
    min-width: 0;
    overflow: hidden;
  }
}

/* 主题适配 */
[data-theme="dark"] .raw-data-item-card {
  background-color: var(--n-color-base-card);
}

[data-theme="dark"] .primary-add-btn {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

/* 动画效果 */
.raw-data-item-card {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
