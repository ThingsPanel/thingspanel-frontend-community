/**
 * 脚本执行上下文管理器
 * 管理脚本执行时的上下文环境，包括变量和函数
 */

import type { IScriptContextManager, ScriptExecutionContext } from './types'
import { nanoid } from 'nanoid'
import { smartDeepClone } from '@/utils/deep-clone'

/**
 * 脚本上下文管理器实现类
 */
export class ScriptContextManager implements IScriptContextManager {
  private contexts: Map<string, ScriptExecutionContext>

  constructor() {
    this.contexts = new Map()
    this.initializeDefaultContexts()
  }

  /**
   * 创建执行上下文
   */
  createContext(name: string, variables: Record<string, any> = {}): ScriptExecutionContext {
    const now = Date.now()
    const context: ScriptExecutionContext = {
      id: nanoid(),
      name,
      variables: { ...variables },
      functions: this.createBuiltinFunctions(),
      createdAt: now,
      updatedAt: now
    }

    this.contexts.set(context.id, context)
    return context
  }

  /**
   * 获取上下文
   */
  getContext(id: string): ScriptExecutionContext | null {
    return this.contexts.get(id) || null
  }

  /**
   * 获取所有上下文
   */
  getAllContexts(): ScriptExecutionContext[] {
    return Array.from(this.contexts.values())
  }

  /**
   * 根据名称查找上下文
   */
  getContextByName(name: string): ScriptExecutionContext | null {
    for (const context of this.contexts.values()) {
      if (context.name === name) {
        return context
      }
    }
    return null
  }

  /**
   * 更新上下文
   */
  updateContext(id: string, updates: Partial<ScriptExecutionContext>): boolean {
    const context = this.contexts.get(id)
    if (!context) {
      return false
    }

    const updatedContext: ScriptExecutionContext = {
      ...context,
      ...updates,
      id, // 确保ID不被修改
      updatedAt: Date.now()
    }

    this.contexts.set(id, updatedContext)
    return true
  }

  /**
   * 删除上下文
   */
  deleteContext(id: string): boolean {
    return this.contexts.delete(id)
  }

  /**
   * 克隆上下文
   */
  cloneContext(id: string, newName: string): ScriptExecutionContext | null {
    const sourceContext = this.contexts.get(id)
    if (!sourceContext) {
      return null
    }

    const now = Date.now()
    const clonedContext: ScriptExecutionContext = {
      id: nanoid(),
      name: newName,
      variables: smartDeepClone(sourceContext.variables), // 使用智能深拷贝
      functions: { ...sourceContext.functions }, // 函数浅拷贝即可
      createdAt: now,
      updatedAt: now
    }

    this.contexts.set(clonedContext.id, clonedContext)
    return clonedContext
  }

  /**
   * 合并上下文
   */
  mergeContexts(sourceId: string, targetId: string): boolean {
    const sourceContext = this.contexts.get(sourceId)
    const targetContext = this.contexts.get(targetId)

    if (!sourceContext || !targetContext) {
      return false
    }

    // 合并变量（目标上下文的变量优先）
    const mergedVariables = {
      ...sourceContext.variables,
      ...targetContext.variables
    }

    // 合并函数（目标上下文的函数优先）
    const mergedFunctions = {
      ...sourceContext.functions,
      ...targetContext.functions
    }

    // 更新目标上下文
    return this.updateContext(targetId, {
      variables: mergedVariables,
      functions: mergedFunctions
    })
  }

