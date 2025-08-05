/**
 * 数据源注册
 */

import { dataSourceRegistry } from '../../core/data-source-registry'
import { DataSourceType } from '../../types/data-source'
import StaticDataSourceConfig from './StaticDataSourceConfig.vue'
import DeviceDataSourceConfig from './DeviceDataSourceConfig.vue'
import HttpDataSourceConfig from './HttpDataSourceConfig.vue'

// 注册数据源配置组件
dataSourceRegistry.register(DataSourceType.STATIC, {
  type: DataSourceType.STATIC,
  name: '静态数据',
  description: '使用JSON格式的静态数据',
  icon: '📄',
  component: StaticDataSourceConfig,
  defaultConfig: {
    type: DataSourceType.STATIC,
    enabled: true,
    name: '静态数据源',
    description: 'JSON格式的静态数据',
    data: {},
    dataPath: '',
    refreshInterval: 0
  }
})

dataSourceRegistry.register(DataSourceType.DEVICE, {
  type: DataSourceType.DEVICE,
  name: '设备数据',
  description: '从设备获取实时数据',
  icon: '📱',
  component: DeviceDataSourceConfig,
  defaultConfig: {
    type: DataSourceType.DEVICE,
    enabled: true,
    name: '设备数据源',
    description: '从设备获取实时数据',
    deviceId: '',
    metricsId: '',
    metricsType: 'telemetry',
    metricsName: '',
    dataPath: ''
  }
})

dataSourceRegistry.register(DataSourceType.HTTP, {
  type: DataSourceType.HTTP,
  name: 'HTTP请求',
  description: '通过HTTP请求获取数据',
  icon: '🌐',
  component: HttpDataSourceConfig,
  defaultConfig: {
    type: DataSourceType.HTTP,
    enabled: true,
    name: 'HTTP数据源',
    description: '通过HTTP请求获取数据',
    method: 'GET',
    url: '',
    headers: [],
    dataPath: '',
    refreshInterval: 5000
  }
})

console.log('🔧 [DataSourceRegistry] 数据源注册完成')
