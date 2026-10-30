import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelDetail, ModelResources } from '@/service/api/thingmodel-native'

const { api, messages, route } = vi.hoisted(() => ({
  api: { get: vi.fn(), getResources: vi.fn(), update: vi.fn(), publish: vi.fn(), list: vi.fn() },
  messages: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  route: { query: { id: 'model-1' } }
}))

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/locales', () => ({
  $t: (key: string) =>
    ({
      'common.save': '保存',
      'common.saveSuccess': '保存成功',
      'generate.publish': '发布',
      'common.backToList': '返回列表',
      'market.versionHistory': '版本历史'
    })[key] || key
}))
vi.mock('@/service/api/thingmodel-native', () => ({
  thingModelNative: api,
  createOperationKey: () => crypto.randomUUID(),
  ThingModelNativeError: class extends Error {}
}))
vi.mock('@/utils/common/tool', () => ({ getDemoServerUrl: () => '/api/v1' }))
vi.mock('@/views/device/template/NativeModelDefinition.vue', () => ({ default: { render: () => null } }))
vi.mock('@/views/device/template/components/version-history-modal.vue', () => ({ default: { render: () => null } }))
vi.mock('@/views/device/template/components/step/web-chart-config.vue', () => ({ default: { render: () => null } }))
vi.mock('@/views/device/template/components/step/app-chart-config.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/list-page/index.vue', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', [slots['header-title']?.(), slots['card-view']?.()])
  })
}))
vi.mock('@/components/card-grid/index.vue', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.())
  })
}))
vi.mock('naive-ui', async () => {
  const { defineComponent: define, h: element } = await import('vue')
  const Slot = define({
    setup:
      (_, { slots }) =>
      () =>
        element('div', [slots.header?.(), slots.default?.(), slots['header-extra']?.()])
  })
  const Button = define({
    props: ['disabled', 'loading'],
    emits: ['click'],
    setup:
      (props, { emit, slots }) =>
      () =>
        element(
          'button',
          {
            disabled: props.disabled || props.loading,
            onClick: () => emit('click')
          },
          slots.default?.()
        )
  })
  const Input = define({
    props: ['value', 'inputProps'],
    emits: ['update:value'],
    setup:
      (props, { emit }) =>
      () =>
        element('input', {
          ...props.inputProps,
          value: props.value,
          onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
        })
  })
  const Modal = define({
    props: ['show'],
    setup:
      (props, { slots }) =>
      () =>
        props.show ? element('div', [slots.default?.(), slots.footer?.()]) : null
  })
  return {
    NButton: Button,
    NInput: Input,
    NModal: Modal,
    NCard: Slot,
    NAlert: Slot,
    NForm: Slot,
    NFormItem: Slot,
    NSpace: Slot,
    NSpin: Slot,
    NTabPane: Slot,
    NTabs: Slot,
    NTag: Slot,
    NIcon: Slot,
    NDataTable: Slot,
    NEmpty: Slot,
    NEllipsis: Slot,
    NPagination: Slot,
    NPopconfirm: Slot
  }
})

import * as naive from 'naive-ui'
import ThingModelDetail from '@/components/thingmodel-detail.vue'
import ThingModelList from '@/views/device/template/index.vue'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const options = {
  global: {
    components: {
      NFormItem: naive.NFormItem,
      NSpace: naive.NSpace,
      NTag: naive.NTag,
      NInput: naive.NInput,
      NButton: naive.NButton
    },
    stubs: { NUpload: true }
  }
}
let stored: ModelDetail
let resources: ModelResources

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  window.$message = messages as unknown as typeof window.$message
  stored = {
    modelID: 'model-1',
    draftRevision: 2,
    publishedRevision: 1,
    lifecycle: 'PUBLISHED',
    draft: { name: '原名称', descriptionI18n: null, category: null, fields: [] }
  }
  resources = {
    modelID: 'model-1',
    revision: 3,
    profile: { author: '', version: 'v1.0.1', brand: '', modelNumber: '', tags: [], cover: '' },
    webChartConfig: null,
    appChartConfig: null
  }
  api.get.mockImplementation(async () => clone(stored))
  api.getResources.mockImplementation(async () => clone(resources))
  api.update.mockImplementation(async request => {
    stored = { ...stored, draft: clone(request.model), draftRevision: stored.draftRevision + 1 }
    if (request.resources) resources = { ...resources, ...clone(request.resources), revision: resources.revision + 1 }
    return {
      status: 'SAVED',
      modelID: stored.modelID,
      draftRevision: stored.draftRevision,
      resourcesRevision: resources.revision
    }
  })
  api.list.mockImplementation(async () => ({
    items: [
      {
        modelID: stored.modelID,
        name: stored.draft.name,
        lifecycle: stored.lifecycle,
        draftRevision: stored.draftRevision,
        publishedRevision: stored.publishedRevision,
        updatedAt: '2026-10-30'
      }
    ],
    total: 1
  }))
  api.publish.mockImplementation(async () => {
    stored.publishedRevision = (stored.publishedRevision ?? 0) + 1
    return {
      status: 'SAVED',
      modelID: stored.modelID,
      draftRevision: stored.draftRevision,
      publishedRevision: stored.publishedRevision
    }
  })
})
afterEach(() => vi.restoreAllMocks())