  /**
   * 添加变量到上下文
   */
  addVariable(contextId: string, name: string, value: any): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    context.variables[name] = value
    context.updatedAt = Date.now()
    return true
  }

  /**
   * 移除上下文中的变量
   */
  removeVariable(contextId: string, name: string): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    delete context.variables[name]
    context.updatedAt = Date.now()
    return true
  }

  /**
   * 添加函数到上下文
   */
  addFunction(contextId: string, name: string, func: Function): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    context.functions[name] = func
    context.updatedAt = Date.now()
    return true
  }

  /**
   * 移除上下文中的函数
   */
  removeFunction(contextId: string, name: string): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    delete context.functions[name]
    context.updatedAt = Date.now()
    return true
  }

  /**
   * 创建内置函数
   */
  private createBuiltinFunctions(): Record<string, Function> {
    return {
      // 数学函数
      random: Math.random,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      abs: Math.abs,
      max: Math.max,
      min: Math.min,

      // 字符串函数
      trim: (str: string) => str.trim(),
      toUpperCase: (str: string) => str.toUpperCase(),
      toLowerCase: (str: string) => str.toLowerCase(),
      replace: (str: string, search: string | RegExp, replacement: string) => str.replace(search, replacement),

      // 数组函数
      arrayMap: <T, R>(arr: T[], callback: (item: T, index: number) => R) => arr.map(callback),
      arrayFilter: <T>(arr: T[], callback: (item: T, index: number) => boolean) => arr.filter(callback),
      arrayReduce: <T, R>(arr: T[], callback: (acc: R, item: T, index: number) => R, initial: R) =>
        arr.reduce(callback, initial),
      arraySort: <T>(arr: T[], compareFunction?: (a: T, b: T) => number) => [...arr].sort(compareFunction),
      arrayUnique: <T>(arr: T[]) => [...new Set(arr)],

      // 对象函数
      objectKeys: Object.keys,
      objectValues: Object.values,
      objectEntries: Object.entries,
      objectAssign: Object.assign,

      // 类型检查函数
      isArray: Array.isArray,
      isString: (value: any) => typeof value === 'string',
      isNumber: (value: any) => typeof value === 'number',
      isBoolean: (value: any) => typeof value === 'boolean',
      isObject: (value: any) => typeof value === 'object' && value !== null,
      isFunction: (value: any) => typeof value === 'function',
      isUndefined: (value: any) => value === undefined,
      isNull: (value: any) => value === null,

      // 转换函数
      toString: String,
      toNumber: Number,
      parseJSON: JSON.parse,
      stringifyJSON: JSON.stringify,

      // 时间函数
      getCurrentTime: () => Date.now(),
      getCurrentDate: () => new Date(),
      formatDate: (date: Date | number, format: string = 'YYYY-MM-DD HH:mm:ss') => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        const seconds = String(d.getSeconds()).padStart(2, '0')

        return format
          .replace('YYYY', year.toString())
          .replace('MM', month)
          .replace('DD', day)
          .replace('HH', hours)
          .replace('mm', minutes)
          .replace('ss', seconds)
      }
    }
  }

  /**
   * 初始化默认上下文
   */
  private initializeDefaultContexts(): void {
    // 创建默认上下文
    this.createDefaultContext()

    // 创建数据处理上下文
    this.createDataProcessingContext()

    // 创建物联网设备上下文
    this.createIoTDeviceContext()
  }

  /**
   * 创建默认上下文
   */
  private createDefaultContext(): void {
    const context = this.createContext('默认上下文', {
      appName: 'ThingsPanel',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      currentUser: {
        id: 'guest',
        name: '访客用户',
        role: 'viewer'
      }
    })

    // 添加常用工具函数
    this.addFunction(context.id, 'generateId', () => nanoid())
    this.addFunction(context.id, 'sleep', (ms: number) => new Promise(resolve => setTimeout(resolve, ms)))
    this.addFunction(context.id, 'retry', async (fn: Function, maxAttempts: number = 3, delay: number = 1000) => {
      let lastError: Error
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn()
        } catch (error) {
          lastError = error as Error
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      throw lastError!
    })
  }

  /**
   * 创建数据处理上下文
   */
  private createDataProcessingContext(): void {
    const context = this.createContext('数据处理上下文', {
      dataSource: 'default',
      batchSize: 100,
      timeout: 30000
    })

    // 添加数据处理函数
    this.addFunction(context.id, 'validateData', (data: any, schema: any) => {
      // 简单的数据验证
      if (schema.required && !data) {
        throw new Error('数据不能为空')
      }
      return true
    })

    this.addFunction(context.id, 'transformData', (data: any, transformer: Function) => {
      if (Array.isArray(data)) {
        return data.map(transformer)
      }
      return transformer(data)
    })
  }

  /**
   * 创建物联网设备上下文
   */
  private createIoTDeviceContext(): void {
    const context = this.createContext('IoT设备上下文', {
      deviceProtocol: 'mqtt',
      sampleRate: 1000, // 毫秒
      deviceTypes: ['sensor', 'actuator', 'gateway'],
      dataFormat: 'json'
    })

    // 添加IoT相关函数
    this.addFunction(context.id, 'parseDeviceMessage', (message: string) => {
      try {
        return JSON.parse(message)
      } catch {
        return { raw: message }
      }
    })

    this.addFunction(context.id, 'generateDeviceData', (deviceType: string) => {
      const baseData = {
        deviceId: nanoid(),
        timestamp: new Date().toISOString(),
        type: deviceType
      }

      switch (deviceType) {
        case 'sensor':
          return {
            ...baseData,
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 40,
            pressure: 1000 + Math.random() * 50
          }
        case 'actuator':
          return {
            ...baseData,
            status: Math.random() > 0.5 ? 'on' : 'off',
            power: Math.random() * 100
          }
        case 'gateway':
          return {
            ...baseData,
            connectedDevices: Math.floor(Math.random() * 20),
            uptime: Math.floor(Math.random() * 86400)
          }
        default:
          return baseData
      }
    })
  }
}
