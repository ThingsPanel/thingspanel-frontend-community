import { request } from '../request';

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */

export function fetchLogin(email: string, password: string, salt: string | null) {
  return request.post<Api.Auth.LoginToken>('/login', { email, password, salt });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>('/user/detail');
}

// 登出接口
export function logout() {
  return request.get('/user/logout');
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

export function fetchEmailCode(email: string) {
  return request.get<{ email: string; is_register: number } | null>('/verification/code', {
    params: {
      email,
      is_register: 1
    }
  });
}
export function fetchEmailCodeByEmail(email: string) {
  return request.get<{ email: string; is_register: number } | null>('/verification/code', {
    params: {
      email,
      is_register: 2
    }
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
/** 修改密码 */
export const editUserPassWord = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>(`/reset/password`, params);
  return data;
};

export const fetchHomeData = async (params: any) => {
  const data = await request.get<{ config: string } | null>('/board/home', {
    params
  });
  return data;
};

export function registerByEmail(data: {
  email: string; // 邮箱
  verify_code: string; // 邮箱验证码
  password: string; // 用户密码
  confirm_password: string; // 确认密码
  phone_prefix: string; // 手机前缀
  phone_number: string; // 手机号码
}) {
  return request.post('/tenant/email/register', data, {
    headers: {
      'Content-Type': 'application/json' // 设置请求体类型为 application/json
    }
  });
}
