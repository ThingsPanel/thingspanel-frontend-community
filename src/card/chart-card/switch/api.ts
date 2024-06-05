import { request } from '@/service/request/index';

export const deviceDatas = async (data: any) => {
  return await request.post<any>('/telemetry/datas/pub', data);
};

export const deviceDetail = async (params: any) => {
  return await request.get<any>('/telemetry/datas/current/keys', { params });
};
