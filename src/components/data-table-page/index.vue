<script lang="tsx" setup>
import type { VueElement } from 'vue';
import { computed, defineProps, getCurrentInstance, ref, watch, watchEffect } from 'vue';
import { NButton, NDataTable, NDatePicker, NInput, NPopconfirm, NSelect, NSpace, NPagination, NSpin } from 'naive-ui';
import type { TreeSelectOption } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { formatDateTime } from '@/utils/common/datetime';
import { createLogger } from '@/utils/logger';
import AdvancedListLayout from '@/components/list-page/index.vue';
import TencentMap from './modules/tencent-map.vue';
import DevCardItem from '@/components/dev-card-item/index.vue';

// 新增 DeviceItem 接口定义
interface DeviceItem {
  id: string;
  device_number: string;
  name: string;
  device_config_id: string;
  device_config_name: string;
  ts: string | null;
  activate_flag: string;
  activate_at: string | null;
  batch_number: string;
  current_version: string;
  created_at: string;
  is_online: 0 | 1;
  location: string;
  access_way: string;
  protocol_type: string;
  device_status: number;
  warn_status: string; // 例如 'N' 表示正常, 'Y' 表示告警
  device_type: string;
  // 根据实际情况可以添加更多字段
  title?: string; // DevCardItem 可能用到的备用字段
  description?: string; // DevCardItem 可能用到的备用字段
  status?: string | number; // DevCardItem 可能用到的备用字段
  value?: string; // DevCardItem 可能用到的备用字段
  indicator?: string; // DevCardItem 可能用到的备用字段
  timestamp?: string; // DevCardItem 可能用到的备用字段
  updatedAt?: string; // DevCardItem 可能用到的备用字段
  key?: string; // DevCardItem 可能用到的备用字段
}

const logger = createLogger('TablePage');

// 定义搜索配置项的类型，支持多种输入类型：纯文本、日期选择器、日期范围选择器、下拉选择和树形选择器
export type theLabel = string | (() => string) | undefined;
export type SearchConfig =
  | {
      key: string;
      label: string;
      type: 'input' | 'date' | 'date-range';
      initValue?: any;
    }
  | {
      key: string;
      label: string;
      type: 'select';
      renderLabel?: any;
      renderTag?: any;
      initValue?: any;
      extendParams?: object;
      options: { label: theLabel; value: any }[];
      labelField?: string;
      valueField?: string;
      loadOptions?: (pattern) => Promise<{ label: theLabel; value: any }[]>;
    }
  | {
      key: string;
      label: string;
      type: 'tree-select';
      initValue?: any;
      options: TreeSelectOption[];
      multiple: boolean;
      loadOptions?: () => Promise<TreeSelectOption[]>;
    };

// 通过props从父组件接收参数
const props = defineProps<{
  fetchData: (data: any) => Promise<any>; // 数据获取函数
  columnsToShow: // 表格列配置
  | {
        key: string;
        label: theLabel;
        render?: (row: any) => VueElement | string | undefined; // 自定义渲染函数
      }[]
    | 'all'; // 特殊值'all'表示显示所有列
  searchConfigs: SearchConfig[]; // 搜索配置数组
  tableActions: Array<{
    // 表格行操作
    theKey?: string; // 操作键
    label: theLabel; // 按钮文本
    callback: any; // 点击回调
  }>;
  topActions: { element: () => JSX.Element }[]; // 顶部操作组件列表
  rowClick?: (row: any) => void; // 表格行点击回调
  initPage?: number;
  initPageSize?: number;
}>();

const { loading, startLoading, endLoading } = useLoading();
// 解构props以简化访问
const { fetchData, columnsToShow, tableActions, searchConfigs }: any = props;

const dataList = ref<DeviceItem[]>([]); // 为 dataList 指定类型
const total = ref(0); // 数据总数
const currentPage = ref(props.initPage || 1); // 当前页码
const pageSize = ref(props.initPageSize || 10); // 每页显示数量
const searchCriteria: any = ref(Object.fromEntries(searchConfigs.map(item => [item.key, item.initValue]))); // 搜索条件

// 添加当前视图状态管理
const currentViewType = ref('list'); // 默认为列表视图

