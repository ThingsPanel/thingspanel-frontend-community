import type { components } from './generated/device-metadata/types'

export type MetadataNativeErrorBody = components['schemas']['Problem'] | components['schemas']['EncoreAuthError']

export interface MetadataNativeHttpOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
  resourceName?: string
}

export type MetadataNativeErrorFactory<TError extends Error> = (
  status: number,
  body: MetadataNativeErrorBody | undefined
) => TError

export type MetadataNativeBodyEncoding = 'json' | 'multipart'

function isProblem(value: unknown): value is components['schemas']['Problem'] {
  return Boolean(value && typeof value === 'object' && 'status' in value && 'detail' in value && 'code' in value)
}

function isEncoreAuthError(value: unknown): value is components['schemas']['EncoreAuthError'] {
  return Boolean(value && typeof value === 'object' && 'code' in value && 'message' in value && !('status' in value))
}

function sanitizeBody(body: MetadataNativeErrorBody, token: string | undefined): MetadataNativeErrorBody {
  if (!token) return body
  if ('detail' in body) return { ...body, detail: body.detail.split(token).join('[redacted]') }
  return { ...body, message: body.message.split(token).join('[redacted]') }
}

export function requireNativeStrongEtag(etag: string | null | undefined, resourceName: string): string {
  // RFC opaque-tag is a quoted sequence of etagc bytes; require the complete
  // quoted form and reject weak validators, embedded quotes, and controls.
  if (!etag || !/^"[\x21\x23-\x2b\x2d-\x7e\x80-\xff]*"$/.test(etag)) {
    throw new Error(`${resourceName} response is missing a strong ETag`)
  }
  return etag
}

/** Shared single-attempt HTTP boundary for generated native metadata APIs. */
export function createMetadataNativeRequester(options: MetadataNativeHttpOptions) {
  const resourceName = options.resourceName ?? 'Native metadata'
  return async function request<TData, TError extends Error>(
    path: string,
    expectedStatus: number,
    errorFactory: MetadataNativeErrorFactory<TError>,
    init: RequestInit = {},
    bodyEncoding: MetadataNativeBodyEncoding = 'json'
  ): Promise<{
    data: TData
    response: Response
    meta: components['schemas']['RequestMeta']
    envelope: unknown
    text: string
  }> {
    const token = options.getToken()
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json, application/problem+json')
    if (init.body !== undefined) {
      if (bodyEncoding === 'multipart') headers.delete('Content-Type')
      else headers.set('Content-Type', 'application/json')
    }
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const language = options.getLanguage()
    if (language) headers.set('Accept-Language', language)

    let response: Response
    try {
      response = await options.fetch(path, { ...init, headers })
    } catch {
      throw new Error(`${resourceName} service is unreachable`)
    }

    if (!response.ok || response.status !== expectedStatus) {
      let body: MetadataNativeErrorBody | undefined
      try {
        const failureText = await response.text()
        const payload: unknown = JSON.parse(failureText)
        if (isProblem(payload) || isEncoreAuthError(payload)) body = sanitizeBody(payload, token || undefined)
      } catch {
        /* Keep an HTTP-status error for empty or non-JSON failure bodies. */
      }
      throw errorFactory(response.status, body)
    }

    // The exact response text is returned so callers that must re-submit a
    // nested object (for example a template configuration) can keep the
    // server's own JSON tokens instead of re-encoding parsed numbers.
    let text: string
    let payload: unknown
    try {
      text = await response.text()
      payload = JSON.parse(text)
    } catch {
      throw new Error(`${resourceName} service returned invalid JSON`)
    }
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('data' in payload) ||
      payload.data === undefined ||
      !('meta' in payload) ||
      !payload.meta ||
      typeof payload.meta !== 'object' ||
      !('requestId' in payload.meta) ||
      typeof payload.meta.requestId !== 'string'
    ) {
      throw new Error(`${resourceName} service returned an invalid data/meta response`)
    }
    return {
      data: payload.data as TData,
      response,
      meta: payload.meta as components['schemas']['RequestMeta'],
      envelope: payload,
      text
    }
  }
}
