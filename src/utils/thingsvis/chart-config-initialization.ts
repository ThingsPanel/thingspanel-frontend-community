/**
 * Web 图表首次保存时初始化 App 图表；App 已有独立配置后保持原值。
 */
export function initializeAppChartConfigOnce(
  currentAppConfig: unknown,
  webConfig: string
): unknown {
  const hasAppConfig =
    currentAppConfig !== null &&
    currentAppConfig !== undefined &&
    (typeof currentAppConfig !== 'string' || currentAppConfig.trim().length > 0)

  return hasAppConfig ? currentAppConfig : webConfig
}
