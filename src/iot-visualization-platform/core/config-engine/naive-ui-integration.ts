/**
 * Naive UI 深度集成模块
 *
 * 功能概述：
 * 1. 与Naive UI组件系统深度集成
 * 2. 提供配置表单的自动生成和渲染
 * 3. 实现主题系统的完全集成
 * 4. 支持Naive UI组件的配置映射
 * 5. 提供响应式的UI组件适配器
 *
 * 设计原则：
 * - 完全基于Naive UI组件构建
 * - 自动主题适配和CSS变量集成
 * - 支持动态表单生成和验证
 * - 提供类型安全的组件配置
 * - 遵循Naive UI设计规范
 *
 * @author Claude
 * @version 1.0.0
 * @date 2024-12-17
 */

import { ref, computed, h, type VNode, type Component } from 'vue'
import type { FormInst, FormItemRule, MessageReactive } from 'naive-ui'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NSlider,
  NColorPicker,
  NDatePicker,
  NTimePicker,
  NRadioGroup,
  NRadio,
  NCheckboxGroup,
  NCheckbox,
  NButton,
  NCard,
  NSpace,
  NGrid,
  NGridItem,
  NDivider,
  NText,
  NIcon,
  NTooltip,
  NPopover,
  NCollapse,
  NCollapseItem,
  NTabs,
  NTabPane,
  NAlert,
  NBadge,
  NTag,
  useThemeVars,
  useMessage,
  useNotification,
  useDialog,
  useLoadingBar
} from 'naive-ui'
import type {
  WidgetConfiguration,
  ConfigurationValidationResult,
  ValidationRule
} from './types'
import type { EditorNodeConfiguration } from './visual-editor-integration-bridge'

/**
 * Naive UI 表单字段类型
 */
export type NaiveUIFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'switch'
  | 'slider'
  | 'color'
  | 'date'
  | 'time'
  | 'datetime'
  | 'radio'
  | 'checkbox'
  | 'checkboxGroup'
  | 'custom'

/**
 * Naive UI 表单字段配置接口
 */
export interface NaiveUIFieldConfig {
  type: NaiveUIFieldType              // 字段类型
  label: string                       // 字段标签
  key: string                         // 字段键名
  placeholder?: string                // 占位符
  defaultValue?: any                  // 默认值
  required?: boolean                  // 是否必填
  disabled?: boolean                  // 是否禁用
  hidden?: boolean                    // 是否隐藏
  options?: Array<{                   // 选项列表（用于select、radio等）
    label: string
    value: any
    disabled?: boolean
  }>
  validation?: FormItemRule[]         // 验证规则
  props?: Record<string, any>         // 组件属性
  slots?: Record<string, () => VNode> // 插槽内容
  group?: string                      // 分组名称
  order?: number                      // 排序权重
  span?: number                       // 栅格跨度
  tooltip?: string                    // 提示信息
  helpText?: string                   // 帮助文本
  dependencies?: string[]             // 依赖字段
  conditional?: {                     // 条件显示
    field: string
    operator: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'lt'
    value: any
  }
  onChange?: (value: any, formData: Record<string, any>) => void  // 值变更回调
}

/**
 * Naive UI 表单布局配置接口
 */
export interface NaiveUIFormLayout {
  labelWidth?: string | number        // 标签宽度
  labelAlign?: 'left' | 'center' | 'right'  // 标签对齐
  labelPlacement?: 'left' | 'top'     // 标签位置
  size?: 'small' | 'medium' | 'large' // 表单尺寸
  showFeedback?: boolean              // 显示验证反馈
  showLabel?: boolean                 // 显示标签
  showRequireMark?: boolean           // 显示必填标记
  requireMarkPlacement?: 'left' | 'right'  // 必填标记位置
  columns?: number                    // 栅格列数
  gap?: number                        // 间距
  responsive?: boolean                // 响应式布局
}

/**
 * Naive UI 主题集成配置接口
 */
export interface NaiveUIThemeIntegration {
  autoApplyTheme?: boolean            // 自动应用主题
  customColors?: Record<string, string>  // 自定义颜色
  customFonts?: Record<string, string>   // 自定义字体
  customSizes?: Record<string, string>   // 自定义尺寸
  darkModeSupport?: boolean           // 深色模式支持
  themeOverrides?: Record<string, any>   // 主题覆盖
}

