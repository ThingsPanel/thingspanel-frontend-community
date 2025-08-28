/**
 * 第三层：数据源合并器 (DataSourceMerger)
 * 职责：将多个数据项合并成数据源最终数据
 */

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
        console.warn('DataSourceMerger: 数据项列表为空，返回空对象')
        return {}
      }

      // 智能默认策略选择
      const finalStrategy = this.selectDefaultStrategy(items, strategy)

      switch (finalStrategy.type) {
        case 'object':
          return await this.mergeAsObject(items)
        case 'array':
          return await this.mergeAsArray(items)
        case 'select':
          return await this.selectOne(items, (finalStrategy as any).selectedIndex)
        case 'script':
          return await this.mergeByScript(items, finalStrategy.script)
        default:
          console.warn('DataSourceMerger: 未知的合并策略', finalStrategy)
          return {}
      }
    } catch (error) {
      console.error('DataSourceMerger: 数据合并失败', error)
      return {} // 统一错误处理：返回空对象
    }
  }

  /**
   * 智能默认策略选择
   * 单项时使用默认策略，多项时使用指定策略
   */
  private selectDefaultStrategy(items: any[], strategy: MergeStrategy): MergeStrategy {
    // 如果只有一个数据项，直接返回该项
    if (items.length === 1) {
      return { type: 'object' } // 单项默认为object策略
    }

    // 多项时使用指定策略
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
      console.error('DataSourceMerger: 对象合并失败', error)
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
        console.warn(`DataSourceMerger: 选择索引 ${index} 超出范围 (0-${items.length-1})，返回第一个数据项`)
        return items[0] ?? {}
      }

      const selectedItem = items[index]
      console.log(`✅ DataSourceMerger: 选择第${index + 1}个数据项 (共${items.length}个)`, selectedItem)
      
      return selectedItem ?? {}
    } catch (error) {
      console.error('DataSourceMerger: 选择数据项失败', error)
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
      console.error('DataSourceMerger: 数组合并失败', error)
      return []
    }
  }

  /**
   * 通过自定义脚本合并
   * 传入数据项列表，让用户脚本处理
   */
  private async mergeByScript(items: any[], script: string): Promise<any> {
    try {
      // 创建脚本执行上下文
      const scriptContext = {
        items,
        JSON,
        console,
        Math,
        Date,
        Array,
        Object
      }

      // 脚本执行
      const func = new Function(
        'context',
        `
        with(context) {
          return (function(list) {
            ${script}
          })(items);
        }
      `
      )

      const result = await func(scriptContext)
      return result !== undefined ? result : {}
    } catch (error) {
      console.error('DataSourceMerger: 自定义脚本合并失败', error)
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
