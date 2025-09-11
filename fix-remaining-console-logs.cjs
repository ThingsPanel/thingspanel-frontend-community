const fs = require('fs')
const path = require('path')

/**
 * 递归获取所有TypeScript和Vue文件
 */
function getAllFiles(dir, extensions = ['.ts', '.vue', '.js']) {
  const files = []
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath)
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        // 跳过node_modules等目录
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath)
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

/**
 * 查找没有被环境检查包装的console.log
 */
function findUnwrappedConsoleLogsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const unwrappedLogs = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 检查是否包含console.log
    if (line.includes('console.log(')) {
      // 检查前面几行是否有环境检查
      let hasEnvCheck = false
      
      // 向前查找最多5行
      for (let j = Math.max(0, i - 5); j < i; j++) {
        if (lines[j].includes("process.env.NODE_ENV === 'development'")) {
          hasEnvCheck = true
          break
        }
      }
      
      if (!hasEnvCheck) {
        unwrappedLogs.push({
          line: i + 1,
          content: line.trim(),
          filePath
        })
      }
    }
  }
  
  return unwrappedLogs
}

/**
 * 修复单个文件中没有被包装的console.log
 */
function fixUnwrappedConsoleLogsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  // 检查是否是Vue文件
  const isVueFile = filePath.endsWith('.vue')
  
  // 匹配console.log开头的完整调用（包括多行）
  const consoleLogRegex = /^(\s*)(console\.log\s*\()/gm
  
  let result = content
  
  result = result.replace(consoleLogRegex, (match, indent, consoleCall) => {
    // 检查前面是否已经有环境检查
    const beforeMatch = result.substring(0, result.indexOf(match))
    const lastLines = beforeMatch.split('\n').slice(-10).join('\n')
    
    // 如果已经在环境检查块中，跳过
    if (lastLines.includes("process.env.NODE_ENV === 'development'")) {
      return match
    }
    
    modified = true
    return `${indent}if (process.env.NODE_ENV === 'development') {\n${indent}  ${consoleCall}`
  })
  
  // 需要闭合括号的处理 - 这里需要更精确的处理
  if (modified) {
    // 重新分析并添加闭合括号
    result = addClosingBraces(result)
    
    fs.writeFileSync(filePath, result, 'utf8')
    console.log(`✅ 修复文件: ${path.relative(process.cwd(), filePath)}`)
    return true
  }
  
  return false
}

/**
 * 添加闭合括号的辅助函数
 */
function addClosingBraces(content) {
  const lines = content.split('\n')
  const result = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    result.push(line)
    
    // 如果当前行是新添加的环境检查中的console.log
    if (line.includes('if (process.env.NODE_ENV === \'development\') {') && 
        i + 1 < lines.length && 
        lines[i + 1].includes('console.log(')) {
      
      // 找到console.log的完整结束
      let j = i + 1
      let parenCount = 0
      let inString = false
      let stringChar = null
      
      while (j < lines.length) {
        const currentLine = lines[j]
        result.push(currentLine)
        
        for (let k = 0; k < currentLine.length; k++) {
          const char = currentLine[k]
          
          if (!inString) {
            if (char === '"' || char === "'" || char === '`') {
              inString = true
              stringChar = char
            } else if (char === '(') {
              parenCount++
            } else if (char === ')') {
              parenCount--
              if (parenCount === 0) {
                // console.log结束，添加闭合括号
                const indent = line.match(/^(\s*)/)[1]
                result.push(`${indent}}`)
                j = lines.length // 跳出外层循环
                break
              }
            }
          } else if (char === stringChar && currentLine[k-1] !== '\\') {
            inString = false
            stringChar = null
          }
        }
        
        if (j < lines.length - 1) j++
        else break
      }
      
      i = j // 跳过已处理的行
    }
  }
  
  return result.join('\n')
}

/**
 * 主函数
 */
function main() {
  const srcDir = path.join(__dirname, 'src')
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src目录不存在')
    return
  }
  
  console.log('🔍 开始查找剩余的console.log...')
  
  const files = getAllFiles(srcDir)
  console.log(`📁 扫描 ${files.length} 个文件`)
  
  let totalUnwrapped = 0
  let modifiedCount = 0
  
  // 首先统计所有未包装的console.log
  for (const file of files) {
    try {
      const unwrapped = findUnwrappedConsoleLogsInFile(file)
      if (unwrapped.length > 0) {
        totalUnwrapped += unwrapped.length
        console.log(`📄 ${path.relative(process.cwd(), file)}: ${unwrapped.length} 个未包装的console.log`)
        unwrapped.forEach(log => {
          console.log(`  第${log.line}行: ${log.content}`)
        })
      }
    } catch (error) {
      console.error(`❌ 扫描文件失败: ${file}`, error.message)
    }
  }
  
  console.log(`\n📊 总计发现 ${totalUnwrapped} 个未包装的console.log`)
  
  if (totalUnwrapped === 0) {
    console.log('🎉 所有console.log都已经被正确包装！')
    return
  }
  
  console.log('\n🚀 开始修复...')
  
  // 修复文件
  for (const file of files) {
    try {
      if (fixUnwrappedConsoleLogsInFile(file)) {
        modifiedCount++
      }
    } catch (error) {
      console.error(`❌ 修复文件失败: ${file}`, error.message)
    }
  }
  
  console.log(`\n🎉 完成！修复了 ${modifiedCount} 个文件`)
}

// 运行脚本
main()