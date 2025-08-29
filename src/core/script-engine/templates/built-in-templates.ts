/**
 * 内置脚本模板库
 * 为 data-architecture 系统提供预制的脚本模板
 */

import type { ScriptTemplate, TemplateCategory } from '../types'

/**
 * 数据获取器脚本模板
 */
export const DATA_FETCHER_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '模拟设备数据',
    description: '生成模拟的IoT设备数据，包含温度、湿度、状态等信息',
    category: 'data-generation',
    code: `// 生成模拟设备数据
const deviceId = context.deviceId || 'device_001'
const timestamp = Date.now()

return {
  deviceId: deviceId,
  timestamp: timestamp,
  data: {
    temperature: Math.round((Math.random() * 40 + 10) * 100) / 100, // 10-50°C
    humidity: Math.round((Math.random() * 60 + 30) * 100) / 100,    // 30-90%
    pressure: Math.round((Math.random() * 200 + 900) * 100) / 100,  // 900-1100 hPa
    battery: Math.round(Math.random() * 100),                       // 0-100%
    status: Math.random() > 0.1 ? 'online' : 'offline',
    location: {
      lat: 39.9042 + (Math.random() - 0.5) * 0.1,
      lng: 116.4074 + (Math.random() - 0.5) * 0.1
    }
  },
  quality: Math.random() > 0.05 ? 'good' : 'poor'
}`,
    parameters: [
      {
        name: 'deviceId',
        type: 'string',
        description: '设备ID',
        required: false,
        defaultValue: 'device_001'
      }
    ],
    example: '// context = { deviceId: "sensor_001" }',
    isSystem: true
  },

  {
    name: '随机时序数据',
    description: '生成时序数据数组，适用于图表展示',
    category: 'data-generation',
    code: `// 生成时序数据
const points = context.points || 24
const startTime = context.startTime || (Date.now() - 24 * 60 * 60 * 1000)
const interval = context.interval || (60 * 60 * 1000) // 1小时间隔

const data = []
let baseValue = context.baseValue || 20
let currentTime = startTime

for (let i = 0; i < points; i++) {
  // 添加随机波动
  const variation = (Math.random() - 0.5) * context.variation || 5
  const value = Math.max(0, baseValue + variation + Math.sin(i / points * Math.PI * 2) * 10)
  
  data.push({
    timestamp: currentTime,
    value: Math.round(value * 100) / 100,
    label: new Date(currentTime).toLocaleTimeString()
  })
  
  currentTime += interval
  baseValue += (Math.random() - 0.5) * 2 // 趋势变化
}

return data`,
    parameters: [
      {
        name: 'points',
        type: 'number',
        description: '数据点数量',
        required: false,
        defaultValue: 24
      },
      {
        name: 'baseValue',
        type: 'number',
        description: '基础数值',
        required: false,
        defaultValue: 20
      },
      {
        name: 'variation',
        type: 'number',
        description: '波动范围',
        required: false,
        defaultValue: 5
      }
    ],
    example: '// context = { points: 48, baseValue: 25, variation: 8 }',
    isSystem: true
  },

  {
    name: 'HTTP API 数据获取',
    description: '从HTTP API获取数据的模板',
    category: 'api-integration',
    code: `// HTTP API数据获取
const url = context.url || 'https://api.example.com/data'
const method = context.method || 'GET'
const headers = context.headers || { 'Content-Type': 'application/json' }

try {
  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: method !== 'GET' ? JSON.stringify(context.body) : undefined
  })
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
  }
  
  const data = await response.json()
  
  return {
    success: true,
    data: data,
    timestamp: Date.now(),
    source: url
  }
} catch (error) {
  console.error('API调用失败:', error)
  return {
    success: false,
    error: error.message,
    timestamp: Date.now(),
    source: url
  }
}`,
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'API地址',
        required: true
      },
      {
        name: 'method',
        type: 'string',
        description: 'HTTP方法',
        required: false,
        defaultValue: 'GET'
      }
    ],
    example: '// context = { url: "https://api.weather.com/current", method: "GET" }',
    isSystem: true
  }
]

