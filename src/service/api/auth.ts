import { request } from '../request';

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */

export function fetchLogin(email: string, password: string) {
  return request.post<Api.Auth.LoginToken>('/login', { email, password });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>('/user/detail');
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */

export function fetchSmsCode(phone: string) {
  return request.post<string>('/getSmsCode', phone, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
  });
}

/** 获取用户列表 */
export const fetchUserList = async (params: any) => {
  const data = await request.get<Api.UserManagement.Data | null>('/user', {
    params
  });
  return data;
};

/** 添加用户 */
export const addUser = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/user', params);
  return data;
};

/** 编辑用户 */
export const editUser = async (params: any) => {
  // delete params.password;
  const data = await request.put<Api.BaseApi.Data>('/user', params);
  return data;
};

/** 删除用户 */
export const delUser = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/user/${id}`);
  return data;
};

/** 切换用户 */
export const transformUser = async (params: any) => {
  const data = await request.post<Api.Auth.LoginToken>(`/user/transform`, params);
  return data;
};

export const fetchHomeData = async (params: any) => {
  const data = await request.get<{ config: string } | null>('/board/home', {
    params
  });
  return data;
};
