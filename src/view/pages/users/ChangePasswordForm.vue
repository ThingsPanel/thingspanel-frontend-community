<template>
<el-dialog
    class="el-dark-dialog el-dark-input"
    :visible.sync="showDialog"
    width="30%"
    :title="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CHANGEPASSWORD')"
    :close-on-click-modal="false"
    :append-to-body="true"
>
  <el-form
      ref="changePasswordForm"
      label-width="100px"
      label-position="left"
      :model="formData"
      :rules="rules"
      @keydown.enter="handleSubmit()"
      hide-required-asterisk
  >

  <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.OLD_PASSWORD')" prop="old_password">
    <el-input size="medium" v-model="formData.old_password" show-password></el-input>
  </el-form-item>

    <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NEW_PASSWORDD')" prop="password">
      <el-input size="medium" v-model="formData.password" show-password></el-input>
    </el-form-item>
    <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CONPASSWORD')" prop="password_confirmation">
      <el-input size="medium" v-model="formData.password_confirmation" show-password></el-input>
    </el-form-item>

    <FormAlert :error_message="error_message"></FormAlert>

    <el-button @click="handleSubmit()" type="save" class="w-100">{{$t('SYSTEM_MANAGEMENT.SAVE')}}</el-button>
  </el-form>
</el-dialog>
<!--</div>-->
</template>

<script>
import {defineComponent, reactive, ref, computed} from "@vue/composition-api";
import TableTitle from "@/components/common/TableTitle";
import {useStore} from "@/core/services/store";
import {user_change_password} from "@/api/user";
import {message_success} from "@/utils/helpers";
import FormAlert from "@/components/common/FormAlert";
import i18n from "@/core/plugins/vue-i18n.js"
import JwtService from "@/core/services/jwt.service";

export default defineComponent({
  name: "ChangePasswordForm",
  components: {
    TableTitle, FormAlert,
  },
  props: {
    changePasswordDialogVisible: {
      type:Boolean,
      default: false,
    }
  },
  setup(props, context){
    let showDialog = computed({
      get(){
        return !!props.changePasswordDialogVisible
      },
      set(val){
        context.emit('update:changePasswordDialogVisible', val)
      },
    })

    const store = useStore()

    let changePasswordForm = ref()
    let loading = ref(false)

    let formData = reactive({
      id: "",
      old_password: "",
      password: "",
      password_confirmation: ""
    })

    let error_message = ref("")

    let check_password_confirmation = (rule, value, callback)=>{
      if (value === "") {
        callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER8')));
      }
      if (formData.password !== value) {
        callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER9')));
      }

      callback();
    }

    let rules = reactive({
      password: [
        {required:true, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER6')},
        {min:6, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER7')}
      ],
      password_confirmation: [
        {required: true, validator: check_password_confirmation}
      ],
    })

    function handleSubmit(){
      changePasswordForm.value.validate((valid)=>{
        if(!valid) return;

        if(loading.value) return
        loading.value = true

        // 提交前清除错误
        error_message.value = ""

        // 赋值user_id
        formData.id = JwtService.getCurrentUser().id

        user_change_password(formData).then(({data})=>{
          if(data.code === 200) {
            message_success(data.message)
            context.emit('update:changePasswordDialogVisible', false)
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
      changePasswordForm,
      formData,
      error_message,
      rules,
      handleSubmit,
    }
  }
})
</script>

<style scoped>
.change-password-form{
  max-width: 400px;
}
</style>