import axios, { AxiosError } from 'axios';
import type { AxiosResponse, CancelTokenSource, CreateAxiosDefaults, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { nanoid } from '@sa/utils';
import { createAxiosConfig, createDefaultOptions, createRetryOptions } from './options';
import { BACKEND_ERROR_CODE, REQUEST_ID_KEY } from './constant';
import type {
  CustomAxiosRequestConfig,
  FlatRequestInstance,
  MappedType,
  RequestInstance,
  RequestOption,
  ResponseType
} from './type';

function createCommonRequest<ResponseData = any>(
  axiosConfig?: CreateAxiosDefaults,
  options?: Partial<RequestOption<ResponseData>>
) {
  const opts = createDefaultOptions<ResponseData>(options);

  const axiosConf = createAxiosConfig(axiosConfig);
  const instance = axios.create(axiosConf);

  const cancelTokenSourceMap = new Map<string, CancelTokenSource>();

  // config axios retry
  const retryOptions = createRetryOptions(axiosConf);
  axiosRetry(instance, retryOptions);

  instance.interceptors.request.use(conf => {
    const config: InternalAxiosRequestConfig = { ...conf };

    // set requestTs id
    const requestId = nanoid();
    config.headers.set(REQUEST_ID_KEY, requestId);

    // config cancel token
    const cancelTokenSource = axios.CancelToken.source();
    config.cancelToken = cancelTokenSource.token;
    cancelTokenSourceMap.set(requestId, cancelTokenSource);

    // handle config by hook
    const handledConfig = opts.onRequest?.(config) || config;

    return handledConfig;
  });

  instance.interceptors.response.use(
    async response => {
      if (opts.isBackendSuccess(response)) {
        return Promise.resolve(response);
      }

      const fail = await opts.onBackendFail(response, instance);
      if (fail) {
        return fail;
      }

      const backendError = new AxiosError<ResponseData>(
        'the backend requestTs error',
        BACKEND_ERROR_CODE,
        response.config,
        response.request,
        response
      );

      await opts.onError(backendError);

      return Promise.reject(backendError);
    },
    async (error: AxiosError<ResponseData>) => {
      await opts.onError(error);

      return Promise.reject(error);
    }
  );

  function cancelRequest(requestId: string) {
    const cancelTokenSource = cancelTokenSourceMap.get(requestId);
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
      cancelTokenSourceMap.delete(requestId);
    }
  }

  function cancelAllRequest() {
    cancelTokenSourceMap.forEach(cancelTokenSource => {
      cancelTokenSource.cancel();
    });
    cancelTokenSourceMap.clear();
  }

  return {
    instance,
    opts,
    cancelRequest,
    cancelAllRequest
  };
}

/**
 * create a requestTs instance
 *
 * @param axiosConfig axios config
 * @param options requestTs options
 */
export function createRequest<ResponseData = any>(
  axiosConfig?: CreateAxiosDefaults,
  options?: Partial<RequestOption<ResponseData>>
) {
  const { instance, opts, cancelRequest, cancelAllRequest } = createCommonRequest<ResponseData>(axiosConfig, options);

  const request: RequestInstance = async function request<T = any, R extends ResponseType = 'json'>(
    config: CustomAxiosRequestConfig
  ) {
    const response: AxiosResponse<ResponseData> = await instance(config);

    const responseType = response.config?.responseType || 'json';

    if (responseType === 'json') {
      return opts.transformBackendResponse(response);
    }

    return response.data as MappedType<R, T>;
  } as RequestInstance;
  const requestMethods = {
    async get<T = any, R extends ResponseType = 'json'>(url: string, config?: CustomAxiosRequestConfig<R>) {
      const fullConfig = { ...config, url, method: 'get' };
      return request<T, R>(fullConfig);
    },
    async post<T = any, R extends ResponseType = 'json'>(
      url: string,
      data?: any,
      config?: CustomAxiosRequestConfig<R>
    ) {
      const fullConfig = { ...config, url, data, method: 'post' };
      return request<T, R>(fullConfig);
    },
    async put<T = any, R extends ResponseType = 'json'>(url: string, data?: any, config?: CustomAxiosRequestConfig<R>) {
      const fullConfig = { ...config, url, data, method: 'put' };
      return request<T, R>(fullConfig);
    },
    async delete<T = any, R extends ResponseType = 'json'>(url: string, config?: CustomAxiosRequestConfig<R>) {
      const fullConfig = { ...config, url, method: 'delete' };
      return request<T, R>(fullConfig);
    },
    async delete2<T = any, R extends ResponseType = 'json'>(
      url: string,
      data?: any,
      config?: CustomAxiosRequestConfig<R>
    ) {
      const fullConfig = { ...config, url, data, method: 'delete' };

      return request<T, R>(fullConfig);
    }
  };

  Object.assign(request, requestMethods, {
    cancelRequest,
    cancelAllRequest
  });

  return request;
}

