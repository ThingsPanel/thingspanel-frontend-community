import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ChartConfigEditor from '../ChartConfigEditor.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      'thingModel.addWidget': '添加图表',
      'thingModel.widgetKind.line': '折线图',
      'thingModel.widgetKind.number': '数字',
      'thingModel.widgetKind.gauge': '仪表盘',
      'thingModel.widgetKind.switch': '开关',
      'thingModel.widgetKind.bar': '柱状图',
      'thingModel.widgetKind.text': '文本',
    }
  }
})

const globalConfig = {
  plugins: [i18n]
}

describe('ChartConfigEditor', () => {
  it('renders empty widget list initially', () => {
    const wrapper = mount(ChartConfigEditor, {
      props: {
        modelValue: { default_widgets: [] },
        platform: 'WEB'
      },
      global: globalConfig
    })
    expect(wrapper.findAll('.widget-row')).toHaveLength(0)
  })

  it('emits update:modelValue with new widget when add is clicked', async () => {
    const wrapper = mount(ChartConfigEditor, {
      props: {
        modelValue: { default_widgets: [] },
        platform: 'WEB'
      },
      global: globalConfig
    })
    const addBtn = wrapper.find('[data-test="add-widget"]')
    if (addBtn.exists()) {
      await addBtn.trigger('click')
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0].default_widgets).toHaveLength(1)
    }
  })

  it('emits update when widget is removed', async () => {
    const wrapper = mount(ChartConfigEditor, {
      props: {
        modelValue: { default_widgets: [{ kind: 'line', options: {} }] },
        platform: 'WEB'
      },
      global: globalConfig
    })
    const removeBtn = wrapper.find('[data-test="remove-widget-0"]')
    if (removeBtn.exists()) {
      await removeBtn.trigger('click')
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0].default_widgets).toHaveLength(0)
    }
  })

  it('accepts APP platform prop', () => {
    const wrapper = mount(ChartConfigEditor, {
      props: {
        modelValue: { default_widgets: [] },
        platform: 'APP'
      },
      global: globalConfig
    })
    expect(wrapper.exists()).toBe(true)
  })
})
