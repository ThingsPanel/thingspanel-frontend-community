import { request } from '../request';

// 获取服务列表数据
export const getServiceList = async (params: any) => {
  return await request.get<Panel.Data>('/service/list', { params });
};

// 注册服务
export const registerService = async (params: any) => {
  return await request.post<Panel.Data>('/service', params);
};

// 更新服务
export const putRegisterService = async (params: any) => {
  return await request.put<Panel.Data>('/service', params);
};

// 删除服务
export const delRegisterService = async (id: any) => {
  return await request.delete<Panel.Data>(`/service/${id}`);
};