describe('native thing model draft editing', () => {
  it('persists basic information and profile without publishing, including after reopening', async () => {
    const page = mount(ThingModelDetail, options)
    await flushPromises()
    await page.get('input[aria-label="名称"]').setValue('修改后的名称')
    await page.get('input[aria-label="作者"]').setValue('新作者')
    const save = page.findAll('button').find(button => /^(保存|保存草稿)$/.test(button.text()))!
    expect(save.attributes('disabled')).toBeUndefined()
    await save.trigger('click')
    await flushPromises()
    expect(api.update).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedDraftRevision: 2,
        expectedResourcesRevision: 3,
        model: expect.objectContaining({ name: '修改后的名称' }),
        resources: expect.objectContaining({
          profile: expect.objectContaining({ author: '新作者', version: 'v1.0.1' })
        })
      }),
      expect.any(String)
    )
    expect(api.publish).not.toHaveBeenCalled()
    expect(stored.publishedRevision).toBe(1)
    page.unmount()
    const reopened = mount(ThingModelDetail, options)
    await flushPromises()
    expect((reopened.get('input[aria-label="名称"]').element as HTMLInputElement).value).toBe('修改后的名称')
    expect((reopened.get('input[aria-label="作者"]').element as HTMLInputElement).value).toBe('新作者')
    reopened.unmount()
  })

  it('preserves edits and reuses the operation key after a failed draft save', async () => {
    api.update.mockRejectedValueOnce(new Error('网络中断'))
    const page = mount(ThingModelDetail, options)
    await flushPromises()
    await page.get('input[aria-label="名称"]').setValue('待保存的名称')
    const save = page.findAll('button').find(button => /^(保存|保存草稿)$/.test(button.text()))!
    await save.trigger('click')
    await flushPromises()
    expect(page.text()).toContain('网络中断')
    expect((page.get('input[aria-label="名称"]').element as HTMLInputElement).value).toBe('待保存的名称')
    await save.trigger('click')
    await flushPromises()
    expect(api.update.mock.calls[0][1]).toBe(api.update.mock.calls[1][1])
    expect(stored.draft.name).toBe('待保存的名称')
    expect(api.publish).not.toHaveBeenCalled()
    page.unmount()
  })

  it('explains an unchanged draft without creating a new draft or published version', async () => {
    const page = mount(ThingModelDetail, options)
    await flushPromises()
    expect(page.text()).toContain('草稿已保存')
    await page
      .findAll('button')
      .find(button => button.text() === '保存草稿')!
      .trigger('click')
    expect(messages.success).toHaveBeenCalledWith('草稿已保存，无需重复保存。')
    expect(api.update).not.toHaveBeenCalled()
    expect(api.publish).not.toHaveBeenCalled()
    page.unmount()
  })

  it('rejects a successful receipt whose readback does not contain the submitted draft', async () => {
    api.update.mockImplementation(async () => {
      stored.draftRevision += 1
      return {
        status: 'SAVED',
        modelID: stored.modelID,
        draftRevision: stored.draftRevision,
        resourcesRevision: resources.revision
      }
    })
    const page = mount(ThingModelDetail, options)
    await flushPromises()
    await page.get('input[aria-label="名称"]').setValue('尚未写入的名称')
    await page
      .findAll('button')
      .find(button => button.text() === '保存草稿')!
      .trigger('click')
    await flushPromises()
    expect(page.text()).toContain('草稿保存结果与提交内容不一致')
    expect((page.get('input[aria-label="名称"]').element as HTMLInputElement).value).toBe('尚未写入的名称')
    expect(
      page
        .findAll('button')
        .find(button => button.text() === '发布')!
        .attributes('disabled')
    ).toBeDefined()
    expect(messages.success).not.toHaveBeenCalled()
    page.unmount()
  })

  it('requires a saved draft before publishing and publishes the confirmed revisions', async () => {
    const page = mount(ThingModelDetail, options)
    await flushPromises()
    await page.get('input[aria-label="名称"]').setValue('待发布的名称')
    expect(
      page
        .findAll('button')
        .find(button => button.text() === '发布')!
        .attributes('disabled')
    ).toBeDefined()
    await page
      .findAll('button')
      .find(button => button.text() === '保存草稿')!
      .trigger('click')
    await flushPromises()
    expect(api.publish).not.toHaveBeenCalled()
    await page
      .findAll('button')
      .find(button => button.text() === '发布')!
      .trigger('click')
    await page
      .findAll('button')
      .filter(button => button.text() === '发布')
      .at(-1)!
      .trigger('click')
    await flushPromises()
    expect(api.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        modelID: 'model-1',
        expectedDraftRevision: 3,
        expectedResourcesRevision: 4
      }),
      expect.any(String)
    )
    page.unmount()
  })

  it('keeps an empty name local and explains why the draft cannot be saved', async () => {
    const page = mount(ThingModelDetail, options)
    await flushPromises()
    await page.get('input[aria-label="名称"]').setValue('   ')
    await page
      .findAll('button')
      .find(button => button.text() === '保存草稿')!
      .trigger('click')
    expect(page.text()).toContain('请输入物模型名称。')
    expect(api.update).not.toHaveBeenCalled()
    page.unmount()
  })

  it('refreshes the cached list when returning after saving a draft', async () => {
    const visible = ref(true)
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(KeepAlive, null, {
            default: () => (visible.value ? h(ThingModelList) : h('div', '详情页'))
          })
      }),
      options
    )
    await flushPromises()
    expect(host.text()).toContain('原名称')
    visible.value = false
    await nextTick()
    stored.draft.name = '已保存的名称'
    visible.value = true
    await flushPromises()
    expect(host.text()).toContain('已保存的名称')
    expect(api.list).toHaveBeenCalledTimes(2)
    host.unmount()
  })
})
