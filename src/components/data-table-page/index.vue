<script lang="tsx" setup>
import type { VNode, VueElement } from 'vue'
import { computed, defineProps, ref, watchEffect, onMounted, onUnmounted } from 'vue'
import _ from 'lodash'
import {
  NButton,
  NDataTable,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NIcon,
  NInput,
  NSelect,
  NPagination,
  NSpin,
  NTag
} from 'naive-ui'
import type { TreeSelectOption } from 'naive-ui'
import { useLoading } from '@sa/hooks'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import { createLogger } from '@/utils/logger'
import { getDemoServerUrl } from '@/utils/common/tool'
import { FilterOutline } from '@vicons/ionicons5'
import AdvancedListLayout from '@/components/list-page/index.vue'
import TencentMap from './modules/tencent-map.vue'
import DevCardItem from '@/components/dev-card-item/index.vue'
import CardGrid from '@/components/card-grid/index.vue'
import { tableThemeOverrides } from '@/utils/table-theme'

// 新增 DeviceItem 接口定义
interface DeviceItem {
  id: string
  device_number: string
  name: string
  device_config_id: string
  device_config_name: string
  ts: string | null
  activate_flag: string
  activate_at: string | null
  batch_number: string
  current_version: string
  created_at: string
  is_online: 0 | 1
  location: string
  access_way: string
  protocol_type: string
  device_status: number
  warn_status: string // 例如 'N' 表示正常, 'Y' 表示告警
  device_type: string
  image_url?: string
  // 根据实际情况可以添加更多字段
  title?: string // DevCardItem 可能用到的备用字段
  description?: string // DevCardItem 可能用到的备用字段
  status?: string | number // DevCardItem 可能用到的备用字段
  value?: string // DevCardItem 可能用到的备用字段
  indicator?: string // DevCardItem 可能用到的备用字段
  timestamp?: string // DevCardItem 可能用到的备用字段
  updatedAt?: string // DevCardItem 可能用到的备用字段
  key?: string // DevCardItem 可能用到的备用字段
}

// These parameter names document the callback contract; the ESLint rules do not inspect type-only signatures correctly.
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
type FetchData = (params: Record<string, any>) => Promise<any>
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
type RowClick = (row: DeviceItem) => void

const logger = createLogger('TablePage')

// 定义搜索配置项的类型，支持多种输入类型：纯文本、日期选择器、日期范围选择器、下拉选择和树形选择器
export type theLabel = string | (() => string) | undefined
export type SearchConfig =
  | {
      key: string
      label: string
      type: 'input' | 'date' | 'date-range'
      initValue?: any
    }
  | {
      key: string
      label: string
      type: 'select'
      renderLabel?: any
      renderTag?: any
      initValue?: any
      extendParams?: object
      options: { label: theLabel; value: any }[]
      labelField?: string
      valueField?: string
      loadOptions?: () => Promise<{ label: theLabel; value: any }[]>
    }
  | {
      key: string
      label: string
      type: 'tree-select'
      initValue?: any
      options: TreeSelectOption[]
      multiple: boolean
      loadOptions?: () => Promise<TreeSelectOption[]>
    }

// 通过props从父组件接收参数
const props = defineProps<{
  fetchData: FetchData // 数据获取函数
  columnsToShow: // 表格列配置
  | {
        key: string
        label: theLabel
        render?: () => VueElement | string | undefined // 自定义渲染函数
      }[]
    | 'all' // 特殊值'all'表示显示所有列
  searchConfigs: SearchConfig[] // 搜索配置数组
  tableActions: Array<{
    // 表格行操作
    theKey?: string // 操作键
    label: theLabel // 按钮文本
    callback: any // 点击回调
  }>
  topActions: { element: () => VNode }[] // 顶部操作组件列表
  pageTitle?: string
  pageCountLabel?: string
  rowClick?: RowClick // 表格行点击回调
  initPage?: number
  initPageSize?: number
  primarySearchKeys?: string[] // 主筛选栏中保留的高频筛选项
}>()

const emit = defineEmits<{
  reset: []
}>()

const { loading, startLoading, endLoading } = useLoading()
// 解构props以简化访问
const { fetchData, columnsToShow, searchConfigs }: any = props

