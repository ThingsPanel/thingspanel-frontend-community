/**
 * 数组图表测试组件图标
 */

import { h } from 'vue'
import { NIcon } from 'naive-ui'
import { BarChartOutline } from '@vicons/ionicons5'

export default function ArrayChartTestIcon() {
  return h(NIcon, { size: 18 }, {
    default: () => h(BarChartOutline)
  })
}