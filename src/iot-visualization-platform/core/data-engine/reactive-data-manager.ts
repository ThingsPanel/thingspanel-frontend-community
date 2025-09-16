import { reactive, watch } from 'vue'
import { cloneDeep } from 'lodash-es'
import {
  type ComponentId,
  type ComponentInstance,
  type Panel,
  type DataType,
  type DataSource,
  type EventBus,
  type EventType,
  type Component,
} from '../types'
import {
  dataSourceManager,
  type IDataSourceManager,
} from './data-source-manager'
import { type IPanelConfigurationManager } from './panel-configuration-manager'
import { type IRuntimeDataSourceManager } from './runtime-data-manager'
import { type IComponent } from '../components/icomponent'

// 定义响应式数据管理器的接口
export interface IReactiveDataContainer {
  data: Record<string, any>
  dataSource: DataSource
  componentId: ComponentId
  panel: Panel
  eventBus: EventBus
  addComponent(component: ComponentInstance): void
  removeComponent(componentId: ComponentId): void
  getComponent(componentId: ComponentId): ComponentInstance | undefined
  getComponents(): ComponentInstance[]
  getComponentIds(): ComponentId[]
  getPanel(): Panel
  setPanel(panel: Panel): void
  getData(): Record<string, any>
  setData(data: Record<string, any>): void
  getDataSource(): DataSource
  setDataSource(dataSource: DataSource): void
  getEventBus(): EventBus
  setEventBus(eventBus: EventBus): void
}

// 响应式数据容器的实现
class ReactiveDataContainer implements IReactiveDataContainer {
  public data: Record<string, any> = reactive({})
  public dataSource: DataSource = reactive({} as DataSource)
  public componentId: ComponentId = ''
  public panel: Panel = reactive({} as Panel)
  public eventBus: EventBus = reactive({} as EventBus)
  private components: Map<ComponentId, ComponentInstance> = new Map()

  constructor(
    componentId: ComponentId,
    panel: Panel,
    eventBus: EventBus,
    initialData?: Record<string, any>,
    initialDataSource?: DataSource,
  ) {
    this.componentId = componentId
    this.panel = panel
    this.eventBus = eventBus
    if (initialData) {
      this.data = reactive(initialData)
    }
    if (initialDataSource) {
      this.dataSource = reactive(initialDataSource)
    }
  }

  public addComponent(component: ComponentInstance): void {
    this.components.set(component.id, component)
  }

  public removeComponent(componentId: ComponentId): void {
    this.components.delete(componentId)
  }

  public getComponent(componentId: ComponentId): ComponentInstance | undefined {
    return this.components.get(componentId)
  }

  public getComponents(): ComponentInstance[] {
    return Array.from(this.components.values())
  }

  public getComponentIds(): ComponentId[] {
    return Array.from(this.components.keys())
  }

  public getPanel(): Panel {
    return this.panel
  }

  public setPanel(panel: Panel): void {
    this.panel = panel
  }

  public getData(): Record<string, any> {
    return this.data
  }

  public setData(data: Record<string, any>): void {
    this.data = reactive(data)
  }

  public getDataSource(): DataSource {
    return this.dataSource
  }

  public setDataSource(dataSource: DataSource): void {
    this.dataSource = reactive(dataSource)
  }

  public getEventBus(): EventBus {
    return this.eventBus
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus
  }
}

// 定义响应式数据管理器的接口
export interface IReactiveDataManager {
  containers: Map<ComponentId, IReactiveDataContainer>
  createContainer(
    componentId: ComponentId,
    panel: Panel,
    eventBus: EventBus,
    initialData?: Record<string, any>,
    initialDataSource?: DataSource,
  ): IReactiveDataContainer
  getContainer(componentId: ComponentId): IReactiveDataContainer | undefined
  removeContainer(componentId: ComponentId): void
  clearContainers(): void
  getDataSourceManager(): IDataSourceManager
}

// 响应式数据管理器的实现
class ReactiveDataManager implements IReactiveDataManager {
  public containers: Map<ComponentId, IReactiveDataContainer> = new Map()
  private dataSourceManager: IDataSourceManager

  constructor(dataSourceManager: IDataSourceManager) {
    this.dataSourceManager = dataSourceManager
  }

  public createContainer(
    componentId: ComponentId,
    panel: Panel,
    eventBus: EventBus,
    initialData?: Record<string, any>,
    initialDataSource?: DataSource,
  ): IReactiveDataContainer {
    const container = new ReactiveDataContainer(
      componentId,
      panel,
      eventBus,
      initialData,
      initialDataSource,
    )
    this.containers.set(componentId, container)
    return container
  }

  public getContainer(
    componentId: ComponentId,
  ): IReactiveDataContainer | undefined {
    return this.containers.get(componentId)
  }

  public removeContainer(componentId: ComponentId): void {
    this.containers.delete(componentId)
  }

  public clearContainers(): void {
    this.containers.clear()
  }

  public getDataSourceManager(): IDataSourceManager {
    return this.dataSourceManager
  }
}

export const reactiveDataManager = new ReactiveDataManager(dataSourceManager)