/**
 * 数据处理器脚本模板
 */
export const DATA_PROCESSOR_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '数值计算处理',
    description: '对数值数据进行计算处理，如平均值、最大值、最小值等',
    category: 'data-processing',
    code: `// 数值计算处理
if (!data || typeof data !== 'object') {
  return { error: '数据格式不正确' }
}

// 提取数值字段
const numericFields = Object.keys(data).filter(key => 
  typeof data[key] === 'number' && !isNaN(data[key])
)

if (numericFields.length === 0) {
  return { error: '未找到数值字段' }
}

const result = {
  original: data,
  processed: {
    sum: numericFields.reduce((sum, key) => sum + data[key], 0),
    average: numericFields.reduce((sum, key) => sum + data[key], 0) / numericFields.length,
    max: Math.max(...numericFields.map(key => data[key])),
    min: Math.min(...numericFields.map(key => data[key])),
    count: numericFields.length
  },
  fields: numericFields,
  timestamp: Date.now()
}

// 添加计算标志
result.processed.isValid = result.processed.average > 0
result.processed.level = result.processed.average > 50 ? 'high' : 
                        result.processed.average > 20 ? 'medium' : 'low'

return result`,
    parameters: [],
    example: '// data = { temperature: 25.5, humidity: 60, pressure: 1013.2 }',
    isSystem: true
  },

  {
    name: '数组数据过滤',
    description: '对数组数据进行过滤、排序和分组处理',
    category: 'data-processing',
    code: `// 数组数据过滤处理
if (!Array.isArray(data)) {
  return { error: '输入数据不是数组' }
}

const filterValue = context?.filterValue || 0
const sortField = context?.sortField || 'value'
const groupField = context?.groupField || 'type'

// 过滤数据
const filtered = data.filter(item => {
  if (typeof item === 'number') return item > filterValue
  if (typeof item === 'object' && item.value !== undefined) {
    return item.value > filterValue
  }
  return true
})

// 排序数据
const sorted = filtered.sort((a, b) => {
  const aVal = typeof a === 'object' ? a[sortField] : a
  const bVal = typeof b === 'object' ? b[sortField] : b
  return (aVal || 0) - (bVal || 0)
})

// 分组数据
const grouped = {}
sorted.forEach(item => {
  const groupKey = typeof item === 'object' ? 
    (item[groupField] || 'default') : 'values'
  
  if (!grouped[groupKey]) {
    grouped[groupKey] = []
  }
  grouped[groupKey].push(item)
})

return {
  original: { count: data.length },
  filtered: { count: filtered.length, data: filtered },
  sorted: { count: sorted.length, data: sorted },
  grouped: grouped,
  summary: {
    totalItems: data.length,
    filteredItems: filtered.length,
    groups: Object.keys(grouped).length,
    filterCriteria: \`value > \${filterValue}\`,
    sortBy: sortField
  }
}`,
    parameters: [
      {
        name: 'filterValue',
        type: 'number',
        description: '过滤阈值',
        required: false,
        defaultValue: 0
      },
      {
        name: 'sortField',
        type: 'string',
        description: '排序字段',
        required: false,
        defaultValue: 'value'
      },
      {
        name: 'groupField',
        type: 'string',
        description: '分组字段',
        required: false,
        defaultValue: 'type'
      }
    ],
    example: '// data = [{ value: 10, type: "A" }, { value: 25, type: "B" }]',
    isSystem: true
  },

  {
    name: '时间数据格式化',
    description: '对包含时间戳的数据进行格式化和时间计算',
    category: 'transformation',
    code: `// 时间数据格式化处理
const now = Date.now()
const timezone = context?.timezone || 'Asia/Shanghai'

// 处理时间戳字段
function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return {
    timestamp: timestamp,
    iso: date.toISOString(),
    local: date.toLocaleString('zh-CN', { timeZone: timezone }),
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN'),
    age: now - timestamp, // 数据年龄（毫秒）
    ageText: getAgeText(now - timestamp)
  }
}

function getAgeText(age) {
  const seconds = Math.floor(age / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return \`\${days}天前\`
  if (hours > 0) return \`\${hours}小时前\`
  if (minutes > 0) return \`\${minutes}分钟前\`
  return \`\${seconds}秒前\`
}

// 处理输入数据
if (typeof data === 'number') {
  // 单个时间戳
  return formatTimestamp(data)
} else if (Array.isArray(data)) {
  // 时间戳数组
  return data.map(item => {
    if (typeof item === 'number') {
      return formatTimestamp(item)
    } else if (typeof item === 'object' && item.timestamp) {
      return { ...item, timeInfo: formatTimestamp(item.timestamp) }
    }
    return item
  })
} else if (typeof data === 'object' && data.timestamp) {
  // 包含时间戳的对象
  return {
    ...data,
    timeInfo: formatTimestamp(data.timestamp)
  }
}

// 添加当前时间信息
return {
  originalData: data,
  currentTime: formatTimestamp(now),
  processed: true
}`,
    parameters: [
      {
        name: 'timezone',
        type: 'string',
        description: '时区',
        required: false,
        defaultValue: 'Asia/Shanghai'
      }
    ],
    example: '// data = { value: 25, timestamp: 1640995200000 }',
    isSystem: true
  }
]

