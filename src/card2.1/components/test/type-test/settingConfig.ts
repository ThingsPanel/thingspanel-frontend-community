/**
 * Card2.1 类型测试组件设置配置
 * 
 * 这是一个完整的设置配置示例，展示了Card2.1设置系统的所有功能：
 * - 各种设置控件类型（SettingControlType）
 * - 设置分组和组织（SettingGroup）
 * - 数据验证和约束（SettingValidationRule）
 * - 动态配置和条件显示
 * - Vue组件集成和自定义控件
 * - 配置模式和高级选项
 * 
 * 该配置文件演示了：
 * 1. 从基础到高级的所有设置类型
 * 2. 完整的表单验证体系
 * 3. 分组和布局管理
 * 4. 条件逻辑和动态交互
 * 5. 自定义组件集成
 */

import { markRaw } from 'vue'
import { 
  SettingControlType  // 枚举值导入，移除type关键字
} from '@/card2.1/types'
import type { 
  Setting,
  SettingValidationRule,
  ComponentSettingConfig,
  CustomConfig,
  ConfigMode,
  SettingGroup,
  EnhancedComponentSettingConfig
} from '@/card2.1/types'
import type { TypeTestConfig } from '@/card2.1/components/test/type-test/definition'

// 导入自定义设置组件（如果需要）
// import CustomColorPicker from '@/card2.1/components/test/type-test/components/CustomColorPicker.vue'
// import AdvancedNumberInput from '@/card2.1/components/test/type-test/components/AdvancedNumberInput.vue'

/**
 * 设置项定义数组
 * 按功能和复杂度组织，展示所有可用的设置类型
 */
