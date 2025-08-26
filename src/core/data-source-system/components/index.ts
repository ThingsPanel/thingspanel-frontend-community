/**
 * 数据源系统组件统一导出入口
 * 提供完整的数据源配置系统访问接口
 */

// 主要配置组件
export { default as DataSourceConfigForm } from './data-source-config-form/forms/DataSourceConfigForm.vue'
export { default as DataSourceConfigFormSimple } from './data-source-config-form/forms/DataSourceConfigFormSimple.vue'

// 弹窗组件
export { default as AddRawDataModal } from './data-source-config-form/modals/AddRawDataModal.vue'
export { default as ApiListModal } from './data-source-config-form/modals/ApiListModal.vue'
export { default as DataDetailModal } from './data-source-config-form/modals/DataDetailModal.vue'

// 功能模块组件
export { default as DataSourceHeader } from './data-source-config-form/sections/DataSourceHeader.vue'
export { default as FinalDataProcessing } from './data-source-config-form/sections/FinalDataProcessing.vue'
export { default as RawDataManagement } from './data-source-config-form/sections/RawDataManagement.vue'

// 基础组件（从子目录导出）
export * from './data-source-config-form/ui'

// 统一类型定义
export * from '../types'

// Composables
export * from './data-source-config-form/composables'

// 使用示例和文档
export const DataSourceSystemUsage = {
  basic: `
// 基本使用
import { DataSourceConfigForm } from '@/core/data-source-system/components'

<DataSourceConfigForm
  v-model="dataSourceConfig"
  :component-id="componentId"
  :component-type="componentType"
  :data-sources="dataSources"
  @data-change="handleDataChange"
  @config-sync="handleConfigSync"
/>`,

  withCustomization: `
// 带自定义配置
import { 
  DataSourceConfigForm,
  useDataSourceState,
  type DataSourceConfigFormProps
} from '@/core/data-source-system/components'

const props = defineProps<DataSourceConfigFormProps>()
const { dataValues, updateDataSource } = useDataSourceState(props)`,

  modalComponents: `
// 独立使用弹窗组件
import { AddRawDataModal } from '@/core/data-source-system/components'

<AddRawDataModal
  v-model:show="showModal"
  :raw-data-item="currentItem"
  @save="handleSave"
  @cancel="handleCancel"
/>`
}

// 系统信息
export const DataSourceSystemInfo = {
  name: 'ThingsPanel Data Source Configuration System',
  version: '2.0.0',
  description: '完整的数据源配置系统，支持HTTP、WebSocket等多种数据源类型',
  components: {
    total: 16,
    categories: {
      main: 2,
      modals: 3,
      functional: 3,
      basic: 8
    }
  },
  features: [
    '多种数据源类型支持（HTTP、WebSocket、静态数据等）',
    '完整的数据处理管道',
    '实时数据预览',
    '连接测试和验证',
    '动态参数系统',
    '主题系统集成',
    '国际化支持',
    'TypeScript完整类型支持',
    '组件化架构',
    '可扩展的插件系统'
  ]
}
