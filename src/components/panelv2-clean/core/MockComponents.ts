/**
 * @file 模拟组件数据
 * @description 提供测试用的基础组件定义数据
 */

import type { ComponentDefinition } from '../types/core'

/**
 * 基础组件数据
 */
export const mockBasicComponents: ComponentDefinition[] = [
  {
    type: 'text-display',
    name: '文本显示',
    category: 'basic',
    component: null, // 实际组件暂时为空
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          text: { type: 'string', title: '显示文本' },
          fontSize: { type: 'number', title: '字体大小', default: 14 },
          color: { type: 'string', title: '文字颜色', default: '#333' }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 4, h: 2 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 4, h: 2 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#e8e8e8', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' },
          onHover: { highlight: false }
        },
        content: {
          text: '文本内容',
          fontSize: 14,
          color: '#333'
        }
      },
      style: {
        background: { color: '#ffffff' },
        shadow: {
          enabled: false,
          color: 'rgba(0,0,0,0.1)',
          blur: 4,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '文本显示组件',
      description: '用于显示静态或动态文本内容',
      icon: '📝',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['文本', '显示', '内容']
    }
  },

  {
    type: 'image-display',
    name: '图片显示',
    category: 'basic',
    component: null,
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          src: { type: 'string', title: '图片链接' },
          alt: { type: 'string', title: '替代文本' },
          fit: { type: 'string', title: '适应方式', enum: ['contain', 'cover', 'fill', 'none'] }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 4, h: 3 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 4, h: 3 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#e8e8e8', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' },
          onHover: { highlight: false }
        },
        content: {
          src: 'https://via.placeholder.com/300x200',
          alt: '图片',
          fit: 'cover'
        }
      },
      style: {
        background: { color: '#f5f5f5' },
        shadow: {
          enabled: false,
          color: 'rgba(0,0,0,0.1)',
          blur: 4,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '图片显示组件',
      description: '用于显示图片内容，支持多种适应方式',
      icon: '🖼️',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['图片', '图像', '显示']
    }
  },

  {
    type: 'button-action',
    name: '按钮组件',
    category: 'basic',
    component: null,
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          text: { type: 'string', title: '按钮文字' },
          type: { type: 'string', title: '按钮类型', enum: ['primary', 'secondary', 'success', 'warning', 'danger'] },
          size: { type: 'string', title: '按钮大小', enum: ['small', 'medium', 'large'] }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 2, h: 1 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 2, h: 1 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#1890ff', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'action' },
          onHover: { highlight: true }
        },
        content: {
          text: '点击按钮',
          type: 'primary',
          size: 'medium'
        }
      },
      style: {
        background: { color: '#1890ff' },
        shadow: {
          enabled: true,
          color: 'rgba(24,144,255,0.3)',
          blur: 4,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '按钮组件',
      description: '可点击的按钮，支持多种样式和交互',
      icon: '🔘',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['按钮', '点击', '交互']
    }
  }
]

/**
 * 图表组件数据
 */