// 获取数据的函数，结合搜索条件、分页等
const getData = async () => {
  // 处理搜索条件，特别是将日期对象转换为字符串
  startLoading();
  const processedSearchCriteria = Object.fromEntries(
    Object.entries(searchCriteria.value).map(([key, value]) => {
      if (value && Array.isArray(value)) {
        // 处理日期范围
        return [key, value.map(v => (v instanceof Date ? v.toISOString() : v))];
      }
      // 单一日期处理
      return [key, value instanceof Date ? value.toISOString() : value];
    })
  );
  // 调用提供的fetchData函数获取数据

  const response = await fetchData({
    page: currentPage.value,
    page_size: pageSize.value,
    ...processedSearchCriteria
  });
  // 处理响应
  if (!response.error) {
    dataList.value = response.data.list;
    total.value = response.data.total;
  } else {
    logger.error({ 'Error fetching data:': response.error });
  }
  endLoading();
};

// 使用计算属性动态生成表格的列配置
const generatedColumns = computed(() => {
  let columns;

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
        };
      }
      return {
        ...item,
        title: item.label,
        key: item.key,
        render: row => {
          if (item.key === 'ts' && row[item.key]) {
            return formatDateTime(row[item.key]);
          }
          return <>{row[item.key]}</>;
        }
      };
    });
    // 添加操作列
    columns.push({
      title: $t('custom.groupPage.actions'),
      key: 'actions',
      width: 180,
      render: row => (
        <div
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <NSpace>
            {tableActions.map(action => {
              if (action.theKey === $t('custom.devicePage.delete') || action.theKey === '删除') {
                return (
                  <NPopconfirm
                    onPositiveClick={async e => {
                      e.stopPropagation();
                      await action.callback(row);
                      // 删除后只刷新数据，不重置搜索条件
                      getData();
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton type="error" size="small">
                          {typeof action.label === 'function' ? action.label() : action.label || ''}
                        </NButton>
                      ),
                      default: () => $t('common.confirmDelete')
                    }}
                  </NPopconfirm>
                );
              }
              return (
                <NButton type="primary" size="small" onClick={() => action.callback(row)}>
                  {typeof action.label === 'function' ? action.label() : action.label || ''}
                </NButton>
              );
            })}
          </NSpace>
        </div>
      )
    });
  }

  return columns || [];
});

// 更新页码或页面大小时重新获取数据
const onUpdatePage = newPage => {
  currentPage.value = newPage;
  getData(); // 更新数据
};
const onUpdatePageSize = newPageSize => {
  pageSize.value = newPageSize;
  currentPage.value = 1; // 重置为第一页
  getData(); // 更新数据
};

// 添加对 searchCriteria 的监听
watch(
  searchCriteria,
  (newVal, oldVal) => {
    // 检查是否真的发生了变化
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      currentPage.value = 1; // 重置到第一页
      getData(); // 重新获取数据
    }
  },
  { deep: true } // 深度监听对象的变化
);

// 观察分页和搜索条件的变化，自动重新获取数据
watchEffect(() => {
  searchConfigs.map((item: any) => {
    const vals = searchCriteria.value[item.key];
    if (item?.extendParams && vals) {
      item?.options.map(oitem => {
        if (oitem.dict_value + oitem.device_type === vals) {
          item?.extendParams.map(eitem => {
            searchCriteria.value[eitem.label] = oitem[eitem.value];
          });
        }
      });
    }
  });
  getData();
});

// 搜索和重置按钮的逻辑
const handleSearch = () => {
  currentPage.value = 1; // 搜索时重置到第一页
  getData();
};

const handleReset = () => {
  // 重置搜索条件为初始值
  Object.keys(searchCriteria.value).forEach(key => {
    const config = searchConfigs.find(item => item.key === key);
    if (config) {
      // 如果是日期范围选择器，设置为空数组
      if (config.type === 'date-range') {
        searchCriteria.value[key] = [];
      }
      // 如果是树形选择器，根据 multiple 属性设置空值
      else if (config.type === 'tree-select') {
        searchCriteria.value[key] = config.multiple ? [] : null;
      }
      // 如果是下拉选择框，设置为 null 以显示占位符
      else if (config.type === 'select') {
        searchCriteria.value[key] = null;
      }
      // 其他类型设置为空字符串
      else {
        searchCriteria.value[key] = '';
      }
    }
  });

  handleSearch(); // 重置后重新获取数据
};

