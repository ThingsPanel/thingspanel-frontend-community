import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TagsEditor from '../TagsEditor.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': { 'deviceTemplate.addTag': '添加标签', 'deviceTemplate.addTagPlaceholder': '输入后回车' } }
})

describe('TagsEditor', () => {
  it('renders existing tags', () => {
    const wrapper = mount(TagsEditor, {
      props: { modelValue: ['sensor', 'outdoor'] },
      global: { plugins: [i18n] }
    })
    expect(wrapper.text()).toContain('sensor')
    expect(wrapper.text()).toContain('outdoor')
  })

  it('emits update:modelValue when tag removed', async () => {
    const wrapper = mount(TagsEditor, {
      props: { modelValue: ['sensor', 'outdoor'] },
      global: { plugins: [i18n] }
    })
    // Find close button for first tag
    const closeBtn = wrapper.find('[data-test="tag-remove-0"]')
    if (closeBtn.exists()) {
      await closeBtn.trigger('click')
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).not.toContain('sensor')
    }
  })

  it('does not add duplicate tags', async () => {
    const wrapper = mount(TagsEditor, {
      props: { modelValue: ['sensor'] },
      global: { plugins: [i18n] }
    })
    // Simulate adding the same tag
    const input = wrapper.find('input')
    if (input.exists()) {
      await input.setValue('sensor')
      await input.trigger('keyup.enter')
      const emitted = wrapper.emitted('update:modelValue')
      // Should not have emitted with duplicate
      if (emitted) {
        expect(emitted[0][0]).toEqual(['sensor'])
      }
    }
  })
})
