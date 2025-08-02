/**
 * 组件注册表实现
 * 提供组件的注册、查找、管理等功能
 */

import type {
  IComponentDefinition,
  IComponentRegistry,
  IComponentInstance,
  IComponentFactory
} from '../types/component'
import type { RendererType } from '../types/index'

/**
 * 组件工厂实现
 */
export class ComponentFactory implements IComponentFactory {
  private instanceCounter = 0

  createInstance(definition: IComponentDefinition, config: any, data?: any): IComponentInstance {
    const instanceId = `${definition.meta.id}_${++this.instanceCounter}_${Date.now()}`

    const instance: IComponentInstance = {
      id: instanceId,
      definition,
      config: { ...definition.config.defaultConfig, ...config },
      data: data || null,
      state: 'created',
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),

      updateConfig(newConfig: any) {
        const oldConfig = this.config
        this.config = { ...this.config, ...newConfig }
        this.lastUpdatedAt = Date.now()

        // 触发配置变更钩子
        if (definition.logic.onConfigChanged) {
          definition.logic.onConfigChanged(this.config, oldConfig, {
            instance: this,
            data: this.data,
            config: this.config,
            updateData: this.updateData.bind(this),
            updateConfig: this.updateConfig.bind(this),
            emit: () => {},
            on: () => {},
            off: () => {},
            getInstance: () => undefined,
            getParent: () => undefined,
            getChildren: () => []
          })
        }
      },

      updateData(newData: any) {
        const oldData = this.data
        this.data = newData
        this.lastUpdatedAt = Date.now()

        // 触发数据变更钩子
        if (definition.logic.onDataChanged) {
          definition.logic.onDataChanged(this.data, oldData, {
            instance: this,
            data: this.data,
            config: this.config,
            updateData: this.updateData.bind(this),
            updateConfig: this.updateConfig.bind(this),
            emit: () => {},
            on: () => {},
            off: () => {},
            getInstance: () => undefined,
            getParent: () => undefined,
            getChildren: () => []
          })
        }
      },

      destroy() {
        this.state = 'unmounted'

        // 触发卸载钩子
        if (definition.logic.onUnmounted) {
          definition.logic.onUnmounted({
            instance: this,
            data: this.data,
            config: this.config,
            updateData: this.updateData.bind(this),
            updateConfig: this.updateConfig.bind(this),
            emit: () => {},
            on: () => {},
            off: () => {},
            getInstance: () => undefined,
            getParent: () => undefined,
            getChildren: () => []
          })
        }
      },

      getState() {
        return {
          id: this.id,
          state: this.state,
          config: this.config,
          data: this.data,
          createdAt: this.createdAt,
          lastUpdatedAt: this.lastUpdatedAt
        }
      },

      setState(state: any) {
        Object.assign(this, state)
        this.lastUpdatedAt = Date.now()
      }
    }

    return instance
  }

  validateDefinition(definition: IComponentDefinition): boolean | string {
    // 验证必需字段
    if (!definition.meta?.id) {
      return '组件定义缺少meta.id字段'
    }

    if (!definition.meta?.name) {
      return '组件定义缺少meta.name字段'
    }

    if (!definition.meta?.version) {
      return '组件定义缺少meta.version字段'
    }

    if (!definition.logic) {
      return '组件定义缺少logic字段'
    }

    if (!definition.views || Object.keys(definition.views).length === 0) {
      return '组件定义缺少views字段或views为空'
    }

    if (!definition.config?.schema) {
      return '组件定义缺少config.schema字段'
    }

    if (!definition.config?.defaultConfig) {
      return '组件定义缺少config.defaultConfig字段'
    }

    // 验证配置
    if (definition.config.validator) {
      const validationResult = definition.config.validator(definition.config.defaultConfig)
      if (validationResult !== true) {
        return `默认配置验证失败: ${validationResult}`
      }
    }

    return true
  }

  cloneInstance(instance: IComponentInstance): IComponentInstance {
    return this.createInstance(
      instance.definition,
      { ...instance.config },
      instance.data ? JSON.parse(JSON.stringify(instance.data)) : undefined
    )
  }
}

/**
 * 组件注册表实现
 */
export class ComponentRegistry implements IComponentRegistry {
  private definitions = new Map<string, IComponentDefinition>()
  private factory = new ComponentFactory()

  register(definition: IComponentDefinition): void {
    // 验证组件定义
    const validationResult = this.validateDefinition(definition)
    if (validationResult !== true) {
      throw new Error(`组件注册失败: ${validationResult}`)
    }

    // 检查是否已存在
    if (this.definitions.has(definition.meta.id)) {
      console.warn(`组件 ${definition.meta.id} 已存在，将被覆盖`)
    }

    this.definitions.set(definition.meta.id, definition)
    console.log(`组件 ${definition.meta.id} 注册成功`)
  }

  unregister(componentId: string): void {
    if (this.definitions.has(componentId)) {
      this.definitions.delete(componentId)
      console.log(`组件 ${componentId} 注销成功`)
    } else {
      console.warn(`组件 ${componentId} 不存在，无法注销`)
    }
  }

  getDefinition(componentId: string): IComponentDefinition | undefined {
    return this.definitions.get(componentId)
  }

  getAllDefinitions(): IComponentDefinition[] {
    return Array.from(this.definitions.values())
  }

  getByCategory(category: string): IComponentDefinition[] {
    return Array.from(this.definitions.values()).filter(def => def.meta.category === category)
  }

  getByRenderer(rendererType: RendererType): IComponentDefinition[] {
    return Array.from(this.definitions.values()).filter(def => def.views[rendererType] !== undefined)
  }

  search(query: string): IComponentDefinition[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.definitions.values()).filter(
      def =>
        def.meta.name.toLowerCase().includes(lowerQuery) ||
        def.meta.id.toLowerCase().includes(lowerQuery) ||
        (def.meta.description && def.meta.description.toLowerCase().includes(lowerQuery)) ||
        (def.meta.tags && def.meta.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    )
  }

  createInstance(componentId: string, config: any, data?: any): IComponentInstance {
    const definition = this.getDefinition(componentId)
    if (!definition) {
      throw new Error(`组件 ${componentId} 不存在`)
    }

    return this.factory.createInstance(definition, config, data)
  }

  validateDefinition(definition: IComponentDefinition): boolean | string {
    return this.factory.validateDefinition(definition)
  }

  getStats() {
    const definitions = this.getAllDefinitions()
    const byCategory: Record<string, number> = {}
    const byRenderer: Record<RendererType, number> = {
      vue: 0,
      react: 0,
      angular: 0,
      svelte: 0,
      canvas: 0,
      webgl: 0
    }

    definitions.forEach(def => {
      // 统计分类
      const category = def.meta.category || 'unknown'
      byCategory[category] = (byCategory[category] || 0) + 1

      // 统计渲染器
      Object.keys(def.views).forEach(renderer => {
        if (renderer in byRenderer) {
          byRenderer[renderer as RendererType]++
        }
      })
    })

    return {
      total: definitions.length,
      byCategory,
      byRenderer
    }
  }
}

// 导出单例实例
export const componentRegistry = new ComponentRegistry()
