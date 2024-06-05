import type { AxiosInstance } from 'axios';
import { request } from '../request';

export default class Irrigation {
  private readonly http: AxiosInstance;

  constructor(http: AxiosInstance) {
    this.http = http;
  }

  getData(name: string) {
    this.http.get('');
    return name;
  }
}

/** 获取空间列表 */
export const getIrrigationSpaces = async () => {
  return await request.get<any>('irrigation/spaces');
};

/** 获取区域列表 */
export const getIrrigationDistricts = async (params: any) => {
  return await request.get<any>('irrigation/districts', { params });
};

/** 获取设备列表 */
export const getIrrigationDiveces = async (params: { id: string }) => {
  return await request.get<any>(`irrigation/districts/device/${params.id}`);
};

/** 新建定时计划 */
export const addTimeIrrigation = async (params: any) => {
  return await request.post<any>(`irrigation/scheduled`, params);
};

/** 新建定时计划 */
export const editTimeIrrigation = async (params: any) => {
  return await request.put<any>(`irrigation/scheduled`, params);
};

/** 获取设备列表 */
export const getIrrigationTimeList = async (params: any) => {
  return await request.get<any>(`irrigation/scheduled`, { params });
};

/** 定时灌溉-下发 */
export const irrigationTimeDistribute = async (id: string, params: { status: 2 | 3 }) => {
  return await request.get<any>(`/irrigation/scheduled/execute/${id}`, { params });
};
/** 定时灌溉-取消 */
export const irrigationTimeCancle = async (params: { id: string; status: 2 | 3 }) => {
  return await request.put<any>(`/irrigation/scheduled/cancel/${params.id}`, { params });
};

/** 定时灌溉-删除 */
export const irrigationTimeDel = async (id: string) => {
  return await request.delete<any>(`/irrigation/scheduled/${id}`);
};

/** 定时灌溉-日志 */
export const irrigationTimeHistorys = async (params: any) => {
  return await request.get<any>(`/irrigation/scheduled/historys`, { params });
};

/** 轮灌计划 */
/** 轮灌-设备列表 */
export const irrigationRotationDeviceList = async () => {
  return await request.get<any>(`/irrigation/districts/device/get`, { params: { page: 1, page_size: 100 } } as any);
};

/** 轮灌-添加计划 */
export const addIrrigationRotation = async (params: any) => {
  return await request.post<any>(`/irrigation/rotation`, params);
};
/** 轮灌-编辑计划 */
export const editIrrigationRotation = async (params: any) => {
  return await request.put<any>(`/irrigation/rotation`, params);
};

/** 轮灌-计划列表 */
export const irrigationRotationList = async (params: any) => {
  return await request.get<any>(`/irrigation/rotation`, { params });
};

/** 轮灌-计划下发 */
export const irrigationRotationExecute = async (params: any) => {
  return await request.put<any>(`/irrigation/rotation/execute/${params.id}`, { status: params.stauts });
};

/** 轮灌-计划取消 */
export const irrigationRotationCancel = async (params: any) => {
  return await request.put<any>(`/irrigation/rotation/cancel/${params.id}`);
};

/** 轮灌-计划删除 */
export const irrigationRotationDel = async (params: any) => {
  return await request.delete<any>(`/irrigation/rotation/${params}`);
};

/** 轮灌-日志 */
export const irrigationRotationHistorys = async (params: any) => {
  return await request.get<any>(`/irrigation/rotation/historys`, { params });
};

/** 轮灌-日志 */
export const irrigationRotationHistorysDetail = async (params: any) => {
  return await request.get<any>(`irrigation/rotation/result/${params.id}`, { params });
};

/** 轮灌-详情 */
export const irrigationRotationDetail = async (id: any) => {
  return await request.get<any>(`/irrigation/rotation/${id}`);
};

/** 群灌-添加 */
export const addIrrigationGroup = async (params: any) => {
  return await request.post<any>(`/irrigation/group`, params);
};

/** 群灌-计划列表 */
export const getIrrigationGroupList = async (params: any) => {
  return await request.get<any>(`/irrigation/group`, { params });
};

/** 群灌-设备列表 */
export const irrigationGroupDeviceList = async (params: any) => {
  return await request.get<any>(`/irrigation/districts/device/get`, { params });
};

/** 群灌-列表详情 */
export const irrigationGroupDeviceDetail = async (id: any) => {
  return await request.get<any>(`/irrigation/group/${id}`);
};

/** 群灌-设备类型 */
export const irrigationGroupDeviceTypes = async () => {
  return await request.get<any>('/dict/enum', { params: { dict_code: 'PRODUCT_TYPE' } });
};

/** 群灌-下发 */
export const irrigationGroupExcute = async (id: string) => {
  return await request.get<any>(`irrigation/group/execute/${id}`, { params: { status: 3 } });
};

/** 群灌-取消下发 */
export const irrigationGroupCancle = async (id: string) => {
  return await request.put<any>(`/irrigation/group/cancel/${id}`, { id, status: 3 });
};

/** 群灌-删除 */
export const irrigationGroupDel = async (id: string) => {
  return await request.delete<any>(`/irrigation/group/${id}`);
};

/** 群灌-日志 */
export const irrigationGroupHistorys = async (params: any) => {
  return await request.get<any>(`/irrigation/group/historys`, { params });
};

/** 群灌-日志详情 */
export const irrigationGroupHistoryDetail = async (params: any) => {
  return await request.get<any>(`/irrigation/group/result`, { params });
};
