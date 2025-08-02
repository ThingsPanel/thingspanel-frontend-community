<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NInput, 
  NInputNumber, 
  NSwitch, 
  NSelect, 
  NColorPicker, 
  NCard,
  NSpace,
  NButton,
  NDivider,
  NSlider,
  NCheckboxGroup,
  NCheckbox
} from 'naive-ui'
import type { TableConfig } from './index'
import { $t } from '@/locales'

interface Props {
  config: TableConfig
}

interface Emits {
  (e: 'update:config', config: TableConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地配置状态
const localConfig = ref<TableConfig>({ ...props.config })

// 选项配置
const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

const positionOptions = [
  { label: '顶部', value: 'top' },
  { label: '底部', value: 'bottom' },
  { label: '两端', value: 'both' }
]

const timeFormatOptions = [
  { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'HH:mm:ss', value: 'HH:mm:ss' },
  { label: 'MM-DD HH:mm', value: 'MM-DD HH:mm' }
]

const sortOrderOptions = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' }
]

const timeRangeOptions = [
  { label: '最近1小时', value: 'last_1h' },
  { label: '最近6小时', value: 'last_6h' },
  { label: '最近12小时', value: 'last_12h' },
  { label: '最近24小时', value: 'last_24h' },
  { label: '最近7天', value: 'last_7d' },
  { label: '最近30天', value: 'last_30d' }
]

const aggregateFunctionOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

const exportFormatOptions = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'excel' },
  { label: 'JSON', value: 'json' }
]

// 更新配置
const updateConfig = () => {
  emit('update:config', { ...localConfig.value })
}

// 重置为默认值
const resetToDefault = () => {
  localConfig.value = {
    title: '数据表格',
    table: {
      bordered: true,
      striped: true,
      size: 'medium',
      maxHeight: 400,
      showHeader: true,
      sortable: true,
      filterable: false
    },
    pagination: {
      enabled: true,
      pageSize: 10,
      pageSizes: [10, 15, 20, 50],
      showSizePicker: true,
      showQuickJumper: false,
      position: 'bottom'
    },
    columns: {
      timeColumn: {
        show: true,
        title: '时间',
        format: 'YYYY-MM-DD HH:mm:ss',
        width: 180,
        fixed: false
      },
      dataColumns: {
        autoGenerate: true,
        defaultWidth: 120,
        numberFormat: {
          precision: 2,
          thousandsSeparator: false,
          unit: ''
        }
      }
    },
    style: {
      headerBgColor: '#f5f5f5',
      headerTextColor: '#333333',
      rowBgColor: '#ffffff',
      rowTextColor: '#333333',
      stripedColor: '#fafafa',
      borderColor: '#e0e0e0',
      fontSize: 14,
      rowHeight: 40
    },
    data: {
      timeRange: 'last_1h',
      aggregateFunction: 'avg',
      aggregateWindow: 'no_aggregate',
      maxRows: 1000,
      sortOrder: 'desc',
      sortField: 'time'
    },
    export: {
      enabled: false,
      formats: ['csv', 'excel'],
      filename: 'table_data'
    },
    autoRefresh: {
      enabled: false,
      interval: 30
    }
  }
  updateConfig()
}

// 确保配置结构完整
const ensureConfigStructure = () => {
  if (!localConfig.value.table) localConfig.value.table = {}
  if (!localConfig.value.pagination) localConfig.value.pagination = {}
  if (!localConfig.value.columns) localConfig.value.columns = {}
  if (!localConfig.value.columns.timeColumn) localConfig.value.columns.timeColumn = {}
  if (!localConfig.value.columns.dataColumns) localConfig.value.columns.dataColumns = {}
  if (!localConfig.value.columns.dataColumns.numberFormat) localConfig.value.columns.dataColumns.numberFormat = {}
  if (!localConfig.value.style) localConfig.value.style = {}
  if (!localConfig.value.data) localConfig.value.data = {}
  if (!localConfig.value.export) localConfig.value.export = {}
  if (!localConfig.value.autoRefresh) localConfig.value.autoRefresh = {}
}

ensureConfigStructure()
</script>