/**
 * 数据合并器脚本模板
 */
export const DATA_MERGER_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '智能对象合并',
    description: '智能合并多个对象，处理重复字段和数据类型转换',
    category: 'data-processing',
    code: `// 智能对象合并
if (!Array.isArray(items) || items.length === 0) {
  return {}
}

const result = {}
const metadata = {
  sources: items.length,
  conflicts: [],
  dataTypes: {},
  mergedFields: []
}

items.forEach((item, index) => {
  if (!item || typeof item !== 'object') return
  
  Object.keys(item).forEach(key => {
    const value = item[key]
    
    // 记录数据类型
    const valueType = Array.isArray(value) ? 'array' : typeof value
    if (!metadata.dataTypes[key]) {
      metadata.dataTypes[key] = []
    }
    if (!metadata.dataTypes[key].includes(valueType)) {
      metadata.dataTypes[key].push(valueType)
    }
    
    if (result[key] === undefined) {
      // 首次赋值
      result[key] = value
      metadata.mergedFields.push(key)
    } else {
      // 处理冲突
      if (result[key] !== value) {
        metadata.conflicts.push({
          field: key,
          values: [result[key], value],
          sources: [\`item_\${index-1}\`, \`item_\${index}\`]
        })
        
        // 合并策略
        if (typeof result[key] === 'number' && typeof value === 'number') {
          // 数值求平均
          result[key] = (result[key] + value) / 2
        } else if (Array.isArray(result[key]) && Array.isArray(value)) {
          // 数组合并去重
          result[key] = [...new Set([...result[key], ...value])]
        } else if (typeof result[key] === 'string' && typeof value === 'string') {
          // 字符串拼接
          result[key] = \`\${result[key]}, \${value}\`
        } else {
          // 保持原值或使用最新值
          result[key] = value
        }
      }
    }
  })
})

return {
  ...result,
  _metadata: metadata,
  _mergeInfo: {
    timestamp: Date.now(),
    strategy: 'intelligent',
    itemsProcessed: items.length,
    fieldsCount: Object.keys(result).length - 2 // 排除元数据
  }
}`,
    parameters: [],
    example: '// items = [{ name: "A", value: 10 }, { name: "B", value: 20 }]',
    isSystem: true
  },

  {
    name: '时序数据合并',
    description: '按时间戳合并多个时序数据数组',
    category: 'time-series',
    code: `// 时序数据合并
if (!Array.isArray(items) || items.length === 0) {
  return []
}

// 收集所有时序数据点
const allPoints = []
const sources = []

items.forEach((item, index) => {
  if (Array.isArray(item)) {
    // 直接是时序数组
    item.forEach(point => {
      if (point && typeof point.timestamp === 'number') {
        allPoints.push({
          ...point,
          sourceIndex: index,
          sourceName: \`source_\${index}\`
        })
      }
    })
    sources.push(\`array_\${index}\`)
  } else if (item && typeof item === 'object') {
    if (typeof item.timestamp === 'number') {
      // 单个时序点
      allPoints.push({
        ...item,
        sourceIndex: index,
        sourceName: \`source_\${index}\`
      })
      sources.push(\`object_\${index}\`)
    } else if (item.data && Array.isArray(item.data)) {
      // 包含data字段的对象
      item.data.forEach(point => {
        if (point && typeof point.timestamp === 'number') {
          allPoints.push({
            ...point,
            sourceIndex: index,
            sourceName: item.name || \`source_\${index}\`
          })
        }
      })
      sources.push(item.name || \`wrapped_\${index}\`)
    }
  }
})

// 按时间戳排序
allPoints.sort((a, b) => a.timestamp - b.timestamp)

// 合并相同时间戳的数据点
const merged = []
const timeGroups = {}

allPoints.forEach(point => {
  const timeKey = point.timestamp
  if (!timeGroups[timeKey]) {
    timeGroups[timeKey] = []
  }
  timeGroups[timeKey].push(point)
})

// 生成合并后的数据
Object.keys(timeGroups).forEach(timestamp => {
  const points = timeGroups[timestamp]
  const mergedPoint = {
    timestamp: parseInt(timestamp),
    values: {},
    sources: [],
    count: points.length
  }
  
  points.forEach(point => {
    mergedPoint.sources.push(point.sourceName)
    
    // 合并数值字段
    Object.keys(point).forEach(key => {
      if (key !== 'timestamp' && key !== 'sourceIndex' && key !== 'sourceName') {
        if (typeof point[key] === 'number') {
          if (!mergedPoint.values[key]) {
            mergedPoint.values[key] = []
          }
          mergedPoint.values[key].push(point[key])
        } else if (point[key] !== undefined) {
          mergedPoint[key] = point[key] // 保留非数值字段
        }
      }
    })
  })
  
  // 计算数值字段的统计值
  Object.keys(mergedPoint.values).forEach(key => {
    const values = mergedPoint.values[key]
    mergedPoint.values[key] = {
      raw: values,
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sum: values.reduce((sum, v) => sum + v, 0)
    }
  })
  
  merged.push(mergedPoint)
})

return merged`,
    parameters: [],
    example: '// items = [array1, array2] where arrays contain {timestamp, value}',
    isSystem: true
  },

  {
    name: '条件选择合并',
    description: '根据条件选择最佳数据项进行合并',
    category: 'data-processing',
    code: `// 条件选择合并
if (!Array.isArray(items) || items.length === 0) {
  return null
}

const criteria = context?.criteria || 'latest' // latest, highest, lowest, quality
const valueField = context?.valueField || 'value'
const timestampField = context?.timestampField || 'timestamp'
const qualityField = context?.qualityField || 'quality'

let selected = null
let reason = ''

switch (criteria) {
  case 'latest':
    // 选择时间戳最新的
    selected = items.reduce((latest, item) => {
      if (!latest) return item
      const itemTime = item[timestampField] || 0
      const latestTime = latest[timestampField] || 0
      return itemTime > latestTime ? item : latest
    }, null)
    reason = '选择时间戳最新的数据项'
    break
    
  case 'highest':
    // 选择数值最高的
    selected = items.reduce((highest, item) => {
      if (!highest) return item
      const itemValue = item[valueField] || 0
      const highestValue = highest[valueField] || 0
      return itemValue > highestValue ? item : highest
    }, null)
    reason = \`选择\${valueField}字段值最高的数据项\`
    break
    
  case 'lowest':
    // 选择数值最低的
    selected = items.reduce((lowest, item) => {
      if (!lowest) return item
      const itemValue = item[valueField] || Number.MAX_VALUE
      const lowestValue = lowest[valueField] || Number.MAX_VALUE
      return itemValue < lowestValue ? item : lowest
    }, null)
    reason = \`选择\${valueField}字段值最低的数据项\`
    break
    
  case 'quality':
    // 选择质量最好的
    const qualityOrder = ['excellent', 'good', 'fair', 'poor']
    selected = items.reduce((best, item) => {
      if (!best) return item
      const itemQuality = item[qualityField] || 'poor'
      const bestQuality = best[qualityField] || 'poor'
      const itemIndex = qualityOrder.indexOf(itemQuality)
      const bestIndex = qualityOrder.indexOf(bestQuality)
      return (itemIndex !== -1 && (bestIndex === -1 || itemIndex < bestIndex)) ? item : best
    }, null)
    reason = \`选择\${qualityField}字段质量最好的数据项\`
    break
    
  default:
    selected = items[0]
    reason = '使用默认选择（第一个数据项）'
}

// 添加选择信息
return {
  ...selected,
  _selectionInfo: {
    criteria: criteria,
    reason: reason,
    totalItems: items.length,
    selectedIndex: items.indexOf(selected),
    timestamp: Date.now(),
    alternatives: items.length - 1
  }
}`,
    parameters: [
      {
        name: 'criteria',
        type: 'string',
        description: '选择条件',
        required: false,
        defaultValue: 'latest',
        validation: {
          enum: ['latest', 'highest', 'lowest', 'quality']
        }
      },
      {
        name: 'valueField',
        type: 'string',
        description: '比较的数值字段',
        required: false,
        defaultValue: 'value'
      }
    ],
    example: '// context = { criteria: "highest", valueField: "temperature" }',
    isSystem: true
  }
]

