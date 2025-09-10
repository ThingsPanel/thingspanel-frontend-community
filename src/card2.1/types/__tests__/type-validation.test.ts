/**
 * Card2.1 类型验证测试套件
 * 确保类型定义和验证函数的正确性
 */

import { describe, it, expect } from 'vitest'
import {
  validateDataSourceRequirement,
  validateStaticParamRequirement,
  validateSetting,
  validateComponentDefinition,
  validateComponentDefinitions,
  isValidComponentDefinition,
  isValidDataSourceRequirement,
  isValidSetting,
  isValidDataFieldType
} from '../validation'

// ============ 数据字段类型验证测试 ============

describe('isValidDataFieldType', () => {
  it('should validate correct data field types', () => {
    expect(isValidDataFieldType('value')).toBe(true)
    expect(isValidDataFieldType('object')).toBe(true)
    expect(isValidDataFieldType('array')).toBe(true)
    expect(isValidDataFieldType('string')).toBe(true)
    expect(isValidDataFieldType('number')).toBe(true)
    expect(isValidDataFieldType('boolean')).toBe(true)
    expect(isValidDataFieldType('date')).toBe(true)
  })

  it('should reject invalid data field types', () => {
    expect(isValidDataFieldType('invalid')).toBe(false)
    expect(isValidDataFieldType(123)).toBe(false)
    expect(isValidDataFieldType(null)).toBe(false)
    expect(isValidDataFieldType(undefined)).toBe(false)
  })
})

// ============ 数据源需求验证测试 ============

describe('validateDataSourceRequirement', () => {
  it('should validate a correct data source requirement', () => {
    const requirement = {
      key: 'test-data',
      name: '测试数据源',
      description: '用于测试的数据源',
      supportedTypes: ['static', 'api'],
      example: { value: 100, label: 'Test' },
      fieldMappings: {
        value: {
          targetField: 'displayValue',
          type: 'number',
          required: true,
          defaultValue: 0
        }
      }
    }

    const result = validateDataSourceRequirement(requirement)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject invalid data source requirement', () => {
    const requirement = {
      // 缺少必填字段
      name: '测试数据源',
      supportedTypes: ['invalid-type'], // 无效类型
      fieldMappings: {
        value: {
          // 缺少必填字段
          type: 'invalid-type', // 无效类型
          required: 'not-boolean' // 错误类型
        }
      }
    }

    const result = validateDataSourceRequirement(requirement)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should handle null or undefined input', () => {
    expect(validateDataSourceRequirement(null).valid).toBe(false)
    expect(validateDataSourceRequirement(undefined).valid).toBe(false)
  })
})

// ============ 静态参数需求验证测试 ============

