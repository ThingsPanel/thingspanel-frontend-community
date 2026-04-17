/**
 * 脚本模板管理器
 * 管理脚本模板的创建、更新、删除和代码生成
 */

import type {
  IScriptTemplateManager,
  ScriptTemplate,
  ScriptTemplateParameter,
  TemplateCategory
} from '@/core/script-engine/types'
import { nanoid } from 'nanoid'

/**
 * 脚本模板管理器实现类
 */
export class ScriptTemplateManager implements IScriptTemplateManager {
  private templates: Map<string, ScriptTemplate>

  constructor() {
    this.templates = new Map()
    this.initializeSystemTemplates()
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): ScriptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory(category: string): ScriptTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.category === category)
  }

  /**
   * 获取指定模板
   */
  getTemplate(id: string): ScriptTemplate | null {
    return this.templates.get(id) || null
  }

  /**
   * 创建模板
   */
  createTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ScriptTemplate {
    const now = Date.now()
    const newTemplate: ScriptTemplate = {
      ...template,
      id: nanoid(),
      createdAt: now,
      updatedAt: now
    }

    this.templates.set(newTemplate.id, newTemplate)
    return newTemplate
  }

  /**
   * 更新模板
   */
  updateTemplate(id: string, updates: Partial<ScriptTemplate>): boolean {
    const template = this.templates.get(id)
    if (!template) {
      return false
    }

    const updatedTemplate: ScriptTemplate = {
      ...template,
      ...updates,
      id, // 确保ID不被修改
      updatedAt: Date.now()
    }

    this.templates.set(id, updatedTemplate)
    return true
  }

  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id)
    if (!template || template.isSystem) {
      return false // 不能删除系统模板
    }

    return this.templates.delete(id)
  }

  /**
   * 根据模板生成代码
   */
  generateCode(templateId: string, parameters: Record<string, any>): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`)
    }

    let code = template.code

    // 替换模板参数
    template.parameters.forEach(param => {
      const value = parameters[param.name]
      const actualValue = value !== undefined ? value : param.defaultValue

      if (param.required && actualValue === undefined) {
        throw new Error(`缺少必需参数: ${param.name}`)
      }

      // 验证参数
      this.validateParameter(param, actualValue)

      // 替换代码中的占位符
      const placeholder = new RegExp(`\\{\\{${param.name}\\}\\}`, 'g')
      const replacement = this.formatParameterValue(actualValue, param.type)
      code = code.replace(placeholder, replacement)
    })

    return code
  }

  /**
   * 验证参数值
   */
  private validateParameter(param: ScriptTemplateParameter, value: any): void {
    if (value === undefined && !param.required) {
      return
    }

    // 类型检查
    switch (param.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`参数 ${param.name} 必须是字符串类型`)
        }
        break
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`参数 ${param.name} 必须是数字类型`)
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`参数 ${param.name} 必须是布尔类型`)
        }
        break
      case 'object':
        if (typeof value !== 'object' || value === null) {
          throw new Error(`参数 ${param.name} 必须是对象类型`)
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`参数 ${param.name} 必须是数组类型`)
        }
        break
    }

    // 验证规则检查
    if (param.validation) {
      const validation = param.validation

      // 数值范围检查
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          throw new Error(`参数 ${param.name} 不能小于 ${validation.min}`)
        }
        if (validation.max !== undefined && value > validation.max) {
          throw new Error(`参数 ${param.name} 不能大于 ${validation.max}`)
        }
      }

      // 字符串长度检查
      if (typeof value === 'string') {
        if (validation.min !== undefined && value.length < validation.min) {
          throw new Error(`参数 ${param.name} 长度不能小于 ${validation.min}`)
        }
        if (validation.max !== undefined && value.length > validation.max) {
          throw new Error(`参数 ${param.name} 长度不能大于 ${validation.max}`)
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          throw new Error(`参数 ${param.name} 格式不正确`)
        }
      }

      // 枚举值检查
      if (validation.enum && !validation.enum.includes(value)) {
        throw new Error(`参数 ${param.name} 必须是以下值之一: ${validation.enum.join(', ')}`)
      }
    }
  }

  /**
   * 格式化参数值
   */
  private formatParameterValue(value: any, type: ScriptTemplateParameter['type']): string {
    switch (type) {
      case 'string':
        return JSON.stringify(value)
      case 'number':
      case 'boolean':
        return String(value)
      case 'object':
      case 'array':
        return JSON.stringify(value)
      case 'function':
        return typeof value === 'function' ? value.toString() : String(value)
      default:
        return JSON.stringify(value)
    }
  }

  /**
   * 初始化系统模板
   */
  private initializeSystemTemplates(): void {
    // 数据生成模板
    this.createSystemTemplate({
      name: '随机数据生成器',
      category: 'data-generation',
      description: '生成指定数量的随机数据',
      code: `
// 生成随机数据
const count = {{count}};
const fields = {{fields}};

const result = [];
for (let i = 0; i < count; i++) {
  const item = {};
  fields.forEach(field => {
    switch (field.type) {
      case 'number':
        item[field.name] = _utils.mockData.randomNumber(field.min || 0, field.max || 100);
        break;
      case 'string':
        item[field.name] = _utils.mockData.randomString(field.length || 10);
        break;
      case 'boolean':
        item[field.name] = _utils.mockData.randomBoolean();
        break;
      case 'date':
        item[field.name] = _utils.mockData.randomDate();
        break;
      default:
        item[field.name] = null;
    }
  });
  result.push(item);
}