/**
 * 通用工具脚本模板
 */
export const UTILITY_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '数据验证器',
    description: '验证数据格式和完整性',
    category: 'validation',
    code: `// 数据验证器
const rules = context?.rules || {}
const result = {
  valid: true,
  errors: [],
  warnings: [],
  summary: {}
}

// 基础类型检查
if (rules.type) {
  const actualType = Array.isArray(data) ? 'array' : typeof data
  if (actualType !== rules.type) {
    result.valid = false
    result.errors.push(\`类型错误: 期望 \${rules.type}, 实际 \${actualType}\`)
  }
}

// 必需字段检查
if (rules.required && Array.isArray(rules.required)) {
  rules.required.forEach(field => {
    if (data[field] === undefined || data[field] === null) {
      result.valid = false
      result.errors.push(\`缺少必需字段: \${field}\`)
    }
  })
}

// 数值范围检查
if (rules.ranges && typeof data === 'object') {
  Object.keys(rules.ranges).forEach(field => {
    if (data[field] !== undefined) {
      const range = rules.ranges[field]
      const value = data[field]
      
      if (typeof value === 'number') {
        if (range.min !== undefined && value < range.min) {
          result.errors.push(\`\${field} 值 \${value} 小于最小值 \${range.min}\`)
        }
        if (range.max !== undefined && value > range.max) {
          result.errors.push(\`\${field} 值 \${value} 大于最大值 \${range.max}\`)
        }
      }
    }
  })
}

// 格式检查
if (rules.formats && typeof data === 'object') {
  Object.keys(rules.formats).forEach(field => {
    if (data[field] !== undefined) {
      const pattern = new RegExp(rules.formats[field])
      if (!pattern.test(String(data[field]))) {
        result.warnings.push(\`\${field} 格式可能不正确\`)
      }
    }
  })
}

// 生成摘要
result.summary = {
  fieldsChecked: Object.keys(data || {}).length,
  errorsCount: result.errors.length,
  warningsCount: result.warnings.length,
  validationTime: Date.now()
}

return result`,
    parameters: [
      {
        name: 'rules',
        type: 'object',
        description: '验证规则配置',
        required: false,
        defaultValue: {}
      }
    ],
    example: '// rules = { type: "object", required: ["id", "name"] }',
    isSystem: true
  },

  {
    name: '性能监控',
    description: '监控脚本执行性能和资源使用',
    category: 'utility',
    code: `// 性能监控脚本
const startTime = performance.now()
const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0

// 执行主要逻辑（这里放置实际的数据处理代码）
const processedData = data

// 性能测量
const endTime = performance.now()
const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0

const metrics = {
  execution: {
    startTime: startTime,
    endTime: endTime,
    duration: endTime - startTime,
    durationText: \`\${(endTime - startTime).toFixed(2)}ms\`
  },
  memory: {
    before: memoryBefore,
    after: memoryAfter,
    used: memoryAfter - memoryBefore,
    usedText: \`\${((memoryAfter - memoryBefore) / 1024 / 1024).toFixed(2)}MB\`
  },
  data: {
    inputSize: JSON.stringify(data || {}).length,
    outputSize: JSON.stringify(processedData || {}).length,
    compressionRatio: JSON.stringify(data || {}).length > 0 ? 
      (JSON.stringify(processedData || {}).length / JSON.stringify(data || {}).length).toFixed(2) : 1
  },
  performance: {
    rating: endTime - startTime < 100 ? 'excellent' :
            endTime - startTime < 500 ? 'good' :
            endTime - startTime < 1000 ? 'fair' : 'poor',
    recommendations: []
  }
}

// 性能建议
if (metrics.execution.duration > 1000) {
  metrics.performance.recommendations.push('执行时间过长，考虑优化算法')
}
if (metrics.memory.used > 10 * 1024 * 1024) {
  metrics.performance.recommendations.push('内存使用过多，考虑分批处理')
}
if (metrics.data.outputSize > metrics.data.inputSize * 2) {
  metrics.performance.recommendations.push('输出数据膨胀过多，考虑数据压缩')
}

return {
  result: processedData,
  metrics: metrics,
  timestamp: Date.now()
}`,
    parameters: [],
    example: '// 自动测量任何数据处理操作的性能',
    isSystem: true
  }
]

