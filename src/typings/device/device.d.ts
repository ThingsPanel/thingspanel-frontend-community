declare namespace DeviceManagement {
  interface Group {
    id: string;
    parent_id: string;
    tier: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    remark: string | null;
    tenant_id: string;
  }

  interface TreeNode {
    group: Group;
    children?: TreeNode[]; // TreeNode类型的可选数组，用于描述子节点
  }

  // 用于描述包含根节点和可能的子节点的整个树结构
  type TreeStructure = TreeNode[];

  interface DetailData {
    detail: {
      created_at: string;
      description: string;
      id: string;
      name: string;
      parent_id: string;
      remark: string;
      tenant_id: string;
      tier: number;
      updated_at: string;
    };
    tier: {
      group_path: string;
    };
  }

  interface GroupDeviceData {
    any;
  }

  interface DeviceData {
    id: string;
    activate_flag: string;
    current_version: string;
    device_config_id: string;
    device_number: string;
    device_type: number;
    group_id: string;
    is_enabled: string;
    label: string;
    name: string;
    product_id: string;
    protocol: string;
  }

  interface DeviceDatas {
    list: DeviceData[];
    total: number;
  }

  interface DeviceDetail {
    id: string;
    name: string;
    voucher: string; // 凭证
    tenant_id: string;
    is_enabled: string; // 启用/禁用 enabled-启用 disabled-禁用 默认禁用，激活后默认启用
    activate_flag: string; // 激活标志 inactive-未激活 active-已激活
    created_at: string;
    update_at: string;
    device_number: string; // 设备编号
    product_id: string; // 产品id
    parent_id: string; // 网关id
    label: string; // 标签 单标签，英文逗号隔开
    location: string; // 地理位置
    sub_device_addr: string; // 子设备地址
    current_version: string; // 固件版本
    additional_info: string; // 附件信息 json字符串
    protocol_config: string; // 协议插件设备配置 协议插件相关的设备配置
    device_config_name: string;
    remark1: string;
    remark2: string;
    remark3: string;
    device_config_id: string; // 设备配置id
    batch_number: string; // 批次号
    activate_at: string; // 激活时间
    is_online: number; // 是否在线
  }

  interface telemetryData {
    device_id: string;
    key: string;
    tenant_id: string;
    ts: string;
    value: number;
    unit: string;
    label: string;
    name: string;
  }

  interface telemetryCurrent {
    data: telemetryData[];
  }

  interface ConfigData {
    id: string;
    name: string;
    device_template_id: string;
    device_type: string;
    protocol_type: string;
    voucher_type: string;
    protocol_config: string;
    device_conn_type: string;
    additional_info: string;
    description: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
    remark: null;
    device_count: number;
  }

  interface ConfigDatas {
    list: ConfigData[];
    total: number;
  }
}
