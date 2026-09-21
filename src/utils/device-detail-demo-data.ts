import dayjs from 'dayjs'

/**
 * 仅用于本地查看设备详情页表格样式的演示数据。
 * 真实接口返回数据时，页面始终优先使用真实数据。
 */
export const DEVICE_DETAIL_DEMO_ID = '795d27e4-0a16-2968-6c22-6de8354b3f25'

export const isDeviceDetailDemo = (deviceId?: string) => deviceId === DEVICE_DETAIL_DEMO_ID

const timestamp = (minutesAgo: number) => dayjs().subtract(minutesAgo, 'minute').toISOString()

export const demoTelemetry = () => [
  {
    device_id: DEVICE_DETAIL_DEMO_ID,
    key: 'temperature',
    label: '环境温度',
    value: 26.8,
    unit: '°C',
    ts: timestamp(2),
    data_type: 'number'
  },
  {
    device_id: DEVICE_DETAIL_DEMO_ID,
    key: 'humidity',
    label: '相对湿度',
    value: 61.4,
    unit: '%RH',
    ts: timestamp(3),
    data_type: 'number'
  },
  {
    device_id: DEVICE_DETAIL_DEMO_ID,
    key: 'running_status',
    label: '运行状态',
    value: 1,
    unit: '',
    ts: timestamp(4),
    data_type: 'enum',
    enum: [
      { value: 0, value_type: 'number', description: '停止' },
      { value: 1, value_type: 'number', description: '运行' }
    ]
  }
]

export const demoTelemetryLogs = () => [
  {
    data: '{"temperature":26.8,"humidity":61.4}',
    operation_type: '1',
    username: 'admin',
    created_at: timestamp(2),
    status: '1'
  },
  {
    data: '{"temperature":27.1,"humidity":60.9}',
    operation_type: '2',
    username: '',
    created_at: timestamp(18),
    status: '1'
  },
  {
    data: '{"temperature":26.5,"humidity":62.2}',
    operation_type: '1',
    username: 'operator',
    created_at: timestamp(35),
    status: '1'
  },
  { data: '{"temperature":28.4}', operation_type: '1', username: 'admin', created_at: timestamp(72), status: '2' },
  {
    data: '{"temperature":25.9,"humidity":63.1}',
    operation_type: '2',
    username: '',
    created_at: timestamp(110),
    status: '1'
  }
]

export const demoHistory = (key = 'temperature') =>
  Array.from({ length: 8 }, (_, index) => ({
    key,
    ts: timestamp(index * 10 + 5),
    value:
      key === 'humidity'
        ? Number((61 + Math.sin(index) * 2).toFixed(1))
        : Number((26 + Math.cos(index) * 1.3).toFixed(1))
  }))

export const demoTimeSeries = (key = 'temperature') =>
  demoHistory(key).map(item => ({ x: dayjs(item.ts).valueOf(), y: item.value }))

export const demoAttributes = () => [
  { id: 'demo-attribute-1', key: 'model', data_name: '设备型号', value: 'TP-SENSE-200', unit: null, ts: timestamp(12) },
  {
    id: 'demo-attribute-2',
    key: 'firmware_version',
    data_name: '固件版本',
    value: 'v2.4.1',
    unit: null,
    ts: timestamp(120)
  },
  { id: 'demo-attribute-3', key: 'sampling_interval', data_name: '采样周期', value: 60, unit: 's', ts: timestamp(240) }
]

export const demoAttributeLogs = () => [
  {
    created_at: timestamp(12),
    message_id: 'msg-20260921-001',
    data: '{"sampling_interval":60}',
    operation_type: '1',
    status: '1',
    error_message: ''
  },
  {
    created_at: timestamp(165),
    message_id: 'msg-20260920-008',
    data: '{"firmware_version":"v2.4.1"}',
    operation_type: '2',
    status: '3',
    error_message: ''
  },
  {
    created_at: timestamp(420),
    message_id: 'msg-20260920-003',
    data: '{"sampling_interval":30}',
    operation_type: '1',
    status: '2',
    error_message: '设备未响应'
  }
]

export const demoEvents = () => [
  { identify: 'overheat', data_name: '温度过高', ts: timestamp(28), data: '{"temperature":32.6}', error_message: '' },
  { identify: 'reconnected', data_name: '设备重连', ts: timestamp(95), data: '{"duration":12}', error_message: '' },
  { identify: 'low_battery', data_name: '电量不足', ts: timestamp(320), data: '{"battery":18}', error_message: '' }
]

