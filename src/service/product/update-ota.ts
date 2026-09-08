import { request } from '../request'

export const getOtaTaskList = (params: any): Promise<any> => request.get('/ota/task', { params })
export const getDeviceList = (params: any): Promise<any> => request.get('/device', { params })
export const addOtaPackage = (data: any): Promise<any> => request.post('/ota/package', data)
export const editOtaPackage = (data: any): Promise<any> => request.put('/ota/package', data)
export const deleteOtaPackage = (id: string): Promise<any> => request.delete(`/ota/package/${id}`)
// /ota/task
export const addOtaTask = (data: any): Promise<any> => request.post('/ota/task', data)
export const deleteOtaTask = (id: string): Promise<any> => request.delete(`/ota/task/${id}`)
// /ota/task/detail
export const getOtaTaskDetail = (params): Promise<any> => request.get(`/ota/task/detail`, { params })
export const editOtaTaskDetail = (params): Promise<any> => request.put(`/ota/task/detail`, params)
export const getOtaProgressLogs = (detailId: string): Promise<any> =>
	request.get('/ota/task/detail/logs', { params: { detail_id: detailId } })
