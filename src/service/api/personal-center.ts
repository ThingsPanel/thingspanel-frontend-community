/*
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-18 09:47:03
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-18 11:34:34
 */
import { request } from '../request'

/** 获取个人信息 */
export const fetchUserInfo = async () => {
  return await request.get<Api.BaseApi.Data | any>('/board/user/info', {})
}
/** 修改个人基本信息 */
export const changeInformation = async (params: any): Promise<any> => {
  const data = await request.post<Api.BaseApi.Data>('/board/user/update', params)
  return data
}
/** 修改密码 */
export const passwordModification = async (params: any): Promise<any> => {
  const data = await request.post('/board/user/update/password', params)
  return data
}
/** 上传文件 */
export const uploadFile = async (params: any): Promise<any> => {
  const data = await request.post<Api.BaseApi.Data>('/file/up', params)
  return data
}
