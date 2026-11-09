const probes = new Map()

// Older ThingsVis deployments may return the editor's SPA HTML with status 200.
// Probe without credentials and require the dedicated entry's version marker.
export function resolveViewerEntry(base, { fetchImpl = fetch, timeoutMs = 1200 } = {}) {
  const fallback = base.split('#')[0]
  if (probes.has(fallback)) return probes.get(fallback)
  const candidate = new URL('miniViewer.html', fallback).href
  const task = (async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(candidate, {
        signal: controller.signal,
        credentials: 'omit',
        redirect: 'error'
      })
      if (!response.ok) return fallback
      const html = await response.text()
      return /<meta\s+name=["']thingsvis-mini-viewer["']\s+content=["']1["']/i.test(html) ? candidate : fallback
    } catch {
      return fallback
    } finally {
      clearTimeout(timer)
    }
  })()
  probes.set(fallback, task)
  return task
}
