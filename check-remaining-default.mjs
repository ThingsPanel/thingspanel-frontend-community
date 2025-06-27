import fs from 'fs';
import path from 'path';

let totalFound = 0;
let foundCalls = [];

// 递归处理目录
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'locales', '.git', 'dist', 'build', 'public'].includes(file)) {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js')) {
      if (!file.includes('node_modules') && !file.includes('.d.ts') && !filePath.includes('locales/')) {
        processFile(filePath);
      }
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 查找带默认值的 $t() 调用
    const pattern = /\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      totalFound++;
      foundCalls.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        match: match[0],
        key: match[1],
        defaultValue: match[2]
      });
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

console.log('🔍 检查剩余的带默认值的 $t() 调用...\n');

// 处理源码目录
processDirectory('./src');

console.log(`📊 总共找到 ${totalFound} 个带默认值的 $t() 调用\n`);

if (foundCalls.length > 0) {
  console.log('📝 详细列表:');
  foundCalls.forEach((call, index) => {
    console.log(`${index + 1}. ${call.file}:${call.line}`);
    console.log(`   ${call.match}`);
    console.log(`   key: "${call.key}", default: "${call.defaultValue}"`);
    console.log('');
  });
  
  // 保存详细记录
  fs.writeFileSync('remaining-default-calls.json', JSON.stringify(foundCalls, null, 2), 'utf8');
  console.log(`📁 详细记录已保存到 remaining-default-calls.json`);
} 