const dataList = ref<DeviceItem[]>([]) // 为 dataList 指定类型
const total = ref(0) // 数据总数
const currentPage = ref(props.initPage || 1) // 当前页码
const pageSize = ref(props.initPageSize || 10) // 每页显示数量
const searchCriteria: any = ref(Object.fromEntries(searchConfigs.map(item => [item.key, item.initValue]))) // 搜索条件
const tableScrollX = 920
const advancedFilterVisible = ref(false)

const primaryFilterKeys = computed(() =>
  props.primarySearchKeys?.length ? props.primarySearchKeys : searchConfigs.map(item => item.key)
)

const primarySearchConfigs = computed(() =>
  primaryFilterKeys.value.map(key => searchConfigs.find(config => config.key === key)).filter(Boolean)
)

const advancedSearchConfigs = computed(() =>
  searchConfigs.filter(config => !primaryFilterKeys.value.includes(config.key))
)

const getSearchLabel = (config: any) => {
  if (!config?.label) return config?.key || ''
  return typeof config.label === 'function' ? config.label() : $t(config.label)
}

const getOptionLabel = (option: any) => {
  if (!option) return ''
  if (typeof option.label === 'function') return option.label()
  return option.label ?? option.name ?? option.key ?? option.value ?? ''
}

const findOption = (options: any[] = [], value: any): any => {
  for (const option of options) {
    if (option.value === value || option.key === value || option.id === value) return option
    if (option.children) {
      const nestedOption = findOption(option.children, value)
      if (nestedOption) return nestedOption
    }
  }
  return undefined
}

const isFilterActive = (config: any) => {
  const value = searchCriteria.value[config.key]
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
}

const getFilterDisplayValue = (config: any) => {
  const value = searchCriteria.value[config.key]
  if (Array.isArray(value)) {
    return value.map(item => getOptionLabel(findOption(config.options, item)) || item).join(', ')
  }
  return getOptionLabel(findOption(config.options, value)) || String(value)
}

const activeFilters = computed(() =>
  searchConfigs
    .filter(config => isFilterActive(config))
    .map(config => ({
      key: config.key,
      text: `${getSearchLabel(config)}: ${getFilterDisplayValue(config)}`
    }))
)

const activeAdvancedFilterCount = computed(
  () => advancedSearchConfigs.value.filter(config => isFilterActive(config)).length
)
// 添加当前视图状态管理
const currentViewType = ref('list') // 默认为列表视图

// 添加图片URL相关变量
const demoUrl = getDemoServerUrl()
const url = ref(demoUrl)

// 获取数据的函数，结合搜索条件、分页等
const getData = async () => {
  // 处理搜索条件，特别是将日期对象转换为字符串
  startLoading()
  const processedSearchCriteria = Object.fromEntries(
    Object.entries(searchCriteria.value).map(([key, value]) => {
      if (value && Array.isArray(value)) {
        // 处理日期范围
        return [key, value.map(v => (v instanceof Date ? v.toISOString() : v))]
      }
      // 单一日期处理
      return [key, value instanceof Date ? value.toISOString() : value]
    })
  )
  // 调用提供的fetchData函数获取数据

  const response = await fetchData({
    page: currentPage.value,
    page_size: pageSize.value,
    ...processedSearchCriteria
  })
  // 处理响应
  if (!response.error) {
    dataList.value = response.data.list
    total.value = response.data.total
  } else {
    logger.error({ 'Error fetching data:': response.error })
  }
  endLoading()
}

// 使用计算属性动态生成表格的列配置
const generatedColumns = computed(() => {
  let columns

  if (dataList.value.length > 0) {
    // 根据columnsToShow生成列配置
    columns = (columnsToShow === 'all' ? Object.keys(dataList.value[0]) : columnsToShow).map(item => {
      if (item.render) {
        // 使用自定义的render函数渲染列
        return {
          ...item,
          title: item.label,
          key: item.key,
          render: row => item.render(row)
        }
      }
      return {
        ...item,
        title: item.label,
        key: item.key,
        render: row => {
          if (item.key === 'ts' && row[item.key]) {
            return formatDateTime(row[item.key])
          }
          return <>{row[item.key]}</>
        }
      }
    })
  }

  return columns || []
})

// 更新页码或页面大小时重新获取数据
const onUpdatePage = newPage => {
  currentPage.value = newPage
  getData() // 更新数据
}
const onUpdatePageSize = newPageSize => {
  pageSize.value = newPageSize
  currentPage.value = 1 // 重置为第一页
  getData() // 更新数据
}

