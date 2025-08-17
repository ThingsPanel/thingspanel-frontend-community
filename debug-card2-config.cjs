/**
 * Card2.1 配置调试脚本
 * 专门调试配置组件加载问题
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Card2.1 配置调试开始...\n')

const projectRoot = 'E:\\wbh\\things2\\thingspanel-frontend-community'

// 检查组件定义文件
function checkComponentDefinition() {
  console.log('📋 检查 simple-test-component 定义...')

  try {
    const definitionPath = path.join(projectRoot, 'src/card2.1/components/simple-test-component/index.ts')
    const content = fs.readFileSync(definitionPath, 'utf-8')

    console.log('✅ 定义文件存在')

    // 检查关键导入和导出
    const checks = [
      { pattern: "import SimpleTestConfig from './config/SimpleTestConfig.vue'", desc: 'SimpleTestConfig 导入' },
      { pattern: 'configComponent: SimpleTestConfig', desc: 'configComponent 属性设置' },
      { pattern: 'export default simpleTestComponentDefinition', desc: '组件定义导出' },
      { pattern: "type: 'simple-test-component'", desc: '组件类型定义' }
    ]

    checks.forEach(check => {
      const found = content.includes(check.pattern)
      console.log(`${found ? '✅' : '❌'} ${check.desc}: ${found ? '正确' : '缺失'}`)
      if (!found) {
        console.log(`   查找内容: ${check.pattern}`)
      }
    })
  } catch (error) {
    console.log(`❌ 无法检查组件定义: ${error.message}`)
  }
}

// 检查配置组件文件
function checkConfigComponent() {
  console.log('\n📋 检查 SimpleTestConfig 组件...')

  try {
    const configPath = path.join(
      projectRoot,
      'src/card2.1/components/simple-test-component/config/SimpleTestConfig.vue'
    )
    const content = fs.readFileSync(configPath, 'utf-8')

    console.log('✅ 配置组件文件存在')

    // 检查组件结构
    const checks = [
      { pattern: '<template>', desc: 'Vue 模板存在' },
      { pattern: '<script setup', desc: 'Composition API setup' },
      { pattern: 'defineProps<Props>', desc: 'Props 定义' },
      { pattern: 'defineEmits<Emits>', desc: 'Emits 定义' },
      { pattern: "emit('update'", desc: '更新事件发射' },
      { pattern: 'handleUpdate', desc: '更新处理函数' }
    ]

    checks.forEach(check => {
      const found = content.includes(check.pattern)
      console.log(`${found ? '✅' : '❌'} ${check.desc}: ${found ? '存在' : '缺失'}`)
    })
  } catch (error) {
    console.log(`❌ 无法检查配置组件: ${error.message}`)
  }
}

// 检查 ComponentConfigForm 的逻辑
function checkComponentConfigForm() {
  console.log('\n📋 检查 ComponentConfigForm 逻辑...')

  try {
    const formPath = path.join(projectRoot, 'src/components/visual-editor/renderers/base/ComponentConfigForm.vue')
    const content = fs.readFileSync(formPath, 'utf-8')

    console.log('✅ ComponentConfigForm 文件存在')

    // 检查关键逻辑
    const checks = [
      { pattern: 'componentWidget?.definition?.configComponent', desc: '正确的配置组件访问路径' },
      { pattern: 'card2Integration.getComponentDefinition', desc: 'getComponentDefinition 调用' },
      { pattern: 'isCard2Component.value', desc: 'Card2组件判断' },
      { pattern: 'console.log.*获取组件定义结果', desc: '调试日志输出' },
      { pattern: 'showDebug = true', desc: '调试模式已启用' }
    ]

    checks.forEach(check => {
      const found = content.includes(check.pattern)
      console.log(`${found ? '✅' : '❌'} ${check.desc}: ${found ? '存在' : '缺失'}`)
    })
  } catch (error) {
    console.log(`❌ 无法检查 ComponentConfigForm: ${error.message}`)
  }
}

// 检查 useVisualEditorIntegration hook
function checkIntegrationHook() {
  console.log('\n📋 检查 useVisualEditorIntegration hook...')

  try {
    const hookPath = path.join(projectRoot, 'src/card2.1/hooks/useVisualEditorIntegration.ts')
    const content = fs.readFileSync(hookPath, 'utf-8')

    console.log('✅ Integration hook 文件存在')

    // 检查关键方法
    const checks = [
      { pattern: 'getComponentDefinition.*type: string', desc: 'getComponentDefinition 方法定义' },
      { pattern: 'definition,', desc: '原始definition保留在widget中' },
      { pattern: 'availableWidgets.value.find', desc: '从availableWidgets查找组件' },
      { pattern: 'console.log.*getComponentDefinition.*被调用', desc: 'getComponentDefinition 调试日志' }
    ]

    checks.forEach(check => {
      const found = content.includes(check.pattern)
      console.log(`${found ? '✅' : '❌'} ${check.desc}: ${found ? '存在' : '缺失'}`)
    })
  } catch (error) {
    console.log(`❌ 无法检查 Integration hook: ${error.message}`)
  }
}

// 生成调试建议
function generateDebugSuggestions() {
  console.log('\n🔍 调试建议:')
  console.log('')
  console.log('1. 打开浏览器开发者工具 (F12)')
  console.log('2. 访问 Visual Editor 或测试页面')
  console.log('3. 添加 simple-test-component 到画布')
  console.log('4. 选中组件，点击"组件"配置标签页')
  console.log('5. 查看控制台日志，特别关注:')
  console.log('   - [ComponentConfigForm] 获取组件定义结果')
  console.log('   - [VisualEditorIntegration] getComponentDefinition 被调用')
  console.log('   - hasCard2ConfigComponent 的值')
  console.log('')
  console.log('6. 如果看到 "获取组件定义结果" 但 hasConfigComponent 为 false:')
  console.log('   - 检查 componentWidget.definition 是否存在')
  console.log('   - 检查 componentWidget.definition.configComponent 是否存在')
  console.log('')
  console.log('7. 如果没有看到任何调试日志:')
  console.log('   - 检查组件是否被正确识别为 Card2 组件')
  console.log('   - 检查 widget.metadata.isCard2Component 是否为 true')
}

// 运行所有检查
checkComponentDefinition()
checkConfigComponent()
checkComponentConfigForm()
checkIntegrationHook()
generateDebugSuggestions()

console.log('\n✨ Card2.1 配置调试完成!')
console.log('\n💡 如果所有检查都通过但仍然有问题，请查看浏览器控制台日志进行进一步调试。')