return result;
      `,
      parameters: [
        {
          name: 'count',
          type: 'number',
          description: '生成数据的数量',
          required: true,
          defaultValue: 10,
          validation: { min: 1, max: 1000 }
        },
        {
          name: 'fields',
          type: 'array',
          description: '字段配置数组',
          required: true,
          defaultValue: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string', length: 8 },
            { name: 'active', type: 'boolean' }
          ]
        }
      ]
    })

    // 数据处理模板
    this.createSystemTemplate({
      name: '数据聚合器',
      category: 'data-processing',
      description: '对数据进行分组和聚合计算',
      code: `
// 数据聚合处理
const data = {{data}};
const groupByField = {{groupByField}};
const aggregateField = {{aggregateField}};
const operation = {{operation}};

const grouped = _utils.dataUtils.groupBy(data, groupByField);
const result = {};

Object.keys(grouped).forEach(key => {
  const group = grouped[key];
  switch (operation) {
    case 'sum':
      result[key] = group.reduce((sum, item) => sum + (item[aggregateField] || 0), 0);
      break;
    case 'avg':
      result[key] = group.reduce((sum, item) => sum + (item[aggregateField] || 0), 0) / group.length;
      break;
    case 'count':
      result[key] = group.length;
      break;
    case 'max':
      result[key] = Math.max(...group.map(item => item[aggregateField] || 0));
      break;
    case 'min':
      result[key] = Math.min(...group.map(item => item[aggregateField] || 0));
      break;
    default:
      result[key] = group;
  }
});

return result;
      `,
      parameters: [
        {
          name: 'data',
          type: 'array',
          description: '要处理的数据数组',
          required: true,
          defaultValue: []
        },
        {
          name: 'groupByField',
          type: 'string',
          description: '分组字段名',
          required: true,
          defaultValue: 'category'
        },
        {
          name: 'aggregateField',
          type: 'string',
          description: '聚合字段名',
          required: true,
          defaultValue: 'value'
        },
        {
          name: 'operation',
          type: 'string',
          description: '聚合操作类型',
          required: true,
          defaultValue: 'sum',
          validation: { enum: ['sum', 'avg', 'count', 'max', 'min'] }
        }
      ]
    })

    // 时间序列数据模板
    this.createSystemTemplate({
      name: '时间序列数据生成器',
      category: 'time-series',
      description: '生成时间序列数据',
      code: `
// 生成时间序列数据
const startDate = new Date({{startDate}});
const endDate = new Date({{endDate}});
const interval = {{interval}}; // 分钟
const baseValue = {{baseValue}};
const variance = {{variance}};

const result = [];
let currentDate = new Date(startDate);

while (currentDate <= endDate) {
  const value = baseValue + (_utils.mockData.randomNumber(-variance, variance));
  result.push({
    timestamp: currentDate.toISOString(),
    value: Math.round(value * 100) / 100,
    date: _utils.timeUtils.format(currentDate)
  });
  
  currentDate = new Date(currentDate.getTime() + interval * 60 * 1000);
}

return result;
      `,
      parameters: [
        {
          name: 'startDate',
          type: 'string',
          description: '开始日期 (ISO格式)',
          required: true,
          defaultValue: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          name: 'endDate',
          type: 'string',
          description: '结束日期 (ISO格式)',
          required: true,
          defaultValue: new Date().toISOString()
        },
        {
          name: 'interval',
          type: 'number',
          description: '时间间隔（分钟）',
          required: true,
          defaultValue: 30,
          validation: { min: 1, max: 1440 }
        },
        {
          name: 'baseValue',
          type: 'number',
          description: '基准值',
          required: true,
          defaultValue: 50
        },
        {
          name: 'variance',
          type: 'number',
          description: '变化幅度',
          required: true,
          defaultValue: 10,
          validation: { min: 0 }
        }
      ]
    })

    // API 集成模板
    this.createSystemTemplate({
      name: 'HTTP API 调用器',
      category: 'api-integration',
      description: '调用HTTP API并处理响应',
      code: `
// HTTP API 调用
const url = {{url}};
const method = {{method}};
const headers = {{headers}};
const body = {{body}};

try {
  const requestOptions = {
    method: method,
    headers: headers
  };
  
  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }
  
  const data = await response.json();
  
  return {
    success: true,
    status: response.status,
    data: data,
    timestamp: new Date().toISOString()
  };
} catch (error) {
  return {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  };
}
      `,
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: 'API URL地址',
          required: true,
          defaultValue: 'https://api.example.com/data'
        },
        {
          name: 'method',
          type: 'string',
          description: 'HTTP方法',
          required: true,
          defaultValue: 'GET',
          validation: { enum: ['GET', 'POST', 'PUT', 'DELETE'] }
        },
        {
          name: 'headers',
          type: 'object',
          description: '请求头',
          required: false,
          defaultValue: { 'Content-Type': 'application/json' }
        },
        {
          name: 'body',
          type: 'object',
          description: '请求体',
          required: false,
          defaultValue: null
        }
      ]
    })
  }

  /**
   * 创建系统模板
   */
  private createSystemTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): void {
    const now = Date.now()
    const systemTemplate: ScriptTemplate = {
      ...template,
      id: nanoid(),
      isSystem: true,
      createdAt: now,
      updatedAt: now
    }

    this.templates.set(systemTemplate.id, systemTemplate)
  }
}
