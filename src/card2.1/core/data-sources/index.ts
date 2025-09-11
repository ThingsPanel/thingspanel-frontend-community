/**
 * 数据源服务集合
 * 统一导出和注册所有数据源服务
 */

import { dataSourceCenter } from '@/card2.1/core/data-source-center'
import { StaticDataSourceService } from '@/card2.1/core/data-sources/static-data-source-service'

/**
 * 初始化和注册所有数据源类型
 */
export function initializeDataSources() {
  // 注册静态数据源
  dataSourceCenter.registerDataSourceType('static', StaticDataSourceService)
}

// 导出数据源服务类
export { StaticDataSourceService }
export type { StaticDataSourceConfig } from '@/card2.1/core/data-sources/static-data-source-service'

// 导出数据源中心
export { dataSourceCenter } from '@/card2.1/core/data-source-center'
export type { DataSourceService, DataSourceSubscription } from '@/card2.1/core/data-source-center'
