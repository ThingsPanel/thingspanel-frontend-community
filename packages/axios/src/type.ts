import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

export type ContentType =
  | 'text/html'
  | 'text/plain'
  | 'multipart/form-data'
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'application/octet-stream'

export interface RequestOption<ResponseData = any> {
  /**
   * The hook before requestTs
   *
   * For example: You can add header token in this hook
   *
   * @param config Axios config
   */
  onRequest: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>
  /**
   * The hook to check backend response is success or not
   *
   * @param response Axios response
   */
  isBackendSuccess: (response: AxiosResponse<ResponseData>) => boolean
  /**
   * The hook after backend requestTs fail
   *
   * For example: You can handle the expired token in this hook
   *
   * @param response Axios response
   * @param instance Axios instance
   * @returns
   */
  onBackendFail: (
    response: AxiosResponse<ResponseData>,
    instance: AxiosInstance
  ) => Promise<AxiosResponse> | Promise<void>

  /**
   * transform backend response when the responseType is json
   *
   * @param response Axios response
   */
  transformBackendResponse(response: AxiosResponse<ResponseData>): any | Promise<any>

  /**
   * The hook to handle error
   *
   * For example: You can show error message in this hook
   *
   * @param error
   */
  onError: (error: AxiosError<ResponseData>) => void | Promise<void>
}

interface ResponseMap {
  blob: Blob
  text: string
  arrayBuffer: ArrayBuffer
  stream: ReadableStream<Uint8Array>
  document: Document
}

export type ResponseType = keyof ResponseMap | 'json'

export type MappedType<R extends ResponseType, JsonType = any> = R extends keyof ResponseMap ? ResponseMap[R] : JsonType

export type CustomAxiosRequestConfig<R extends ResponseType = 'json'> = Omit<AxiosRequestConfig, 'responseType'> & {
  responseType?: R
}

/** The requestTs instance */
export interface RequestInstance {
  <T = any, R extends ResponseType = 'json'>(config: CustomAxiosRequestConfig<R>): Promise<MappedType<R, T>>

  get<T = any, R extends ResponseType = 'json'>(
    url: string,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  post<T = any, R extends ResponseType = 'json'>(
    url: string,
    data?: any,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  put<T = any, R extends ResponseType = 'json'>(
    url: string,
    data?: any,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  delete<T = any, R extends ResponseType = 'json'>(
    url: string,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  cancelRequest: (requestId: string) => void
  cancelAllRequest: () => void
}

export type FlatResponseSuccessData<T = any> = {
  data: T
  error: null
}

export type FlatResponseFailData<T = any> = {
  data: null
  error: AxiosError<T>
}

export type FlatResponseData<T = any> = FlatResponseSuccessData<T> | FlatResponseFailData<T>

export interface FlatRequestInstance {
  <T = any, R extends ResponseType = 'json'>(
    config: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  // 添加HTTP方法的声明
  get<T = any, R extends ResponseType = 'json'>(
    url: string,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  post<T = any, R extends ResponseType = 'json'>(
    url: string,
    data?: any,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  put<T = any, R extends ResponseType = 'json'>(
    url: string,
    data?: any,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  delete<T = any, R extends ResponseType = 'json'>(
    url: string,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  delete2<T = any, R extends ResponseType = 'json'>(
    url: string,
    data?: any,
    config?: CustomAxiosRequestConfig<R>
  ): Promise<FlatResponseData<MappedType<R, T>>>

  cancelRequest: (requestId: string) => void
  cancelAllRequest: () => void
}
