const fs = require('fs');
const path = require('path');

// 手动定义一些常用的键值对映射（基于您的项目）
const keyValueMap = {
  // 从您的语言包中提取一些示例
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.save': '保存',
  'common.delete': '删除',
  'common.edit': '编辑',
  'common.add': '添加',
  'common.search': '搜索',
  'common.reset': '重置',
  'common.submit': '提交',
  'common.back': '返回',
  'common.close': '关闭',
  'common.open': '打开',
  'common.loading': '加载中...',
  'common.nodata': '暂无数据',
  'common.success': '成功',
  'common.error': '错误',
  'common.warning': '警告',
  'common.info': '信息',
  // 可以继续添加更多...
};

// 递归处理目录
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 locales 目录
      if (!['node_modules', 'locales', '.git'].includes(file)) {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js')) {
      processFile(filePath);
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // 匹配 $t() 调用
    const regex = /\$t\(['"`]([^'"`]+)['"`]\)/g;
    
    content = content.replace(regex, (match, key) => {
      if (keyValueMap[key]) {
        hasChanges = true;
        console.log(`${filePath}: ${match} → "${keyValueMap[key]}"`);
        return `"${keyValueMap[key]}"`;
      } else {
        console.log(`⚠️  未找到映射: ${match} in ${filePath}`);
        return match; // 保持原样
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (error) {
    console.error(`处理文件出错 ${filePath}:`, error.message);
  }
}

// 开始处理
console.log('🚀 开始逆向国际化重构...');
console.log('📝 将会把 $t() 调用替换为中文原文\n');

processDirectory('./src');

console.log('\n✅ 处理完成！');
console.log('💡 建议先提交代码到 Git，然后检查替换结果'); 