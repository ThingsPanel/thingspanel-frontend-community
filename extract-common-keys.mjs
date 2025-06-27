import fs from 'fs';
import path from 'path';

console.log('🔍 提取所有 common.* 相关的键...');

let commonKeys = new Set();
let allTCalls = [];

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
      /\$t\(['"`]([^'"`]+)['"`]\s*,\s*[^)]+\)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        allTCalls.push({
          file: filePath,
          key: key,
          match: match[0]
        });
        
        // 如果是 common.* 键，添加到集合中
        if (key.startsWith('common.')) {
          commonKeys.add(key);
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
console.log(`📝 其中 common.* 相关的键有 ${commonKeys.size} 个\n`);

// 显示所有 common.* 键
console.log('🔑 所有 common.* 键:');
const sortedCommonKeys = Array.from(commonKeys).sort();
sortedCommonKeys.forEach((key, index) => {
  console.log(`${index + 1}. ${key}`);
});

// 统计其他类型的键
const otherKeys = new Set();
const formKeys = new Set();
const pageKeys = new Set();
const generateKeys = new Set();
const routeKeys = new Set();

allTCalls.forEach(call => {
  const key = call.key;
  if (key.startsWith('form.')) {
    formKeys.add(key);
  } else if (key.startsWith('page.')) {
    pageKeys.add(key);
  } else if (key.startsWith('generate.')) {
    generateKeys.add(key);
  } else if (key.startsWith('route.')) {
    routeKeys.add(key);
  } else if (!key.startsWith('common.') && !key.includes('${') && !key.includes('[')) {
    otherKeys.add(key);
  }
});

console.log(`\n📊 其他类型键的统计:`);
console.log(`  form.*: ${formKeys.size} 个`);
console.log(`  page.*: ${pageKeys.size} 个`);
console.log(`  generate.*: ${generateKeys.size} 个`);
console.log(`  route.*: ${routeKeys.size} 个`);
console.log(`  其他: ${otherKeys.size} 个`);

// 保存 common.* 键列表
const commonKeysArray = Array.from(commonKeys).sort();
fs.writeFileSync('common-keys.json', JSON.stringify(commonKeysArray, null, 2), 'utf8');
console.log(`\n📁 common.* 键列表已保存到 common-keys.json`);

// 保存所有调用的详细信息
fs.writeFileSync('all-t-calls-analysis.json', JSON.stringify({
  total: allTCalls.length,
  commonKeys: commonKeysArray,
  formKeys: Array.from(formKeys).sort(),
  pageKeys: Array.from(pageKeys).sort(),
  generateKeys: Array.from(generateKeys).sort(),
  routeKeys: Array.from(routeKeys).sort(),
  otherKeys: Array.from(otherKeys).sort(),
  allCalls: allTCalls
}, null, 2), 'utf8');

console.log(`📁 完整分析报告已保存到 all-t-calls-analysis.json`); 