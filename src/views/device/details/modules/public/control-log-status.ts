import { $t } from '@/locales'

const statusKeys = {
  '0': 'page.expect.pending',
  '1': 'generate.sendingSuccess',
  '2': 'generate.sendingFail',
  '3': 'generate.returnSuccess',
  '4': 'generate.returnFail'
} as const

export function controlLogStatus(status: string | number | null | undefined) {
  const key = statusKeys[String(status) as keyof typeof statusKeys]
  return key ? $t(key) : '--'
}