/**
 * create a flat requestTs instance
 *
 * The response data is a flat object: { data: any, error: AxiosError }
 *
 * @param axiosConfig axios config
 * @param options requestTs options
 */

export { BACKEND_ERROR_CODE, REQUEST_ID_KEY };
export type * from './type';
export type * from './options';
export type * from './constant';
export type * from './shared';

export function createFlatRequest<ResponseData = any>(
  axiosConfig?: CreateAxiosDefaults,
  options?: Partial<RequestOption<ResponseData>>
) {
  const { instance, opts, cancelRequest, cancelAllRequest } = createCommonRequest<ResponseData>(axiosConfig, options);
  // 确保在请求拦截器中移除所有null值的字段

  instance.interceptors.request.use(config => {
    if (config.params) {
      config.params = Object.entries(config.params).reduce((acc: Record<string, any>, [key, value]) => {
        if (value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
    }
    if (config.data) {
      config.data = Object.entries(config.data).reduce((acc: Record<string, any>, [key, value]) => {
        if (value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
    }
    return config;
  });
  const flatRequest: FlatRequestInstance = async function flatRequest<T = any, R extends ResponseType = 'json'>(
    config: CustomAxiosRequestConfig
  ) {
    try {
      const response: AxiosResponse<ResponseData> = await instance(config);

      const responseType = response.config?.responseType || 'json';

      if (responseType === 'json') {
        const data = opts.transformBackendResponse(response);

        return { data, error: null };
      }

      return { data: response.data as MappedType<R, T>, error: null };
    } catch (error) {
      return { data: null, error };
    }
  } as FlatRequestInstance;
  const requestMethods = {
    async get<T = any, R extends ResponseType = 'json'>(url: string, config?: CustomAxiosRequestConfig<R>) {
      const fullConfig = { ...config, url, method: 'get' };
      return flatRequest<T, R>(fullConfig);
    },
    async post<T = any, R extends ResponseType = 'json'>(
      url: string,
      data?: any,
      config?: CustomAxiosRequestConfig<R>
    ) {
      const fullConfig = { ...config, url, data, method: 'post' };
      return flatRequest<T, R>(fullConfig);
    },
    async put<T = any, R extends ResponseType = 'json'>(url: string, data?: any, config?: CustomAxiosRequestConfig<R>) {
      const fullConfig = { ...config, url, data, method: 'put' };
      return flatRequest<T, R>(fullConfig);
    },
    async delete<T = any, R extends ResponseType = 'json'>(url: string, config?: CustomAxiosRequestConfig<R>) {
      const fullConfig = { ...config, url, method: 'delete' };
      return flatRequest<T, R>(fullConfig);
    },
    async delete2<T = any, R extends ResponseType = 'json'>(
      url: string,
      data?: any,
      config?: CustomAxiosRequestConfig<R>
    ) {
      const fullConfig = { ...config, url, data, method: 'delete' };
      return flatRequest<T, R>(fullConfig);
    }
  };
  Object.assign(flatRequest, requestMethods, {
    cancelRequest,
    cancelAllRequest
  });

  return flatRequest;
}

export type { CreateAxiosDefaults, AxiosError };