// 观察搜索条件的变化以更新扩展参数，不自动获取数据
watchEffect(() => {
  searchConfigs.map((item: any) => {
    const vals = searchCriteria.value[item.key]
    if (item?.extendParams && vals) {
      item?.options.map(oitem => {
        if (oitem.dict_value + oitem.device_type === vals) {
          item?.extendParams.map(eitem => {
            searchCriteria.value[eitem.label] = oitem[eitem.value]
          })
        }
      })
    }
  })
})

// 搜索和重置按钮的逻辑
const handleSearch = () => {
  currentPage.value = 1 // 搜索时重置到第一页
  getData()
}

const resetSearchConfig = (config: any) => {
  if (config.type === 'date-range') {
    searchCriteria.value[config.key] = []
  } else if (config.type === 'tree-select') {
    searchCriteria.value[config.key] = config.multiple ? [] : null
  } else if (config.type === 'select') {
    searchCriteria.value[config.key] = null
  } else {
    searchCriteria.value[config.key] = ''
  }
}

const handleReset = () => {
  // 重置搜索条件为初始值
  Object.keys(searchCriteria.value).forEach(key => {
    const config = searchConfigs.find(item => item.key === key)
    if (config) {
      resetSearchConfig(config)
    }
  })

  emit('reset')
  handleSearch() // 重置后重新获取数据
}

const handleAdvancedReset = () => {
  advancedSearchConfigs.value.forEach(config => resetSearchConfig(config))
  handleSearch()
}

const handleClearFilter = (key: string) => {
  const config = searchConfigs.find(item => item.key === key)
  if (!config) return
  resetSearchConfig(config)
  handleSearch()
}

const handleAdvancedApply = () => {
  advancedFilterVisible.value = false
  handleSearch()
}

// 强制更新指定参数并刷新数据
const forceChangeParamsByKey = (params: Record<string, any>) => {
  Object.entries(params).forEach(([key, value]) => {
    if (key in searchCriteria.value) {
      searchCriteria.value[key] = value
    }
  })
  getData()
}

// 暴露方法给父组件
defineExpose({
  handleSearch,
  handleReset,
  forceChangeParamsByKey,
  dataList // 暴露dataList以便父组件能够直接更新数据
})

// 更新树形选择器的选项
const handleTreeSelectUpdate = (value, key) => {
  currentPage.value = 1
  searchCriteria.value[key] = value
  getData()
}

// 用于加载动态选项的函数，适用于select和tree-select类型的搜索配置
const loadOptionsOnMount = async pattern => {
  for (const config of searchConfigs) {
    if (config.type === 'select' && config.loadOptions) {
      const opts = await config.loadOptions(pattern)
      config.options = [...config.options, ...opts]
    }
  }
}

const rowProps = row => {
  if (props && props.rowClick) {
    return {
      style: 'cursor: pointer;',
      onClick: () => {
        props.rowClick && props.rowClick(row)
      }
    }
  }
  return {}
}

const rowKey = (row: DeviceItem) => row.id

const loadOptionsOnMount2 = async () => {
  for (const config of searchConfigs) {
    if (config.type === 'tree-select' && config.loadOptions) {
      const opts = await config.loadOptions()
      config.options = [...config.options, ...opts]
    }
  }
}

// 在组件挂载时加载选项
loadOptionsOnMount('')
loadOptionsOnMount2()

onMounted(() => {
  getData()
})

const debouncedInputSearch = _.debounce(() => {
  currentPage.value = 1
  getData()
}, 400)

const handleInputChange = () => {
  debouncedInputSearch()
}

const handleSelectChange = () => {
  currentPage.value = 1
  getData()
}

onUnmounted(() => {
  debouncedInputSearch.cancel()
})

// 修复 NSelect 的 filter 函数类型错误
const filterSelectOption = (pattern: string, option: any) => {
  const label = typeof option.label === 'string' ? option.label : ''
  return label.includes(pattern)
}

// AdvancedListLayout 事件处理
const handleLayoutQuery = () => {
  handleSearch()
}

const handleLayoutReset = () => {
  handleReset()
}

const handleAddNew = () => {
  // 触发新建事件，由父组件或第一个 topAction 处理
}

const handleViewChange = ({ viewType }: { viewType: string }) => {
  // 更新当前视图类型
  currentViewType.value = viewType
}

const handleRefresh = () => {
  getData()
}

