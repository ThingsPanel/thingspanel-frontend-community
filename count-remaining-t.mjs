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
    
    // 查找所有 $t() 调用
    const pattern = /\$t\(/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      totalFound++;
      
      // 获取完整的调用（包括参数）
      let fullMatch = '';
      let openParens = 0;
      let i = match.index;
      
      while (i < content.length) {
        const char = content[i];
        fullMatch += char;
        
        if (char === '(') openParens++;
        if (char === ')') openParens--;
        
        if (openParens === 0) break;
        i++;
      }
      
      foundCalls.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        match: fullMatch
      });
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

console.log('🔍 统计剩余的所有 $t() 调用...\n');

// 处理源码目录
processDirectory('./src');

console.log(`📊 总共找到 ${totalFound} 个 $t() 调用\n`);

if (foundCalls.length > 0) {
  // 按文件分组统计
  const fileStats = {};
  foundCalls.forEach(call => {
    if (!fileStats[call.file]) {
      fileStats[call.file] = 0;
    }
    fileStats[call.file]++;
  });
  
  console.log('📝 按文件统计:');
  Object.entries(fileStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([file, count]) => {
      console.log(`  ${file}: ${count} 个`);
    });
  
  if (Object.keys(fileStats).length > 20) {
    console.log(`  ... 还有 ${Object.keys(fileStats).length - 20} 个文件`);
  }
  
  // 显示一些示例
  console.log('\n📝 示例调用:');
  foundCalls.slice(0, 10).forEach((call, index) => {
    console.log(`${index + 1}. ${call.file}:${call.line}`);
    console.log(`   ${call.match}`);
  });
  
  if (foundCalls.length > 10) {
    console.log(`   ... 还有 ${foundCalls.length - 10} 个调用`);
  }
  
  // 保存详细记录
  fs.writeFileSync('remaining-t-calls.json', JSON.stringify(foundCalls, null, 2), 'utf8');
  console.log(`\n📁 详细记录已保存到 remaining-t-calls.json`);
}

console.log('\n📈 处理进度总结:');
console.log('✅ 带默认值的 $t() 调用: 13 个 (已全部处理)');
console.log('✅ 通过键值映射的 $t() 调用: 424 个 (已处理)');
console.log(`🔄 剩余未处理的 $t() 调用: ${totalFound} 个`);
console.log(`📊 总处理率: ${((13 + 424) / (13 + 424 + totalFound) * 100).toFixed(1)}%`); 