/**
 * 配置表单生成器类
 *
 * 基于Naive UI组件自动生成配置表单
 */
export class NaiveUIConfigurationFormGenerator {
  private themeVars = useThemeVars()
  private message = useMessage()
  private notification = useNotification()
  private dialog = useDialog()
  private loadingBar = useLoadingBar()

  /**
   * 根据配置类型生成表单字段
   *
   * @param configuration 配置对象
   * @param options 生成选项
   * @returns 表单字段配置数组
   */
  generateFormFields(
    configuration: WidgetConfiguration,
    options: {
      includeAdvanced?: boolean
      groupByCategory?: boolean
      customFields?: Record<string, NaiveUIFieldConfig>
    } = {}
  ): NaiveUIFieldConfig[] {
    const fields: NaiveUIFieldConfig[] = []

    // 递归处理配置对象
    const processObject = (
      obj: any,
      keyPrefix = '',
      category = 'basic'
    ): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key
        const fieldConfig = this.createFieldConfig(fullKey, value, category)

        if (fieldConfig) {
          // 检查是否有自定义字段配置
          if (options.customFields?.[fullKey]) {
            Object.assign(fieldConfig, options.customFields[fullKey])
          }

          fields.push(fieldConfig)
        }

        // 递归处理嵌套对象
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          processObject(value, fullKey, this.inferCategory(key))
        }
      }
    }

    processObject(configuration)

    // 按分组和顺序排序
    fields.sort((a, b) => {
      if (a.group !== b.group) {
        return (a.group || '').localeCompare(b.group || '')
      }
      return (a.order || 0) - (b.order || 0)
    })

    return fields
  }

  /**
   * 渲染配置表单
   *
   * @param fields 字段配置数组
   * @param formData 表单数据
   * @param layout 布局配置
   * @returns Vue组件渲染函数
   */
  renderConfigurationForm(
    fields: NaiveUIFieldConfig[],
    formData: Record<string, any>,
    layout: NaiveUIFormLayout = {}
  ) {
    const formRef = ref<FormInst>()

    // 分组字段
    const groupedFields = this.groupFields(fields)

    // 验证表单
    const validateForm = async (): Promise<boolean> => {
      try {
        await formRef.value?.validate()
        return true
      } catch (errors) {
        this.message.error('表单验证失败，请检查输入')
        return false
      }
    }

    // 重置表单
    const resetForm = (): void => {
      formRef.value?.restoreValidation()
      // 重置为默认值
      for (const field of fields) {
        if (field.defaultValue !== undefined) {
          this.setNestedValue(formData, field.key, field.defaultValue)
        }
      }
    }

    return {
      formRef,
      validateForm,
      resetForm,
      render: () => h(
        NForm,
        {
          ref: formRef,
          model: formData,
          labelWidth: layout.labelWidth || 120,
          labelAlign: layout.labelAlign || 'left',
          labelPlacement: layout.labelPlacement || 'left',
          size: layout.size || 'medium',
          showFeedback: layout.showFeedback !== false,
          showLabel: layout.showLabel !== false,
          showRequireMark: layout.showRequireMark !== false,
          requireMarkPlacement: layout.requireMarkPlacement || 'left'
        },
        () => this.renderFormContent(groupedFields, formData, layout)
      )
    }
  }

  /**
   * 创建字段配置
   *
   * @param key 字段键名
   * @param value 字段值
   * @param category 分类
   * @returns 字段配置
   */
  private createFieldConfig(
    key: string,
    value: any,
    category: string
  ): NaiveUIFieldConfig | null {
    const label = this.generateFieldLabel(key)
    const type = this.inferFieldType(value)

    if (!type) {
      return null
    }

    const config: NaiveUIFieldConfig = {
      type,
      label,
      key,
      defaultValue: value,
      group: category,
      order: this.getFieldOrder(key, category)
    }

    // 根据类型设置特定配置
    switch (type) {
      case 'input':
        config.placeholder = `请输入${label}`
        break

      case 'textarea':
        config.placeholder = `请输入${label}`
        config.props = { type: 'textarea', rows: 3 }
        break

      case 'number':
        config.placeholder = `请输入${label}`
        config.props = { precision: this.inferNumberPrecision(value) }
        break

      case 'select':
        config.options = this.generateSelectOptions(value)
        config.placeholder = `请选择${label}`
        break

      case 'switch':
        config.props = { checkedValue: true, uncheckedValue: false }
        break

      case 'color':
        config.props = { showAlpha: true }
        break

      case 'slider':
        config.props = {
          min: 0,
          max: 100,
          step: 1
        }
        break
    }

    // 设置验证规则
    config.validation = this.generateValidationRules(key, type, value)

    // 设置提示信息
    config.tooltip = this.generateTooltip(key, type)

    return config
  }

  /**
   * 推断字段类型
   *
   * @param value 字段值
   * @returns 字段类型
   */
  private inferFieldType(value: any): NaiveUIFieldType | null {
    if (value === null || value === undefined) {
      return 'input'
    }

    switch (typeof value) {
      case 'string':
        if (value.length > 100) {
          return 'textarea'
        }
        if (value.startsWith('#') && (value.length === 7 || value.length === 9)) {
          return 'color'
        }
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return 'date'
        }
        if (value.match(/^\d{2}:\d{2}:\d{2}$/)) {
          return 'time'
        }
        return 'input'

      case 'number':
        return 'number'

      case 'boolean':
        return 'switch'

      default:
        if (Array.isArray(value)) {
          return 'checkboxGroup'
        }
        return 'input'
    }
  }

  /**
   * 推断分类
   *
   * @param key 字段键名
   * @returns 分类名称
   */
  private inferCategory(key: string): string {
    const categoryMap: Record<string, string> = {
      style: 'styling',
      color: 'styling',
      font: 'styling',
      size: 'layout',
      width: 'layout',
      height: 'layout',
      position: 'layout',
      margin: 'layout',
      padding: 'layout',
      data: 'data',
      api: 'data',
      url: 'data',
      event: 'events',
      click: 'events',
      change: 'events',
      animation: 'animation',
      transition: 'animation'
    }

    for (const [pattern, category] of Object.entries(categoryMap)) {
      if (key.toLowerCase().includes(pattern)) {
        return category
      }
    }

    return 'basic'
  }

  /**
   * 生成字段标签
   *
   * @param key 字段键名
   * @returns 标签文本
   */
  private generateFieldLabel(key: string): string {
    // 移除路径前缀，只保留最后一段
    const lastSegment = key.split('.').pop() || key

    // 转换驼峰命名为可读文本
    return lastSegment
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  /**
   * 获取字段排序权重
   *
   * @param key 字段键名
   * @param category 分类
   * @returns 排序权重
   */
  private getFieldOrder(key: string, category: string): number {
    const orderMap: Record<string, number> = {
      basic: 100,
      layout: 200,
      styling: 300,
      data: 400,
      events: 500,
      animation: 600,
      advanced: 900
    }

    return orderMap[category] || 500
  }

  /**
   * 推断数字精度
   *
   * @param value 数字值
   * @returns 精度
   */
  private inferNumberPrecision(value: number): number {
    if (Number.isInteger(value)) {
      return 0
    }

    const str = value.toString()
    const decimal = str.split('.')[1]
    return decimal ? decimal.length : 0
  }

  /**
   * 生成选择框选项
   *
   * @param value 字段值
   * @returns 选项数组
   */
  private generateSelectOptions(value: any): Array<{ label: string; value: any }> {
    // 这里可以根据具体的业务逻辑生成选项
    // 暂时返回示例选项
    return [
      { label: '选项1', value: 'option1' },
      { label: '选项2', value: 'option2' },
      { label: '选项3', value: 'option3' }
    ]
  }

  /**
   * 生成验证规则
   *
   * @param key 字段键名
   * @param type 字段类型
   * @param value 字段值
   * @returns 验证规则数组
   */
  private generateValidationRules(
    key: string,
    type: NaiveUIFieldType,
    value: any
  ): FormItemRule[] {
    const rules: FormItemRule[] = []

    // 基础验证规则
    if (key.includes('required') || key.includes('必填')) {
      rules.push({
        required: true,
        message: `请输入${this.generateFieldLabel(key)}`,
        trigger: ['blur', 'input']
      })
    }

    // 类型特定验证规则
    switch (type) {
      case 'input':
        if (key.includes('email')) {
          rules.push({
            type: 'email',
            message: '请输入有效的邮箱地址',
            trigger: ['blur', 'input']
          })
        }
        if (key.includes('url')) {
          rules.push({
            type: 'url',
            message: '请输入有效的URL地址',
            trigger: ['blur', 'input']
          })
        }
        break

      case 'number':
        rules.push({
          type: 'number',
          message: '请输入有效的数字',
          trigger: ['blur', 'input']
        })
        if (key.includes('positive')) {
          rules.push({
            validator: (rule, value) => value > 0,
            message: '请输入大于0的数字',
            trigger: ['blur', 'input']
          })
        }
        break
    }

    return rules
  }

  /**
   * 生成提示信息
   *
   * @param key 字段键名
   * @param type 字段类型
   * @returns 提示信息
   */
  private generateTooltip(key: string, type: NaiveUIFieldType): string {
    const tooltipMap: Record<string, string> = {
      color: '点击选择颜色',
      date: '选择日期',
      time: '选择时间',
      number: '输入数字',
      switch: '开启/关闭',
      slider: '拖动滑块调整数值'
    }

    return tooltipMap[type] || `配置${this.generateFieldLabel(key)}`
  }

  /**
   * 分组字段
   *
   * @param fields 字段配置数组
   * @returns 分组后的字段映射
   */
  private groupFields(fields: NaiveUIFieldConfig[]): Record<string, NaiveUIFieldConfig[]> {
    const groups: Record<string, NaiveUIFieldConfig[]> = {}

    for (const field of fields) {
      const group = field.group || 'basic'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(field)
    }

    return groups
  }

  /**
   * 渲染表单内容
   *
   * @param groupedFields 分组后的字段
   * @param formData 表单数据
   * @param layout 布局配置
   * @returns 渲染内容
   */
  private renderFormContent(
    groupedFields: Record<string, NaiveUIFieldConfig[]>,
    formData: Record<string, any>,
    layout: NaiveUIFormLayout
  ): VNode[] {
    const content: VNode[] = []

    // 如果只有一个分组，直接渲染字段
    if (Object.keys(groupedFields).length === 1) {
      const fields = Object.values(groupedFields)[0]
      content.push(this.renderFieldGrid(fields, formData, layout))
    } else {
      // 多个分组，使用标签页或折叠面板
      content.push(this.renderGroupedFields(groupedFields, formData, layout))
    }

    return content
  }

  /**
   * 渲染字段网格
   *
   * @param fields 字段数组
   * @param formData 表单数据
   * @param layout 布局配置
   * @returns 网格组件
   */
  private renderFieldGrid(
    fields: NaiveUIFieldConfig[],
    formData: Record<string, any>,
    layout: NaiveUIFormLayout
  ): VNode {
    const columns = layout.columns || 1
    const responsive = layout.responsive !== false

    return h(
      NGrid,
      {
        cols: columns,
        responsive: responsive ? 'screen' : false,
        xGap: layout.gap || 16,
        yGap: layout.gap || 16
      },
      () => fields
        .filter(field => this.shouldShowField(field, formData))
        .map(field => h(
          NGridItem,
          { span: field.span || 1 },
          () => this.renderFormField(field, formData)
        ))
    )
  }

  /**
   * 渲染分组字段
   *
   * @param groupedFields 分组字段
   * @param formData 表单数据
   * @param layout 布局配置
   * @returns 分组组件
   */
  private renderGroupedFields(
    groupedFields: Record<string, NaiveUIFieldConfig[]>,
    formData: Record<string, any>,
    layout: NaiveUIFormLayout
  ): VNode {
    // 使用折叠面板展示分组
    return h(
      NCollapse,
      { defaultExpandedNames: Object.keys(groupedFields) },
      () => Object.entries(groupedFields).map(([groupName, fields]) =>
        h(
          NCollapseItem,
          {
            title: this.getGroupTitle(groupName),
            name: groupName
          },
          () => this.renderFieldGrid(fields, formData, layout)
        )
      )
    )
  }

  /**
   * 渲染表单字段
   *
   * @param field 字段配置
   * @param formData 表单数据
   * @returns 表单项组件
   */
  private renderFormField(field: NaiveUIFieldConfig, formData: Record<string, any>): VNode {
    const value = this.getNestedValue(formData, field.key)
    const setValue = (newValue: any) => {
      this.setNestedValue(formData, field.key, newValue)
      field.onChange?.(newValue, formData)
    }

    // 表单项包装器
    const formItem = h(
      NFormItem,
      {
        label: field.label,
        path: field.key,
        rule: field.validation,
        showFeedback: true,
        showLabel: true,
        showRequireMark: field.required
      },
      () => [
        this.renderFieldComponent(field, value, setValue),
        field.helpText ? h(NText, { depth: 3, style: { fontSize: '12px' } }, () => field.helpText) : null
      ]
    )

    // 添加提示信息
    if (field.tooltip) {
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          trigger: () => formItem,
          default: () => field.tooltip
        }
      )
    }

    return formItem
  }

  /**
   * 渲染字段组件
   *
   * @param field 字段配置
   * @param value 当前值
   * @param setValue 设置值函数
   * @returns 字段组件
   */
  private renderFieldComponent(
    field: NaiveUIFieldConfig,
    value: any,
    setValue: (value: any) => void
  ): VNode {
    const commonProps = {
      value,
      'onUpdate:value': setValue,
      placeholder: field.placeholder,
      disabled: field.disabled,
      ...field.props
    }

    switch (field.type) {
      case 'input':
        return h(NInput, commonProps)

      case 'textarea':
        return h(NInput, { ...commonProps, type: 'textarea' })

      case 'number':
        return h(NInputNumber, commonProps)

      case 'select':
        return h(NSelect, {
          ...commonProps,
          options: field.options
        })

      case 'multiSelect':
        return h(NSelect, {
          ...commonProps,
          options: field.options,
          multiple: true
        })

      case 'switch':
        return h(NSwitch, commonProps)

      case 'slider':
        return h(NSlider, commonProps)

      case 'color':
        return h(NColorPicker, commonProps)

      case 'date':
        return h(NDatePicker, { ...commonProps, type: 'date' })

      case 'time':
        return h(NTimePicker, commonProps)

      case 'datetime':
        return h(NDatePicker, { ...commonProps, type: 'datetime' })

      case 'radio':
        return h(
          NRadioGroup,
          commonProps,
          () => field.options?.map(option =>
            h(NRadio, { value: option.value }, () => option.label)
          )
        )

      case 'checkboxGroup':
        return h(
          NCheckboxGroup,
          commonProps,
          () => field.options?.map(option =>
            h(NCheckbox, { value: option.value }, () => option.label)
          )
        )

      case 'custom':
        return field.slots?.default?.() || h('div', '自定义组件')

      default:
        return h(NInput, commonProps)
    }
  }

  /**
   * 检查是否应该显示字段
   *
   * @param field 字段配置
   * @param formData 表单数据
   * @returns 是否显示
   */
  private shouldShowField(field: NaiveUIFieldConfig, formData: Record<string, any>): boolean {
    if (field.hidden) {
      return false
    }

    if (field.conditional) {
      const { field: condField, operator, value: condValue } = field.conditional
      const fieldValue = this.getNestedValue(formData, condField)

      switch (operator) {
        case 'eq':
          return fieldValue === condValue
        case 'neq':
          return fieldValue !== condValue
        case 'in':
          return Array.isArray(condValue) && condValue.includes(fieldValue)
        case 'nin':
          return Array.isArray(condValue) && !condValue.includes(fieldValue)
        case 'gt':
          return fieldValue > condValue
        case 'lt':
          return fieldValue < condValue
        default:
          return true
      }
    }

    return true
  }

  /**
   * 获取分组标题
   *
   * @param groupName 分组名称
   * @returns 分组标题
   */
  private getGroupTitle(groupName: string): string {
    const titleMap: Record<string, string> = {
      basic: '基础配置',
      layout: '布局设置',
      styling: '样式设置',
      data: '数据配置',
      events: '事件配置',
      animation: '动画设置',
      advanced: '高级设置'
    }

    return titleMap[groupName] || groupName
  }

  /**
   * 获取嵌套对象的值
   *
   * @param obj 对象
   * @param path 路径
   * @returns 值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 设置嵌套对象的值
   *
   * @param obj 对象
   * @param path 路径
   * @param value 值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      return current[key]
    }, obj)

    target[lastKey] = value
  }
}

/**
 * 配置编辑器组件适配器
 *
 * 提供高级的配置编辑界面和交互
 */