// 导入SvgIcon组件，使用项目标准图标系统
import SvgIcon from '@/components/custom/svg-icon.vue'

// 设备类型到图标名称的映射 (使用项目标准图标系统)
const deviceTypeIcons = {
  '1': 'direct', // 直连设备图标
  '2': 'gateway', // 网关图标
  '3': 'subdevice', // 网关子设备图标
  default: 'defaultdevice' // 默认设备图标
}

// 获取设备图标名称的函数，针对"默认配置"使用直连设备图标
const getDeviceIconName = (deviceType: string, deviceConfigName?: string): string => {
  // 当配置是默认配置时，强制使用直连设备图标
  if (!deviceConfigName || deviceConfigName === '默认配置') {
    return deviceTypeIcons['1'] // 直连设备图标
  }
  return deviceTypeIcons[deviceType] || deviceTypeIcons.default
}

const getDeviceTypeLabel = (deviceType: string): string => {
  if (deviceType === '1') return $t('custom.devicePage.directConnectedDevices')
  if (deviceType === '2') return $t('custom.devicePage.gateway')
  if (deviceType === '3') return $t('custom.devicePage.gatewaySubEquipment')
  return $t('generate.device-type')
}

// 获取配置图片URL的函数
const getConfigImageUrl = (imagePath: string | undefined): string => {
  logger.info('imagePath:', imagePath)
  if (!imagePath) return '' // 返回空字符串，让模板使用默认图标
  const relativePath = imagePath.replace(/^\.?\//, '')
  return `${url.value.replace('api/v1', '') + relativePath}`
}

// 导入图标组件（修复图标显示问题）
import { ListOutline, MapOutline, GridOutline as CardIcon } from '@vicons/ionicons5'

// 定义可用视图，修复图标引用
const availableViews = [
  { key: 'card', icon: CardIcon, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' },
  { key: 'map', icon: MapOutline, label: 'common.viewMap' }
]
const formSize = ref(undefined)
</script>

<template>
  <AdvancedListLayout
    :initial-view="'card'"
    :available-views="availableViews"
    :inline-header="true"
    :stacked-header="true"
    :show-query-button="false"
    :show-reset-button="false"
    :show-add-button="false"
    @query="handleLayoutQuery"
    @reset="handleLayoutReset"
    @add-new="handleAddNew"
    @view-change="handleViewChange"
    @refresh="handleRefresh"
  >
    <!-- 内容区头部：标题独占一行，下面是完整工具栏 -->
    <template #header-title>
      <div class="data-table-page-header">
        <div class="data-table-page-header__title">
          <h2>{{ props.pageTitle }}</h2>
          <span>{{ total }} {{ props.pageCountLabel || '条' }}</span>
        </div>
      </div>
    </template>

    <template #search-form-content>
      <div class="device-filter-area">
        <div class="device-filter-toolbar">
          <div class="device-filter-primary-actions">
            <slot name="header-left-before" />
            <component :is="action.element" v-for="(action, index) in topActions" :key="index"></component>
            <slot name="search-toolbar-before" />
          </div>

          <div
            v-for="config in primarySearchConfigs"
            :key="config.key"
            class="device-filter-field"
            :class="{ 'device-filter-field--search': config.key === 'search' }"
          >
            <template v-if="config.type === 'input'">
              <NInput
                v-model:value="searchCriteria[config.key]"
                :size="formSize"
                :placeholder="$t(config.label)"
                class="input-style"
                @update:value="handleInputChange"
              />
            </template>
            <template v-else-if="config.type === 'date-range'">
              <NDatePicker
                v-model:value="searchCriteria[config.key]"
                :size="formSize"
                type="daterange"
                :placeholder="$t(config.label)"
                class="input-style"
              />
            </template>
            <template v-else-if="config.type === 'select'">
              <NSelect
                v-model:value="searchCriteria[config.key]"
                :value-field="config.valueField"
                :label-field="config.labelField"
                :size="formSize"
                filterable
                :filter="filterSelectOption"
                :options="config.options"
                :render-label="config.renderLabel"
                :render-tag="config.renderTag"
                :placeholder="$t(config.label)"
                class="input-style"
                @update:value="handleSelectChange"
              />
            </template>
            <template v-else-if="config.type === 'date'">
              <NDatePicker
                v-model:value="searchCriteria[config.key]"
                :size="formSize"
                type="date"
                :placeholder="$t(config.label)"
                class="input-style"
              />
            </template>
            <template v-else-if="config.type === 'tree-select'">
              <n-tree-select
                v-model:value="searchCriteria[config.key]"
                :size="formSize"
                filterable
                :options="config.options"
                :multiple="config.multiple"
                :placeholder="$t(config.label)"
                class="input-style"
                @update:value="value => handleTreeSelectUpdate(value, config.key)"
              />
            </template>
          </div>

          <div class="device-filter-actions">
            <n-button secondary :size="formSize" @click="advancedFilterVisible = true">
              <template #icon>
                <NIcon><FilterOutline /></NIcon>
              </template>
              {{ $t('custom.devicePage.moreFilters') }}
              <span v-if="activeAdvancedFilterCount" class="device-filter-count">
                {{ activeAdvancedFilterCount }}
              </span>
            </n-button>
            <n-button quaternary :size="formSize" @click="handleReset">
              {{ $t('generate.reset') }}
            </n-button>
          </div>
        </div>

        <div v-if="activeFilters.length" class="device-active-filters">
          <span class="device-active-filters__label">{{ $t('custom.devicePage.activeFilters') }}</span>
          <NTag
            v-for="filter in activeFilters"
            :key="filter.key"
            size="small"
            closable
            type="info"
            @close="handleClearFilter(filter.key)"
          >
            {{ filter.text }}
          </NTag>
          <n-button text size="small" @click="handleReset">
            {{ $t('custom.devicePage.clearFilters') }}
          </n-button>
          <span class="device-filter-result-count">{{ total }} {{ $t('custom.devicePage.resultCount') }}</span>
        </div>
      </div>

      <NDrawer v-model:show="advancedFilterVisible" :width="380" placement="right">
        <NDrawerContent :title="$t('custom.devicePage.advancedFilters')" closable>
          <div class="advanced-filter-form">
            <div v-for="config in advancedSearchConfigs" :key="config.key" class="advanced-filter-field">
              <div class="advanced-filter-field__label">{{ getSearchLabel(config) }}</div>
              <template v-if="config.type === 'input'">
                <NInput
                  v-model:value="searchCriteria[config.key]"
                  :placeholder="$t(config.label)"
                  clearable
                  class="input-style"
                />
              </template>
              <template v-else-if="config.type === 'date-range'">
                <NDatePicker
                  v-model:value="searchCriteria[config.key]"
                  type="daterange"
                  :placeholder="$t(config.label)"
                  clearable
                  class="input-style"
                />
              </template>
              <template v-else-if="config.type === 'select'">
                <NSelect
                  v-model:value="searchCriteria[config.key]"
                  :value-field="config.valueField"
                  :label-field="config.labelField"
                  filterable
                  :filter="filterSelectOption"
                  :options="config.options"
                  :render-label="config.renderLabel"
                  :render-tag="config.renderTag"
                  :placeholder="$t(config.label)"
                  clearable
                  class="input-style"
                />
              </template>
              <template v-else-if="config.type === 'date'">
                <NDatePicker
                  v-model:value="searchCriteria[config.key]"
                  type="date"
                  :placeholder="$t(config.label)"
                  clearable
                  class="input-style"
                />
              </template>
              <template v-else-if="config.type === 'tree-select'">
                <n-tree-select
                  v-model:value="searchCriteria[config.key]"
                  filterable
                  :options="config.options"
                  :multiple="config.multiple"
                  :placeholder="$t(config.label)"
                  clearable
                  class="input-style"
                />
              </template>
            </div>
          </div>

          <template #footer>
            <div class="advanced-filter-footer">
              <n-button quaternary @click="handleAdvancedReset">{{ $t('generate.reset') }}</n-button>
              <n-button type="primary" @click="handleAdvancedApply">{{ $t('generate.query') }}</n-button>
            </div>
          </template>
        </NDrawerContent>
      </NDrawer>
    </template>

    <!-- 卡片视图 - 使用铃铛图标插槽 -->
    <template #card-view>
      <n-scrollbar class="device-card-scroll" :size="1">
        <n-spin :show="loading">
          <CardGrid>
            <div v-for="item in dataList" :key="item.id">
              <DevCardItem
                class="device-card"
                :title="item.name || 'N/A'"
                :status-active="item.is_online === 1"
                :subtitle="item.device_config_name || '--'"
                :hide-footer-left="true"
                @click-card="() => props.rowClick && props.rowClick(item)"
              >
                <template #subtitle-icon>
                  <span
                    class="device-type-icon"
                    :title="getDeviceTypeLabel(item.device_type)"
                    :aria-label="getDeviceTypeLabel(item.device_type)"
                  >
                    <SvgIcon
                      :local-icon="getDeviceIconName(item.device_type, item.device_config_name)"
                      class="image-icon"
                    />
                  </span>
                </template>

                <template #card-preview>
                  <div class="device-card-preview">
                    <div class="config-image-frame">
                      <img
                        v-if="item.image_url"
                        :src="getConfigImageUrl(item.image_url)"
                        :alt="`${item.name || '设备'}默认图片`"
                        class="config-image"
                      />
                      <SvgIcon v-else local-icon="defaultdevice" class="config-image config-image--default" />
                    </div>
                    <span class="device-report-time">
                      {{ item.ts ? formatDateTime(item.ts) : '--' }}
                    </span>
                  </div>
                </template>
              </DevCardItem>
            </div>
          </CardGrid>
        </n-spin>
      </n-scrollbar>
    </template>

    <!-- 列表视图 -->
    <template #list-view>
      <n-scrollbar class="device-table-scroll" :size="1">
        <NDataTable
          class="device-data-table thingspanel-data-table"
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="tableScrollX"
          :row-key="rowKey"
          :row-props="rowProps"
          :loading="loading"
          :columns="generatedColumns"
          :data="dataList"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>
      </n-scrollbar>
    </template>

    <!-- 地图视图 -->
    <template #map-view>
      <n-spin class="map-view-spin" :show="loading">
        <div class="map-view-container">
          <TencentMap :devices="dataList" />
        </div>
      </n-spin>
    </template>

    <!-- 底部分页 -->
    <template #footer>
      <NPagination
        v-model:page="currentPage"
        v-model:page-size="pageSize"
        class="justify-end"
        :item-count="total"
        :page-sizes="[10, 20, 30, 40, 50]"
        show-size-picker
        @update:page="onUpdatePage"
        @update:page-size="onUpdatePageSize"
      />
    </template>
  </AdvancedListLayout>
</template>

<style scoped lang="scss">
.data-table-page-header {
  width: 100%;
  min-width: 0;
}

.data-table-page-header__main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 36px;
}

.data-table-page-header__title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;

  h2 {
    margin: 0;
    color: var(--text-color);
    font-size: 20px;
    font-weight: 700;
    line-height: 1.35;
    white-space: nowrap;
  }

  span {
    color: var(--text-color-3);
    font-size: 13px;
    line-height: 1.4;
    white-space: nowrap;
  }
}

