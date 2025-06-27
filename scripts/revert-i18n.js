const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 读取中文语言包
function loadChineseLocales() {
  const zhLocale = require('../src/locales/langs/zh-cn.ts');
  return zhLocale.default || zhLocale;
}

// 递归获取所有键值对
function flattenObject(obj, prefix = '') {
  let result = {};
  
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(result, flattenObject(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  
  return result;
}

// 替换文件中的 $t() 调用
function replaceInFile(filePath, keyValueMap) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // 匹配各种 $t() 调用格式
  const patterns = [
    /\$t\(['"`]([^'"`]+)['"`]\)/g,
    /t\(['"`]([^'"`]+)['"`]\)/g,
    /i18n\.t\(['"`]([^'"`]+)['"`]\)/g,
    /i18n\.global\.t\(['"`]([^'"`]+)['"`]\)/g
  ];
  
  patterns.forEach(pattern => {
    content = content.replace(pattern, (match, key) => {
      if (keyValueMap[key]) {
        hasChanges = true;
        console.log(`替换: ${match} → "${keyValueMap[key]}"`);
        return `"${keyValueMap[key]}"`;
      }
      return match;
    });
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 已更新: ${filePath}`);
  }
}

// 主函数
function main() {
  try {
    console.log('🚀 开始逆向国际化重构...\n');
    
    // 加载中文语言包
    console.log('📝 加载中文语言包...');
    const chineseLocales = loadChineseLocales();
    const keyValueMap = flattenObject(chineseLocales);
    
    console.log(`📊 找到 ${Object.keys(keyValueMap).length} 个翻译键\n`);
    
    // 查找所有需要处理的文件
    const filePatterns = [
      'src/**/*.vue',
      'src/**/*.ts',
      'src/**/*.js'
    ];
    
    let allFiles = [];
    filePatterns.forEach(pattern => {
      const files = glob.sync(pattern, { 
        ignore: ['src/locales/**/*', 'node_modules/**/*'] 
      });
      allFiles = allFiles.concat(files);
    });
    
    console.log(`🔍 找到 ${allFiles.length} 个文件需要处理\n`);
    
    // 处理每个文件
    allFiles.forEach(file => {
      replaceInFile(file, keyValueMap);
    });
    
    console.log('\n🎉 逆向国际化重构完成！');
    console.log('💡 现在您可以重新开始规划国际化结构了');
    
  } catch (error) {
    console.error('❌ 执行过程中出现错误:', error);
  }
}

main(); 