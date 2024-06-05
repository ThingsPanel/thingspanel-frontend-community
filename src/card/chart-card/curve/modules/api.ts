import { request } from '@/service/request/index';

export const deviceDetail = async (params: any) => {
  return await request.get<any>('/telemetry/datas/current/keys', { params });
};
