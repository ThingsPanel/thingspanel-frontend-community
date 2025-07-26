// 配置字段类型定义
export interface ConfigFieldSchema {
  key: string
  label: string
  type: 'text' | 'number' | 'color' | 'boolean' | 'select' | 'range'
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: any }[]
  description?: string
}

// 配置schema定义
export interface ConfigSchema {
  title: string
  fields: ConfigFieldSchema[]
}

// 表单字段变更回调
export type FieldChangeCallback = (key: string, value: any) => void

// 配置表单生成器
export class ConfigFormGenerator {
  // 创建表单元素
  static createForm(schema: ConfigSchema, currentConfig: any, onChange: FieldChangeCallback): HTMLElement {
    console.log('ConfigFormGenerator.createForm 调用:', { schema, currentConfig })

    const formContainer = document.createElement('div')
    formContainer.className = 'config-form-container'

    // 创建表单标题
    const title = document.createElement('h4')
    title.textContent = schema.title
    title.className = 'config-form-title'
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #333;
      font-weight: 500;
    `
    formContainer.appendChild(title)

    // 创建表单字段
    schema.fields.forEach(field => {
      const fieldContainer = this.createField(field, currentConfig[field.key] ?? field.defaultValue, onChange)
      formContainer.appendChild(fieldContainer)
    })

    return formContainer
  }

  // 创建单个字段
  private static createField(field: ConfigFieldSchema, value: any, onChange: FieldChangeCallback): HTMLElement {
    const fieldContainer = document.createElement('div')
    fieldContainer.className = 'config-field'
    fieldContainer.style.cssText = `
      margin-bottom: 16px;
    `

    // 创建字段标签
    const label = document.createElement('label')
    label.textContent = field.label
    label.className = 'config-field-label'
    label.style.cssText = `
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
      font-weight: 500;
    `
    fieldContainer.appendChild(label)

    // 根据字段类型创建对应的输入控件
    let inputElement: HTMLElement

    switch (field.type) {
      case 'text':
        inputElement = this.createTextInput(field, value, onChange)
        break
      case 'number':
        inputElement = this.createNumberInput(field, value, onChange)
        break
      case 'color':
        inputElement = this.createColorInput(field, value, onChange)
        break
      case 'boolean':
        inputElement = this.createBooleanInput(field, value, onChange)
        break
      case 'select':
        inputElement = this.createSelectInput(field, value, onChange)
        break
      case 'range':
        inputElement = this.createRangeInput(field, value, onChange)
        break
      default:
        inputElement = this.createTextInput(field, value, onChange)
    }

    fieldContainer.appendChild(inputElement)

    // 添加描述文本（如果有）
    if (field.description) {
      const description = document.createElement('div')
      description.textContent = field.description
      description.className = 'config-field-description'
      description.style.cssText = `
        font-size: 10px;
        color: #999;
        margin-top: 4px;
        line-height: 1.4;
      `
      fieldContainer.appendChild(description)
    }

    return fieldContainer
  }

  // 创建文本输入
  private static createTextInput(field: ConfigFieldSchema, value: any, onChange: FieldChangeCallback): HTMLElement {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = String(value || '')
    input.className = 'config-text-input'
    input.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s;
    `

    input.addEventListener('input', e => {
      onChange(field.key, (e.target as HTMLInputElement).value)
    })

    input.addEventListener('focus', () => {
      input.style.borderColor = '#40a9ff'
    })

    input.addEventListener('blur', () => {
      input.style.borderColor = '#d9d9d9'
    })

    return input
  }

