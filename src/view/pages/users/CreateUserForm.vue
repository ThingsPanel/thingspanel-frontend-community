<template>
<el-dialog
    :visible.sync="showDialog"
    width="30%"
    center
>
<el-form
    ref="createUserForm"
    label-width="80px"
    label-position="left"
    :model="formData"
    :rules="rules"
    hide-required-asterisk>
  <el-form-item label="姓名" prop="name">
    <el-input v-model="formData.name"></el-input>
  </el-form-item>

  <el-form-item label="邮箱" prop="email">
    <el-input v-model="formData.email"></el-input>
  </el-form-item>

  <el-form-item label="手机" prop="mobile">
    <el-input v-model="formData.mobile"></el-input>
  </el-form-item>

  <el-form-item label="密码" prop="password">
    <el-input v-model="formData.password" type="password" show-password></el-input>
  </el-form-item>

  <el-form-item label="确认密码" prop="password_confirmation">
    <el-input v-model="formData.password_confirmation" type="password" show-password></el-input>
  </el-form-item>
  <el-form-item label="角色" prop="is_admin">
    <el-radio-group v-model="formData.is_admin">
      <el-radio :label="1">管理员</el-radio>
      <el-radio :label="0">普通用户</el-radio>
    </el-radio-group>
  </el-form-item>

  <el-alert
      v-if="error_message"
      title="提交的数据有误"
      type="error"
      :description="error_message"
      class="mb-4"
      show-icon>
  </el-alert>

  <div class="py-1"><el-button class="w-100" type="primary" @click="handleSubmit">提交</el-button></div>
  <div class="py-1"><el-button class="w-100" @click="handleReset">重置</el-button></div>

</el-form>
</el-dialog>
</template>

<script>
import {defineComponent, ref, reactive, computed} from "@vue/composition-api";
import {is_cellphone, is_email} from "@/utils/helpers";
import {user_add} from "@/api/user";
import {Message} from "element-ui";

export default defineComponent({
  name: "CreateUserForm",
  props: {
    add_user: {
      required: true,
      type: Function,
    },
    createUserDialogVisible: {
      type: Boolean,
      default: false
    }
  },
  setup(props, context){
    // 父级 props 的计算属性
    let showDialog = computed({
      get(){
        return props.createUserDialogVisible
      },
      set(val){
        context.emit('update:createUserDialogVisible', val)
      },
    });
    // from 表单元素
    let createUserForm = ref()

    // 提交的数据
    let formData = reactive({
      name: "",
      is_admin: 0,
      email: "",
      mobile: "",
      password: "",
      password_confirmation: "",
    })
    let loading = ref(false);
    let error_message = ref('')

    // 检查密码
    const check_password_confirmation = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请再次输入密码"));
      }
      if (formData.password !== value) {
        callback(new Error("新密码两次输入不一致"));
      }

      callback();
    }

    // 表单验证
    let rules = reactive({
      name: [
        {required: true, message: "请填写姓名"}
      ],
      email: [
        {required: true, message: "请填写合法的电子邮箱", validator: check_email}
      ],
      mobile: [
        {required: true, message: "请填写合法的手机号", validator: check_mobile}
      ],
      password: [
        {required:true, message: "请输入新密码"},
        {min:6, message: "密码至少 6 位"}
      ],
      password_confirmation: [
        {required: true, validator: check_password_confirmation}
      ]
    })

    // 提交
    function handleSubmit(){
      createUserForm.value.validate((valid)=>{
        if(!valid) return;

        if(loading.value) return;
        loading.value = true

        // 提交前清除错误
        error_message.value = ""

        // 发送请求
        user_add(formData).then(({data})=>{
          if( data.code === 200) {
            Message.success("添加成功！！")
            // 调用 props 方法向列表添加新数据
            // 后端返回数据缺少 mobile
            data.data.mobile = formData.mobile
            props.add_user(data.data)
            // 通知父级关闭 dialog
            context.emit("update:createUserDialogVisible", false)
          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })

      })
    }

    function handleReset(){
      createUserForm.value.resetFields()
      error_message.value = ""
    }

    return {
      showDialog,
      createUserForm,
      formData,
      rules,
      handleSubmit,
      handleReset,
      error_message,
    }
  }
})

// el-form 表单自定义验证方法
const check_email = (rule, value, callback) => {
  if (is_email(value)) {
    callback()
  }
  callback(new Error("请填写合法的电子邮箱"))
}
const check_mobile = (rule, value, callback) => {
  if (is_cellphone(value)) {
    callback()
  }
  callback(new Error("请填写合法的手机号"))
}
</script>

<style scoped>

</style>