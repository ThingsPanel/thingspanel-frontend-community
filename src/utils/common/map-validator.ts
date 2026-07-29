/**
 * 经纬度坐标验证工具
 * 用于验证地理坐标的有效性
 */

/**
 * 验证经纬度是否在有效范围内
 * @param lat 纬度 (-90 到 90)
 * @param lng 经度 (-180 到 180)
 * @returns 是否为有效坐标
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && lat !== 0 && lng !== 0
}

/**
 * 验证字符串形式的经纬度
 * @param latStr 纬度字符串
 * @param lngStr 经度字符串
 * @returns 是否为有效坐标
 */
export function isValidCoordinateString(latStr: string | number, lngStr: string | number): boolean {
  const lat = Number(latStr)
  const lng = Number(lngStr)
  return isValidCoordinate(lat, lng)
}

/**
 * 获取坐标验证错误信息
 * @param lat 纬度
 * @param lng 经度
 * @returns 错误信息，如果有效则返回null
 */
export function getCoordinateValidationError(lat: number, lng: number): string | null {
  if (isNaN(lat) || isNaN(lng)) {
    return '经纬度必须是有效数字'
  }

  if (lat < -90 || lat > 90) {
    return '纬度必须在-90到90度之间'
  }

  if (lng < -180 || lng > 180) {
    return '经度必须在-180到180度之间'
  }

  if (lat === 0 && lng === 0) {
    return '经纬度不能同时为0'
  }

  return null
}

/**
 * 获取字符串坐标验证错误信息
 * @param latStr 纬度字符串
 * @param lngStr 经度字符串
 * @returns 错误信息，如果有效则返回null
 */
export function getCoordinateStringValidationError(latStr: string | number, lngStr: string | number): string | null {
  const lat = Number(latStr)
  const lng = Number(lngStr)
  return getCoordinateValidationError(lat, lng)
}
