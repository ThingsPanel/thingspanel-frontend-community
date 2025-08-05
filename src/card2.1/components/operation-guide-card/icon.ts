import { h } from 'vue'

const OperationGuideCardIcon = () =>
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
      h('path', { d: 'M9 12l2 2 4-4' }),
      h('path', { d: 'M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z' }),
      h('path', { d: 'M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z' }),
      h('path', { d: 'M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z' }),
      h('path', { d: 'M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z' }),
      h('path', { d: 'M12 7v10' }),
      h('path', { d: 'M7 12h10' })
    ]
  )

export default OperationGuideCardIcon