const settingDefinitions: Setting[] = [
  
  // ============ 基础设置分组 ============
  {
    type: SettingControlType.INPUT,
    label: '组件标题',
    field: 'title',
    group: '基础设置',
    placeholder: '请输入组件标题',
    defaultValue: '类型测试组件',
    required: true,
    tooltip: '显示在组件顶部的标题文字，支持多语言',
    validation: {
      required: true,
      minLength: 1,
      maxLength: 50,
      pattern: '^[\\u4e00-\\u9fa5a-zA-Z0-9\\s\\-_]+$',
      message: '标题只能包含中文、英文、数字、空格、连字符和下划线'
    } as SettingValidationRule
  },

  {
    type: SettingControlType.TEXTAREA,
    label: '副标题',
    field: 'subtitle',
    group: '基础设置',
    placeholder: '请输入副标题（可选）',
    defaultValue: '',
    required: false,
    rows: 2,
    maxlength: 200,
    showWordLimit: true,
    tooltip: '可选的副标题说明文字，支持换行',
    validation: {
      maxLength: 200
    }
  },

  {
    type: SettingControlType.SELECT,
    label: '组件尺寸',
    field: 'size',
    group: '基础设置',
    defaultValue: 'medium',
    required: true,
    options: [
      { label: '小尺寸', value: 'small', description: '适用于仪表板中的小卡片' },
      { label: '中尺寸', value: 'medium', description: '标准尺寸，适用于大多数场景' },
      { label: '大尺寸', value: 'large', description: '适用于重要数据的突出显示' }
    ],
    tooltip: '选择组件的显示尺寸，影响字体大小和内边距'
  },

  {
    type: SettingControlType.RADIO_GROUP,
    label: '背景主题',
    field: 'backgroundTheme',
    group: '基础设置',
    defaultValue: 'auto',
    required: false,
    options: [
      { label: '浅色', value: 'light' },
      { label: '深色', value: 'dark' },
      { label: '自动', value: 'auto' }
    ],
    tooltip: '选择组件的背景主题模式'
  },

  {
    type: SettingControlType.SWITCH,
    label: '显示边框',
    field: 'showBorder',
    group: '基础设置',
    defaultValue: true,
    required: false,
    tooltip: '是否显示组件的外边框'
  },

  // ============ 数据设置分组 ============
  {
    type: SettingControlType.INPUT_NUMBER,
    label: '主要数值',
    field: 'primaryValue',
    group: '数据设置',
    defaultValue: 0,
    required: true,
    min: -999999,
    max: 999999,
    step: 0.01,
    precision: 2,
    placeholder: '请输入数值',
    tooltip: '组件显示的主要数值数据',
    validation: {
      required: true,
      type: 'number',
      min: -999999,
      max: 999999
    }
  },

  {
    type: SettingControlType.INPUT_NUMBER,
    label: '次要数值',
    field: 'secondaryValue',
    group: '数据设置',
    defaultValue: null,
    required: false,
    min: 0,
    max: 100,
    step: 1,
    placeholder: '可选的次要数值',
    tooltip: '可选的辅助数值，用于对比显示'
  },

  {
    type: SettingControlType.INPUT,
    label: '数值单位',
    field: 'unit',
    group: '数据设置',
    defaultValue: '',
    required: false,
    placeholder: '如：℃、%、m/s等',
    tooltip: '数值的单位标识，显示在数值后面',
    validation: {
      maxLength: 10,
      pattern: '^[A-Za-z%°℃℉/\\s]*$',
      message: '单位只能包含英文字母、百分号、度数符号等'
    }
  },

  {
    type: SettingControlType.SLIDER,
    label: '数值精度',
    field: 'precision',
    group: '数据设置',
    defaultValue: 2,
    required: false,
    min: 0,
    max: 6,
    step: 1,
    showTooltip: true,
    marks: {
      0: '整数',
      1: '1位',
      2: '2位', 
      3: '3位',
      6: '6位'
    },
    tooltip: '数值显示的小数位数，0表示显示整数'
  },

  // ============ 样式设置分组 ============
  {
    type: SettingControlType.INPUT_NUMBER,
    label: '字体大小',
    field: 'fontSize',
    group: '样式设置',
    defaultValue: 14,
    required: false,
    min: 10,
    max: 72,
    step: 1,
    suffix: 'px',
    tooltip: '组件文字的字体大小（像素）',
    validation: {
      type: 'number',
      min: 10,
      max: 72
    }
  },

  {
    type: SettingControlType.SLIDER,
    label: '内边距',
    field: 'padding',
    group: '样式设置',
    defaultValue: 16,
    required: false,
    min: 0,
    max: 50,
    step: 2,
    showTooltip: true,
    tooltip: '组件内容与边框的间距'
  },

  {
    type: SettingControlType.INPUT_NUMBER,
    label: '圆角半径',
    field: 'borderRadius',
    group: '样式设置',
    defaultValue: 6,
    required: false,
    min: 0,
    max: 20,
    step: 1,
    suffix: 'px',
    tooltip: '组件边框的圆角大小'
  },

  {
    type: SettingControlType.COLOR_PICKER,
    label: '主色调',
    field: 'primaryColor',
    group: '样式设置',
    defaultValue: '#1890ff',
    required: false,
    showAlpha: false,
    predefine: [
      '#1890ff',
      '#52c41a', 
      '#faad14',
      '#f5222d',
      '#722ed1',
      '#13c2c2'
    ],
    tooltip: '组件的主要颜色主题'
  },

  // ============ 高级设置分组 ============
  {
    type: SettingControlType.SWITCH,
    label: '启用动画',
    field: 'enableAnimation',
    group: '高级设置',
    defaultValue: true,
    required: false,
    tooltip: '是否启用数值变化时的动画效果'
  },

  {
    type: SettingControlType.SLIDER,
    label: '动画持续时间',
    field: 'animationDuration',
    group: '高级设置',
    defaultValue: 1000,
    required: false,
    min: 100,
    max: 5000,
    step: 100,
    showTooltip: true,
    suffix: 'ms',
    tooltip: '动画效果的持续时间（毫秒）',
    // 条件显示：仅当启用动画时显示
    condition: {
      field: 'enableAnimation',
      operator: 'equals',
      value: true
    }
  },

  {
    type: SettingControlType.DYNAMIC_TAGS,
    label: '自定义标签',
    field: 'customTags',
    group: '高级设置',
    defaultValue: [],
    required: false,
    placeholder: '添加自定义标签',
    maxTags: 10,
    tooltip: '为组件添加自定义标签，用于分类和搜索'
  },

  {
    type: SettingControlType.INPUT,
    label: '自定义CSS类',
    field: 'customClassName',
    group: '高级设置',
    defaultValue: '',
    required: false,
    placeholder: '输入自定义CSS类名',
    tooltip: '为组件添加自定义的CSS类名，用于个性化样式',
    validation: {
      pattern: '^[a-zA-Z][a-zA-Z0-9\\-_\\s]*$',
      message: '类名必须以字母开头，只能包含字母、数字、连字符和下划线'
    }
  },

  // ============ 开发者设置分组 ============
  {
    type: SettingControlType.CHECKBOX,
    label: '开发者选项',
    field: 'devOptions',
    group: '开发者设置',
    defaultValue: [],
    required: false,
    options: [
      { label: '显示调试信息', value: 'showDebug' },
      { label: '启用性能监控', value: 'enablePerf' },
      { label: '显示数据结构', value: 'showDataStructure' },
      { label: '启用热重载', value: 'enableHotReload' }
    ],
    tooltip: '开发环境下的调试和监控选项'
  },

  {
    type: SettingControlType.DATE_PICKER,
    label: '测试日期',
    field: 'testDate',
    group: '开发者设置',
    defaultValue: new Date(),
    required: false,
    type: 'datetime',
    format: 'YYYY-MM-DD HH:mm:ss',
    tooltip: '用于测试日期时间处理的示例字段'
  }

  // ============ 自定义Vue组件示例 ============
  // 注意：自定义组件需要单独实现，这里仅作为类型示例
  /*
  {
    type: SettingControlType.VUE_COMPONENT,
    label: '高级颜色配置',
    field: 'advancedColors',
    group: '自定义组件',
    defaultValue: {
      primary: '#1890ff',
      secondary: '#52c41a',
      gradient: ['#1890ff', '#52c41a']
    },
    required: false,
    component: markRaw(CustomColorPicker), // 自定义Vue组件
    componentProps: {
      allowGradient: true,
      presetThemes: ['blue', 'green', 'orange']
    },
    tooltip: '使用自定义组件进行高级颜色配置'
  }
  */
]

