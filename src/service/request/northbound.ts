import { createFlatRequest } from '@sa/axios'
import { localStg } from '@/utils/storage'

/**
 * 数据转发（北向服务）专用请求实例。
 *
 * 为什么不复用全局 `request`：全局实例按社区后端的 `{ code, data }` 信封解包，
 * 而北向服务返回的是合同约定的裸 JSON（`{ contractVersion, connectors: [...] }`）。
 * 用全局实例会把每一次成功响应当成失败。这里只做三件事：同源转发、带令牌、原样返回。
 *
 * 路径经社区后端 `/api/v1/northbound/*` 纯传输代理转发到北向服务，代理不改写身份，
 * 也不做本地授权判定——授权只发生在北向服务内部。
 */
const baseURL = `${window.location.origin}/api/v1/northbound`

export const northboundRequest = createFlatRequest<any>(
  { baseURL },
  {
    async onRequest(config) {
      const token = localStg.get('token')
      const lang = localStg.get('lang')
      const headers: Record<string, string> = {}
      if (token) {
        headers['x-token'] = token
      }
      if (lang) {
        headers['Accept-Language'] = lang
      }
      Object.assign(config.headers, headers)
      return config
    },
    isBackendSuccess(response) {
      return response.status >= 200 && response.status < 300
    },
    transformBackendResponse(response) {
      return response.data
    },
    async onError(error) {
      // 让调用方拿到后端的原始 message，而不是一个笼统的网络错误。
      const data = error?.response?.data as any
      if (data?.message) {
        window.$message?.error(data.message)
      } else if (data?.error) {
        window.$message?.error(data.error)
      }
    }
  }
)
