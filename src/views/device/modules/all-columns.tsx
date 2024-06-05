import { type DataTableColumns, NButton, NFlex, NPopconfirm } from 'naive-ui';
import dayjs from 'dayjs';
import { $t } from '@/locales';

export const group_columns = (viewDetails: (rid: string) => void, deleteItem: (rid: string) => void) => [
  {
    title: () => $t('custom.groupPage.groupName'),
    key: 'name',
    minWidth:'140px',
    ellipsis: {
      tooltip: {
        width: 320
      }
    }
  },
  {
    title: () => $t('custom.groupPage.description'),
    key: 'description',minWidth:'140px',
    ellipsis: {
      tooltip: {
        width: 320
      }
    }
  },
  {
    title: () => $t('custom.groupPage.createdAt'),
    key: 'created_at',minWidth:'180px',
    render(row: { id: string; name: string; description: string; created_at: string; [key: string]: any }) {
      return dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: () => $t('custom.groupPage.actions'),
    key: 'actions',minWidth:'140px',
    render: (row: { id: string; name: string; description: string; created_at: string; [key: string]: any }) => {
      return (
        <div
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <NFlex justify={'start'}>
            <NButton
              quaternary
              type="primary"
              size={'small'}
              onClick={() => {
                viewDetails(row.id);
              }}
            >
              {$t('custom.groupPage.view')}
            </NButton>
            <NPopconfirm
              onPositiveClick={e => {
                e.stopPropagation();
                deleteItem(row.id);
              }}
            >
              {{
                default: () => $t('common.confirmDelete'),
                trigger: () => (
                  <NButton quaternary type="primary" size={'small'}>
                    {$t('common.delete')}
                  </NButton>
                )
              }}
            </NPopconfirm>
          </NFlex>
        </div>
      );
    }
  }
];

export const createDeviceColumns = (): DataTableColumns<DeviceManagement.DeviceData> => [
  {
    type: 'selection', minWidth:'140px',
  },
  {
    title: () => $t('custom.devicePage.deviceName'),
    key: 'name', minWidth:'140px',
    render: row => row.name || '-'
  },
  {
    title: () => $t('custom.devicePage.deviceNumber'),
    key: 'device_number', minWidth:'140px',
    render: row => row.device_number || '-'
  },
  {
    title: () => $t('custom.devicePage.deviceConfig'), minWidth:'140px',
    key: 'device_config_name'
  }
];

export const createNoSelectDeviceColumns = (
  viewDevicsseDetails: (rid: string) => void,
  deleteDeviceItem: (rid: string) => void
): DataTableColumns<DeviceManagement.DeviceData> => {
  return [
    {
      title: () => $t('custom.devicePage.deviceName'),
      key: 'name', minWidth:'140px',
      render: row => row.name || '-'
    },
    {
      title: () => $t('custom.devicePage.deviceNumber'),
      key: 'device_number', minWidth:'140px',
      render: row => row.device_number || '-'
    },
    {
      title: () => $t('custom.devicePage.deviceConfig'), minWidth:'140px',
      key: 'device_config_name'
    },
    {
      title: () => $t('custom.groupPage.actions'),
      key: 'actions', minWidth:'140px',
      render: row => {
        return (
          <NFlex justify={'start'}>
            <NButton
              quaternary
              type="primary"
              size={'small'}
              onClick={() => {
                viewDevicsseDetails(row.id);
              }}
            >
              {$t('custom.groupPage.view')}
            </NButton>
            <NPopconfirm
              onPositiveClick={() => {
                deleteDeviceItem(row.id);
              }}
            >
              {{
                default: () => $t('common.confirmDelete'),
                trigger: () => (
                  <NButton quaternary type="primary" size={'small'}>
                    {$t('custom.groupPage.removeFromGroup')}
                  </NButton>
                )
              }}
            </NPopconfirm>
          </NFlex>
        );
      }
    }
  ];
};