:deep(.list-content-header) {
  align-items: flex-start;
}

:deep(.list-content-header-left) {
  flex: 1;
  min-width: 0;
}

:deep(.list-content-header-right) {
  padding-top: 2px;
}

.btn-style {
  @apply hover:bg-[var(--color-primary-hover)] rounded-md shadow;
}

.device-filter-area {
  width: 100%;
  min-width: 0;
  padding: 2px 0 0;
}

.device-filter-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: start;
  width: 100%;
}

.device-filter-primary-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.device-filter-field {
  flex: 0 1 168px;
  min-width: 148px;
}

.device-filter-field--search {
  flex-basis: 210px;
  min-width: 180px;
}

.device-filter-toolbar {
  :deep(.n-input),
  :deep(.n-base-selection) {
    min-height: 36px;
    border-radius: 8px;
    background: var(--card-color);
  }

  :deep(.n-input:hover),
  :deep(.n-base-selection:hover) {
    border-color: var(--primary-color);
  }

  :deep(.n-button) {
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
  }
}

.device-filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  height: 100%;
}

.device-filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  margin-left: 4px;
  padding: 0 5px;
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  border-radius: 9px;
  background: var(--primary-color-suppl);
}

.device-active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 30px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.device-active-filters__label {
  color: var(--text-color-3);
  font-size: 12px;
}

