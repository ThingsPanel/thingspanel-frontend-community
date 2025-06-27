import { type DataTableColumns, NButton, NFlex, NPopconfirm } from 'naive-ui';
import dayjs from 'dayjs';

export const group_columns = (viewDetails: (rid: string) => void, deleteItem: (rid: string) => void) => [
  {
    title: () => "组名",
    key: 'name',
    minWidth:'140px',
    ellipsis: {
      tooltip: {
        width: 320
      }
    }
  },
  {
    title: () => "描述",
    key: 'description',minWidth:'140px',
    ellipsis: {
      tooltip: {
        width: 320
      }
    }
  },
  {
    title: () => "创建时间",
    key: 'created_at',minWidth:'180px',
    render(row: { id: string; name: string; description: string; created_at: string; [key: string]: any }) {
      return dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: () => "操作",
    key: 'actions',width:'200px',
    render: (row: { id: string; name: string; description: string; created_at: string; [key: string]: any }) => {
      return (
        <div
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <NFlex justify={'start'}>
            <NButton              
              type="primary"
              size={'small'}
              onClick={() => {
                viewDetails(row.id);
              }}
            >
              {"查看"}
            </NButton>
            <NPopconfirm
              onPositiveClick={e => {
                e.stopPropagation();
                deleteItem(row.id);
              }}
            >
              {{
                default: () => "确定删除吗？",
                trigger: () => (
                  <NButton type="error" size={'small'}>
                    {"删除"}
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
    title: () => "设备名称",
    key: 'name', minWidth:'140px',
    render: row => row.name || '-'
  },
  {
    title: () => "设备编号",
    key: 'device_number', minWidth:'140px',
    render: row => row.device_number || '-'
  },
  {
    title: () => "设备配置", minWidth:'140px',
    key: 'device_config_name'
  }
];

export const createNoSelectDeviceColumns = (
  viewDevicsseDetails: (rid: string) => void,
  deleteDeviceItem: (rid: string) => void
): DataTableColumns<DeviceManagement.DeviceData> => {
  return [
    {
      title: () => "设备名称",
      key: 'name', minWidth:'140px',
      render: row => row.name || '-'
    },
    {
      title: () => "设备编号",
      key: 'device_number', minWidth:'140px',
      render: row => row.device_number || '-'
    },
    {
      title: () => "设备配置", minWidth:'140px',
      key: 'device_config_name'
    },
    {
      title: () => "操作",
      key: 'actions', minWidth:'140px',
      render: row => {
        return (
          <NFlex justify={'start'}>
            <NButton            
              type="primary"
              size={'small'}
              onClick={() => {
                viewDevicsseDetails(row.id);
              }}
            >
              {"查看"}
            </NButton>
            <NPopconfirm
              onPositiveClick={() => {
                deleteDeviceItem(row.id);
              }}
            >
              {{
                default: () => "确定删除吗？",
                trigger: () => (
                  <NButton type="error" size={'small'}>
                    {"从组中移除"}
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
