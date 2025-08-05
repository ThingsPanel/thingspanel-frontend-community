import { h } from 'vue'

const SystemMetricsHistoryIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'w-6 h-6'
    },
    [
      h('path', { d: 'M3 3v18h18' }),
      h('path', { d: 'M18 17V9' }),
      h('path', { d: 'M13 17V5' }),
      h('path', { d: 'M8 17v-3' })
    ]
  )

export default SystemMetricsHistoryIcon
