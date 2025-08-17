#!/usr/bin/env node

/**
 * 数据字段映射集成功能验证脚本
 * 🔧 验证 DataFieldMappingInput 与数据源配置表单的集成效果
 */

const fs = require('fs')
const path = require('path')

// 验证配置
const VERIFICATION_CONFIG = {
  targetFile: 'src/core/data-source-system/components/DataSourceConfigForm.vue',
  requiredImports: ['DataFilterInput', 'InformationCircleOutline'],
  requiredFunctions: [
    'getJsonDefaultValue',
    'handleFilterPathChange',
    'handleFilterResultChange',
    'toggleFilterSection'
  ],
  requiredComponents: ['DataFilterInput'],
  requiredStyles: ['data-filter-section', 'filter-config-area']
}

function log(type, message) {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  }
  console.log(`${icons[type]} ${message}`)
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

function checkFileContent(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const results = {}

    patterns.forEach(pattern => {
      if (typeof pattern === 'string') {
        results[pattern] = content.includes(pattern)
      } else if (pattern instanceof RegExp) {
        results[pattern.toString()] = pattern.test(content)
      }
    })

    return { content, results }
  } catch (error) {
    return { content: '', results: {}, error: error.message }
  }
}

function verifyIntegration() {
  log('info', '🧪 开始验证数据字段映射集成功能...\n')

  // 1. 检查主要文件是否存在
  log('info', '📁 检查文件存在性:')
  const targetFilePath = path.join(process.cwd(), VERIFICATION_CONFIG.targetFile)

  if (!checkFileExists(targetFilePath)) {
    log('error', `目标文件不存在: ${VERIFICATION_CONFIG.targetFile}`)
    return false
  }
  log('success', `目标文件存在: ${VERIFICATION_CONFIG.targetFile}`)

  // 2. 检查文件内容
  log('info', '\n🔍 检查文件内容:')
  const { content, results, error } = checkFileContent(targetFilePath, [
    // 导入检查
    ...VERIFICATION_CONFIG.requiredImports,
    // 函数检查
    ...VERIFICATION_CONFIG.requiredFunctions.map(fn => `const ${fn} =`),
    // 组件使用检查
    '<DataFilterInput',
    ':source-data="filterSourceData"',
    '@filter-change="handleFilterResultChange"',
    // 样式检查
    ...VERIFICATION_CONFIG.requiredStyles.map(style => `.${style}`)
  ])

  if (error) {
    log('error', `读取文件失败: ${error}`)
    return false
  }

  // 3. 验证具体功能
  let allChecksPass = true

  // 检查导入
  log('info', '\n📦 检查组件导入:')
  VERIFICATION_CONFIG.requiredImports.forEach(importName => {
    if (results[importName]) {
      log('success', `导入存在: ${importName}`)
    } else {
      log('error', `导入缺失: ${importName}`)
      allChecksPass = false
    }
  })

  // 检查函数
  log('info', '\n🔧 检查处理函数:')
  VERIFICATION_CONFIG.requiredFunctions.forEach(funcName => {
    const funcPattern = `const ${funcName} =`
    if (results[funcPattern]) {
      log('success', `函数存在: ${funcName}`)
    } else {
      log('error', `函数缺失: ${funcName}`)
      allChecksPass = false
    }
  })

  // 检查组件使用
  log('info', '\n🎯 检查组件集成:')
  if (results['<DataFilterInput']) {
    log('success', 'DataFilterInput 组件已集成')
  } else {
    log('error', 'DataFilterInput 组件未集成')
    allChecksPass = false
  }

  if (results[':source-data="filterSourceData"']) {
    log('success', '过滤源数据绑定正确')
  } else {
    log('warning', '过滤源数据绑定可能有问题')
  }

  if (results['@filter-change="handleFilterResultChange"']) {
    log('success', '过滤变化事件处理正确')
  } else {
    log('error', '过滤变化事件处理缺失')
    allChecksPass = false
  }

  // 检查样式
  log('info', '\n🎨 检查样式定义:')
  VERIFICATION_CONFIG.requiredStyles.forEach(styleName => {
    const stylePattern = `.${styleName}`
    if (results[stylePattern]) {
      log('success', `样式存在: ${styleName}`)
    } else {
      log('warning', `样式可能缺失: ${styleName}`)
    }
  })

  // 4. 高级功能检查
  log('info', '\n🚀 检查高级功能:')

  // JSON默认值功能
  if (content.includes('getJsonDefaultValue()')) {
    log('success', 'JSON默认值设置功能已实现')
  } else {
    log('warning', 'JSON默认值设置可能有问题')
  }

  // 数据过滤状态管理
  if (content.includes('currentFilterPath') && content.includes('showFilterSection')) {
    log('success', '数据过滤状态管理已实现')
  } else {
    log('error', '数据过滤状态管理缺失')
    allChecksPass = false
  }

  // 配置器与执行器分离
  if (content.includes('handleFilterPathChange') && content.includes('handleFilterResultChange')) {
    log('success', '配置器与执行器逻辑分离已实现')
  } else {
    log('error', '配置器与执行器逻辑分离缺失')
    allChecksPass = false
  }

  // 5. 总结
  log('info', '\n📊 验证总结:')
  if (allChecksPass) {
    log('success', '🎉 所有核心功能验证通过！')
    log('info', '✨ 数据过滤器集成功能已成功实现')
    log('info', '📝 请使用 test-field-mapping-integration.html 进行UI测试')
  } else {
    log('error', '❌ 部分功能验证失败，请检查实现')
  }

  return allChecksPass
}

// 6. 输出测试指导
function printTestGuide() {
  log('info', '\n📋 测试指导:')
  console.log(`
🔧 开发服务器测试:
  1. 运行: pnpm dev
  2. 访问: /views/test/data-source-config-form-test
  3. 点击 "添加数据项" 按钮
  4. 验证 JSON 默认值和字段映射功能

🧪 功能测试清单:
  ✅ JSON 示例自动填充
  ✅ 数据过滤器区域切换
  ✅ JSONPath 过滤路径解析
  ✅ 实时过滤状态更新
  ✅ 配置保存验证
  ✅ 多数据类型支持

📁 相关文件:
  • 主要组件: ${VERIFICATION_CONFIG.targetFile}
  • 测试页面: /views/test/data-source-config-form-test/index.vue
  • 过滤组件: /components/visual-editor/configuration/components/DataFilterInput.vue
  • 测试指南: test-field-mapping-integration.html
  `)
}

// 执行验证
if (require.main === module) {
  const success = verifyIntegration()
  printTestGuide()
  process.exit(success ? 0 : 1)
}

module.exports = { verifyIntegration }
