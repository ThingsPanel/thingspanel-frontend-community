import { templateNative } from './template-native'
import { thingModelNative } from './thingmodel-native'
import { fromNativeField } from '@/views/device/template/native-field-mapping'
import type { FieldKind } from './thingmodel-native-transport'
import { request } from '../request'
/** 获取设备列表下拉菜单 */
export const deviceListAll = async (params: any) => {
  return await request.get<any>('/device/tenant/list', { params })
}

/** 获取设备配置下拉菜单 */
export const deviceConfigAll = async (params: any) => {
  try {
    const data: { id: string; name: string }[] = []
    const search = String(params?.device_config_name || '')
      .trim()
      .toLowerCase()
    for (let page = 1; ; page++) {
      const result = await templateNative.list({ page, pageSize: 100 })
      for (const template of result.items) {
        const model = template.configuration.model
        if (model?.modelId && model.publishedRevision > 0 && template.name.toLowerCase().includes(search)) {
          data.push({ id: template.id, name: template.name })
        }
      }
      if (!result.items.length || page * 100 >= result.total) break
    }
    return { data, error: null }
  } catch (error) {
    window.$message?.error('设备模板列表读取失败，请重试')
    return { data: [], error }
  }
}

async function templateMetrics(id: string, kinds: FieldKind[]) {
  try {
    const { template } = await templateNative.get(id)
    const binding = template.configuration.model
    if (!binding?.modelId || !binding.publishedRevision) throw new Error('请先在设备模板中绑定已发布的物模型版本')
    const snapshot = await thingModelNative.version(binding.modelId, binding.publishedRevision)
    const data = kinds
      .map(kind => ({
        data_source_type: kind === 'ATTRIBUTE' ? 'attributes' : kind.toLowerCase(),
        options: snapshot.model.fields
          .filter(
            field =>
              field.kind === kind &&
              (kind === 'COMMAND' ? field.access.write : kind === 'EVENT' ? field.access.observe : field.access.read)
          )
          .map(field => {
            const info = fromNativeField(field)
            return {
              key: field.identifier,
              label: field.nameI18n.default,
              data_type: info.data_type || 'String',
              params: info.params,
              enum: info.additional_info,
              unit: field.unit
            }
          })
      }))
      .filter(group => group.options.length > 0)
    return { data, error: null }
  } catch (error) {
    window.$message?.error('无法读取模板的已发布物模型，请检查模板绑定或重新选择模板')
    return { data: [], error }
  }
}

/** 单个设备条件选择下拉菜单 */
export const deviceMetricsConditionMenu = async (params: any) => {
  return await request.get<any>(`/device/metrics/condition/menu`, { params })
}

/** 单类设备条件选择下拉菜单 */
export const configMetricsConditionMenu = async (params: any) => {
  return templateMetrics(params.device_config_id, ['TELEMETRY', 'ATTRIBUTE', 'EVENT'])
}

/** 单个设备动作选择下拉菜单 */
export const deviceMetricsMenu = async (params: any) => {
  return await request.get<any>(`/device/metrics/menu`, { params })
}

/** 单类设备动作选择下拉菜单 */
export const deviceConfigMetricsMenu = async (params: any) => {
  return templateMetrics(params.device_config_id, ['COMMAND'])
}

/** 创建场景 */
export const sceneAdd = async (params: any) => {
  return await request.post<any>(`/scene`, params)
}

/** 修改场景 */
export const sceneEdit = async (params: any) => {
  return await request.put<any>(`/scene`, params)
}

/** 获取场景列表 */
export const sceneGet = async (params: any) => {
  return await request.get<any>(`/scene`, { params })
}

/** 删除场景 */
export const sceneDel = async (id: any) => {
  return await request.delete<any>(`/scene/${id}`)
}

/** 获取场景详情 */
export const sceneInfo = async (id: any) => {
  return await request.get<any>(`/scene/detail/${id}`)
}

/** 获取场景日志 */
export const sceneLog = async (params: any) => {
  return await request.get<any>(`/scene/log`, { params })
}

/** 激活场景 */
export const sceneActive = async (id: any) => {
  return await request.post<any>(`/scene/active/${id}`)
}

/** 创建场景 */
export const sceneAutomationsAdd = async (params: any) => {
  return await request.post<any>(`/scene_automations`, params)
}

/** 修改场景 */
export const sceneAutomationsEdit = async (params: any) => {
  return await request.put<any>(`/scene_automations`, params)
}

/** 获取场景列表 */
export const sceneAutomationsGet = async (params: any) => {
  return await request.get<any>(`/scene_automations/list`, { params })
}

/** 删除场景 */
export const sceneAutomationsDel = async (id: any) => {
  return await request.delete<any>(`/scene_automations/${id}`)
}

/** 获取场景详情 */
export const sceneAutomationsInfo = async (id: any) => {
  return await request.get<any>(`/scene_automations/detail/${id}`)
}

/** 获取场景日志 */
export const sceneAutomationsLog = async (params: any) => {
  return await request.get<any>(`/scene_automations/log`, { params })
}

/** 激活场景 */
export const sceneAutomationsSwitch = async (id: any) => {
  return await request.post<any>(`/scene_automations/switch/${id}`)
}
