import { BACKEND_ERROR_CODE, createFlatRequest } from '@sa/axios';
import { localStg } from '@/utils/storage';
import { createProxyPattern, createServiceConfig } from '~/env.config';

const { otherBaseURL } = createServiceConfig(import.meta.env);
const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y';
const demoUrl = otherBaseURL.demo ? otherBaseURL.demo : `${window.location.origin}/api/v1`;

export const request = createFlatRequest<App.Service.DEVResponse>(
  {
    baseURL: isHttpProxy ? createProxyPattern() : demoUrl,
    headers: {
      apifoxToken: 'XL299LiMEDZ0H5h3A29PxwQXdMJqWyY2'
    }
  },
  {
    async onRequest(config) {
      const { headers, params } = config;
      // set token
      const token = localStg.get('token');
      const userLanguage = localStg.get('lang');
      // const Authorization = token ? `Bearer ${token}` : null;
      const headersWithToken = token ? { 'x-token': token } : {};
      if (userLanguage) {
        headersWithToken['Accept-Language'] = userLanguage;
      }
      Object.assign(headers, headersWithToken);
      if (params && typeof params === 'object' && !Array.isArray(params)) {
        Object.keys(params).forEach(key => {
          if (params[key] === '') {
            params[key] = undefined;
          }
        });
      }

      return config;
    },
    isBackendSuccess(response) {
      // when the backend response code is "0000", it means the requestTs is success
      // you can change this logic by yourself
      return response.data.code === 200;
    },
    async onBackendFail(_response) {
      // when the backend response code is not "0000", it means the requestTs is fail
      // for example: the token is expired, prefetch token and retry requestTs
    },
    transformBackendResponse(response) {
      if (response.config.method !== 'get') {
        window.$message?.destroyAll();
      }
      if ((response as any).config?.needMessage) {
        return response.data;
      }
      return response.data.data;
    },
    onError(error) {
      // when the requestTs is fail, you can show error message

      if (error?.response?.status === 401) {
        window.$message?.error('无法验证身份或获取权限，请重新登录。');

        setTimeout(() => {
          localStg.remove('token');
          localStg.remove('refreshToken');
          localStg.remove('userInfo');

          window.location.reload();
        }, 200);

        return;
      }

      let message = error.message;
      if (error.response?.status === 404) {
        window.$message?.error('请求的资源未找到 (404)。');
        return;
      }
      // show backend error message
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.message || message;
      }

    
      window.$message?.error(message);
    }
  }
);

export const mockRequest = createFlatRequest<App.Service.DEVResponse>(
  {
    baseURL: otherBaseURL.mock
  },
  {
    async onRequest(config) {
      const { headers } = config;

      // set token
      const token = localStg.get('token');
      const XToken = token || null;
      Object.assign(headers, { 'x-token': XToken });

      return config;
    },
    isBackendSuccess(response) {
      // when the backend response code is "200", it means the requestTs is success
      // you can change this logic by yourself
      return response.data.code === 200;
    },
    async onBackendFail(_response) {
      // when the backend response code is not "200", it means the requestTs is fail
      // for example: the token is expired, prefetch token and retry requestTs
    },
    transformBackendResponse(response) {
      return response.data.data;
    },
    onError(error) {
      // when the requestTs is fail, you can show error message

      let message = error.message;

      // show backend error message
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.message || message;
      }

      window.$message?.error(message);
    }
  }
);
