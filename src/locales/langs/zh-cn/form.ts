export default {
  required: '不能为空',
  userName: {
    required: '请输入用户名',
    invalidFormat: '用户名格式不正确',
    lenMin6: '用户名至少需要6个字符',
    tip: '用户名至少需要6个字符'
  },
  phone: {
    required: '请输入手机号',
    invalid: '手机号格式不正确',
    lenMin6: '手机号至少需要6个字符',
    tip: '手机号至少需要6个字符'
  },
  pwd: {
    required: '请输入密码',
    invalid: '密码格式不正确',
    lenMin6: '密码长度不能小于6位，且必须包含小写字母',
    tip: '密码长度不能小于6位，且必须包含小写字母'
  },
  code: {
    required: '请输入验证码',
    invalid: '验证码格式不正确',
    lenMin6: '验证码至少需要6个字符',
    tip: '验证码至少需要6个字符'
  },
  email: {
    required: '请输入邮箱',
    invalid: '邮箱格式不正确',
    lenMin6: '邮箱至少需要6个字符',
    tip: '邮箱至少需要6个字符'
  },
  manycheck: {
    required: '输入的值与密码不一致',
    invalid: '输入的值与密码不一致',
    lenMin6: '输入的值至少需要6个字符',
    tip: '输入的值至少需要6个字符'
  }
};
