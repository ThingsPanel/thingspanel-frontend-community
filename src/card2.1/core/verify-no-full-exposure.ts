/**
 * 🔒 验证没有全量属性暴露的检查工具
 * 用于确认所有属性暴露都经过白名单验证
 */

/**
 * 验证组件是否存在全量属性暴露
 * @param componentId 组件ID
 * @param exposedProperties 当前暴露的属性
 * @param componentConfig 组件的完整配置
 */
export function verifyNoFullExposure(
  componentId: string,
  exposedProperties: Record<string, any>,
  componentConfig: Record<string, any>
): {
  isSecure: boolean
  issues: string[]
  summary: {
    configProperties: number
    exposedProperties: number
    suspiciousProperties: string[]
  }
} {
  const issues: string[] = []
  const suspiciousProperties: string[] = []

  const configKeys = Object.keys(componentConfig)
  const exposedKeys = Object.keys(exposedProperties)

  console.log(`🔒 [验证] 开始验证组件 ${componentId} 的属性暴露安全性`)
  console.log(`📊 配置属性数量: ${configKeys.length}`)
  console.log(`📊 暴露属性数量: ${exposedKeys.length}`)

  // 检查1: 如果暴露属性数量接近配置属性数量，可能存在全量暴露
  const exposureRatio = exposedKeys.length / configKeys.length
  if (exposureRatio > 0.7) {
    issues.push(`⚠️ 暴露属性比例过高: ${(exposureRatio * 100).toFixed(1)}% (${exposedKeys.length}/${configKeys.length})`)
  }

  // 检查2: 查找可疑的配置属性被暴露
  const suspiciousConfigKeys = configKeys.filter(key => {
    // 这些通常是内部配置，不应该被暴露
    return key.includes('api') ||
           key.includes('secret') ||
           key.includes('token') ||
           key.includes('config') ||
           key.includes('internal') ||
           key.startsWith('_')
  })

  suspiciousConfigKeys.forEach(key => {
    if (exposedKeys.includes(key)) {
      suspiciousProperties.push(key)
      issues.push(`🚨 可疑属性被暴露: ${key}`)
    }
  })

  // 检查3: 检查是否有完全相同的属性结构（表明可能是直接拷贝）
  const identicalProperties = configKeys.filter(key =>
    exposedKeys.includes(key) &&
    JSON.stringify(componentConfig[key]) === JSON.stringify(exposedProperties[key])
  )

  if (identicalProperties.length > Math.max(3, configKeys.length * 0.5)) {
    issues.push(`🚨 发现大量相同属性暴露，可能存在直接拷贝: ${identicalProperties.length} 个属性`)
  }

  // 检查4: 检查白名单机制的特征
  const hasWhitelistMarkers = exposedKeys.some(key =>
    key === 'lastUpdated' || key === 'componentId'
  )

  if (!hasWhitelistMarkers && exposedKeys.length > 0) {
    issues.push(`⚠️ 缺少白名单机制的标识属性 (lastUpdated, componentId)`)
  }

  const isSecure = issues.length === 0

  console.log(`🔒 [验证结果] 组件 ${componentId}: ${isSecure ? '✅ 安全' : '❌ 存在风险'}`)
  if (issues.length > 0) {
    console.log(`🚨 发现 ${issues.length} 个安全问题:`)
    issues.forEach(issue => console.log(`  ${issue}`))
  }

  return {
    isSecure,
    issues,
    summary: {
      configProperties: configKeys.length,
      exposedProperties: exposedKeys.length,
      suspiciousProperties
    }
  }
}

/**
 * 在浏览器中验证当前页面的所有组件
 */
export function verifyAllComponentsInPage(): {
  totalComponents: number
  secureComponents: number
  insecureComponents: string[]
  detailedResults: Array<{
    componentId: string
    isSecure: boolean
    issues: string[]
  }>
} {
  if (typeof window === 'undefined') {
    throw new Error('此函数只能在浏览器环境中运行')
  }

  console.log(`🔒 开始验证页面中所有组件的属性暴露安全性...`)

  // 查找所有有 data-component-id 的元素
  const componentElements = document.querySelectorAll('[data-component-id]')
  const results: Array<{
    componentId: string
    isSecure: boolean
    issues: string[]
  }> = []

  let secureCount = 0
  const insecureComponents: string[] = []

  componentElements.forEach(element => {
    const componentId = element.getAttribute('data-component-id')
    if (!componentId) return

    try {
      // 尝试获取组件的暴露属性（从全局状态或其他方式）
      // 这里需要根据实际的编辑器API来获取
      const exposedProperties = (window as any).getComponentExposedProperties?.(componentId) || {}
      const componentConfig = (window as any).getComponentConfig?.(componentId) || {}

      const verification = verifyNoFullExposure(componentId, exposedProperties, componentConfig)

      results.push({
        componentId,
        isSecure: verification.isSecure,
        issues: verification.issues
      })

      if (verification.isSecure) {
        secureCount++
      } else {
        insecureComponents.push(componentId)
      }
    } catch (error) {
      console.error(`❌ 验证组件 ${componentId} 时出错:`, error)
      insecureComponents.push(componentId)
      results.push({
        componentId,
        isSecure: false,
        issues: [`验证过程出错: ${error.message}`]
      })
    }
  })

  const totalComponents = componentElements.length
  console.log(`📊 验证完成: ${secureCount}/${totalComponents} 个组件安全`)

  if (insecureComponents.length > 0) {
    console.log(`🚨 存在风险的组件:`, insecureComponents)
  }

  return {
    totalComponents,
    secureComponents: secureCount,
    insecureComponents,
    detailedResults: results
  }
}

// 在开发环境自动设置浏览器测试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).verifyNoFullExposure = verifyNoFullExposure
  ;(window as any).verifyAllComponentsInPage = verifyAllComponentsInPage
  console.log('🔒 属性暴露安全验证工具已设置完成！')
  console.log('💡 使用方法:')
  console.log('  - window.verifyNoFullExposure(componentId, exposedProps, config)')
  console.log('  - window.verifyAllComponentsInPage()')
}