/**
 * 设置分组定义
 * 组织和管理设置项的显示结构
 */
const settingGroups: SettingGroup[] = [
  {
    name: '基础设置',
    label: '基础设置',
    description: '组件的基本显示和行为配置',
    fields: ['title', 'subtitle', 'size', 'backgroundTheme', 'showBorder'],
    collapsible: false,
    defaultExpanded: true,
    icon: 'i-mdi-cog',
    order: 1
  },

  {
    name: '数据设置', 
    label: '数据设置',
    description: '组件的数据显示和格式化配置',
    fields: ['primaryValue', 'secondaryValue', 'unit', 'precision'],
    collapsible: true,
    defaultExpanded: true,
    icon: 'i-mdi-chart-line',
    order: 2
  },

  {
    name: '样式设置',
    label: '样式设置', 
    description: '组件的外观和视觉效果配置',
    fields: ['fontSize', 'padding', 'borderRadius', 'primaryColor'],
    collapsible: true,
    defaultExpanded: false,
    icon: 'i-mdi-palette',
    order: 3
  },

  {
    name: '高级设置',
    label: '高级设置',
    description: '动画、交互和个性化配置选项',
    fields: ['enableAnimation', 'animationDuration', 'customTags', 'customClassName'],
    collapsible: true,
    defaultExpanded: false,
    icon: 'i-mdi-cog-outline',
    order: 4
  },

  {
    name: '开发者设置',
    label: '开发者设置',
    description: '开发和调试相关的配置选项',
    fields: ['devOptions', 'testDate'],
    collapsible: true,
    defaultExpanded: false,
    icon: 'i-mdi-code-braces',
    order: 5,
    // 仅在开发环境显示
    condition: {
      field: '__DEV__',
      operator: 'equals',
      value: true
    }
  }
]

/**
 * 自定义配置定义
 * 定义组件的完整配置结构
 */
const customConfig: CustomConfig<TypeTestConfig> = {
  type: 'type-test',
  
  // 根级配置（影响整个组件容器）
  root: {
    // 变换配置
    transform: {
      rotate: 0,      // 旋转角度
      scale: 1,       // 缩放比例
      translateX: 0,  // X轴位移
      translateY: 0   // Y轴位移
    },
    
    // 布局配置
    layout: {
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden'
    },
    
    // 尺寸约束
    constraints: {
      minWidth: 200,
      minHeight: 100,
      maxWidth: 800,
      maxHeight: 600,
      aspectRatio: null // 宽高比约束，null表示不限制
    }
  },

  // 组件自定义配置
  customize: {
    // 基础配置
    title: '类型测试组件',
    subtitle: '',
    showBorder: true,
    backgroundTheme: 'auto',
    
    // 数据配置
    primaryValue: 0,
    secondaryValue: null,
    unit: '',
    precision: 2,
    
    // 样式配置
    size: 'medium',
    fontSize: 14,
    padding: 16,
    borderRadius: 6,
    
    // 高级配置
    enableAnimation: true,
    animationDuration: 1000,
    customClassName: '',
    extraProps: {}
  }
}

