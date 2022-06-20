<template>
<el-dialog
    class="el-dark-dialog el-dark-input"
    :visible.sync="showDialog"
    width="30%"
    center
    :close-on-click-modal="false"
>
<el-form
    ref="createUserForm"
    label-width="80px"
    label-position="left"
    :model="formData"
    :rules="rules"
    hide-required-asterisk>
  <el-form-item label="姓名" prop="name">
    <el-input size="medium" v-model="formData.name"></el-input>
  </el-form-item>

  <el-form-item label="邮箱" prop="email">
    <el-input size="medium" v-model="formData.email"></el-input>
  </el-form-item>

  <el-form-item label="手机" prop="mobile">
    <el-input size="medium" v-model="formData.mobile"></el-input>
  </el-form-item>

  <el-form-item label="密码" prop="password">
    <el-input size="medium" v-model="formData.password" type="password" show-password></el-input>
  </el-form-item>

  <el-form-item label="确认密码" prop="password_confirmation">
    <el-input size="medium" v-model="formData.password_confirmation" type="password" show-password></el-input>
  </el-form-item>
  <el-form-item label="角色" prop="is_admin">
    <el-radio-group v-model="formData.is_admin">
      <el-radio :label="1">管理员</el-radio>
      <el-radio :label="0">普通用户</el-radio>
    </el-radio-group>
  </el-form-item>

  <el-form-item label="备注" prop="remark">
    <el-input size="medium" v-model="formData.remark" type="textarea"></el-input>
  </el-form-item>

  <FormAlert :error_message="error_message"></FormAlert>

  <div class="py-1">
    <el-button size="medium" class="w-100" type="primary" @click="handleSubmit">保存</el-button>
  </div>
<!--  <div class="py-1"><el-button class="w-100" @click="handleReset">重置</el-button></div>-->

</el-form>
</el-dialog>
</template>

<script>
import {defineComponent, ref, reactive, computed, watch} from "@vue/composition-api";
import {is_cellphone, is_email, message_success} from "@/utils/helpers";
import {user_add} from "@/api/user";
import FormAlert from "@/components/common/FormAlert";

export default defineComponent({
  name: "CreateUserForm",
  components: {
    FormAlert
  },
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
    // from 表单元素
    let createUserForm = ref()

    // 父级 props 的计算属性
    let showDialog = computed({
      get(){
        return !!props.createUserDialogVisible
      },
      set(val){
        context.emit('update:createUserDialogVisible', val)
      },
    });

    // 弹窗关闭时重置表单
    watch(()=> props.createUserDialogVisible, (val)=>{
      if(val === false) {
        createUserForm.value.resetFields()
        error_message.value = ""
      }
    })

    // 提交的数据
    let formData = reactive({
      name: "",
      is_admin: 0,
      email: "",
      mobile: "",
      password: "",
      password_confirmation: "",
      remark: "",
    })
    let loading = ref(false);
    let error_message = ref("")

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
            message_success(data.message)
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

    // function handleReset(){
    //   createUserForm.value.resetFields()
    //   error_message.value = ""
    // }

    return {
      showDialog,
      createUserForm,
      formData,
      rules,
      handleSubmit,
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