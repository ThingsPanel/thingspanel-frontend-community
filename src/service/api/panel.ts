import { request } from '../request';

export const getBoardList = async (params: Panel.RequestParams) => {
  return await request.get<Panel.Data>('/board', { params });
};

export const getBoard = async (params: string) => {
  return await request.get<Panel.Board>(`/board/${params}`);
};

export const PostBoard = async (params: any) => {
  return await request.post<any>('/board', params);
};

export const PutBoard = async (params: any) => {
  return await request.put<any>('/board', params);
};

export const DelBoard = async (params: string) => {
  return await request.delete<any>(`/board/${params}`);
};

export const deviceListForPanel = async (params: any) => {
  return await request.get<any>('/device/tenant/list', params);
};

export const deviceModelSourceForPanel = async (params: any) => {
  return await request.get<any>('/device/model/source/at/list', { params });
};

export const deviceMetricsList = async (params: string) => {
  const url = `device/metrics/${params}`;

  return await request.get<any>(url);
};
