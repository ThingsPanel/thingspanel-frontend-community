import { request } from '../request';

/** 获取常规设置 - 主题设置 */
export const fetchThemeSetting = async () => {
  const data = await request.get<Api.GeneralSetting.Theme | null>('/logo');
  return data;
};

/** 获取常规设置 - 主题编辑 */
export const editThemeSetting = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/logo', params);
  return data;
};

/** 获取常规设置 - 数据清理设置列表 */
export const fetchDataClearList = async (params: any) => {
  const data = await request.get<Api.GeneralSetting.DataClear | null>('/datapolicy', {
    params
  });
  return data;
};

/** 编辑清理设置 */
export const editDataClear = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/datapolicy', params);
  return data;
};

/** 编辑清理设置 */
export const dictQuery = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>('dict/enum', { params });
};
/** 编辑清理设置 */
export const getFunction = async () => {
  return await request.get<Api.BaseApi.Data | any>('/sys_function');
};
/** 编辑清理设置 */
export const editFunction = async (param: { function_id: string }) => {
  return await request.put<Api.BaseApi.Data | any>(`/sys_function/${param.function_id}`);
};
