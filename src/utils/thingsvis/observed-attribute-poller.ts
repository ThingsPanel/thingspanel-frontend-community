interface Options {
  read(): Promise<Record<string, unknown>>
  push(values: Record<string, unknown>): void
  isVisible(): boolean
  onError(error: unknown): void
  intervalMs?: number
}

/** Attribute reports have no telemetry WS stream; refresh observed values without optimistic writes. */
export function createObservedAttributePoller(options: Options) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0
  const stop = () => {
    generation++
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  const start = () => {
    stop()
    const current = generation
    const schedule = () => {
      if (current === generation) timer = setTimeout(tick, options.intervalMs ?? 5000)
    }
    const tick = async () => {
      timer = undefined
      if (current !== generation) return
      try {
        if (options.isVisible()) {
          const values = await options.read()
          if (current === generation && options.isVisible()) options.push(values)
        }
      } catch (error) {
        if (current === generation) options.onError(error)
      } finally {
        schedule()
      }
    }
    schedule()
  }
  return { start, stop }
}
