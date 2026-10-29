import { TemplateNativeError, type TemplateReferencePage } from './template-native-transport'

/** Plain Chinese for the refusals a template delete can get; anything else keeps the server's text. */
export function templateDeleteErrorMessage(error: unknown): string {
  if (error instanceof TemplateNativeError) {
    if (error.status === 409) return '仍有设备在使用该模板，请先把这些设备解绑后再删除'
    if (error.status === 412) return '模板已被其他人修改，请刷新后再试'
    if (error.status === 403) return '没有删除设备模板的权限'
    if (error.status === 404) return '该模板已不存在，请刷新列表'
  }
  return error instanceof Error && error.message ? error.message : '删除设备模板失败'
}

/** Plain Chinese for the refusals a template copy can get. */
export function templateCopyErrorMessage(error: unknown): string {
  if (error instanceof TemplateNativeError) {
    if (error.status === 409) return '已有同名模板，请换一个名称'
    if (error.status === 403) return '没有复制设备模板的权限'
    if (error.status === 404) return '源模板已不存在，请刷新列表'
  }
  return error instanceof Error && error.message ? error.message : '复制设备模板失败'
}

/** Names the devices that block a delete, e.g. “仍有 5 台设备在使用：甲、乙、丙 等”. */
export function templateInUseMessage(references: TemplateReferencePage | null | undefined): string {
  const base = '仍有设备在使用该模板，请先把这些设备解绑后再删除'
  if (!references || references.total < 1 || references.items.length === 0) return base
  const shown = references.items.slice(0, 3).map(item => item.displayName || item.id)
  const more = references.total > shown.length ? ' 等' : ''
  return `仍有 ${references.total} 台设备在使用该模板：${shown.join('、')}${more}。请先把这些设备解绑后再删除`
}
