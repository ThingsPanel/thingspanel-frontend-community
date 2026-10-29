import { request } from '../request'

export type AutomationMode = 'legacy' | 'native'

// Do not cache across operations: a backend restart can change the active engine.
// Failure must stop the operation rather than silently selecting another database.
export async function getAutomationMode(): Promise<AutomationMode> {
  const result = await request.get<{ mode: AutomationMode }>('/automation/runtime')
  if (result.error || !result.data || !['legacy', 'native'].includes(result.data.mode)) {
    throw new Error('无法确认自动化服务状态，请稍后重试')
  }
  return result.data.mode
}

export function routeAutomationCall<T extends (...args: any[]) => Promise<any>>(
  legacy: T,
  native: (...args: Parameters<T>) => Promise<any>
) {
  return async (...args: Parameters<T>): Promise<any> => {
    try {
      return await ((await getAutomationMode()) === 'native' ? native : legacy)(...args)
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error))
      window.$message?.error(failure.message)
      return { data: null, error: failure }
    }
  }
}
