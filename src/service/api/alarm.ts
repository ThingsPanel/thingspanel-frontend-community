/*
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-18 15:57:57
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-19 10:08:22
 */
import { request } from '../request';

/** 新增告警 */
export const addWarningMessage = async (params: any): Promise<any> => {
  const data = await request.post<Api.BaseApi.Data>('/alarm/config', params);
  return data;
};
/** 配置告警列表 */
export const warningMessageList = async (params: any): Promise<any> => {
  const data = await request.get<Api.UserManagement.Data | null>('/alarm/config', {
    params
  });
  return data;
};
/** 告警配置编辑:启用停止 */
export const editInfo = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/config', params);
  return data;
};

/** 告警配置编辑:启用停止 */
export const editInfoText = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/config', params);
  return data;
};

/** 删除告警配置 */
export const delInfo = async (id: string): Promise<any> => {
  const data = await request.delete<Api.BaseApi.Data>(`/alarm/config/${id}`);
  return data;
};

/** 告警信息列表 */
export const infoList = async (params: any): Promise<any> => {
  const data = await request.get<Api.UserManagement.Data | null>('/alarm/info', {
    params
  });
  return data;
};
/** 告警历史列表 */
export const alarmHistory = async (params: any): Promise<any> => {
  const data = await request.get<Api.UserManagement.Data | null>('/alarm/info/history', {
    params
  });
  return data;
};

/** 告警信息处理 */
export const processingOperation = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/info', params);
  return data;
};
/** 告警信息批量处理 */
export const batchProcessing = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/info/batch', params);
  return data;
};
