<template>
  <div>
    <n-text strong>原始数据管理:</n-text>
    <n-space vertical :size="8" style="margin-top: 8px">
      <!-- 添加原始数据按钮 - 弹窗形式 -->
      <n-button type="dashed" size="small" class="add-data-btn" @click="emit('openAddRawDataModal', dataSourceKey)">
        <template #icon>
          <n-icon size="14">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2"></path>
            </svg>
          </n-icon>
        </template>
        添加数据项
      </n-button>

      <!-- 原始数据列表 -->
      <div v-if="dataValue?.rawDataList?.length > 0" class="raw-data-list">
        <n-text depth="3" style="font-size: 12px">原始数据列表 ({{ dataValue.rawDataList.length }} 项):</n-text>
        <n-space vertical :size="4" style="margin-top: 4px">
          <div v-for="rawDataItem in dataValue.rawDataList" :key="rawDataItem.id" class="raw-data-item-compact">
            <n-space align="center" justify="space-between">
              <n-space align="center" :size="8">
                <span class="raw-data-name">{{ rawDataItem.name }}</span>
                <!-- 🔥 新增：显示数据项类型 -->
                <n-tag :type="getDataItemTypeColor(rawDataItem.type)" size="small" round>
                  {{ rawDataItem.type?.toUpperCase() || 'JSON' }}
                </n-tag>
              </n-space>
              <n-space :size="4">
                <n-button
                  size="tiny"
                  quaternary
                  type="info"
                  class="compact-btn"
                  @click="emit('viewRawDataDetail', dataSourceKey, rawDataItem.id)"
                >
                  查看
                </n-button>
                <!-- 🔥 新增：编辑按钮 -->
                <n-button
                  size="tiny"
                  quaternary
                  type="warning"
                  class="compact-btn"
                  @click="emit('editRawData', dataSourceKey, rawDataItem.id)"
                >
                  编辑
                </n-button>
                <n-button
                  size="tiny"
                  quaternary
                  type="error"
                  class="compact-btn"
                  @click="emit('deleteRawData', dataSourceKey, rawDataItem.id)"
                >
                  删除
                </n-button>
              </n-space>
            </n-space>
          </div>
        </n-space>
      </div>
      <n-text v-else depth="3" style="font-size: 12px">暂无原始数据项</n-text>
    </n-space>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { NText, NSpace, NButton, NIcon, NTag } from 'naive-ui'

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

const emit = defineEmits(['openAddRawDataModal', 'viewRawDataDetail', 'editRawData', 'deleteRawData'])
</script>

<style scoped>
.add-data-btn {
  width: 100%;
}
.raw-data-list {
  width: 100%;
}
.raw-data-item-compact {
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.raw-data-item-compact:hover {
  background-color: var(--hover-color);
}
.raw-data-name {
  font-size: 13px;
  font-weight: 500;
}
.compact-btn {
  padding: 0 4px;
}
</style>