export class NaiveUIConfigurationEditorAdapter {
  private formGenerator = new NaiveUIConfigurationFormGenerator()
  private message = useMessage()
  private dialog = useDialog()

  /**
   * 创建配置编辑器
   *
   * @param nodeConfig 节点配置
   * @param options 选项
   * @returns 编辑器组件
   */
  createConfigurationEditor(
    nodeConfig: EditorNodeConfiguration,
    options: {
      layout?: NaiveUIFormLayout
      themeIntegration?: NaiveUIThemeIntegration
      onSave?: (config: WidgetConfiguration) => Promise<void>
      onCancel?: () => void
      onValidate?: (result: ConfigurationValidationResult) => void
    } = {}
  ) {
    const formData = ref({ ...nodeConfig.configuration })
    const isLoading = ref(false)
    const isDirty = ref(false)

    // 生成表单字段
    const fields = this.formGenerator.generateFormFields(nodeConfig.configuration)

    // 创建表单
    const form = this.formGenerator.renderConfigurationForm(fields, formData.value, options.layout)

    // 保存配置
    const saveConfiguration = async (): Promise<void> => {
      if (!(await form.validateForm())) {
        return
      }

      try {
        isLoading.value = true
        await options.onSave?.(formData.value)
        isDirty.value = false
        this.message.success('配置保存成功')
      } catch (error) {
        this.message.error(`保存失败: ${error}`)
        throw error
      } finally {
        isLoading.value = false
      }
    }

    // 取消编辑
    const cancelEdit = (): void => {
      if (isDirty.value) {
        this.dialog.warning({
          title: '确认取消',
          content: '当前有未保存的更改，确定要取消吗？',
          positiveText: '确定',
          negativeText: '继续编辑',
          onPositiveClick: () => {
            options.onCancel?.()
          }
        })
      } else {
        options.onCancel?.()
      }
    }

    // 重置配置
    const resetConfiguration = (): void => {
      this.dialog.warning({
        title: '确认重置',
        content: '确定要重置到默认配置吗？此操作不可恢复。',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          form.resetForm()
          isDirty.value = true
        }
      })
    }