export const demoCommands = () => [
  {
    identify: 'set_sampling_interval',
    identify_name: '设置采样周期',
    created_at: timestamp(20),
    status: '1',
    data: '{"interval":60}',
    error_message: ''
  },
  {
    identify: 'restart',
    identify_name: '重启设备',
    created_at: timestamp(180),
    status: '3',
    data: '{}',
    error_message: ''
  },
  {
    identify: 'set_sampling_interval',
    identify_name: '设置采样周期',
    created_at: timestamp(390),
    status: '2',
    data: '{"interval":30}',
    error_message: '设备离线'
  }
]

export const demoExpectedMessages = () => [
  {
    id: 'expect-1',
    created_at: timestamp(6),
    send_type: 'telemetry',
    label: '温度回传',
    payload: '{"temperature":26.8}',
    expiry_time: timestamp(-54),
    status: 'pending',
    message: '等待设备响应',
    send_time: ''
  },
  {
    id: 'expect-2',
    created_at: timestamp(80),
    send_type: 'attribute',
    label: '配置确认',
    payload: '{"sampling_interval":60}',
    expiry_time: timestamp(10),
    status: 'sent',
    message: '已收到响应',
    send_time: timestamp(70)
  },
  {
    id: 'expect-3',
    created_at: timestamp(260),
    send_type: 'command',
    label: '重启确认',
    payload: '{}',
    expiry_time: timestamp(200),
    status: 'expired',
    message: '超时未响应',
    send_time: ''
  }
]

export const demoChildDevices = () => [
  { id: 'child-1', name: '温湿度探头 A', subDeviceAddr: 'channel-01' },
  { id: 'child-2', name: '温湿度探头 B', subDeviceAddr: 'channel-02' },
  { id: 'child-3', name: '光照传感器', subDeviceAddr: 'channel-03' }
]

export const demoStatusHistory = () => [
  { status: 1, change_time: timestamp(2) },
  { status: 0, change_time: timestamp(48) },
  { status: 1, change_time: timestamp(52) },
  { status: 0, change_time: timestamp(260) },
  { status: 1, change_time: timestamp(268) }
]

export const demoDiagnostics = () => ({
  stats: {
    uplink: { success: 128, total: 132, success_rate: 97.0 },
    downlink: { success: 42, total: 44, success_rate: 95.5 },
    storage: { success: 170, total: 176, success_rate: 96.6 }
  },
  recent_failures: [
    { timestamp: timestamp(36), direction: 'uplink', stage: '消息解析', error: 'payload 字段缺少 humidity' },
    { timestamp: timestamp(210), direction: 'downlink', stage: '命令下发', error: '设备响应超时' },
    { timestamp: timestamp(385), direction: 'uplink', stage: '数据入库', error: '采样值超出校验范围' }
  ]
})

export const demoDebugLogs = () => [
  { ts: timestamp(2), level: 'INFO', message: 'telemetry message received' },
  { ts: timestamp(3), level: 'INFO', message: 'device status changed to online' },
  { ts: timestamp(36), level: 'WARN', message: 'payload missing field: humidity' },
  { ts: timestamp(52), level: 'INFO', message: 'reconnect handshake completed' }
]

export const demoAlarmHistory = () => [
  {
    id: 'alarm-1',
    create_at: timestamp(28),
    alarm_status: 'H',
    name: '温度过高',
    description: '温度达到 32.6°C，已恢复'
  },
  { id: 'alarm-2', create_at: timestamp(320), alarm_status: 'M', name: '电量不足', description: '电量低于 20%' },
  { id: 'alarm-3', create_at: timestamp(720), alarm_status: 'N', name: '温度恢复正常', description: '设备恢复稳定运行' }
]

export const demoAutomations = () => [
  { id: 'scene-1', name: '温度过高通知', status: 'enable', description: '温度超过 30°C 时发送通知' },
  { id: 'scene-2', name: '设备离线告警', status: 'enable', description: '设备离线超过 5 分钟时触发告警' }
]

export const demoAutomationLogs = () => [
  { executed_at: timestamp(28), detail: '温度过高通知：已发送至管理员', execution_result: 'S' },
  { executed_at: timestamp(210), detail: '设备离线告警：通知发送失败', execution_result: 'F' },
  { executed_at: timestamp(385), detail: '设备离线告警：条件未满足', execution_result: 'S' }
]
