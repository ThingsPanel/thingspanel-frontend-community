import { request } from '../request';

/** 获取设备功能模板列表 */
export const deviceTemplate = async (params: { page: number; page_size: number; name?: string }) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/template`, { params });
};

/** 删除设备功能模板 */
export const deleteDeviceTemplate = async (id: string) => {
  return await request.delete<Api.BaseApi.Data | any>(`/device/template/${id}`);
};

export const getDeviceTemplateDetail = async (id: string) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/template/detail/${id}`);
};

export const getDeviceModel = async (params: { page: number; page_size: number; device_template_id: string }) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/model/telemetry`, { params });
};

export const postDeviceModel = async (params: {
  device_template_id: string;
  data_identifier: string;
  data_name?: string;
  data_type?: string;
  unit?: string;
  description?: string;
}) => {
  return await request.post<Api.BaseApi.Data | any>(`/device/model/telemetry`, { params });
};

export const putDeviceModel = async (params: {
  device_template_id: string;
  data_identifier: string;
  data_name?: string;
  data_type?: string;
  unit?: string;
  description?: string;
}) => {
  return await request.put<Api.BaseApi.Data | any>(`/device/model/telemetry`, { params });
};

/**
 * 获取用于下拉选择的设备列表 (根据文档更新)
 *
 * @param params - 查询参数 (可选)
 */
export const getDeviceListForSelect = async (params?: Api.Device.DeviceSelectorParams) => {
  // 使用文档提供的 URL 和参数类型
  // 假设 request.get 返回的 data 部分是 Api.Device.DeviceSelectItem[]
  return await request.get<Api.Device.DeviceSelectItem[]>(`/device/selector`, { params });
};
