import { h } from 'vue'

const ReportedDataIcon = () =>
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
    [h('path', { d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }), h('circle', { cx: '12', cy: '12', r: '3' })]
  )

export default ReportedDataIcon
