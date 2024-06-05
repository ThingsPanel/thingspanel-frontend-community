import { request } from '../request';

/** 获取协议插件列表 */
export const fetchProtocolPluginList = async (params: any) => {
  const data = await request.get<Api.ApiApplyManagement.Data | null>('/protocol_plugin', {
    params
  });
  return data;
};

/** 创建协议插件 */
export const addProtocolPlugin = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/protocol_plugin', params);
  return data;
};

/** 编辑协议插件 */
export const editProtocolPlugin = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/protocol_plugin', params);
  return data;
};

/** 删除协议插件 */
export const delProtocolPlugin = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/protocol_plugin/${id}`);
  return data;
};
