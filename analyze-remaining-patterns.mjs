import fs from 'fs';
import path from 'path';

console.log('🔍 分析剩余 $t() 调用的模式...');

let allTCalls = [];
let staticKeys = new Set();
let dynamicCalls = [];

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
    const patterns = [
      // 简单的 $t('key') 调用
      /\$t\(['"`]([^'"`]+)['"`]\)/g,
      // 带参数的 $t('key', params) 调用
      /\$t\(['"`]([^'"`]+)['"`]\s*,\s*[^)]+\)/g,
      // 动态调用 $t(variable)
      /\$t\(([^'"`][^)]*)\)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        
        // 判断是否为静态键
        if (key.match(/^[a-zA-Z][a-zA-Z0-9._-]*$/)) {
          staticKeys.add(key);
          allTCalls.push({
            file: filePath,
            key: key,
            match: match[0],
            type: 'static'
          });
        } else {
          // 动态调用
          dynamicCalls.push({
            file: filePath,
            expression: key,
            match: match[0],
            type: 'dynamic'
          });
          allTCalls.push({
            file: filePath,
            key: key,
            match: match[0],
            type: 'dynamic'
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

// 处理源码目录
processDirectory('./src');

console.log(`📊 总共找到 ${allTCalls.length} 个 $t() 调用`);
console.log(`📝 其中静态键: ${staticKeys.size} 个`);
console.log(`📝 其中动态调用: ${dynamicCalls.length} 个\n`);

// 分析静态键的前缀
const prefixStats = {};
Array.from(staticKeys).forEach(key => {
  const prefix = key.split('.')[0];
  if (!prefixStats[prefix]) {
    prefixStats[prefix] = [];
  }
  prefixStats[prefix].push(key);
});

console.log('🔑 静态键前缀分析:');
Object.entries(prefixStats)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([prefix, keys]) => {
    console.log(`  ${prefix}.*: ${keys.length} 个键`);
    if (keys.length <= 10) {
      keys.forEach(key => console.log(`    - ${key}`));
    } else {
      keys.slice(0, 5).forEach(key => console.log(`    - ${key}`));
      console.log(`    ... 还有 ${keys.length - 5} 个`);
    }
  });

console.log('\n🔄 动态调用示例:');
dynamicCalls.slice(0, 10).forEach((call, index) => {
  console.log(`${index + 1}. ${call.file}`);
  console.log(`   ${call.match}`);
  console.log(`   表达式: ${call.expression}`);
});

if (dynamicCalls.length > 10) {
  console.log(`   ... 还有 ${dynamicCalls.length - 10} 个动态调用`);
}

// 保存分析结果
fs.writeFileSync('remaining-patterns-analysis.json', JSON.stringify({
  total: allTCalls.length,
  staticKeys: Array.from(staticKeys).sort(),
  dynamicCalls: dynamicCalls,
  prefixStats: prefixStats,
  allCalls: allTCalls
}, null, 2), 'utf8');

console.log(`\n📁 分析结果已保存到 remaining-patterns-analysis.json`); 