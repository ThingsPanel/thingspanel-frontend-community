/**
 * @file Card 2.1 系统入口
 * 动态导入并注册所有卡片组件
 */
import { componentRegistry } from './core'
import type { IComponentDefinition } from './core'

// --- Display Components ---
import version from './components/display/version'
import access from './components/display/access'
import alarmCount from './components/display/alarm-count'
import alarmInfo from './components/display/alarm-info'
import appDownload from './components/display/app-download'
import cpuUsage from './components/display/cpu-usage'
import diskUsage from './components/display/disk-usage'
import memoryUsage from './components/display/memory-usage'
import information from './components/display/information'
import news from './components/display/news'
import offLine from './components/display/off-line'
import onLine from './components/display/on-line'
import operationGuideCard from './components/display/operation-guide-card'
import recentlyVisited from './components/display/recently-visited'
import reportedData from './components/display/reported-data'
import tenantCount from './components/display/tenant-count'

// --- Chart Components ---
import onlineTrend from './components/chart/online-trend'
import systemMetricsHistory from './components/chart/system-metrics-history'
import tenantChart from './components/chart/tenant-chart'

const componentsToRegister: IComponentDefinition[] = [
  // Display
  version,
  access,
  alarmCount,
  alarmInfo,
  appDownload,
  cpuUsage,
  diskUsage,
  memoryUsage,
  information,
  news,
  offLine,
  onLine,
  operationGuideCard,
  recentlyVisited,
  reportedData,
  tenantCount,
  // Chart
  onlineTrend,
  systemMetricsHistory,
  tenantChart
]

componentsToRegister.forEach(componentDef => {
  componentRegistry.register(componentDef.id, componentDef)
})

console.log(
  '✅ All Card 2.1 components registered:',
  componentRegistry.getAll().map(c => c.id)
)

export default componentRegistry