<template>
  <div class="table-config">
    <NForm :model="localConfig" label-placement="top" @submit.prevent>
      <!-- 基础设置 -->
      <NCard title="基础设置" size="small" class="config-section">
        <NFormItem label="组件标题">
          <NInput 
            v-model:value="localConfig.title" 
            placeholder="请输入组件标题"
            @blur="updateConfig"
          />
        </NFormItem>
      </NCard>

      <!-- 表格设置 -->
      <NCard title="表格设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="显示边框">
            <NSwitch 
              v-model:value="localConfig.table!.bordered" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="斑马纹">
            <NSwitch 
              v-model:value="localConfig.table!.striped" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="表格大小">
            <NSelect 
              v-model:value="localConfig.table!.size" 
              :options="sizeOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="最大高度">
            <NSlider 
              v-model:value="localConfig.table!.maxHeight" 
              :min="200"
              :max="800"
              :step="10"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.table!.maxHeight" 
              :min="200"
              :max="800"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="显示表头">
            <NSwitch 
              v-model:value="localConfig.table!.showHeader" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="可排序">
            <NSwitch 
              v-model:value="localConfig.table!.sortable" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="可筛选">
            <NSwitch 
              v-model:value="localConfig.table!.filterable" 
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 分页设置 -->
      <NCard title="分页设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用分页">
            <NSwitch 
              v-model:value="localConfig.pagination!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.pagination!.enabled" label="每页条数">
            <NSlider 
              v-model:value="localConfig.pagination!.pageSize" 
              :min="5"
              :max="100"
              :step="5"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.pagination!.pageSize" 
              :min="5"
              :max="100"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.pagination!.enabled" label="显示条数选择器">
            <NSwitch 
              v-model:value="localConfig.pagination!.showSizePicker" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.pagination!.enabled" label="显示快速跳转">
            <NSwitch 
              v-model:value="localConfig.pagination!.showQuickJumper" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.pagination!.enabled" label="分页位置">
            <NSelect 
              v-model:value="localConfig.pagination!.position" 
              :options="positionOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 列配置 -->
      <NCard title="列配置" size="small" class="config-section">
        <NSpace vertical>
          <!-- 时间列设置 -->
          <NDivider title-placement="left">时间列</NDivider>
          
          <NFormItem label="显示时间列">
            <NSwitch 
              v-model:value="localConfig.columns!.timeColumn!.show" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.columns!.timeColumn!.show" label="时间列标题">
            <NInput 
              v-model:value="localConfig.columns!.timeColumn!.title" 
              placeholder="时间列标题"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.columns!.timeColumn!.show" label="时间格式">
            <NSelect 
              v-model:value="localConfig.columns!.timeColumn!.format" 
              :options="timeFormatOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.columns!.timeColumn!.show" label="时间列宽度">
            <NSlider 
              v-model:value="localConfig.columns!.timeColumn!.width" 
              :min="100"
              :max="300"
              :step="10"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.columns!.timeColumn!.width" 
              :min="100"
              :max="300"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <!-- 数据列设置 -->
          <NDivider title-placement="left">数据列</NDivider>
          
          <NFormItem label="自动生成列">
            <NSwitch 
              v-model:value="localConfig.columns!.dataColumns!.autoGenerate" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.columns!.dataColumns!.autoGenerate" label="默认列宽">
            <NSlider 
              v-model:value="localConfig.columns!.dataColumns!.defaultWidth" 
              :min="80"
              :max="300"
              :step="10"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.columns!.dataColumns!.defaultWidth" 
              :min="80"
              :max="300"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.columns!.dataColumns!.autoGenerate" label="数值精度">
            <NSlider 
              v-model:value="localConfig.columns!.dataColumns!.numberFormat!.precision" 
              :min="0"
              :max="10"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.columns!.dataColumns!.numberFormat!.precision" 
              :min="0"
              :max="10"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.columns!.dataColumns!.autoGenerate" label="千分位分隔符">
            <NSwitch 
              v-model:value="localConfig.columns!.dataColumns!.numberFormat!.thousandsSeparator" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.columns!.dataColumns!.autoGenerate" label="数值单位">
            <NInput 
              v-model:value="localConfig.columns!.dataColumns!.numberFormat!.unit" 
              placeholder="数值单位"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 样式设置 -->
      <NCard title="样式设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="表头背景色">
            <NColorPicker 
              v-model:value="localConfig.style!.headerBgColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="表头文字颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.headerTextColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="行背景色">
            <NColorPicker 
              v-model:value="localConfig.style!.rowBgColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="行文字颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.rowTextColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="斑马纹颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.stripedColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="边框颜色">
            <NColorPicker 
              v-model:value="localConfig.style!.borderColor" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="字体大小">
            <NSlider 
              v-model:value="localConfig.style!.fontSize" 
              :min="10"
              :max="24"
              :step="1"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.style!.fontSize" 
              :min="10"
              :max="24"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="行高">
            <NSlider 
              v-model:value="localConfig.style!.rowHeight" 
              :min="30"
              :max="80"
              :step="5"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.style!.rowHeight" 
              :min="30"
              :max="80"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 数据设置 -->
      <NCard title="数据设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="数据时间范围">
            <NSelect 
              v-model:value="localConfig.data!.timeRange" 
              :options="timeRangeOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="聚合函数">
            <NSelect 
              v-model:value="localConfig.data!.aggregateFunction" 
              :options="aggregateFunctionOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="最大显示行数">
            <NSlider 
              v-model:value="localConfig.data!.maxRows" 
              :min="100"
              :max="10000"
              :step="100"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.data!.maxRows" 
              :min="100"
              :max="10000"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="排序方式">
            <NSelect 
              v-model:value="localConfig.data!.sortOrder" 
              :options="sortOrderOptions"
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem label="排序字段">
            <NInput 
              v-model:value="localConfig.data!.sortField" 
              placeholder="排序字段名"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 导出设置 -->
      <NCard title="导出设置" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用导出">
            <NSwitch 
              v-model:value="localConfig.export!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.export!.enabled" label="导出格式">
            <NCheckboxGroup 
              v-model:value="localConfig.export!.formats" 
              @update:value="updateConfig"
            >
              <NSpace>
                <NCheckbox value="csv" label="CSV" />
                <NCheckbox value="excel" label="Excel" />
                <NCheckbox value="json" label="JSON" />
              </NSpace>
            </NCheckboxGroup>
          </NFormItem>
          
          <NFormItem v-if="localConfig.export!.enabled" label="导出文件名">
            <NInput 
              v-model:value="localConfig.export!.filename" 
              placeholder="导出文件名"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 自动刷新设置 -->
      <NCard title="自动刷新" size="small" class="config-section">
        <NSpace vertical>
          <NFormItem label="启用自动刷新">
            <NSwitch 
              v-model:value="localConfig.autoRefresh!.enabled" 
              @update:value="updateConfig"
            />
          </NFormItem>
          
          <NFormItem v-if="localConfig.autoRefresh!.enabled" label="刷新间隔(秒)">
            <NSlider 
              v-model:value="localConfig.autoRefresh!.interval" 
              :min="5"
              :max="3600"
              :step="5"
              @update:value="updateConfig"
            />
            <NInputNumber 
              v-model:value="localConfig.autoRefresh!.interval" 
              :min="5"
              :max="3600"
              size="small"
              style="margin-top: 8px;"
              @blur="updateConfig"
            />
          </NFormItem>
        </NSpace>
      </NCard>

      <!-- 操作按钮 -->
      <NCard size="small" class="config-section">
        <NSpace justify="center">
          <NButton type="primary" @click="updateConfig">
            应用配置
          </NButton>
          <NButton @click="resetToDefault">
            重置为默认值
          </NButton>
        </NSpace>
      </NCard>
    </NForm>
  </div>
</template>

<style scoped>
.table-config {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 16px;
}

.config-section:last-child {
  margin-bottom: 0;
}

:deep(.n-card-header) {
  padding: 12px 16px;
  font-weight: 600;
}

:deep(.n-card__content) {
  padding: 16px;
}

:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.n-form-item-label) {
  font-size: 13px;
  font-weight: 500;
}

:deep(.n-divider) {
  margin: 16px 0 12px 0;
}

:deep(.n-divider .n-divider__title) {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

/* 滚动条样式 */
.table-config::-webkit-scrollbar {
  width: 6px;
}

.table-config::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.table-config::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.table-config::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>