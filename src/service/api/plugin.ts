import { request } from '../request';

// 获取服务列表数据
export const getServices = async (params: any) => {
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

// 获取租户服务接入点列表
export const getServiceAccess = async (params: any) => {
  return await request.get<Panel.Data>('/service/access/list', { params });
};

// 获取租户服务接入点表单
export const getServiceAccessForm = async (params: any) => {
  return await request.get<Panel.Data>('/service/access/voucher/form', {
    params
  });
};

// 删除租户服务接入点
export const delServiceAccess = async (id: any) => {
  return await request.delete<Panel.Data>(`/service/access/${id}`);
};

// 创建服务接入点
export const createServiceDrop = async (params: any) => {
  return await request.post<Panel.Data>('/service/access', params);
};

// 更新服务接入点
export const putServiceDrop = async (params: any) => {
  return await request.put<Panel.Data>('/service/access', params);
};

// 三方服务设备列表查询
export const getServiceListDrop = async (params: any) => {
  return await request.get<Panel.Data>('/service/access/device/list', {
    params
  });
};

// 设备配置下拉菜单✅
export const getSelectServiceMenuList = async (params: any) => {
  return await request.get<Panel.Data>('/device_config/menu', {
    params
  });
};

// 批量添加服务
export const batchAddServiceMenuList = async (params: any) => {
  return await request.post<Panel.Data>('/device/service/access/batch', params);
};
