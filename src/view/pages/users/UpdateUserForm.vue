<template>
<el-dialog
    class="el-dark-dialog el-dark-input"
    :visible.sync="showDialog"
    width="30%"
    center
    :close-on-click-modal="false"
>
  <el-form
      ref="updateUserForm"
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
  </el-form>
</el-dialog>
</template>

<script>
import {defineComponent, reactive, ref, watch, computed} from "@vue/composition-api";
import FormAlert from "@/components/common/FormAlert";
import {is_cellphone, is_email, message_success} from "@/utils/helpers";
import {user_edit} from "@/api/user";

export default defineComponent({
  name: "UpdateUserForm",
  components: {
    FormAlert
  },
  props: {
    editUserItem: {
      required: true,
    },
    update_user: {
      required: true,
      type: Function,
    },
    updateUserDialogVisible: {
      type: Boolean,
      default: false,
    }
  },
  setup(props, context){
    // 表单元素
    let updateUserForm = ref()

    let showDialog = computed({
      get(){
        return !!props.updateUserDialogVisible
      },
      set(val){
        context.emit('update:updateUserDialogVisible', val)
      },
    })

    let formData = reactive({
      name: "",
      is_admin: 0,
      email: "",
      mobile: "",
      remark: "",
    })

    watch(()=> props.editUserItem, (val)=>{
      if(val){
        formData.id = val.id
        formData.name = val.name;
        formData.is_admin = val.is_admin;
        formData.email = val.email;
        formData.mobile = val.mobile;
        formData.remark = val.remark;
      }
    })

    let loading = ref(false)
    let error_message = ref("")

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
    })

    function handleSubmit(){
      updateUserForm.value.validate((valid)=>{
        if(!valid) return;

        if(loading.value) return;
        loading.value = true

        // 提交前清除错误
        error_message.value = ""

        // 发送请求
        user_edit(formData).then(({data})=>{
          if(data.code === 200) {
            message_success(data.message)

            // 调用父级修改的方法
            // 后端返回数据缺少 mobile
            data.data.mobile = formData.mobile
            props.update_user(props.editUserItem, data.data)
            // 通知父级关闭弹窗
            context.emit('update:updateUserDialogVisible', false)

          }else{
            error_message.value = data.message
          }
        }).finally(()=>{
          loading.value = false
        })
      })
    }

    return {
      updateUserForm,
      formData,
      rules,
      error_message,
      handleSubmit,
      showDialog,
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