const fs = require('fs');
const path = require('path');

// 从您的语言包中提取常用的键值映射
const keyValueMap = {
  // 通用词汇
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.save': '保存',
  'common.delete': '删除',
  'common.edit': '编辑',
  'common.add': '新增',
  'common.search': '搜索',
  'common.reset': '重置',
  'common.back': '返回',
  'common.close': '关闭',
  'common.confirmDelete': '确认删除',
  'common.time': '时间',
  'common.requestPath': '请求路径',
  'common.yesOrNo.yes': '是',
  'common.yesOrNo.no': '否',
  
  // 系统相关
  'system.title': 'ThingsPanel',
  'system.description': '连接万物，智慧生活',
  'route.login': '登录',
  
  // 登录页面
  'page.login.common.codeSent': '验证码已发送',
  'page.login.common.validateSuccess': '验证成功',
  'page.login.common.emailPlaceholder': '请输入邮箱',
  'page.login.common.codePlaceholder': '请输入验证码',
  'page.login.common.passwordPlaceholder': '请输入密码',
  'page.login.common.confirmPasswordPlaceholder': '请确认密码',
  'page.login.common.userNamePlaceholder': '请输入用户名',
  'page.login.common.phonePlaceholder': '请输入手机号',
  'page.login.common.back': '返回',
  'page.login.common.rememberPath': '记住密码',
  'page.login.pwdLogin.title': '密码登录',
  'page.login.pwdLogin.rememberMe': '记住我',
  'page.login.pwdLogin.forgetPassword': '忘记密码',
  'page.login.pwdLogin.otherLoginMode': '其他登录方式',
  'page.login.pwdLogin.otherAccountLogin': '其他账号登录',
  'page.login.register.title': '注册',
  'page.login.register.emailPlaceholder': '请输入邮箱地址',
  'page.login.register.registerSuccess': '注册成功',
  'page.login.resetPwd.title': '重置密码',
  'page.login.codeLogin.title': '验证码登录',
  'page.login.codeLogin.imageCodePlaceholder': '请输入图形验证码',
  
  // 表单验证
  'form.pwd.tip': '密码为6-18位字符，需包含字母、数字',
  'form.pwd.required': '请输入密码',
  'form.email.required': '请输入邮箱',
  'form.userName.required': '请输入用户名',
  'form.userName.invalidFormat': '用户名格式错误',
  
  // 可视化
  'generate.preview': '预览',
  'generate.first': '首页',
  'generate.search-by-name': '按名称搜索',
  'generate.dashboard-name': '看板名称',
  'generate.enter-dashboard-name': '请输入看板名称',
  'generate.is-homepage': '是否首页',
  'generate.enter-description': '请输入描述',
  'generate.cancel': '取消',
  'generate.or': '或',
  
  // 仪表板面板
  'dashboard_panel.addKanBan': '添加看板',
  'dashboard_panel.editKanban': '编辑看板',
  
  // 设备模板
  'device_template.table_header.description': '描述',
  
  // 自定义
  'custom.home.kanbanNameNull': '看板名称不能为空',
  'custom.visualization.onlyOneHomepage': '只能有一个首页',
  'custom.management.all': '全部'
};

// 递归处理目录
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`目录不存在: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过特定目录
      if (!['node_modules', 'locales', '.git', 'dist', 'build'].includes(file)) {
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
    let replacements = 0;
    let unmappedKeys = [];
    
    // 匹配 $t() 调用的正则表达式
    const patterns = [
      /\$t\(['"`]([^'"`]+)['"`]\)/g,
      /t\(['"`]([^'"`]+)['"`]\)/g
    ];
    
    patterns.forEach(pattern => {
      content = content.replace(pattern, (match, key) => {
        if (keyValueMap[key]) {
          hasChanges = true;
          replacements++;
          console.log(`  ✅ ${match} → "${keyValueMap[key]}"`);
          return `"${keyValueMap[key]}"`;
        } else {
          unmappedKeys.push(key);
          return match; // 保持原样
        }
      });
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`\n📄 ${filePath} - 替换了 ${replacements} 个翻译`);
    }
    
    if (unmappedKeys.length > 0) {
      console.log(`⚠️  ${filePath} 中有 ${unmappedKeys.length} 个未映射的键:`);
      unmappedKeys.forEach(key => console.log(`    - ${key}`));
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

// 主函数
function main() {
  console.log('🚀 开始逆向国际化重构...');
  console.log('📝 将会把 $t() 调用替换为中文原文\n');
  console.log(`📋 当前映射了 ${Object.keys(keyValueMap).length} 个翻译键\n`);
  
  // 处理源码目录
  processDirectory('./src');
  
  console.log('\n✅ 处理完成！');
  console.log('💡 建议检查输出的"未映射的键"，手动添加到脚本中');
  console.log('🔧 然后重新运行脚本处理剩余的翻译');
}

// 如果作为主模块运行
if (require.main === module) {
  main();
}

module.exports = { processDirectory, processFile, keyValueMap }; 