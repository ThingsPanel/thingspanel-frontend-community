import type { ComponentDefinition } from '../../core/types'
import SimpleTestComponent from './SimpleTestComponent.vue'
import SimpleTestConfig from './config/SimpleTestConfig.vue'

const simpleTestComponentDefinition: ComponentDefinition = {
  type: 'simple-test-component',
  name: '简单测试组件',
  description: '用于测试组件配置系统的简单组件',
  category: 'test',
  mainCategory: '测试',
  subCategory: '基础',
  author: 'Claude',
  permission: '不限',
  icon: 'cube-outline',
  component: SimpleTestComponent,
  
  // 🔥 新增：注册配置组件
  configComponent: SimpleTestConfig,
  
  config: {
    style: {
      width: 300,
      height: 200
    },
    // 组件默认配置
    title: '简单测试组件',
    showTitle: true,
    content: '这是一个简单的测试组件',
    backgroundColor: '#f0f8ff',
    textColor: '#333333',
    showButton: true,
    buttonText: '测试按钮',
    buttonType: 'primary',
    fontSize: 14,
    padding: 16,
    borderRadius: 8
  }
}

export default simpleTestComponentDefinition