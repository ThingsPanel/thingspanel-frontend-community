/** One selection owns schema and credentials together. Old responses cannot restore old fields. */
export function createProtocolSelection<T, V>(deps: {
  schema(type: string | number | null, protocol: string | number): Promise<T>
  vouchers(type: string | number | null, protocol: string | number): Promise<V>
  clear(resetData: boolean): void
  commit(schema: T, vouchers: V): void
  loading(value: boolean): void
  failed(): void
}) {
  let generation = 0
  return {
    invalidate() {
      generation++
      deps.clear(true)
      deps.loading(false)
    },
    async select(type: string | number | null, protocol: string | number | null, resetData = true) {
      const current = ++generation
      deps.clear(resetData)
      if (protocol === null || protocol === '') {
        deps.loading(false)
        return
      }
      deps.loading(true)
      try {
        const [schema, vouchers] = await Promise.all([deps.schema(type, protocol), deps.vouchers(type, protocol)])
        if (generation === current) deps.commit(schema, vouchers)
      } catch {
        if (generation === current) deps.failed()
      } finally {
        if (generation === current) deps.loading(false)
      }
    }
  }
}
