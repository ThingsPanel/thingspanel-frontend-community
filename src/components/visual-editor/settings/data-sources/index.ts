/**
 * 数据源注册
 */

import { dataSourceRegistry } from '../../core/data-source-registry'
import { DataSourceType } from '../../types/data-source'
import StaticDataSourceConfig from './StaticDataSourceConfig.vue'
import DeviceDataSourceConfig from './DeviceDataSourceConfig.vue'
import HttpDataSourceConfig from './HttpDataSourceConfig.vue'

// 注册数据源配置组件
dataSourceRegistry.register(DataSourceType.STATIC, StaticDataSourceConfig)
dataSourceRegistry.register(DataSourceType.DEVICE, DeviceDataSourceConfig)
dataSourceRegistry.register(DataSourceType.HTTP, HttpDataSourceConfig)

console.log('🔧 [DataSourceRegistry] 数据源注册完成')
