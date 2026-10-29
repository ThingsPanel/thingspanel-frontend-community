import type { components, operations } from './generated/device-metadata/types'
import {
  createMetadataNativeRequester,
  requireNativeStrongEtag,
  type MetadataNativeErrorBody,
  type MetadataNativeHttpOptions
} from './metadata-native-http'

export type FileAsset = components['schemas']['FileAsset']
export type FileAssetUpload = components['schemas']['FileAssetUpload']
export type FileAssetIdempotencyKey = operations['createFileAsset']['parameters']['header']['Idempotency-Key']
export type FileAssetNativeErrorBody = MetadataNativeErrorBody

export interface FileAssetsNativeClient {
  upload(
    file: File,
    idempotencyKey: FileAssetIdempotencyKey
  ): Promise<{
    asset: FileAsset
    location: string
    requestId: string
  }>
  get(id: components['schemas']['Id']): Promise<{ asset: FileAsset; etag: string; requestId: string }>
}

export class FileAssetNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: FileAssetNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `File asset request failed (${status})`)
    this.name = 'FileAssetNativeError'
  }

  get code(): string | undefined {
    return this.body?.code
  }
}

const maxImageBytes = 10 * 1024 * 1024
const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const assetFields = ['checksum', 'contentType', 'downloadUrl', 'expiresAt', 'id', 'sizeBytes']
const assetPathPrefix = '/api/v2/file-assets/'

export function createFileAssetOperationKey(): FileAssetIdempotencyKey {
  const crypto = globalThis.crypto
  if (!crypto?.getRandomValues) throw new Error('Secure random number generation is unavailable')
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function requireIdempotencyKey(key: string): FileAssetIdempotencyKey {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  }
  return key
}

function validateUpload(file: File): void {
  if (!(file instanceof File)) throw new Error('A file is required')
  if (file.size < 1 || file.size > maxImageBytes) throw new Error('File size must be between 1 byte and 10 MiB')
  if (!allowedImageTypes.has(file.type)) throw new Error('File must be PNG, JPEG, or WebP')
}

function requireAssetId(id: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('File asset id must be a UUID')
  }
  return id
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

function validateFileAssetEnvelope(value: unknown): string {
  if (!isRecord(value) || !hasExactKeys(value, ['data', 'meta'])) {
    throw new Error('File asset service returned an invalid response envelope')
  }
  if (!isRecord(value.meta) || !hasExactKeys(value.meta, ['requestId'])) {
    throw new Error('File asset service returned invalid request metadata')
  }
  if (
    typeof value.meta.requestId !== 'string' ||
    value.meta.requestId.length < 1 ||
    value.meta.requestId.length > 128
  ) {
    throw new Error('File asset service returned invalid request metadata')
  }
  return value.meta.requestId
}

function validateAsset(value: unknown): FileAsset {
  if (!isRecord(value) || !hasExactKeys(value, assetFields)) {
    throw new Error('File asset service returned an invalid asset shape')
  }
  if (
    typeof value.id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id)
  ) {
    throw new Error('File asset service returned an invalid asset identity')
  }
  if (typeof value.contentType !== 'string' || !allowedImageTypes.has(value.contentType)) {
    throw new Error('File asset service returned an invalid content type')
  }
  if (
    typeof value.sizeBytes !== 'number' ||
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes < 1 ||
    value.sizeBytes > maxImageBytes
  ) {
    throw new Error('File asset service returned an invalid file size')
  }
  if (typeof value.checksum !== 'string' || !/^[0-9a-f]{64}$/.test(value.checksum)) {
    throw new Error('File asset service returned an invalid checksum')
  }
  if (typeof value.downloadUrl !== 'string' || value.downloadUrl.length < 1 || value.downloadUrl.length > 2048) {
    throw new Error('File asset service returned an invalid download URL')
  }
  if (
    typeof value.expiresAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value.expiresAt) ||
    Number.isNaN(Date.parse(value.expiresAt))
  ) {
    throw new Error('File asset service returned an invalid URL expiry')
  }
  return value as FileAsset
}

function requireMatchingRequestId(header: string | null, metaRequestId: string): string {
  if (!header || header.length > 128 || header !== metaRequestId) {
    throw new Error('File asset service returned inconsistent request identifiers')
  }
  return metaRequestId
}

function hasControlCharacter(value: string): boolean {
  return [...value].some(char => {
    const code = char.charCodeAt(0)
    return code <= 0x1f || code === 0x7f
  })
}

function requireAssetLocation(location: string | null, assetId: string): string {
  if (!location || hasControlCharacter(location)) {
    throw new Error('File asset create response is missing a valid Location')
  }
  let parsed: URL
  try {
    parsed = new URL(location, 'https://file-assets.invalid/')
  } catch {
    throw new Error('File asset create response is missing a valid Location')
  }
  if (
    parsed.origin !== 'https://file-assets.invalid' ||
    parsed.pathname !== `${assetPathPrefix}${encodeURIComponent(assetId)}` ||
    parsed.search !== '' ||
    parsed.hash !== ''
  ) {
    throw new Error('File asset create response returned an unexpected Location')
  }
  return location
}

export interface FileAssetsNativeOptions extends MetadataNativeHttpOptions {}

export function createFileAssetsNativeClient(options: FileAssetsNativeOptions): FileAssetsNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'File asset' })

  return {
    async upload(file, idempotencyKey) {
      validateUpload(file)
      const key = requireIdempotencyKey(idempotencyKey)
      const form = new FormData()
      form.append('file', file, file.name)
      form.append('purpose', 'template-image')

      const { data, response, envelope } = await request<FileAsset, FileAssetNativeError>(
        '/api/v2/file-assets',
        201,
        (status, body) => new FileAssetNativeError(status, body),
        { method: 'POST', headers: { 'Idempotency-Key': key }, body: form },
        'multipart'
      )
      const metaRequestId = validateFileAssetEnvelope(envelope)
      const asset = validateAsset(data)
      const requestId = requireMatchingRequestId(response.headers.get('X-Request-Id'), metaRequestId)
      const location = requireAssetLocation(response.headers.get('Location'), asset.id)
      return { asset, location, requestId }
    },

    async get(id) {
      const assetId = requireAssetId(id)
      const { data, response, envelope } = await request<FileAsset, FileAssetNativeError>(
        `${assetPathPrefix}${encodeURIComponent(assetId)}`,
        200,
        (status, body) => new FileAssetNativeError(status, body),
        { method: 'GET' }
      )
      const metaRequestId = validateFileAssetEnvelope(envelope)
      const asset = validateAsset(data)
      const etag = requireNativeStrongEtag(response.headers.get('ETag'), 'File asset')
      const requestId = requireMatchingRequestId(response.headers.get('X-Request-Id'), metaRequestId)
      return { asset, etag, requestId }
    }
  }
}
