import { createVNode } from 'vue'

// 使用简单的测试图标
export const DataSourceTestIcon = () => {
  return createVNode(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    [
      createVNode('path', {
        d: 'M21 16V8a2 2 0 0 0-1-1.73L14 4a2 2 0 0 0-2 0L6 6.27A2 2 0 0 0 5 8v8a2 2 0 0 0 1 1.73L12 20a2 2 0 0 0 2 0l6-2.27A2 2 0 0 0 21 16z'
      }),
      createVNode('polyline', { points: '7.5,8 12,11 16.5,8' }),
      createVNode('polyline', { points: '7.5,16 12,13 16.5,16' })
    ]
  )
}
