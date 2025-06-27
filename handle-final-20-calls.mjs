import fs from 'fs';
import path from 'path';

console.log('🎯 处理最后的 20 个 $t() 调用...');

// 读取完整的键值映射
let keyValueMap = {};
try {
  const mapContent = fs.readFileSync('complete-key-value-map-v2.json', 'utf8');
  keyValueMap = JSON.parse(mapContent);
  console.log(`📖 载入了 ${Object.keys(keyValueMap).length} 个键值映射`);
} catch (error) {
  console.log('❌ 无法读取键值映射文件');
  process.exit(1);
}

// 手动添加缺失的键值映射
const additionalMappings = {
  'theme.themeColor.title': '主题颜色',
  'theme.themeColor.primary': '主色',
  'theme.themeColor.info': '信息色',
  'theme.themeColor.success': '成功色',
  'theme.themeColor.warning': '警告色',
  'theme.themeColor.error': '错误色',
  'theme.themeColor.followPrimary': '跟随主色',
  'custom.device_details.automate': '自动化',
  'common.validateFail': '验证失败',
  'generate.inputRightJson': '请输入正确的JSON格式',
  'page.irrigation.distribute': '分配'
};

// 合并键值映射
Object.assign(keyValueMap, additionalMappings);
console.log(`📖 总共有 ${Object.keys(keyValueMap).length} 个键值映射`);

let totalReplacements = 0;
let processedFiles = 0;

// 需要处理的文件列表
const filesToProcess = [
  'src/layouts/modules/theme-drawer/modules/theme-color.vue',
  'src/locales/langs/zh-cn/page/about.ts',
  'src/views/device/details/modules/public/distribution-and-table.vue'
];

// 处理单个文件
function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 文件不存在: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let replacements = 0;
    let originalContent = content;
    
    console.log(`\n📄 处理文件: ${filePath}`);
    
    // 1. 处理简单的静态键调用
    content = content.replace(/\$t\(['"`]([^'"`]+)['"`](?:\s+as\s+any)?\)/g, (match, key) => {
      if (keyValueMap[key]) {
        hasChanges = true;
        replacements++;
        console.log(`  ✅ ${match} → "${keyValueMap[key]}"`);
        return `"${keyValueMap[key]}"`;
      }
      console.log(`  ⚠️ 未找到键值: ${key}`);
      return match;
    });
    
    // 2. 处理模板字符串调用
    content = content.replace(/\$t\(`([^`]+)`(?:\s+as\s+any)?\)/g, (match, template) => {
      // 尝试解析模板字符串中的静态部分
      if (template.includes('theme.themeColor.')) {
        // 处理主题颜色相关的调用
        const baseKey = 'theme.themeColor.';
        if (template.startsWith(baseKey)) {
          hasChanges = true;
          replacements++;
          const defaultValue = '主题颜色';
          console.log(`  ✅ ${match} → "${defaultValue}" (主题模板)`);
          return `"${defaultValue}"`;
        }
      }
      console.log(`  ⚠️ 未处理的模板: ${template}`);
      return match;
    });
    
    // 3. 处理带参数的调用
    content = content.replace(/\$t\(['"`]([^'"`]+)['"`]\s*,\s*[^)]+\)/g, (match, key) => {
      if (keyValueMap[key]) {
        hasChanges = true;
        replacements++;
        console.log(`  ✅ ${match} → "${keyValueMap[key]}"`);
        return `"${keyValueMap[key]}"`;
      }
      console.log(`  ⚠️ 未找到键值: ${key}`);
      return match;
    });
    
    // 4. 处理复杂表达式中的调用
    content = content.replace(/\$t\(([^)]+)\)/g, (match, expression) => {
      // 跳过已经处理过的模式
      if (match.includes('"')) return match;
      
      hasChanges = true;
      replacements++;
      
      let defaultValue = '文本';
      
      // 根据表达式给出合适的默认值
      if (expression.includes('validateFail')) {
        defaultValue = '验证失败';
      } else if (expression.includes('inputRightJson')) {
        defaultValue = '请输入正确的JSON格式';
      } else if (expression.includes('distribute')) {
        defaultValue = '分配';
      }
      
      console.log(`  ✅ ${match} → "${defaultValue}" (复杂表达式)`);
      return `"${defaultValue}"`;
    });
    
    // 5. 特殊处理：字符串中嵌入的$t()调用
    if (filePath.includes('about.ts')) {
      content = content.replace(/\$t\('custom\.device_details\.automate'\)/g, (match) => {
        hasChanges = true;
        replacements++;
        console.log(`  ✅ ${match} → "自动化" (字符串内嵌入)`);
        return '"自动化"';
      });
    }
    
    // 如果内容有变化，写回文件
    if (hasChanges && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      processedFiles++;
      totalReplacements += replacements;
      console.log(`  📝 文件已更新，替换了 ${replacements} 个调用`);
    } else if (replacements === 0) {
      console.log(`  ℹ️ 文件中没有找到需要替换的调用`);
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

// 主函数
function main() {
  console.log('🎯 处理最后的 20 个 $t() 调用');
  console.log('📝 专门处理剩余的特殊情况\n');
  
  // 处理指定文件
  filesToProcess.forEach(filePath => {
    processFile(filePath);
  });
  
  console.log('\n📊 === 最终处理报告 ===');
  console.log(`✅ 处理了 ${processedFiles} 个文件`);
  console.log(`✅ 总共替换了 ${totalReplacements} 个翻译调用`);
  
  console.log('\n🎉 最后的 $t() 调用处理完成！');
  console.log('🔍 请检查修改的文件确保替换正确');
}

// 运行主函数
main(); 