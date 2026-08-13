/**
 * Web 图表首次保存时初始化 App 图表；App 已有独立配置后保持原值。
 */
export function initializeAppChartConfigOnce(
  currentAppConfig: unknown,
  webConfig: string
): string {
  const hasAppConfig =
    currentAppConfig !== null &&
    currentAppConfig !== undefined &&
    (typeof currentAppConfig !== 'string' || currentAppConfig.trim().length > 0)

  if (hasAppConfig) {
    return typeof currentAppConfig === 'string' ? currentAppConfig : JSON.stringify(currentAppConfig)
  }

  try {
    const parsed = JSON.parse(webConfig)
    const appGridCols = 4
    let cursorX = 0
    let cursorY = 0
    let rowHeight = 0
    const nodes = Array.isArray(parsed.nodes)
      ? parsed.nodes.map((node: any) => {
          const sourceGrid = node?.grid
          if (!sourceGrid) return node

          const width = Math.min(appGridCols, Math.max(1, Math.ceil((sourceGrid.w || 1) * appGridCols / 24)))
          const height = Math.max(1, sourceGrid.h || 1)
          if (cursorX + width > appGridCols) {
            cursorX = 0
            cursorY += rowHeight
            rowHeight = 0
          }

          const nextNode = {
            ...node,
            grid: {
              ...sourceGrid,
              x: cursorX,
              y: cursorY,
              w: width,
              h: height
            }
          }
          cursorX += width
          rowHeight = Math.max(rowHeight, height)
          return nextNode
        })
      : parsed.nodes

    return JSON.stringify({
      ...parsed,
      nodes,
      canvas: {
        ...(parsed.canvas || {}),
        mode: 'grid',
        width: 375,
        height: 844,
        gridCols: 4,
        gridRowHeight: 50,
        gridGap: 5,
        padding: 0,
        responsive: false
      }
    })
  } catch {
    return webConfig
  }
}
