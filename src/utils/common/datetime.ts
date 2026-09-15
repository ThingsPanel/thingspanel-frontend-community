import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 将时间戳格式化为 YYYY-MM-DD HH:mm:ss 格式的字符串（24小时制）
 *
 * @param {string | null | undefined} ts - 时间戳
 * @returns {string | null} - 格式化后的时间字符串
 */
export function formatDateTime(ts: string | number | Date | null | undefined): string | null {
  return ts ? dayjs(ts).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss') : null
}
