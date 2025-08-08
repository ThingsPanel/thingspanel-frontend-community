/**
 * 数据源注册表
 */

import type {
  DataSourceType,
  DataSourceConfigComponent,
  DataSourceRegistry
} from '@/components/visual-editor/types/data-source'

class DataSourceRegistryImpl implements DataSourceRegistry {
  private registry = new Map<DataSourceType, DataSourceConfigComponent>()

  register(type: DataSourceType, config: DataSourceConfigComponent): void {
    this.registry.set(type, config)
    console.log(`🔧 [DataSourceRegistry] 注册数据源: ${type}`)
  }

  get(type: DataSourceType): DataSourceConfigComponent | undefined {
    return this.registry.get(type)
  }

  getAll(): DataSourceConfigComponent[] {
    return Array.from(this.registry.values())
  }

  has(type: DataSourceType): boolean {
    return this.registry.has(type)
  }

  clear(): void {
    this.registry.clear()
  }
}

// 导出单例
export const dataSourceRegistry = new DataSourceRegistryImpl()
export default dataSourceRegistry
