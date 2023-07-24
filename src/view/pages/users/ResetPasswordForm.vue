<template>
  <el-dialog class="el-dark-dialog el-dark-input" :visible.sync="showDialog" width="30%"
    :title="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CHANGEPASSWORD')" :close-on-click-modal="false">
    <el-form ref="resetPasswordFormRef" label-width="120px" label-position="left" :model="formData" :rules="rules"
      hide-required-asterisk>

      <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.OLD_PASSWORD')" prop="old_password">
        <el-input size="medium" v-model="formData.old_password" show-password></el-input>
      </el-form-item>

      <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NEW_PASSWORDD')" prop="password">
        <el-input size="medium" v-model="formData.password" show-password></el-input>
      </el-form-item>

      <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CONFIRM_PASSWORD')" prop="password_confirmation">
        <el-input size="medium" v-model="formData.password_confirmation" show-password></el-input>
      </el-form-item>

      <FormAlert :error_message="error_message"></FormAlert>

      <el-button size="medium" class="w-100" type="save"
        @click="handleSubmit">{{ $t('SYSTEM_MANAGEMENT.SAVE') }}</el-button>
    </el-form>
  </el-dialog>
</template>

<script>
import { defineComponent, ref, reactive, watch, computed } from "@vue/composition-api";
import { user_reset_password } from "@/api/user";
import { message_success } from "@/utils/helpers";
import FormAlert from "@/components/common/FormAlert.vue"
import i18n from "@/core/plugins/vue-i18n.js"
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
  setup(props, context) {
    // form表单元素
    let resetPasswordFormRef = ref()

    // 父级 props 的计算属性
    let showDialog = computed({
      get() {
        return !!props.resetPasswordDialogVisible
      },
      set(val) {
        context.emit("update:resetPasswordDialogVisible", val)
      },
    });

    // 弹窗关闭时重置表单
    watch(() => props.resetPasswordDialogVisible, (val) => {
      if (val === false) {
        resetPasswordFormRef.value.resetFields()
        error_message.value = ""
      }
    })

    // 表单数据
    let formData = reactive({
      old_password: "",
      password: "",
      password_confirmation: "",
    })

    let loading = ref(false)
    let error_message = ref("")

    // 检查密码
    const check_password_confirmation = (rule, value, callback) => {
      if (value === "") {
        callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER8')));
      }
      if (formData.password !== value) {
        callback(new Error(i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER9')));
      }

      callback();
    }

    // 表单验证
    let rules = reactive({
      old_password: [
        { required: true, message: "请输入原密码" },
        { min: 6, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER7') }
      ],
      password: [
        { required: true, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER6') },
        { min: 6, message: i18n.t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PLACEHOLDER7') }
      ],
      password_confirmation: [
        { required: true, validator: check_password_confirmation }
      ]
    })

    // 提交
    function handleSubmit() {
      resetPasswordFormRef.value.validate((valid) => {
        if (!valid) return;

        if (loading.value) return;
        loading.value = true;

        // 提交前清除错误
        error_message.value = ""

        // 发送请求
        formData.id = props.editUserItem.id;
        user_reset_password(formData).then(({ data }) => {
          if (data.code === 200) {
            message_success(data.message)

            // 通知父级关闭 dialog
            context.emit('update:resetPasswordDialogVisible', false)
          } else {
            error_message.value = data.message
          }
        }).finally(() => {
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

<style scoped></style>