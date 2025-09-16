import { watch } from 'vue'
import { cloneDeep } from 'lodash-es'
import type {
  ComponentId,
  ComponentInstance,
  Panel,
  DataType,
  DataSource,
  EventBus,
  EventType,
  Component,
} from '../types'
import { reactiveDataManager, type IReactiveDataManager } from './reactive-data-manager'
import { dataSourceManager, type IDataSourceManager } from './data-source-manager'

// 定义数据绑定管理器的接口
export interface IDataBindingManager {
  reactiveDataManager: IReactiveDataManager
  dataSourceManager: IDataSourceManager
  bind(componentId: ComponentId, panel: Panel, eventBus: EventBus): void
  unbind(componentId: ComponentId): void
}

// 数据绑定管理器的实现
class DataBindingManager implements IDataBindingManager {
  public reactiveDataManager: IReactiveDataManager
  public dataSourceManager: IDataSourceManager

  constructor(
    reactiveDataManager: IReactiveDataManager,
    dataSourceManager: IDataSourceManager,
  ) {
    this.reactiveDataManager = reactiveDataManager
    this.dataSourceManager = dataSourceManager
  }

  // 绑定数据源到组件
  public bind(componentId: ComponentId, panel: Panel, eventBus: EventBus): void {
    const component = panel.getComponent(componentId)
    if (!component) return

    const { dataSource } = component.props
    if (!dataSource) return

    const container = this.reactiveDataManager.createContainer(
      componentId,
      panel,
      eventBus,
      component.props,
      dataSource,
    )

    // 监听数据源变化
    watch(
      () => this.dataSourceManager.getDataSource(dataSource.id),
      (newData) => {
        if (newData) {
          container.setData(cloneDeep(newData.data))
        }
      },
      { deep: true, immediate: true },
    )
  }

  // 解绑数据源
  public unbind(componentId: ComponentId): void {
    this.reactiveDataManager.removeContainer(componentId)
  }
}

export const dataBindingManager = new DataBindingManager(
  reactiveDataManager,
  dataSourceManager,
)

