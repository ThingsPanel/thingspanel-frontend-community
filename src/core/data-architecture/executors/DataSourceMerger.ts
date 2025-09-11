/**
 * 第三层：数据源合并器 (DataSourceMerger)
 * 职责：将多个数据项合并成数据源最终数据
 * 已集成 script-engine 安全脚本执行系统
 */

import { defaultScriptEngine } from '@/core/script-engine'

export type MergeStrategy =
  | {
      type: 'object'
      /** 拼接成大对象 */
    }
  | {
      type: 'array'
      /** 拼接成大数组 */
    }
  | {
      type: 'select'
      /** 选择其中一个数据项 */
      selectedIndex?: number
    }
  | {
      type: 'script'
      /** 自定义脚本处理list */
      script: string
    }

/**
 * 数据源合并器接口
 */
export interface IDataSourceMerger {
  /**
   * 根据策略合并数据项
   * @param items 处理后的数据项列表
   * @param strategy 合并策略
   * @returns 合并后的数据源最终数据，出错时返回 {}
   */
  mergeDataItems(items: any[], strategy: MergeStrategy): Promise<any>
}

/**
 * 数据源合并器实现类
 */
export class DataSourceMerger implements IDataSourceMerger {
  /**
   * 数据项合并主方法
   */
  async mergeDataItems(items: any[], strategy: MergeStrategy): Promise<any> {
    try {
      // 前置依赖检查：必须有数据项才能合并
      if (!items || items.length === 0) {
        return {}
      }

      // 智能默认策略选择
      const finalStrategy = this.selectDefaultStrategy(items, strategy)
      switch (finalStrategy.type) {
        case 'object':
          const objectResult = await this.mergeAsObject(items)
          return objectResult
        case 'array':
          const arrayResult = await this.mergeAsArray(items)
          return arrayResult
        case 'select':
          const selectResult = await this.selectOne(items, (finalStrategy as any).selectedIndex)
          return selectResult
        case 'script':
          const scriptResult = await this.mergeByScript(items, finalStrategy.script)
          return scriptResult
        default:
          return {}
      }
    } catch (error) {
      return {} // 统一错误处理：返回空对象
    }
  }

  /**
   * 智能默认策略选择
   * 单项时使用默认策略，多项时使用指定策略
   */
  private selectDefaultStrategy(items: any[], strategy: MergeStrategy): MergeStrategy {
    // 🔥 修复：无论单项还是多项，都使用用户指定的策略
    // 如果没有指定策略，则使用默认的 object 策略
    if (!strategy || !strategy.type) {
      return { type: 'object' }
    }
    return strategy
  }

  /**
   * 合并为大对象
   * 将多个数据项按索引或键合并到一个对象中
   */
  private async mergeAsObject(items: any[]): Promise<any> {
    try {
      const result: Record<string, any> = {}

      items.forEach((item, index) => {
        if (item !== null && item !== undefined) {
          // 如果数据项本身是对象，展开其属性
          if (typeof item === 'object' && !Array.isArray(item)) {
            Object.assign(result, item)
          } else {
            // 否则按索引放入结果对象
            result[`item_${index}`] = item
          }
        }
      })

      return result
    } catch (error) {
      return {}
    }
  }

  /**
   * 🔥 新增：选择其中一个数据项
   * 根据用户指定的索引返回特定的数据项
   */
  private async selectOne(items: any[], selectedIndex?: number): Promise<any> {
    try {
      // 默认选择第一个数据项（索引0）
      const index = selectedIndex ?? 0

      // 边界检查
      if (index < 0 || index >= items.length) {
        return items[0] ?? {}
      }

      const selectedItem = items[index]
      return selectedItem ?? {}
    } catch (error) {
      return {}
    }
  }

  /**
   * 合并为大数组
   * 将多个数据项拼接成一个数组
   */
  private async mergeAsArray(items: any[]): Promise<any[]> {
    try {
      const result: any[] = []

      for (const item of items) {
        if (item !== null && item !== undefined) {
          // 如果数据项本身是数组，展开其元素
          if (Array.isArray(item)) {
            result.push(...item)
          } else {
            // 否则直接添加到结果数组
            result.push(item)
          }
        }
      }

      return result
    } catch (error) {
      return []
    }
  }

  /**
   * 通过自定义脚本合并 (使用 script-engine 安全执行)
   * 传入数据项列表，让用户脚本处理
   */
  private async mergeByScript(items: any[], script: string): Promise<any> {
    try {
      // 创建脚本执行上下文
      const scriptContext = {
        items
        // script-engine 已内置 JSON, console, Math, Date, Array, Object 等
      }

      // 使用 script-engine 安全执行脚本
      const result = await defaultScriptEngine.execute(script, scriptContext)

      if (result.success) {
        return result.data !== undefined ? result.data : {}
      } else {
        return {} // 脚本失败时返回空对象
      }
    } catch (error) {
      return {} // 脚本失败时返回空对象
    }
  }

  /**
   * 验证合并策略的有效性
   */
  validateMergeStrategy(strategy: MergeStrategy): boolean {
    if (!strategy || !strategy.type) {
      return false
    }

    switch (strategy.type) {
      case 'object':
      case 'array':
      case 'select':
        return true
      case 'script':
        return !!(strategy as any).script
      default:
        return false
    }
  }

  /**
   * 获取推荐的合并策略
   * 基于数据项的类型推荐最佳合并策略
   */
  getRecommendedStrategy(items: any[]): MergeStrategy {
    if (!items || items.length === 0) {
      return { type: 'object' }
    }

    if (items.length === 1) {
      return { type: 'object' }
    }

    // 如果所有数据项都是数组，推荐array合并
    const allArrays = items.every(item => Array.isArray(item))
    if (allArrays) {
      return { type: 'array' }
    }

    // 如果所有数据项都是对象，推荐object合并
    const allObjects = items.every(item => item && typeof item === 'object' && !Array.isArray(item))
    if (allObjects) {
      return { type: 'object' }
    }

    // 默认使用array合并
    return { type: 'array' }
  }
}
