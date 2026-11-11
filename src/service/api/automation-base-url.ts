/** Shared ingress for both automation clients; the owner paths remain /v1/*. */
export function automationApiBase(configured?: string): string {
  return configured?.trim().replace(/\/+$/, '') || '/automation-core'
}
