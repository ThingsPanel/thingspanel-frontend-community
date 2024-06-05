import { request } from '../request';

// notification-group
export const getNotificationGroupList = async (params: Api.Alarm.NotificationGroupParams) => {
  return await request.get<{
    list: Api.Alarm.NotificationGroupList[];
    total: number;
  }>('/notification_group/list', { params });
};

export const getNotificationGroupDetail = async (params: { id: string }) => {
  return await request.get<Api.Alarm.NotificationGroupList>(`notification_group/${params.id}`);
};

export const deleteNotificationGroup = async (params: { id: string }) => {
  return await request.delete<Api.BaseApi.Data>(`/notification_group/${params.id}`);
};

export const postNotificationGroup = async (params: Api.Alarm.AddNotificationGroupParams) => {
  return await request.post<Api.BaseApi.Data>('/notification_group', params);
};

export const putNotificationGroup = async (
  params: {
    description: string;
    name: string;
    notification_config: string;
    notification_type: string;
    remark?: string;
    status: string;
    tenant_id: string;
  },
  id: string
) => {
  return await request.put<Api.BaseApi.Data>(`/notification_group/${id}`, params);
};

export const getUserList = async (params: { page: number; page_size: number; name?: string }) => {
  return await request.get('/user', { params });
};

// notification-record
export const getNotificationHistoryList = async (params: Api.Alarm.NotificationHistoryParams) => {
  return await request.get<{
    list: Api.Alarm.NotificationHistoryList[];
    total: number;
  }>('/notification_history/list', { params });
};
