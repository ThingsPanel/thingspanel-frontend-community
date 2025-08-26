/**
 * 简单参数替换器
 * 就做一件事：把字符串中的 ${参数名} 替换成实际值
 */

/**
 * 简单的参数上下文类型
 */
export interface SimpleParamContext {
  [key: string]: any
}

/**
 * 简单参数替换器
 */
export class SimpleParamReplacer {
  /**
   * 替换字符串中的参数
   * @param template 模板字符串，如 "/device/${deviceId}/data"
   * @param params 参数对象，如 { deviceId: '123' }
   * @returns 替换后的字符串
   */
  static replace(template: string, params: SimpleParamContext): string {
    if (!template || !params) {
      return template
    }

    return template.replace(/\$\{([^}]+)\}/g, (match, paramName) => {
      const value = params[paramName]
      if (value === undefined || value === null) {
        console.warn(`⚠️ 参数 ${paramName} 未找到，保持原样`)
        return match
      }
      return String(value)
    })
  }

  /**
   * 替换对象中所有字符串值的参数
   * @param obj 要处理的对象
   * @param params 参数对象
   * @returns 替换后的对象
   */
  static replaceObject<T>(obj: T, params: SimpleParamContext): T {
    if (!obj || !params) {
      return obj
    }

    const result = JSON.parse(JSON.stringify(obj)) // 深拷贝

    const processValue = (value: any): any => {
      if (typeof value === 'string') {
        return this.replace(value, params)
      } else if (Array.isArray(value)) {
        return value.map(processValue)
      } else if (typeof value === 'object' && value !== null) {
        const newObj: any = {}
        for (const [key, val] of Object.entries(value)) {
          const newKey = this.replace(key, params)
          newObj[newKey] = processValue(val)
        }
        return newObj
      }
      return value
    }

    return processValue(result)
  }

  /**
   * 检查字符串是否包含参数模板
   * @param str 要检查的字符串
   * @returns 是否包含参数
   */
  static hasParams(str: string): boolean {
    if (!str) return false
    return /\$\{[^}]+\}/.test(str)
  }

  /**
   * 提取字符串中的所有参数名
   * @param str 要检查的字符串
   * @returns 参数名列表
   */
  static extractParams(str: string): string[] {
    if (!str) return []

    const matches = str.match(/\$\{([^}]+)\}/g)
    if (!matches) return []

    return matches.map(match => match.slice(2, -1)) // 去掉 ${ 和 }
  }

  /**
   * 检查参数是否都有值
   * @param template 模板字符串
   * @param params 参数对象
   * @returns 缺失的参数列表
   */
  static getMissingParams(template: string, params: SimpleParamContext): string[] {
    const required = this.extractParams(template)
    const missing: string[] = []

    for (const param of required) {
      if (params[param] === undefined || params[param] === null) {
        missing.push(param)
      }
    }

    return missing
  }
}