/**
 * 配置模式定义
 * 支持不同的配置复杂度级别
 */
const configModes: Record<ConfigMode, Setting[]> = {
  // 简单模式：只包含最基本的配置项
  simple: settingDefinitions.filter(setting => 
    ['title', 'primaryValue', 'unit', 'showBorder', 'size'].includes(setting.field)
  ),
  
  // 标准模式：包含常用配置项
  standard: settingDefinitions.filter(setting =>
    setting.group !== '开发者设置'
  ),
  
  // 高级模式：包含所有配置项
  advanced: settingDefinitions,
  
  // 自定义模式：可由用户自定义选择
  custom: []
}

/**
 * 完整的组件设置配置导出
 * 这是Card2.1设置系统的标准配置结构
 */
export const typeTestSettingConfig: EnhancedComponentSettingConfig<TypeTestConfig> = {
  // 组件类型标识
  componentType: 'type-test',
  
  // 设置项定义
  settings: settingDefinitions,
  
  // 自定义配置结构
  customConfig: customConfig,
  
  // 设置分组配置
  groups: settingGroups,
  
  // 配置模式支持
  configModes: configModes,
  
  // 默认配置模式
  defaultMode: 'standard' as ConfigMode,
  
  // 验证规则（全局级别）
  globalValidation: {
    // 数值范围验证
    crossFieldValidation: [
      {
        name: '数值范围检查',
        fields: ['primaryValue', 'secondaryValue'],
        validator: (values: any) => {
          const { primaryValue, secondaryValue } = values
          if (secondaryValue !== null && secondaryValue > primaryValue) {
            return '次要数值不应大于主要数值'
          }
          return true
        }
      },
      
      {
        name: '动画时长检查',
        fields: ['enableAnimation', 'animationDuration'],
        validator: (values: any) => {
          const { enableAnimation, animationDuration } = values
          if (enableAnimation && animationDuration < 100) {
            return '启用动画时，动画持续时间不能少于100毫秒'
          }
          return true
        }
      }
    ]
  },
  
  // 配置变更钩子
  hooks: {
    // 配置初始化时
    onConfigInit: (config: TypeTestConfig) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('配置初始化:', config)
      }
      return config
    },
    
    // 配置改变时
    onConfigChange: (newConfig: TypeTestConfig, oldConfig: TypeTestConfig, field?: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('配置改变:', { field, newConfig, oldConfig })
      }
      
      // 特殊逻辑处理
      if (field === 'size') {
        // 根据尺寸自动调整字体大小
        const fontSizeMap = { small: 12, medium: 14, large: 16 }
        newConfig.fontSize = fontSizeMap[newConfig.size] || 14
      }
      
      return newConfig
    },
    
    // 配置验证时
    onConfigValidate: (config: TypeTestConfig) => {
      const errors: string[] = []
      
      // 自定义验证逻辑
      if (config.title.length === 0) {
        errors.push('标题不能为空')
      }
      
      if (config.precision < 0 || config.precision > 6) {
        errors.push('精度必须在0-6之间')
      }
      
      return errors.length > 0 ? errors : true
    }
  },
  
  // 设置面板UI配置
  ui: {
    // 面板标题
    title: '类型测试组件配置',
    
    // 面板图标
    icon: 'i-mdi-cog',
    
    // 面板尺寸
    width: 320,
    maxHeight: 600,
    
    // 搜索功能
    searchable: true,
    searchPlaceholder: '搜索配置项...',
    
    // 重置功能
    resetable: true,
    resetConfirmText: '确定要重置所有配置吗？',
    
    // 帮助信息
    helpUrl: '/docs/components/type-test/configuration',
    
    // 高级模式切换
    allowModeSwitch: true,
    
    // 主题适配
    theme: 'auto'
  }
}

// 默认导出设置配置
export default typeTestSettingConfig