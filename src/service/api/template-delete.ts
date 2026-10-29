import { TemplateNativeError } from './template-native-transport'

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
