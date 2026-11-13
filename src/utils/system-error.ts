/** Agent error codes (`details.code` of /api/system errors, or an operation's `code`) that have operator guidance text. */
export const SYSTEM_ERROR_CODES = ['upgrade_helper_image_unavailable'] as const

export function hasSystemErrorText(code: string | undefined): boolean {
  return !!code && (SYSTEM_ERROR_CODES as readonly string[]).includes(code)
}
