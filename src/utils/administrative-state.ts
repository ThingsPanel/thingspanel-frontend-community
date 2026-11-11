/** The backend's administrative state is an English enum; tables show a Chinese label and keep unknown values as received. */
export function administrativeStateLabel(state: string | null | undefined): string {
  if (state === 'enabled') return '已启用'
  if (state === 'disabled') return '已停用'
  return state || '--'
}