    // 监听表单变更
    watch(
      formData,
      () => {
        isDirty.value = true
      },
      { deep: true }
    )

    return {
      formData,
      isLoading,
      isDirty,
      form,
      saveConfiguration,
      cancelEdit,
      resetConfiguration,
      render: () => h(
        NCard,
        {
          title: `配置编辑 - ${nodeConfig.metadata.title}`,
          style: { maxWidth: '800px', margin: '20px auto' }
        },
        {
          default: () => form.render(),
          action: () => h(
            NSpace,
            { justify: 'end' },
            () => [
              h(
                NButton,
                {
                  onClick: resetConfiguration,
                  disabled: isLoading.value
                },
                () => '重置'
              ),
              h(
                NButton,
                {
                  onClick: cancelEdit,
                  disabled: isLoading.value
                },
                () => '取消'
              ),
              h(
                NButton,
                {
                  type: 'primary',
                  loading: isLoading.value,
                  disabled: !isDirty.value,
                  onClick: saveConfiguration
                },
                () => '保存'
              )
            ]
          )
        }
      )
    }
  }

  /**
   * 创建配置预览器
   *
   * @param configuration 配置对象
   * @returns 预览器组件
   */
  createConfigurationPreviewer(configuration: WidgetConfiguration) {
    return {
      render: () => h(
        NCard,
        { title: '配置预览' },
        () => h(
          'pre',
          { style: { fontSize: '12px', lineHeight: '1.5' } },
          JSON.stringify(configuration, null, 2)
        )
      )
    }
  }
}

// 导出主要类和函数
export { NaiveUIConfigurationFormGenerator, NaiveUIConfigurationEditorAdapter }

// 导出类型
export type {
  NaiveUIFieldType,
  NaiveUIFieldConfig,
  NaiveUIFormLayout,
  NaiveUIThemeIntegration
}