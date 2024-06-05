import { adapterOfFetchRouterList, adapterOfFetchUserRouterList } from '@/service/api/management.adapter';
import { request } from '../request';

/** get user routes */
export async function fetchGetUserRoutes() {
  const data = await request<Api.Route.UserRoute>({ url: '/ui_elements/menu' });
  data && data.data && (data.data.list = adapterOfFetchUserRouterList(data.data.list));
  return data;
}

/** 获取路由列表 */
export const fetchElementList = async (params: any = {}) => {
  const data = await request.get<Api.Route.Data>('/ui_elements', {
    params
  });
  // eslint-disable-next-line no-unused-expressions
  data && data.data && (data.data.list = adapterOfFetchRouterList(data.data));
  return data;
};

/** 添加路由 */
export const addElement = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/ui_elements', params);
  return data;
};
/** 编辑路由 */
export const editElement = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/ui_elements', params);
  return data;
};

/** 删除路由 */
export const delElement = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/ui_elements/${id}`);
  return data;
};

/** Get UI Element List */
export const fetchUIElementList = async () => {
  const data = await request.get<Api.Route.Data>('/ui_elements/select/form');
  return data?.data?.list || [];
};

/**
 * whether the route is existed
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  console.log(routeName);
  return false;
}
