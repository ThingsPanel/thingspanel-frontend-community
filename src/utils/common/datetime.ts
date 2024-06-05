import dayjs from 'dayjs';

/**
 * 将时间戳格式化为 YYYY-MM-DD HH:mm:ss 格式的字符串（24小时制）
 *
 * @param {string | null | undefined} ts - 时间戳
 * @returns {string | null} - 格式化后的时间字符串
 */
export function formatDateTime(ts: string | null | undefined): string | null {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : null;
}
