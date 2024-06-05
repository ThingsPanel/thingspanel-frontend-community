
import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  CancelTokenSource,
  InternalAxiosRequestConfig
} from 'axios';
import {createProxyPattern, createServiceConfig} from '~/env.config';


const {otherBaseURL} = createServiceConfig(import.meta.env);

const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y';


interface ApiResponse<T> {
  data: T;
  status: number;
}

// 创建axios实例的函数
function createHttpClient(baseURL: string): AxiosInstance {
  const httpClient: AxiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 默认请求超时设置
  });

  // 请求拦截器
  httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // 移除所有值为null的字段
    const params = config.params || {};
    Object.keys(params).forEach(key => params[key] === null && delete params[key]);
    const data = config.data || {};
    Object.keys(data).forEach(key => data[key] === null && delete data[key]);

    // 添加x-token到请求头
    const authToken = 'your_token_here'; // 应从环境变量或其他安全位置获取
    if (config.headers) {
      config.headers['x-token'] = authToken;
    }

    return config;
  }, errorHandler);

  // 响应拦截器
  httpClient.interceptors.response.use((response: AxiosResponse) => {
    // 在这里进行一些响应数据的处理或者状态码的检查
    return response;
  }, errorHandler);

  return httpClient;
}

// 错误处理函数
function errorHandler(error: AxiosError) {
  if (error.response) {
    console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
  } else if (error.request) {
    console.error('No response received for request.');
  } else {
    console.error('Error setting up request:', error.message);
  }
  return Promise.reject(error);
}

// 创建请求取消逻辑
function createCancelTokenSource() {
  let cancelTokenSource: CancelTokenSource = axios.CancelToken.source();

  function getRequestCancelToken() {
    cancelTokenSource.cancel('Cancelled the previous request.');
    cancelTokenSource = axios.CancelToken.source();
    return cancelTokenSource.token;
  }

  return getRequestCancelToken;
}

// 封装的请求方法
// 封装的请求方法，这里做出调整以适应DEVResponse<T>类型
function createRequestFunctions(httpClient: AxiosInstance) {
  const getRequestCancelToken = createCancelTokenSource();

  return {
    get<T>(url: string, params?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined;
      return httpClient.get<App.Service.DEVResponse<T>>(url, { params, cancelToken }).then(response => ({
        data: response.data.data, // 适应DEVResponse<T>结构
        status: response.status
      }));
    },
    post<T>(url: string, data?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined;
      return httpClient.post<App.Service.DEVResponse<T>>(url, data, { cancelToken }).then(response => ({
        data: response.data.data, // 适应DEVResponse<T>结构
        status: response.status
      }));
    },
    put<T>(url: string, data?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined;
      return httpClient.put<App.Service.DEVResponse<T>>(url, data, { cancelToken }).then(response => ({
        data: response.data.data, // 适应DEVResponse<T>结构
        status: response.status
      }));
    },
    delete<T>(url: string, params?: object, cancelPrevious: boolean = false): Promise<ApiResponse<T>> {
      const cancelToken = cancelPrevious ? getRequestCancelToken() : undefined;
      return httpClient.delete<App.Service.DEVResponse<T>>(url, { params, cancelToken }).then(response => ({
        data: response.data.data, // 适应DEVResponse<T>结构
        status: response.status
      }));
    },
    // 可以根据需要添加更多的HTTP方法
  };
};

const request = createRequestFunctions(createHttpClient(isHttpProxy ? createProxyPattern() : otherBaseURL.demo)); // 实际环境URL作为示例
const mockRequest = createRequestFunctions(createHttpClient(otherBaseURL.mock)); // 模拟环境URL作为示例

export {request, mockRequest}
