/**
 * Store Visual Editor 相对路径修复脚本
 * 将 src/store/modules/visual-editor 目录中所有相对路径统一转换为 @/ 绝对路径
 */
const fs = require('fs');
const path = require('path');

// store/modules/visual-editor 目录的路径
const STORE_VISUAL_EDITOR_DIR = './src/store/modules/visual-editor';
const BASE_SRC_PATH = './src';

/**
 * 获取所有 TypeScript 和 Vue 文件
 */
function getAllFiles(dir, extensions = ['.ts', '.vue']) {
  let results = [];
  
  function traverse(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          traverse(filePath);
        } else if (extensions.some(ext => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    } catch (err) {
      console.warn(`警告: 无法访问目录 ${currentDir}: ${err.message}`);
    }
  }
  
  traverse(dir);
  return results;
}

/**
 * 解析相对路径并转换为绝对路径
 * @param {string} filePath 当前文件路径
 * @param {string} relativePath 相对路径
 * @returns {string} 转换后的 @/ 路径
 */
function resolveRelativePath(filePath, relativePath) {
  // 获取当前文件所在目录
  const currentDir = path.dirname(filePath);
  
  // 解析相对路径得到绝对路径
  const absolutePath = path.resolve(currentDir, relativePath);
  
  // 将绝对路径转换为相对于 src 的路径
  const srcAbsolutePath = path.resolve(BASE_SRC_PATH);
  const relativeTosrc = path.relative(srcAbsolutePath, absolutePath);
  
  // 转换为 @/ 路径格式，并统一使用正斜杠
  return '@/' + relativeTosrc.replace(/\\/g, '/');
}

/**
 * 处理单个文件的相对路径转换
 * @param {string} filePath 文件路径
 * @returns {number} 修改的行数
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modifiedLines = 0;
    let hasChanges = false;
    
    // 匹配各种 import/export 语句中的相对路径
    const patterns = [
      // import ... from './path' 或 import ... from '../path'
      {
        regex: /(import\s+.*?\s+from\s+['"])(\.[^'"]+)(['"])/g,
        description: 'import from 相对路径'
      },
      // export ... from './path' 或 export ... from '../path'
      {
        regex: /(export\s+.*?\s+from\s+['"])(\.[^'"]+)(['"])/g,
        description: 'export from 相对路径'
      },
      // import('./path') 动态导入
      {
        regex: /(import\s*\(\s*['"])(\.[^'"]+)(['"])/g,
        description: '动态 import 相对路径'
      },
      // require('./path')
      {
        regex: /(require\s*\(\s*['"])(\.[^'"]+)(['"])/g,
        description: 'require 相对路径'
      }
    ];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let lineModified = false;
      
      for (const pattern of patterns) {
        const originalLine = line;
        
        line = line.replace(pattern.regex, (match, prefix, relativePath, suffix) => {
          try {
            // 解析相对路径
            const absolutePath = resolveRelativePath(filePath, relativePath);
            lineModified = true;
            console.log(`  ${pattern.description}: ${relativePath} → ${absolutePath}`);
            return prefix + absolutePath + suffix;
          } catch (error) {
            console.warn(`  警告: 无法解析路径 ${relativePath} in ${filePath}: ${error.message}`);
            return match; // 保持原样
          }
        });
        
        if (lineModified) {
          hasChanges = true;
          modifiedLines++;
          break; // 一行只处理一次
        }
      }
      
      lines[i] = line;
    }
    
    // 如果有修改，写回文件
    if (hasChanges) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log(`✅ ${filePath}: 修改了 ${modifiedLines} 行`);
      return modifiedLines;
    } else {
      console.log(`⚪ ${filePath}: 无需修改`);
      return 0;
    }
    
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始处理 Store Visual Editor 目录的相对路径转换...\n');
  
  // 获取所有文件
  const files = getAllFiles(STORE_VISUAL_EDITOR_DIR);
  console.log(`📁 找到 ${files.length} 个文件需要处理\n`);
  
  let totalModified = 0;
  let totalFiles = 0;
  
  // 处理每个文件
  for (const file of files) {
    console.log(`\n🔍 处理文件: ${file}`);
    const modified = processFile(file);
    if (modified > 0) {
      totalFiles++;
      totalModified += modified;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Store Visual Editor 相对路径转换完成!`);
  console.log(`📊 统计结果:`);
  console.log(`   - 处理文件数: ${files.length}`);
  console.log(`   - 修改文件数: ${totalFiles}`);
  console.log(`   - 修改行数: ${totalModified}`);
  console.log('='.repeat(60));
}

// 运行脚本
main();