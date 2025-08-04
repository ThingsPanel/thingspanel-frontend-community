/**
 * 数据路径解析工具
 * 支持解析复杂的数据结构，如 "data.value" 或 "data[0].value"
 */

import type { DataPathResolver } from '../types/data-source'

class DataPathResolverImpl implements DataPathResolver {
  /**
   * 解析数据路径
   * @param data 原始数据
   * @param path 数据路径，如 "data.value" 或 "data[0].value"
   * @returns 解析后的值
   */
  resolve(data: any, path?: string): any {
    if (!path || path === '') {
      return data
    }

    try {
      // 将路径转换为安全的访问方式
      const pathParts = this.parsePath(path)
      let result = data

      for (const part of pathParts) {
        if (result === null || result === undefined) {
          return undefined
        }

        if (typeof part === 'number') {
          // 数组索引
          if (Array.isArray(result)) {
            result = result[part]
          } else {
            return undefined
          }
        } else {
          // 对象属性
          if (typeof result === 'object' && result !== null) {
            result = result[part]
          } else {
            return undefined
          }
        }
      }

      return result
    } catch (error) {
      console.warn('数据路径解析失败:', error)
      return undefined
    }
  }

  /**
   * 获取可用的数据路径
   * @param data 原始数据
   * @returns 可用的路径列表
   */
  getAvailablePaths(data: any): string[] {
    const paths: string[] = []

    if (data === null || data === undefined) {
      return paths
    }

    // 添加根路径
    paths.push('')

    // 递归获取所有路径，限制最大数量
    this.collectPaths(data, '', paths, 0, 100) // 限制最多100个路径

    return paths
  }

  /**
   * 解析路径字符串
   * @param path 路径字符串
   * @returns 路径部分数组
   */
  private parsePath(path: string): (string | number)[] {
    const parts: (string | number)[] = []
    let current = ''
    let inBrackets = false
    let bracketContent = ''

    for (let i = 0; i < path.length; i++) {
      const char = path[i]

      if (char === '[') {
        if (current) {
          parts.push(current)
          current = ''
        }
        inBrackets = true
        bracketContent = ''
      } else if (char === ']') {
        inBrackets = false
        const index = parseInt(bracketContent, 10)
        if (!isNaN(index)) {
          parts.push(index)
        }
        bracketContent = ''
      } else if (char === '.') {
        if (inBrackets) {
          bracketContent += char
        } else {
          if (current) {
            parts.push(current)
            current = ''
          }
        }
      } else {
        if (inBrackets) {
          bracketContent += char
        } else {
          current += char
        }
      }
    }

    if (current) {
      parts.push(current)
    }

    return parts
  }

  /**
   * 递归收集所有可用路径
   * @param data 数据
   * @param currentPath 当前路径
   * @param paths 路径集合
   */
  private collectPaths(data: any, currentPath: string, paths: string[], currentCount: number, maxCount: number): void {
    if (data === null || data === undefined) {
      return
    }

    if (currentCount >= maxCount) {
      return
    }

    if (Array.isArray(data)) {
      // 数组 - 限制最多处理前10个元素
      const maxArrayItems = Math.min(data.length, 10)
      for (let index = 0; index < maxArrayItems; index++) {
        const item = data[index]
        const newPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`
        paths.push(newPath)

        // 递归处理数组元素
        if (typeof item === 'object' && item !== null) {
          this.collectPaths(item, newPath, paths, currentCount + 1, maxCount)
        }
      }
    } else if (typeof data === 'object') {
      // 对象 - 限制最多处理前20个属性
      const keys = Object.keys(data)
      const maxObjectKeys = Math.min(keys.length, 20)
      
      for (let i = 0; i < maxObjectKeys; i++) {
        const key = keys[i]
        const newPath = currentPath ? `${currentPath}.${key}` : key
        paths.push(newPath)

        // 递归处理对象属性
        const value = data[key]
        if (typeof value === 'object' && value !== null) {
          this.collectPaths(value, newPath, paths, currentCount + 1, maxCount)
        }
      }
    }
  }

  /**
   * 格式化路径显示
   * @param path 路径
   * @returns 格式化的路径字符串
   */
  formatPath(path: string): string {
    if (!path) return '根数据'
    return path
  }

  /**
   * 验证路径是否有效
   * @param data 数据
   * @param path 路径
   * @returns 是否有效
   */
  isValidPath(data: any, path: string): boolean {
    const result = this.resolve(data, path)
    return result !== undefined
  }
}

// 导出单例
export const dataPathResolver = new DataPathResolverImpl()
export default dataPathResolver
