import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const TenantCountIcon = () =>
  h(Icon, {
    icon: 'mdi:account-group',
    class: 'text-blue-600 dark:text-blue-400'
  })
