import { describe, expect, it } from 'vitest'
import { TemplateNativeError } from '@/service/api/template-native-transport'
import {
  templateCopyErrorMessage,
  templateDeleteErrorMessage,
  templateInUseMessage
} from '@/service/api/template-delete'

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

describe('template in-use message', () => {
  it('names the blocking devices and falls back to the generic text', () => {
    const page = (total: number, names: string[]) => ({
      items: names.map((displayName, i) => ({ kind: 'device', id: `d${i}`, displayName })),
      page: 1,
      pageSize: 20,
      total
    })
    expect(templateInUseMessage(page(2, ['甲', '乙']))).toBe(
      '仍有 2 台设备在使用该模板：甲、乙。请先把这些设备解绑后再删除'
    )
    expect(templateInUseMessage(page(5, ['甲', '乙', '丙', '丁']))).toBe(
      '仍有 5 台设备在使用该模板：甲、乙、丙 等。请先把这些设备解绑后再删除'
    )
    expect(templateInUseMessage(null)).toContain('仍有设备在使用')
    expect(templateInUseMessage(page(0, []))).toContain('仍有设备在使用')
  })
})