/**
 * 所有内置模板
 */
export const ALL_BUILT_IN_TEMPLATES = [
  ...DATA_FETCHER_TEMPLATES,
  ...DATA_PROCESSOR_TEMPLATES,
  ...DATA_MERGER_TEMPLATES,
  ...UTILITY_TEMPLATES
]

/**
 * 初始化内置模板到模板管理器
 */
export function initializeBuiltInTemplates(templateManager: any) {
  console.log('🚀 [BuiltInTemplates] 开始初始化内置模板库...')

  let successCount = 0
  let errorCount = 0

  ALL_BUILT_IN_TEMPLATES.forEach(template => {
    try {
      templateManager.createTemplate(template)
      successCount++
    } catch (error) {
      console.error('❌ [BuiltInTemplates] 模板创建失败:', template.name, error)
      errorCount++
    }
  })

  console.log(`✅ [BuiltInTemplates] 模板库初始化完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`)

  // 返回统计信息
  return {
    total: ALL_BUILT_IN_TEMPLATES.length,
    success: successCount,
    error: errorCount,
    categories: {
      'data-generation': DATA_FETCHER_TEMPLATES.filter(t => t.category === 'data-generation').length,
      'data-processing': [...DATA_PROCESSOR_TEMPLATES, ...DATA_MERGER_TEMPLATES].filter(
        t => t.category === 'data-processing'
      ).length,
      'api-integration': DATA_FETCHER_TEMPLATES.filter(t => t.category === 'api-integration').length,
      'time-series': DATA_MERGER_TEMPLATES.filter(t => t.category === 'time-series').length,
      transformation: DATA_PROCESSOR_TEMPLATES.filter(t => t.category === 'transformation').length,
      validation: UTILITY_TEMPLATES.filter(t => t.category === 'validation').length,
      utility: UTILITY_TEMPLATES.filter(t => t.category === 'utility').length
    }
  }
}
