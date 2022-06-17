<template>
<el-dialog
    class="el-dark-dialog el-dark-input"
    :visible.sync="showDialog"
    width="30%"
    center
>
  <el-form
      ref="resetPasswordFormRef"
      label-width="80px"
      label-position="left"
      :model="formData"
      :rules="rules"
      hide-required-asterisk>
    <el-form-item label="密码" prop="password">
      <el-input v-model="formData.password" show-password></el-input>
    </el-form-item>

    <el-form-item label="确认密码" prop="password_confirmation">
      <el-input v-model="formData.password_confirmation" show-password></el-input>
    </el-form-item>

    <FormAlert :error_message="error_message"></FormAlert>

    <el-button class="w-100" type="primary" @click="handleSubmit">提交</el-button>
  </el-form>
</el-dialog>
</template>

<script>
import {defineComponent, ref, reactive, watch, computed} from "@vue/composition-api";
import {user_password} from "@/api/user";
import {message_success} from "@/utils/helpers";
import FormAlert from "@/components/common/FormAlert.vue"

export default defineComponent({
  name: "ResetPasswordForm",
  components: {
    FormAlert
  },
  props: {
    editUserItem: {
      required: true,
    },
    resetPasswordDialogVisible: {
      type: Boolean,
      default: false,
    }
  },
  setup(props, context){
    // form表单元素
    let resetPasswordFormRef = ref()

    // 父级 props 的计算属性
    let showDialog = computed({
      get(){
        return !!props.resetPasswordDialogVisible
      },
      set(val){
        context.emit("update:resetPasswordDialogVisible", val)
      },
    });

    // 弹窗关闭时重置表单
    watch(()=> props.resetPasswordDialogVisible, (val)=>{
      if(val === false) {
        resetPasswordFormRef.value.resetFields()
        error_message.value = ""
      }
    })

    // 表单数据
    let formData = reactive({
      password: "",
      password_confirmation: "",
    })

    let loading = ref(false)
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
      resetPasswordFormRef.value.validate((valid)=>{
        if(!valid) return;

        if(loading.value) return;
        loading.value = true;

        // 提交前清除错误
        error_message.value = ""

        // 发送请求
        formData.id = props.editUserItem.id;
        user_password(formData).then(({data})=>{
          if(data.code === 200) {
            message_success("密码修改成功！！")

            // 通知父级关闭 dialog
            context.emit('update:resetPasswordDialogVisible', false)
          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })

      })
    }

    return {
      showDialog,
      resetPasswordFormRef,
      formData,
      rules,
      handleSubmit,
      error_message,
    }
  }
})
</script>

<style scoped>

</style>