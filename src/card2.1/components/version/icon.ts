import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const VersionIcon = () =>
  h(Icon, {
    icon: 'carbon:information-square-filled',
    class: 'text-blue-600 dark:text-blue-400'
  })
