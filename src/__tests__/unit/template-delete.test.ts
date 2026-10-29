import { describe, expect, it } from 'vitest'
import { TemplateNativeError } from '@/service/api/template-native-transport'
import { templateCopyErrorMessage, templateDeleteErrorMessage } from '@/service/api/template-delete'

describe('template delete messages', () => {
  it('explains the refusals in plain Chinese', () => {
    expect(templateDeleteErrorMessage(new TemplateNativeError(409))).toContain('先把这些设备解绑')
    expect(templateDeleteErrorMessage(new TemplateNativeError(412))).toContain('刷新')
    expect(templateDeleteErrorMessage(new TemplateNativeError(403))).toContain('权限')
    expect(templateDeleteErrorMessage(new TemplateNativeError(404))).toContain('不存在')
  })

  it('keeps other errors as written and falls back for unknown ones', () => {
    expect(templateDeleteErrorMessage(new TemplateNativeError(500, { detail: 'boom' } as never))).toBe('boom')
    expect(templateDeleteErrorMessage(null)).toBe('删除设备模板失败')
  })
})

describe('template copy messages', () => {
  it('explains a duplicate name and keeps other errors', () => {
    expect(templateCopyErrorMessage(new TemplateNativeError(409))).toContain('同名')
    expect(templateCopyErrorMessage(new TemplateNativeError(404))).toContain('不存在')
    expect(templateCopyErrorMessage(new TemplateNativeError(500, { detail: 'boom' } as never))).toBe('boom')
    expect(templateCopyErrorMessage(undefined)).toBe('复制设备模板失败')
  })
})