.device-filter-result-count {
  margin-left: auto;
  color: var(--text-color-3);
  font-size: 12px;
}

.advanced-filter-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.advanced-filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.advanced-filter-field__label {
  color: var(--text-color);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}

.advanced-filter-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1440px) {
  .device-filter-toolbar {
    gap: 8px;
  }

  .device-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .device-filter-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .device-filter-primary-actions,
  .device-filter-field,
  .device-filter-actions {
    width: 100%;
  }

  .device-filter-field--search {
    min-width: 0;
  }

  .device-filter-actions {
    justify-content: stretch;

    :deep(.n-button) {
      flex: 1;
    }
  }

  .device-filter-result-count {
    width: 100%;
    margin-left: 0;
  }
}

.card-wrapper {
  @apply rounded-lg shadow overflow-hidden;
  margin: 0 auto;
  padding: 16px;
}

.device-card-scroll {
  height: 100%;
  min-height: 0;
}

.device-type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border: 1px solid rgb(var(--primary-color) / 14%);
  border-radius: 8px;
  background: rgb(var(--primary-color) / 6%);
}

.image-icon {
  max-width: 100%;
  max-height: 100%;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.device-card-preview {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  align-items: start;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  padding: 0;
  column-gap: 16px;
  overflow: visible;
}

.config-image-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
  border-radius: 12px;
  background: var(--n-color);
}

