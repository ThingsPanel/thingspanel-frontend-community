import { request } from '../request';

/** 通知服务配置 */
export const fetchNotificationServicesEmail = async () => {
  const data = await request.get<Api.NotificationServices.Email | null>(`/notification/services/config/EMAIL`);
  return data;
};

/** 修改通知服务配置 */
export const editNotificationServices = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/notification/services/config', params);
  return data;
};

/** 发送测试邮件 */
export const sendTestEmail = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/notification/services/config/e-mail/test', params);
  return data;
};
