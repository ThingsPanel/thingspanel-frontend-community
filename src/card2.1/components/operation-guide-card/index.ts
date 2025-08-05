import type { ComponentDefinition } from '../../core/types'
import OperationGuideCardIcon from './icon'
import OperationGuideCard from './OperationGuideCard.vue'

const operationGuideCardDefinition: ComponentDefinition = {
  type: 'operation-guide-card',
  name: '操作向导',
  description: '显示系统操作指南和快速导航链接',
  category: 'card21',
  icon: OperationGuideCardIcon,
  component: OperationGuideCard,
  properties: {
    title: { type: 'string', default: '操作向导', description: '卡片标题' },
    showAdminGuides: { type: 'boolean', default: true, description: '是否显示管理员指南' },
    showUserGuides: { type: 'boolean', default: true, description: '是否显示用户指南' },
    serialBgColor: { type: 'string', default: '#2080f0', description: '序号背景颜色' },
    itemHoverBgColor: { type: 'string', default: '#EDEDFF', description: '项目悬停背景颜色' },
    titleColor: { type: 'string', default: '#333639', description: '标题颜色' },
    descriptionColor: { type: 'string', default: '#666', description: '描述颜色' }
  }
}

export default operationGuideCardDefinition
