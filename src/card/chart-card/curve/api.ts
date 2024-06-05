import { request } from '@/service/request/index';

export const deviceTelemetryList = async (params: any) => {
  return await request.get<any>('/telemetry/datas/statistic', { params });
};
