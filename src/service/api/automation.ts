import { request } from '../request';
/** 获取设备列表下拉菜单 */
export const deviceListAll = async (params: any) => {
  return await request.get<any>('/device/tenant/list', { params });
};

/** 获取设备配置下拉菜单 */
export const deviceConfigAll = async (params: any) => {
  return await request.get<any>('/device_config/menu', { params });
};

/** 单个设备动作选择下拉菜单 */
export const deviceMetricsConditionMenu = async (params: any) => {
  return await request.get<any>(`/device/metrics/condition/menu`, { params });
};

/** 单类设备动作选择下拉菜单 */
export const configMetricsConditionMenu = async (params: any) => {
  return await request.get<any>(`/device_config/metrics/condition/menu`, { params });
};

/** 单个设备动作选择下拉菜单 */
export const deviceMetricsMenu = async (params: any) => {
  return await request.get<any>(`/device/metrics/menu`, { params });
};

/** 单类设备动作选择下拉菜单 */
export const deviceConfigMetricsMenu = async (params: any) => {
  return await request.get<any>(`/device_config/metrics/menu`, { params });
};

/** 创建场景 */
export const sceneAdd = async (params: any) => {
  return await request.post<any>(`/scene`, params);
};

/** 修改场景 */
export const sceneEdit = async (params: any) => {
  return await request.put<any>(`/scene`, params);
};

/** 获取场景列表 */
export const sceneGet = async (params: any) => {
  return await request.get<any>(`/scene`, { params });
};

/** 删除场景 */
export const sceneDel = async (id: any) => {
  return await request.delete<any>(`/scene/${id}`);
};

/** 获取场景详情 */
export const sceneInfo = async (id: any) => {
  return await request.get<any>(`/scene/detail/${id}`);
};

/** 获取场景日志 */
export const sceneLog = async (params: any) => {
  return await request.get<any>(`/scene/log`, { params });
};

/** 激活场景 */
export const sceneActive = async (id: any) => {
  return await request.post<any>(`/scene/active/${id}`);
};

/** 创建场景 */
export const sceneAutomationsAdd = async (params: any) => {
  return await request.post<any>(`/scene_automations`, params);
};

/** 修改场景 */
export const sceneAutomationsEdit = async (params: any) => {
  return await request.put<any>(`/scene_automations`, params);
};

/** 获取场景列表 */
export const sceneAutomationsGet = async (params: any) => {
  return await request.get<any>(`/scene_automations/list`, { params });
};

/** 删除场景 */
export const sceneAutomationsDel = async (id: any) => {
  return await request.delete<any>(`/scene_automations/${id}`);
};

/** 获取场景详情 */
export const sceneAutomationsInfo = async (id: any) => {
  return await request.get<any>(`/scene_automations/detail/${id}`);
};

/** 获取场景日志 */
export const sceneAutomationsLog = async (params: any) => {
  return await request.get<any>(`/scene_automations/log`, { params });
};

/** 激活场景 */
export const sceneAutomationsSwitch = async (id: any) => {
  return await request.post<any>(`/scene_automations/switch/${id}`);
};
