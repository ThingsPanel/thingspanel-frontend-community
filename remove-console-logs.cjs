const fs = require('fs')
const path = require('path')

/**
 * 递归获取所有文件
 */
function getAllFiles(dir) {
  const files = []
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath)
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath)
        }
      } else if (fullPath.match(/\.(ts|vue|js)$/)) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

/**
 * 找到console.log的完整调用（包括多行）
 */
function findConsoleLogCalls(content) {
  const calls = []
  const regex = /console\.log\s*\(/g
  let match
  
  while ((match = regex.exec(content)) !== null) {
    const start = match.index
    const end = findMatchingParen(content, match.index + match[0].length - 1)
    
    if (end !== -1) {
      calls.push({
        start,
        end,
        text: content.substring(start, end + 1)
      })
    }
  }
  
  return calls
}

/**
 * 找到匹配的右括号
 */
function findMatchingParen(content, startIndex) {
  let depth = 1
  let inString = false
  let stringChar = null
  
  for (let i = startIndex + 1; i < content.length; i++) {
    const char = content[i]
    const prevChar = content[i - 1]
    
    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false
        stringChar = null
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = true
        stringChar = char
      } else if (char === '(') {
        depth++
      } else if (char === ')') {
        depth--
        if (depth === 0) {
          return i
        }
      }
    }
  }
  
  return -1
}

/**
 * 删除单个文件中的console.log
 */
function removeConsoleLogsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  const calls = findConsoleLogCalls(content)
  
  // 从后往前处理，避免位置偏移
  calls.reverse()
  
  for (const call of calls) {
    // 检查是否在包装的if语句中
    const beforeContent = content.substring(Math.max(0, call.start - 200), call.start)
    const afterContent = content.substring(call.end + 1, Math.min(content.length, call.end + 50))
    
    // 如果是包装在if (process.env.NODE_ENV === 'development')中的，删除整个if块
    if (beforeContent.includes("if (process.env.NODE_ENV === 'development')")) {
      // 找到if语句的开始
      const ifMatch = beforeContent.match(/if\s*\(\s*process\.env\.NODE_ENV\s*===\s*'development'\s*\)\s*\{/)
      if (ifMatch) {
        const ifStart = call.start - (beforeContent.length - beforeContent.lastIndexOf(ifMatch[0]))
        
        // 找到匹配的}
        let braceDepth = 1
        let ifEnd = call.end + 1
        
        for (let i = call.end + 1; i < content.length; i++) {
          if (content[i] === '{') braceDepth++
          else if (content[i] === '}') {
            braceDepth--
            if (braceDepth === 0) {
              ifEnd = i
              break
            }
          }
        }
        
        // 删除整个if块（包括前后的空行）
        let deleteStart = ifStart
        let deleteEnd = ifEnd + 1
        
        // 向前删除空白行
        while (deleteStart > 0 && content[deleteStart - 1].match(/\s/)) {
          deleteStart--
          if (content[deleteStart] === '\n') break
        }
        
        // 向后删除空白行
        while (deleteEnd < content.length && content[deleteEnd].match(/\s/)) {
          deleteEnd++
          if (content[deleteEnd - 1] === '\n') break
        }
        
        content = content.substring(0, deleteStart) + content.substring(deleteEnd)
        modified = true
      }
    } else {
      // 直接删除console.log语句
      let deleteStart = call.start
      let deleteEnd = call.end + 1
      
      // 如果后面跟着分号，也删除
      if (content[deleteEnd] === ';') deleteEnd++
      
      // 删除整行如果这行只有console.log
      const lineStart = content.lastIndexOf('\n', call.start)
      const lineEnd = content.indexOf('\n', call.end)
      const lineContent = content.substring(lineStart + 1, lineEnd === -1 ? content.length : lineEnd)
      
      if (lineContent.trim() === call.text.trim() || lineContent.trim() === (call.text + ';').trim()) {
        deleteStart = lineStart + 1
        deleteEnd = lineEnd === -1 ? content.length : lineEnd + 1
      }
      
      content = content.substring(0, deleteStart) + content.substring(deleteEnd)
      modified = true
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ 删除文件: ${path.relative(process.cwd(), filePath)}`)
    return true
  }
  
  return false
}

/**
 * 主函数
 */
function main() {
  const srcDir = path.join(__dirname, 'src')
  
  console.log('🚀 开始删除所有console.log...')
  
  const files = getAllFiles(srcDir)
  let modifiedCount = 0
  
  for (const file of files) {
    try {
      if (removeConsoleLogsInFile(file)) {
        modifiedCount++
      }
    } catch (error) {
      console.error(`❌ 处理文件失败: ${file}`, error.message)
    }
  }
  
  console.log(`🎉 完成！修改了 ${modifiedCount} 个文件`)
}

main()