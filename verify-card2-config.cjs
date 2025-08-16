/**
 * Card2.1配置系统验证脚本
 * 验证所有必要的文件是否存在且配置正确
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Card2.1配置系统验证开始...')

// 检查文件是否存在
function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath)
  console.log(`${exists ? '✅' : '❌'} ${filePath} ${exists ? '存在' : '不存在'}`)
  return exists
}

// 检查文件内容
function checkFileContent(filePath, searchText, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const found = content.includes(searchText)
    console.log(`${found ? '✅' : '❌'} ${description}: ${found ? '已找到' : '未找到'}`)
    return found
  } catch (error) {
    console.log(`❌ 无法读取文件 ${filePath}: ${error.message}`)
    return false
  }
}

// 基础路径
const projectRoot = 'E:\\wbh\\things2\\thingspanel-frontend-community'

console.log('\n📋 检查核心文件...')

// 1. 检查simple-test-component组件结构
const componentFiles = [
  'src/card2.1/components/simple-test-component/index.ts',
  'src/card2.1/components/simple-test-component/SimpleTestComponent.vue',
  'src/card2.1/components/simple-test-component/config/SimpleTestConfig.vue'
]

componentFiles.forEach(file => {
  checkFileExists(path.join(projectRoot, file))
})

console.log('\n📋 检查配置系统集成...')

// 2. 检查配置系统文件
const configFiles = [
  'src/components/visual-editor/renderers/base/ComponentConfigForm.vue',
  'src/components/visual-editor/configuration/component-registry.ts'
]

configFiles.forEach(file => {
  checkFileExists(path.join(projectRoot, file))
})

console.log('\n📋 检查配置注册逻辑...')

// 3. 检查simple-test-component是否注册了配置组件
const indexFile = path.join(projectRoot, 'src/card2.1/components/simple-test-component/index.ts')
checkFileContent(indexFile, 'configComponent: SimpleTestConfig', 'SimpleTestConfig配置组件注册')
checkFileContent(indexFile, 'import SimpleTestConfig', 'SimpleTestConfig导入')

console.log('\n📋 检查ComponentConfigForm集成...')

// 4. 检查ComponentConfigForm是否支持Card2组件
const configFormFile = path.join(projectRoot, 'src/components/visual-editor/renderers/base/ComponentConfigForm.vue')
checkFileContent(configFormFile, 'useCard2Integration', 'Card2集成hook使用')
checkFileContent(configFormFile, 'card2ConfigComponent', 'Card2配置组件获取')
checkFileContent(configFormFile, 'isCard2Component', 'Card2组件判断')

console.log('\n📋 检查配置组件注册表...')

// 5. 检查组件注册表是否显示组件配置
const registryFile = path.join(projectRoot, 'src/components/visual-editor/configuration/component-registry.ts')
checkFileContent(registryFile, 'component: ComponentConfigForm', 'ComponentConfigForm注册')
checkFileContent(registryFile, 'visible: true', '组件配置可见性')

console.log('\n📋 检查SimpleTestConfig实现...')

// 6. 检查SimpleTestConfig实现
const configCompFile = path.join(projectRoot, 'src/card2.1/components/simple-test-component/config/SimpleTestConfig.vue')
checkFileContent(configCompFile, 'emit(\'update\', config)', '配置更新事件')
checkFileContent(configCompFile, 'handleUpdate', '配置更新处理')
checkFileContent(configCompFile, 'formData', '表单数据')

console.log('\n📊 验证总结:')

// 统计检查结果
const totalChecks = componentFiles.length + configFiles.length + 8 // 8个内容检查
console.log(`总检查项: ${totalChecks}`)
console.log('详细检查结果已显示在上方')

console.log('\n🎯 关键配置点:')
console.log('1. simple-test-component 应该注册了 SimpleTestConfig 作为配置组件')
console.log('2. ComponentConfigForm 应该能动态加载和渲染 Card2 配置组件')
console.log('3. 配置组件注册表应该显示组件配置标签页')
console.log('4. SimpleTestConfig 应该实现完整的表单和更新逻辑')

console.log('\n✨ 如果所有检查都通过，Card2.1配置系统应该能正常工作')

console.log('\n📝 测试步骤:')
console.log('1. 启动开发服务器: pnpm dev')
console.log('2. 访问 Visual Editor 页面')
console.log('3. 添加 simple-test-component 到画布')
console.log('4. 选中组件，检查右侧配置面板是否显示 "组件" 标签页')
console.log('5. 点击 "组件" 标签页，应该显示 SimpleTestConfig 表单')
console.log('6. 修改配置项，检查组件是否实时更新')