// 强制更新指定参数并刷新数据
const forceChangeParamsByKey = (params: Record<string, any>) => {
  Object.entries(params).forEach(([key, value]) => {
    if (key in searchCriteria.value) {
      searchCriteria.value[key] = value;
    }
  });
  getData();
};

// 暴露方法给父组件
defineExpose({
  handleSearch,
  handleReset,
  forceChangeParamsByKey
});

// 更新树形选择器的选项
const handleTreeSelectUpdate = (value, key) => {
  currentPage.value = 1;
  searchCriteria.value[key] = value;
};

// 用于加载动态选项的函数，适用于select和tree-select类型的搜索配置
const loadOptionsOnMount = async pattern => {
  for (const config of searchConfigs) {
    if (config.type === 'select' && config.loadOptions) {
      const opts = await config.loadOptions(pattern);
      config.options = [...config.options, ...opts];
    }
  }
};

const rowProps = row => {
  if (props && props.rowClick) {
    return {
      style: 'cursor: pointer;',
      onClick: () => {
        props.rowClick && props.rowClick(row);
      }
    };
  }
  return {};
};

const loadOptionsOnMount2 = async () => {
  for (const config of searchConfigs) {
    if (config.type === 'tree-select' && config.loadOptions) {
      const opts = await config.loadOptions();
      config.options = [...config.options, ...opts];
    }
  }
};

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});

// 在组件挂载时加载选项
loadOptionsOnMount('');
loadOptionsOnMount2();

// 为 input 类型添加专门的处理函数
const handleInputChange = () => {
  currentPage.value = 1;
  getData();
};

// 修复 NSelect 的 filter 函数类型错误
const filterSelectOption = (pattern: string, option: any) => {
  const label = typeof option.label === 'string' ? option.label : '';
  return label.includes(pattern);
};

// AdvancedListLayout 事件处理
const handleLayoutQuery = (filterData: Record<string, any>) => {
  handleSearch();
};

const handleLayoutReset = () => {
  handleReset();
};

const handleAddNew = () => {
  // 触发新建事件，由父组件或第一个 topAction 处理
  if (props.topActions && props.topActions.length > 0) {
    // 这里可以根据实际需求调整
    console.log('Add new action triggered');
  }
};

const handleViewChange = ({ viewType }: { viewType: string }) => {
  // 更新当前视图类型
  currentViewType.value = viewType;
  console.log('View changed to:', viewType);
};

const handleRefresh = () => {
  getData();
};

// 导入您在 modules 文件夹下创建的SVG图标 (使用 ?url 后缀)
import directDeviceIconUrl from './modules/svg/direct.svg?url';
import gatewayIconUrl from './modules/svg/gateway.svg?url';
import subDeviceIconUrl from './modules/svg/subdevice.svg?url';
import defaultDeviceIconUrl from './modules/svg/defaultdevice.svg?url';

// 设备类型到图标URL的映射 (现在使用导入的SVG路径)
const deviceTypeIconUrls = {
  '1': directDeviceIconUrl,         // 直连设备图标
  '2': gatewayIconUrl,            // 网关图标
  '3': subDeviceIconUrl,           // 网关子设备图标
  default: '' // 如果没有匹配的类型，则不显示图标
};

// 修改获取设备图标URL的函数，针对"默认配置"使用直连设备图标
const getDeviceIconUrl = (deviceType: string, deviceConfigName?: string): string => {
  // 当配置是默认配置时，强制使用直连设备图标
  if (!deviceConfigName || deviceConfigName === '默认配置') {
    return deviceTypeIconUrls['1']; // 直连设备图标
  }
  return deviceTypeIconUrls[deviceType] || deviceTypeIconUrls.default;
};

// 导入图标组件（修复图标显示问题）
import { ListOutline, MapOutline, GridOutline as CardIcon } from '@vicons/ionicons5';

// 定义可用视图，修复图标引用
const availableViews = [
  { key: 'card', icon: CardIcon, label: 'views.card' },
  { key: 'list', icon: ListOutline, label: 'views.list' },
  { key: 'map', icon: MapOutline, label: 'views.map' }
];

// 处理告警铃铛图标点击事件
const handleWarningClick = (item: DeviceItem) => {
  // 根据设备信息跳转到相应的告警页面
  // 可以传递设备ID等参数
  if (item.warn_status === 'Y') {
    // 有告警时跳转到具体设备的告警详情
    window.location.href = `/alarm/warning-message?device_id=${item.id}`
  } else {
    // 无告警时可能跳转到告警管理页面
    window.location.href = '/alarm/warning-message'
  }
}
</script>

