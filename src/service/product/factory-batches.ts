import { request } from '../request';

const base = '/product/factory-batches';

export const listFactoryBatches = (params: { productKey: string; page: number }): Promise<any> =>
  request.get(base, { params });
export const getFactoryBatch = (batchId: string, params: { page: number; status?: string }): Promise<any> =>
  request.get(`${base}/${encodeURIComponent(batchId)}`, { params });
export const createFactoryBatch = (body: Record<string, unknown>): Promise<any> => request.post(base, body);
export const setFactoryBatchStatus = (batchId: string, status: string): Promise<any> =>
  request.post(`${base}/${encodeURIComponent(batchId)}/status`, { status });
export const issueFactoryStationGrant = (batchId: string, body: Record<string, unknown>): Promise<any> =>
  request.post(`${base}/${encodeURIComponent(batchId)}/stations`, body);
export const revokeFactoryStationGrant = (batchId: string, grantId: number): Promise<any> =>
  request.post(`${base}/${encodeURIComponent(batchId)}/stations/${grantId}/revoke`);
export const enableFactoryUnit = (batchId: string, deviceId: string): Promise<any> =>
  request.post(`${base}/${encodeURIComponent(batchId)}/units/${encodeURIComponent(deviceId)}/enable`);
