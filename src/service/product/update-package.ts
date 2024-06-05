import { request } from '../request';

export const getOtaPackageList = (params: any): Promise<any> => request.get('/ota/package', { params });
export const getDeviceList = (params: any): Promise<any> => request.get('/device', { params });
export const addOtaPackage = (data: any): Promise<any> => request.post('/ota/package', data);
export const editOtaPackage = (data: any): Promise<any> => request.put('/ota/package', data);
export const deleteOtaPackage = (id: string): Promise<any> => request.delete(`/ota/package/${id}`);
