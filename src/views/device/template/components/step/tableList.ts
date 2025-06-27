import type { Ref } from 'vue'
import { ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { $t } from '@/locales'

export const test: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: '数据名称',
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: '数据标识符',
    align: 'center'
  },
  {
    key: 'read_write_flag',
    minWidth: '100px',
    title: '读写标志',
    align: 'center'
  },
  {
    key: 'data_type',
    minWidth: '100px',
    title: '数据类型',
    align: 'center'
  },
  {
    key: 'unit',
    minWidth: '100px',
    title: '单位',
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: '描述',
    align: 'center'
  }
])

export const attribute: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: '属性名称',
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: '属性标识符',
    align: 'center'
  },
  {
    key: 'read_write_flag',
    minWidth: '100px',
    title: '读写标志',
    align: 'center'
  },
  {
    key: 'data_type',
    minWidth: '100px',
    title: '数据类型',
    align: 'center'
  },
  {
    key: 'unit',
    minWidth: '100px',
    title: '单位',
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: '描述',
    align: 'center'
  }
])

export const events: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: '事件名称',
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: '事件标识符',
    align: 'center'
  },
  {
    key: 'params',
    minWidth: '100px',
    title: '事件参数',
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: '描述',
    align: 'center'
  }
])

export const command: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: '命令名称',
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: '命令标识符',
    align: 'center'
  },
  {
    key: 'params',
    minWidth: '100px',
    title: '命令参数',
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: '描述',
    align: 'center'
  }
])
