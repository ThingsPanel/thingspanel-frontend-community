/**
 * 调试自动注册系统的独立脚本
 * 用于验证组件发现和注册机制
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readdir, stat } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function scanComponentDirectories() {
  const componentRoot = join(__dirname, 'src/card2.1/components')
  
  console.log('🔍 开始扫描组件目录...')
  console.log('根目录:', componentRoot)
  
  const foundComponents = []
  
  async function scanDirectory(dir, level = 0) {
    try {
      const entries = await readdir(dir)
      const indent = '  '.repeat(level)
      
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'auto-registry.ts' || entry === 'index.ts') continue
        
        const fullPath = join(dir, entry)
        const stats = await stat(fullPath)
        
        if (stats.isDirectory()) {
          console.log(`${indent}📁 ${entry}/`)
          
          // 检查是否有 index.ts 文件
          const indexPath = join(fullPath, 'index.ts')
          try {
            await stat(indexPath)
            const relativePath = fullPath.replace(componentRoot + '/', '').replace(/\\/g, '/')
            foundComponents.push({
              path: relativePath,
              indexFile: indexPath
            })
            console.log(`${indent}  ✅ 发现组件: ${relativePath}`)
          } catch {
            // 没有 index.ts，继续扫描子目录
            await scanDirectory(fullPath, level + 1)
          }
        }
      }
    } catch (error) {
      console.error(`❌ 扫描目录失败: ${dir}`, error.message)
    }
  }
  
  await scanDirectory(componentRoot)
  
  console.log('\n📊 扫描结果统计:')
  console.log(`总共发现 ${foundComponents.length} 个组件:`)
  foundComponents.forEach(comp => {
    console.log(`  - ${comp.path}`)
  })
  
  return foundComponents
}

// 执行扫描
scanComponentDirectories().catch(console.error)