  // 创建数字输入
  private static createNumberInput(field: ConfigFieldSchema, value: any, onChange: FieldChangeCallback): HTMLElement {
    const input = document.createElement('input')
    input.type = 'number'
    input.value = String(value || field.defaultValue || 0)

    if (field.min !== undefined) input.min = String(field.min)
    if (field.max !== undefined) input.max = String(field.max)
    if (field.step !== undefined) input.step = String(field.step)

    input.className = 'config-number-input'
    input.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s;
    `

    input.addEventListener('input', e => {
      const numValue = parseFloat((e.target as HTMLInputElement).value)
      onChange(field.key, isNaN(numValue) ? field.defaultValue : numValue)
    })

    input.addEventListener('focus', () => {
      input.style.borderColor = '#40a9ff'
    })

    input.addEventListener('blur', () => {
      input.style.borderColor = '#d9d9d9'
    })

    return input
  }

  // 创建颜色选择器
  private static createColorInput(field: ConfigFieldSchema, value: any, onChange: FieldChangeCallback): HTMLElement {
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.gap = '8px'
    container.style.alignItems = 'center'

    const colorInput = document.createElement('input')
    colorInput.type = 'color'
    colorInput.value = value || field.defaultValue || '#ffffff'
    colorInput.style.cssText = `
      width: 40px;
      height: 32px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      cursor: pointer;
    `

    const textInput = document.createElement('input')
    textInput.type = 'text'
    textInput.value = value || field.defaultValue || '#ffffff'
    textInput.style.cssText = `
      flex: 1;
      padding: 6px 8px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
    `

    const updateColor = (newValue: string) => {
      colorInput.value = newValue
      textInput.value = newValue
      onChange(field.key, newValue)
    }

    colorInput.addEventListener('input', e => {
      updateColor((e.target as HTMLInputElement).value)
    })

    textInput.addEventListener('input', e => {
      const value = (e.target as HTMLInputElement).value
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        updateColor(value)
      }
    })

    container.appendChild(colorInput)
    container.appendChild(textInput)

    return container
  }

  // 创建布尔开关
  private static createBooleanInput(field: ConfigFieldSchema, value: any, onChange: FieldChangeCallback): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = Boolean(value ?? field.defaultValue)
    checkbox.style.cssText = `
      width: 16px;
      height: 16px;
      cursor: pointer;
    `

    const statusText = document.createElement('span')
    statusText.style.cssText = `
      font-size: 11px;
      color: #666;
    `

    const updateStatus = (checked: boolean) => {
      statusText.textContent = checked ? '启用' : '禁用'
      onChange(field.key, checked)
    }

    updateStatus(checkbox.checked)

    checkbox.addEventListener('change', e => {
      updateStatus((e.target as HTMLInputElement).checked)
    })

    container.appendChild(checkbox)
    container.appendChild(statusText)

    return container
  }

  // 创建选择下拉框
  private static createSelectInput(field: ConfigFieldSchema, value: any, onChange: FieldChangeCallback): HTMLElement {
    const select = document.createElement('select')
    select.className = 'config-select-input'
    select.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 12px;
      background: white;
      cursor: pointer;
      outline: none;
    `

    // 添加选项
    field.options?.forEach(option => {
      const optionElement = document.createElement('option')
      optionElement.value = String(option.value)
      optionElement.textContent = option.label
      optionElement.selected = option.value === value
      select.appendChild(optionElement)
    })

    select.addEventListener('change', e => {
      const selectedValue = (e.target as HTMLSelectElement).value
      // 尝试转换为原始类型
      let parsedValue: any = selectedValue
      if (!isNaN(Number(selectedValue))) {
        parsedValue = Number(selectedValue)
      } else if (selectedValue === 'true' || selectedValue === 'false') {
        parsedValue = selectedValue === 'true'
      }
      onChange(field.key, parsedValue)
    })

    return select
  }

  // 创建范围滑块
  private static createRangeInput(field: ConfigFieldSchema, value: any, onChange: FieldChangeCallback): HTMLElement {
    const container = document.createElement('div')

    const rangeInput = document.createElement('input')
    rangeInput.type = 'range'
    rangeInput.value = String(value ?? field.defaultValue ?? 0)
    rangeInput.min = String(field.min ?? 0)
    rangeInput.max = String(field.max ?? 100)
    rangeInput.step = String(field.step ?? 1)
    rangeInput.style.cssText = `
      width: 100%;
      margin-bottom: 4px;
    `

    const valueDisplay = document.createElement('div')
    valueDisplay.style.cssText = `
      text-align: center;
      font-size: 11px;
      color: #666;
      font-family: monospace;
    `

    const updateValue = (newValue: number) => {
      valueDisplay.textContent = String(newValue)
      onChange(field.key, newValue)
    }

    updateValue(Number(rangeInput.value))

    rangeInput.addEventListener('input', e => {
      updateValue(Number((e.target as HTMLInputElement).value))
    })

    container.appendChild(rangeInput)
    container.appendChild(valueDisplay)

    return container
  }
}