describe('validateStaticParamRequirement', () => {
  it('should validate a correct static parameter requirement', () => {
    const requirement = {
      key: 'title',
      name: '标题',
      type: 'string',
      description: '组件标题',
      defaultValue: '默认标题'
    }

    const result = validateStaticParamRequirement(requirement)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject invalid static parameter requirement', () => {
    const requirement = {
      // 缺少必填字段
      name: '标题',
      type: 'invalid-type', // 无效类型
      // 缺少 description
    }

    const result = validateStaticParamRequirement(requirement)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// ============ 设置项验证测试 ============

describe('validateSetting', () => {
  it('should validate a correct setting', () => {
    const setting = {
      type: 'input',
      label: '标题',
      field: 'title',
      group: '基础设置',
      placeholder: '请输入标题',
      defaultValue: '默认标题'
    }

    const result = validateSetting(setting)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should validate setting with options', () => {
    const setting = {
      type: 'select',
      label: '类型',
      field: 'type',
      options: [
        { label: '类型A', value: 'a' },
        { label: '类型B', value: 'b' }
      ]
    }

    const result = validateSetting(setting)
    expect(result.valid).toBe(true)
  })

  it('should reject setting with invalid options', () => {
    const setting = {
      type: 'select',
      label: '类型',
      field: 'type',
      options: [
        { label: '类型A' }, // 缺少 value
        'invalid-option' // 不是对象
      ]
    }

    const result = validateSetting(setting)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// ============ 组件定义验证测试 ============

describe('validateComponentDefinition', () => {
  const mockVueComponent = { name: 'TestComponent' }

  it('should validate a correct component definition', () => {
    const definition = {
      type: 'test-component',
      name: '测试组件',
      description: '用于测试的组件',
      component: mockVueComponent,
      dataSources: [
        {
          key: 'test-data',
          name: '测试数据',
          description: '测试数据源',
          supportedTypes: ['static']
        }
      ],
      staticParams: [
        {
          key: 'title',
          name: '标题',
          type: 'string',
          description: '组件标题'
        }
      ]
    }

    const result = validateComponentDefinition(definition)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should warn about non-kebab-case type names', () => {
    const definition = {
      type: 'TestComponent', // 不是 kebab-case
      name: '测试组件',
      description: '用于测试的组件',
      component: mockVueComponent
    }

    const result = validateComponentDefinition(definition)
    expect(result.valid).toBe(true) // 仍然有效，但有警告
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('should reject invalid component definition', () => {
    const definition = {
      // 缺少必填字段
      name: '测试组件',
      // 缺少 description 和 component
      dataSources: 'not-array', // 错误类型
      staticParams: [
        {
          // 无效的静态参数
          name: '标题'
          // 缺少必填字段
        }
      ]
    }

    const result = validateComponentDefinition(definition)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// ============ 批量验证测试 ============

describe('validateComponentDefinitions', () => {
  const mockVueComponent = { name: 'TestComponent' }

  it('should validate multiple component definitions', () => {
    const definitions = [
      {
        type: 'component-a',
        name: '组件A',
        description: '第一个组件',
        component: mockVueComponent
      },
      {
        type: 'component-b',
        name: '组件B',
        description: '第二个组件',
        component: mockVueComponent
      }
    ]

    const result = validateComponentDefinitions(definitions)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect duplicate component types', () => {
    const definitions = [
      {
        type: 'duplicate-type',
        name: '组件A',
        description: '第一个组件',
        component: mockVueComponent
      },
      {
        type: 'duplicate-type', // 重复类型
        name: '组件B',
        description: '第二个组件',
        component: mockVueComponent
      }
    ]

    const result = validateComponentDefinitions(definitions)
    expect(result.valid).toBe(false)
    expect(result.errors.some(error => error.includes('重复的组件类型'))).toBe(true)
  })
})

// ============ 类型断言测试 ============

describe('Type Guards', () => {
  const mockVueComponent = { name: 'TestComponent' }

  describe('isValidComponentDefinition', () => {
    it('should return true for valid component definition', () => {
      const definition = {
        type: 'test-component',
        name: '测试组件',
        description: '用于测试的组件',
        component: mockVueComponent
      }

      expect(isValidComponentDefinition(definition)).toBe(true)
    })

    it('should return false for invalid component definition', () => {
      const definition = {
        // 缺少必填字段
        name: '测试组件'
      }

      expect(isValidComponentDefinition(definition)).toBe(false)
    })
  })

  describe('isValidDataSourceRequirement', () => {
    it('should return true for valid data source requirement', () => {
      const requirement = {
        key: 'test-data',
        name: '测试数据源',
        description: '用于测试的数据源',
        supportedTypes: ['static']
      }

      expect(isValidDataSourceRequirement(requirement)).toBe(true)
    })

    it('should return false for invalid data source requirement', () => {
      const requirement = {
        // 缺少必填字段
        name: '测试数据源'
      }

      expect(isValidDataSourceRequirement(requirement)).toBe(false)
    })
  })

  describe('isValidSetting', () => {
    it('should return true for valid setting', () => {
      const setting = {
        type: 'input',
        label: '标题',
        field: 'title'
      }

      expect(isValidSetting(setting)).toBe(true)
    })

    it('should return false for invalid setting', () => {
      const setting = {
        // 缺少必填字段
        label: '标题'
      }

      expect(isValidSetting(setting)).toBe(false)
    })
  })
})

// ============ 边界情况测试 ============

describe('Edge Cases', () => {
  it('should handle empty objects gracefully', () => {
    expect(validateComponentDefinition({}).valid).toBe(false)
    expect(validateDataSourceRequirement({}).valid).toBe(false)
    expect(validateSetting({}).valid).toBe(false)
  })

  it('should handle non-object inputs gracefully', () => {
    expect(validateComponentDefinition('string').valid).toBe(false)
    expect(validateDataSourceRequirement(123).valid).toBe(false)
    expect(validateSetting(true).valid).toBe(false)
  })

  it('should handle arrays as invalid inputs', () => {
    expect(validateComponentDefinition([]).valid).toBe(false)
    expect(validateDataSourceRequirement([]).valid).toBe(false)
    expect(validateSetting([]).valid).toBe(false)
  })
})