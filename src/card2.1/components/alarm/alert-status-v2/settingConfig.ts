/**
 * 告警状态组件 V2 配置定义
 * 标准4属性实现，用于演示正确的单属性绑定机制
 */

export interface AlertStatusV2Customize {
  /** 标题 */
  title?: string
  /** 金额 */
  amount?: number
  /** 状态 */
  status?: string
  /** 描述 */
  description?: string
}

/**
 * 告警状态V2配置接口
 */
export interface AlertStatusV2Config {
  type: 'alert-status-v2'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: AlertStatusV2Customize
}

/**
 * 默认自定义配置
 */
export const customConfig: AlertStatusV2Customize = {
  title: '告警状态',
  amount: 0,
  status: '正常',
  description: '系统运行正常'
}

/**
 * 告警状态V2设置配置 - 按分组结构
 */
export const alertStatusV2SettingConfig = [
  {
    group: '基本配置',
    items: [
      {
        key: 'title',
        label: '标题',
        type: 'input',
        defaultValue: '告警状态',
        placeholder: '请输入标题'
      },
      {
        key: 'amount',
        label: '金额',
        type: 'number',
        defaultValue: 0,
        placeholder: '请输入金额'
      },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        defaultValue: '正常',
        options: [
          { label: '正常', value: '正常' },
          { label: '警告', value: '警告' },
          { label: '错误', value: '错误' },
          { label: '离线', value: '离线' }
        ]
      },
      {
        key: 'description',
        label: '描述',
        type: 'textarea',
        defaultValue: '系统运行正常',
        placeholder: '请输入描述'
      }
    ]
  }
]

export default alertStatusV2SettingConfig