export const mockChartComponents: ComponentDefinition[] = [
  {
    type: 'line-chart',
    name: '折线图',
    category: 'chart',
    component: null,
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          title: { type: 'string', title: '图表标题' },
          dataSource: { type: 'string', title: '数据源' },
          xAxis: { type: 'string', title: 'X轴字段' },
          yAxis: { type: 'string', title: 'Y轴字段' }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 6, h: 4 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 6, h: 4 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#e8e8e8', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' },
          onHover: { highlight: true }
        },
        content: {
          title: '数据趋势',
          dataSource: '',
          xAxis: 'time',
          yAxis: 'value'
        }
      },
      style: {
        background: { color: '#ffffff' },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          blur: 8,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '折线图组件',
      description: '用于显示数据的趋势变化',
      icon: '📈',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['图表', '折线图', '趋势', '数据']
    }
  },

  {
    type: 'bar-chart',
    name: '柱状图',
    category: 'chart',
    component: null,
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          title: { type: 'string', title: '图表标题' },
          dataSource: { type: 'string', title: '数据源' },
          xAxis: { type: 'string', title: 'X轴字段' },
          yAxis: { type: 'string', title: 'Y轴字段' }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 6, h: 4 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 6, h: 4 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#e8e8e8', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' },
          onHover: { highlight: true }
        },
        content: {
          title: '数据对比',
          dataSource: '',
          xAxis: 'category',
          yAxis: 'value'
        }
      },
      style: {
        background: { color: '#ffffff' },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          blur: 8,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '柱状图组件',
      description: '用于显示不同类别数据的对比',
      icon: '📊',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['图表', '柱状图', '对比', '数据']
    }
  },

  {
    type: 'pie-chart',
    name: '饼图',
    category: 'chart',
    component: null,
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          title: { type: 'string', title: '图表标题' },
          dataSource: { type: 'string', title: '数据源' },
          nameField: { type: 'string', title: '名称字段' },
          valueField: { type: 'string', title: '数值字段' }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 4, h: 4 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 4, h: 4 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#e8e8e8', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' },
          onHover: { highlight: true }
        },
        content: {
          title: '数据分布',
          dataSource: '',
          nameField: 'name',
          valueField: 'value'
        }
      },
      style: {
        background: { color: '#ffffff' },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          blur: 8,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '饼图组件',
      description: '用于显示数据的比例分布',
      icon: '🥧',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['图表', '饼图', '比例', '分布']
    }
  }
]

/**
 * 表单组件数据
 */
export const mockFormComponents: ComponentDefinition[] = [
  {
    type: 'input-field',
    name: '输入框',
    category: 'form',
    component: null,
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          placeholder: { type: 'string', title: '占位符' },
          label: { type: 'string', title: '标签' },
          required: { type: 'boolean', title: '必填' },
          maxLength: { type: 'number', title: '最大长度' }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 4, h: 1 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 4, h: 1 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#d9d9d9', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' },
          onHover: { highlight: false }
        },
        content: {
          placeholder: '请输入内容',
          label: '输入字段',
          required: false,
          maxLength: 100
        }
      },
      style: {
        background: { color: '#ffffff' },
        shadow: {
          enabled: false,
          color: 'rgba(0,0,0,0.1)',
          blur: 4,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '输入框组件',
      description: '用于用户输入文本内容',
      icon: '📝',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['输入', '表单', '文本']
    }
  },

  {
    type: 'select-field',
    name: '下拉选择',
    category: 'form',
    component: null,
    configSchema: {
      base: {},
      interaction: {},
      content: {
        type: 'object',
        properties: {
          placeholder: { type: 'string', title: '占位符' },
          label: { type: 'string', title: '标签' },
          options: { type: 'array', title: '选项列表' },
          multiple: { type: 'boolean', title: '多选' }
        }
      }
    },
    defaults: {
      layout: { x: 0, y: 0, w: 4, h: 1 },
      config: {
        base: {
          layout: { x: 0, y: 0, w: 4, h: 1 },
          state: { locked: false, hidden: false, disabled: false },
          appearance: {
            border: { width: 1, style: 'solid', color: '#d9d9d9', radius: 4 },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' },
          onHover: { highlight: false }
        },
        content: {
          placeholder: '请选择',
          label: '选择字段',
          options: [],
          multiple: false
        }
      },
      style: {
        background: { color: '#ffffff' },
        shadow: {
          enabled: false,
          color: 'rgba(0,0,0,0.1)',
          blur: 4,
          offsetX: 0,
          offsetY: 2
        }
      }
    },
    meta: {
      title: '下拉选择组件',
      description: '用于从选项中选择值',
      icon: '📋',
      version: '1.0.0',
      author: 'ThingsPanel',
      keywords: ['选择', '下拉', '表单']
    }
  }
]

/**
 * 所有模拟组件数据
 */
export const allMockComponents: ComponentDefinition[] = [
  ...mockBasicComponents,
  ...mockChartComponents,
  ...mockFormComponents
]