.config-image {
  display: block;
  width: 100%;
  height: 100%;
  padding: 4px;
  object-fit: contain;
  object-position: center;
}

.config-image--default {
  padding: 3px;
  opacity: 0.82;
}

.device-report-time {
  grid-column: 2;
  justify-self: end;
  color: var(--n-text-color);
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.62;
  text-align: right;
  white-space: nowrap;
}

:deep(.item-card.device-card) {
  height: 190px;
  border: 1px solid var(--n-border-color);
  border-radius: 14px;
  background: var(--n-color);
  box-shadow: 0 6px 18px rgb(15 23 42 / 4%);
}

:deep(.item-card.device-card:hover) {
  border-color: rgb(var(--primary-color) / 58%);
  box-shadow: 0 10px 22px rgb(var(--primary-color) / 12%);
}

:deep(.item-card.device-card .card-container) {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  column-gap: 16px;
  box-sizing: border-box;
  padding: 16px;
}

:deep(.item-card.device-card .card-header) {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  min-width: 0;
  z-index: 1;
}

:deep(.item-card.device-card .title-row) {
  margin-bottom: 10px;
}

:deep(.item-card.device-card .card-title) {
  font-size: 16px;
  font-weight: 650;
  line-height: 1.35;
}

:deep(.item-card.device-card .status-dot) {
  width: 7px;
  height: 7px;
  box-shadow: 0 0 0 3px rgb(var(--primary-color) / 12%);
}

:deep(.item-card.device-card .subtitle-row) {
  gap: 8px;
  color: var(--n-text-color);
}

:deep(.item-card.device-card .subtitle-text-container) {
  overflow: hidden;
  color: var(--n-text-color);
  opacity: 0.72;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.item-card.device-card .card-preview) {
  grid-column: 1 / -1;
  grid-row: 1;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  pointer-events: none;
}

:deep(.item-card.device-card .config-image-frame) {
  grid-column: 1;
  grid-row: 1;
  width: 88px;
  height: 88px;
  border-radius: 14px;
}

:deep(.item-card.device-card .device-report-time) {
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  align-self: end;
  max-width: 100%;
  margin-top: 10px;
}

:deep(.item-card.device-card .card-footer) {
  justify-content: flex-end;
  padding-top: 2px;
}

:deep(.item-card.device-card .footer-right) {
  flex: 0 1 auto;
  max-width: 100%;
}

:deep(.item-card.device-card .footer-text) {
  max-width: 100%;
  color: var(--n-text-color);
  opacity: 0.62;
  font-size: 11px;
  line-height: 1.35;
}

.map-view-container {
  height: 100%;
  min-height: 0;
}

:deep(.map-view-spin),
:deep(.map-view-spin > .n-spin-content) {
  height: 100%;
}

.device-table-scroll {
  height: 100%;
  min-height: 220px;
}

.device-data-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th) {
    height: 44px;
    color: var(--text-color);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0.01em;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }

  :deep(.device-name-cell) {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }

  :deep(.device-name-button) {
    max-width: 240px;
    padding: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    text-align: left;
  }

  :deep(.device-status-dot) {
    position: absolute;
    top: 50%;
    left: -10px;
    width: 7px;
    height: 7px;
    flex: 0 0 7px;
    border-radius: 50%;
    background: var(--text-color-3);
    transform: translateY(-50%);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-color-3) 12%, transparent);
  }

  :deep(.device-status-dot--online) {
    background: var(--success-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--success-color) 14%, transparent);
  }
}
</style>