<template>
  <AdvancedListLayout
    :initial-view="'card'"
    :available-views="availableViews"
    @query="handleLayoutQuery"
    @reset="handleLayoutReset"
    @add-new="handleAddNew"
    @view-change="handleViewChange"
    @refresh="handleRefresh"
  >
    <!-- 搜索表单内容 -->
    <template #search-form-content>
      <div class="flex flex-1 flex-wrap items-end gap-4">
        <div
          v-for="config in searchConfigs"
          :key="config.key"
          class="flex flex-col gap-2"
          :class="getPlatform ? 'min-w-100%' : ''"
        >
          <template v-if="config.type === 'input'">
            <NInput
              v-model:value="searchCriteria[config.key]"
              size="small"
              :placeholder="$t(config.label)"
              class="input-style"
              @update:value="handleInputChange"
            />
          </template>
          <template v-else-if="config.type === 'date-range'">
            <NDatePicker
              v-model:value="searchCriteria[config.key]"
              size="small"
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
              size="small"
              filterable
              :filter="filterSelectOption"
              :options="config.options"
              :render-label="config.renderLabel"
              :render-tag="config.renderTag"
              :placeholder="$t(config.label)"
              class="input-style"
              @update:value="currentPage = 1"
            />
          </template>
          <template v-else-if="config.type === 'date'">
            <NDatePicker
              v-model:value="searchCriteria[config.key]"
              size="small"
              type="date"
              :placeholder="$t(config.label)"
              class="input-style"
            />
          </template>
          <template v-else-if="config.type === 'tree-select'">
            <n-tree-select
              v-model:value="searchCriteria[config.key]"
              size="small"
              filterable
              :options="config.options"
              :multiple="config.multiple"
              class="input-style"
              @update:value="value => handleTreeSelectUpdate(value, config.key)"
            />
          </template>
        </div>
      </div>
    </template>

    <!-- 头部左侧操作区域 -->
    <template #header-left>
      <div class="flex gap-2">
        <component :is="action.element" v-for="(action, index) in topActions" :key="index"></component>
      </div>
    </template>

    <!-- 卡片视图 - 使用铃铛图标插槽 -->
    <template #card-view>
      <n-spin :show="loading">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4">
          <DevCardItem
            v-for="item in dataList"
            :key="item.id" 
            :title="item.name || 'N/A'" 
            :status-active="item.is_online === 1"
            :subtitle="item.device_config_name || '--'"
            :footer-text="(item.ts ? formatDateTime(item.ts) : null) ?? '--'"
            :warn-status="item.warn_status"
            :device-id="item.id"
            :device-config-id="item.device_config_id"
            @click-top-right-icon="handleWarningClick(item)"
          >
            <template #subtitle-icon>
              <img 
                :src="getDeviceIconUrl(item.device_type, item.device_config_name)" 
                alt="device type icon" 
                class="image-icon" 
              />
            </template>
            
            <!-- 右上角铃铛图标插槽 -->
            <template #top-right-icon>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                :fill="item.warn_status === 'Y' ? '#ff4d4f' : '#d9d9d9'"
                class="bell-icon"
              >
                <!-- 铃铛图标 SVG 路径 -->
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </template>
            
            <template #footer-icon>
              <img 
                :src="defaultDeviceIconUrl" 
                alt="device type icon" 
                class="image-icon" 
              />
            </template>
          </DevCardItem>
        </div>
      </n-spin>
    </template>

    <!-- 列表视图 -->
    <template #list-view>
      <div class="overflow-x-auto">
        <NDataTable
          :row-props="rowProps"
          :loading="loading"
          :columns="generatedColumns"
          :data="dataList"
          class="w-full"
        />
      </div>
    </template>

    <!-- 地图视图 -->
    <template #map-view>
      <n-spin :show="loading">
        <div class="h-525px">
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
.input-style {
  min-width: 140px;
}

.btn-style {
  @apply hover:bg-[var(--color-primary-hover)] rounded-md shadow;
}

.card-wrapper {
  @apply rounded-lg shadow overflow-hidden;
  margin: 0 auto;
  padding: 16px;
}

.image-icon {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.bell-icon {
  transition: fill 0.3s ease;
}
</style>