import type { Ref } from 'vue';
import { ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';

export const test: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: $t('device_template.table_header.dataName'),
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: $t('device_template.table_header.dataIdentifier'),
    align: 'center'
  },
  {
    key: 'read_write_flag',
    minWidth: '100px',
    title: $t('device_template.table_header.readAndWriteSign'),
    align: 'center'
  },
  {
    key: 'data_type',
    minWidth: '100px',
    title: $t('device_template.table_header.dataType'),
    align: 'center'
  },
  {
    key: 'unit',
    minWidth: '100px',
    title: $t('device_template.table_header.unit'),
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: $t('device_template.table_header.description'),
    align: 'center'
  }
]);

export const attribute: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: $t('device_template.table_header.attributeName'),
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: $t('device_template.table_header.attributeIdentifier'),
    align: 'center'
  },
  {
    key: 'read_write_flag',
    minWidth: '100px',
    title: $t('device_template.table_header.readAndWriteSign'),
    align: 'center'
  },
  {
    key: 'data_type',
    minWidth: '100px',
    title: $t('device_template.table_header.dataType'),
    align: 'center'
  },
  {
    key: 'unit',
    minWidth: '100px',
    title: $t('device_template.table_header.unit'),
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: $t('device_template.table_header.description'),
    align: 'center'
  }
]);

export const events: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: $t('device_template.table_header.eventName'),
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: $t('device_template.table_header.eventIdentifier'),
    align: 'center'
  },
  {
    key: 'data_type',
    minWidth: '100px',
    title: $t('device_template.table_header.eventParameters'),
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: $t('device_template.table_header.description'),
    align: 'center'
  }
]);

export const command: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    minWidth: '100px',
    title: $t('device_template.table_header.commandName'),
    align: 'center'
  },
  {
    key: 'data_identifier',
    minWidth: '100px',
    title: $t('device_template.table_header.commandIdentifier'),
    align: 'center'
  },
  {
    key: 'data_type',
    minWidth: '100px',
    title: $t('device_template.table_header.commandParameters'),
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: $t('device_template.table_header.description'),
    align: 'center'
  }
]);
