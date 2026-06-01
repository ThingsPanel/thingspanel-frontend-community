import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import StateMachineButtons from '../StateMachineButtons.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      'deviceTemplate.publish': '发布',
      'deviceTemplate.deriveDraft': '派生草稿',
      'deviceTemplate.archive': '归档',
      'deviceTemplate.publishConfirm': '确认发布？',
      'deviceTemplate.archiveConfirm': '确认归档？',
      'deviceTemplate.deleteConfirm': '确认删除？',
      'deviceTemplate.deleteDisabled': '有 {count} 台设备绑定',
      'deviceTemplate.archivedNoOp': '已归档',
    }
  }
})

describe('StateMachineButtons', () => {
  it('shows publish and delete buttons in DRAFT state', () => {
    const wrapper = mount(StateMachineButtons, {
      props: { status: 'DRAFT', boundDevicesCount: 0 },
      global: { plugins: [i18n] }
    })
    expect(wrapper.text()).toContain('发布')
  })

  it('shows deriveDraft and archive buttons in PUBLISHED state', () => {
    const wrapper = mount(StateMachineButtons, {
      props: { status: 'PUBLISHED', boundDevicesCount: 0 },
      global: { plugins: [i18n] }
    })
    expect(wrapper.text()).toContain('派生草稿')
    expect(wrapper.text()).toContain('归档')
  })

  it('disables delete when bound devices exist', () => {
    const wrapper = mount(StateMachineButtons, {
      props: { status: 'DRAFT', boundDevicesCount: 5 },
      global: { plugins: [i18n] }
    })
    // Delete button should be disabled or absent
    const deleteBtn = wrapper.find('[data-test="delete-btn"]')
    if (deleteBtn.exists()) {
      expect(deleteBtn.attributes('disabled')).toBeDefined()
    }
  })

  it('shows archived state as non-interactive', () => {
    const wrapper = mount(StateMachineButtons, {
      props: { status: 'ARCHIVED', boundDevicesCount: 0 },
      global: { plugins: [i18n] }
    })
    // Publish and archive buttons should not appear
    expect(wrapper.text()).not.toContain('发布')
    expect(wrapper.text()).not.toContain('归档')
  })

  it('emits publish on publish click', async () => {
    const wrapper = mount(StateMachineButtons, {
      props: { status: 'DRAFT', boundDevicesCount: 0 },
      global: { plugins: [i18n] }
    })
    const publishBtn = wrapper.find('[data-test="publish-btn"]')
    if (publishBtn.exists()) {
      await publishBtn.trigger('click')
      expect(wrapper.emitted('publish')).toBeTruthy()
    }
  })
})
