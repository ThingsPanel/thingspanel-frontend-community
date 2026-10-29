import { randomBytes } from 'node:crypto'
import { appendFileSync, chmodSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig, type Plugin, type UserConfig } from 'vite'
import frontendConfig from '/Users/junhong/.codex/worktrees/device-metadata-native-cutover-1.3/frontend/vite.config.ts'

const scratchDir = '/Volumes/DevScratch/device-management-native-20261027/luna-http-7312c5b5'
const frontendDir = '/Users/junhong/.codex/worktrees/device-metadata-native-cutover-1.3/frontend'
const sessionPath = resolve(scratchDir, 'ui-session.private.json')
const noncePath = resolve(scratchDir, 'ui-bootstrap.private.json')
const nativeProxyPaths = [
  '/api/v2/devices',
  '/api/v2/device-statistics',
  '/api/v2/device-groups',
  '/api/v2/device-group-tree',
  '/api/v2/device-access-templates'
]

interface AcceptanceSession {
  apiBase: string
  token: string
  user: Record<string, unknown> & { authority: string }
  groupId: string
  tenantId: string
  uiPort?: number
}

function readSession(): AcceptanceSession {
  const mode = statSync(sessionPath).mode & 0o777
  if ((mode & 0o077) !== 0) throw new Error('ui-session.private.json must not be readable by group or other users')
  const raw = JSON.parse(readFileSync(sessionPath, 'utf8')) as Partial<AcceptanceSession>
  if (
    typeof raw.apiBase !== 'string' ||
    typeof raw.token !== 'string' || !raw.token ||
    !raw.user || typeof raw.user !== 'object' || typeof raw.user.authority !== 'string' ||
    typeof raw.groupId !== 'string' || !raw.groupId ||
    typeof raw.tenantId !== 'string' || !raw.tenantId
  ) {
    throw new Error(`Invalid private UI session file: ${sessionPath}`)
  }
  const apiBase = new URL(raw.apiBase)
  if (!['http:', 'https:'].includes(apiBase.protocol) || apiBase.username || apiBase.password || apiBase.search || apiBase.hash || apiBase.pathname !== '/') {
    throw new Error('apiBase must be a bare HTTP(S) origin without credentials, path, query, or fragment')
  }
  if (raw.uiPort !== undefined && (!Number.isInteger(raw.uiPort) || raw.uiPort < 1024 || raw.uiPort > 65535)) {
    throw new Error('uiPort must be an integer between 1024 and 65535')
  }
  return { ...raw, apiBase: apiBase.origin, user: raw.user } as AcceptanceSession
}

function readOrCreateBootstrapNonce(): string {
  try {
    const mode = statSync(noncePath).mode & 0o777
    if ((mode & 0o077) !== 0) throw new Error('bootstrap nonce file is not private')
    const privateValue = JSON.parse(readFileSync(noncePath, 'utf8')) as { nonce?: unknown }
    if (typeof privateValue.nonce === 'string' && /^[A-Za-z0-9_-]{32,}$/.test(privateValue.nonce)) {
      chmodSync(noncePath, 0o600)
      return privateValue.nonce
    }
  } catch {
    // A fresh random nonce is created below for this isolated Vite process.
  }
  const nonce = randomBytes(32).toString('base64url')
  writeFileSync(noncePath, `${JSON.stringify({ nonce })}\n`, { mode: 0o600, flag: 'w' })
  chmodSync(noncePath, 0o600)
  return nonce
}

function safeInlineJSON(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

function notFound(res: ServerResponse) {
  res.statusCode = 404
  res.setHeader('Content-Type', 'application/problem+json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end('{"type":"about:blank","title":"Not Found","status":404,"detail":"Not found","code":"NotFound"}')
}

function acceptanceMiddleware(session: AcceptanceSession, bootstrapNonce: string): Plugin {
  const bootstrapPath = '/__native-ui-bootstrap/rotated-session'
  const userDetailPath = '/proxy-default/user/detail'
  const user = {
    ...session.user,
    roles: Array.isArray(session.user.roles) ? session.user.roles : [session.user.authority]
  }
  const userDetailEnvelope = safeInlineJSON({ code: 200, message: 'success', data: user })
  const bootstrapSession = safeInlineJSON({ ...session, user })

  return {
    name: 'isolated-native-ui-acceptance-fixture',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname
        if (pathname.startsWith('/api/') || pathname.startsWith('/proxy-default/')) {
          const queryKeys = [...new URL(req.url || '/', 'http://127.0.0.1').searchParams.keys()]
          res.once('finish', () => appendFileSync(resolve(scratchDir, 'ui-native-request-log.jsonl'), JSON.stringify({
            method: req.method, path: pathname, queryKeys, status: res.statusCode
          }) + '\n', { mode: 0o600 }))
        }

        if (pathname === bootstrapPath) {
          if (req.method !== 'GET') return notFound(res)
          const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Native UI acceptance bootstrap</title></head><body><script type="module">
import { localStg } from '/src/utils/storage.ts'
const session = ${bootstrapSession}
localStg.set('token', session.token)
localStg.set('userInfo', session.user)
window.location.replace('/device/manage')
</script></body></html>`
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store, private')
          res.setHeader('Referrer-Policy', 'no-referrer')
          res.end(html)
          return
        }

        if (pathname.startsWith('/__native-ui-bootstrap/')) return notFound(res)

        if (pathname === userDetailPath) {
          const xToken = req.headers['x-token']
          const authorization = req.headers.authorization
          if (req.method !== 'GET' || xToken !== session.token || authorization !== `Bearer ${session.token}`) return notFound(res)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store, private')
          res.end(userDetailEnvelope)
          return
        }

        if (pathname === '/proxy-default' || pathname.startsWith('/proxy-default/')) return notFound(res)

        if (pathname.startsWith('/api/')) {
          if (nativeProxyPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) return next()
          return notFound(res)
        }

        return next()
      })
    }
  }
}

export default defineConfig(async configEnv => {
  const session = readSession()
  const nonce = readOrCreateBootstrapNonce()
  const original = typeof frontendConfig === 'function' ? await frontendConfig(configEnv) : frontendConfig
  const base = original as UserConfig
  const acceptance: UserConfig = {
    root: frontendDir,
    cacheDir: resolve(scratchDir, 'vite-ui-cache'),
    plugins: [acceptanceMiddleware(session, nonce)],
    server: {
      host: '127.0.0.1',
      port: session.uiPort ?? 5003,
      strictPort: true,
      open: false,
      proxy: Object.fromEntries(nativeProxyPaths.map(path => [path, { target: session.apiBase, changeOrigin: true }]))
    }
  }
  return mergeConfig(base, acceptance)
})
