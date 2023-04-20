<template>
  <div>
    <el-form ref="loginFormRef" :model="formData" :rules="rules" @keyup.enter.native="handleSubmit">
      <el-form-item prop="email" :error="errors.email">
        <el-input v-model.trim="formData.email" clearable auto-complete="on" name="email"></el-input>
      </el-form-item>
      <el-form-item prop="password" :error="errors.password">
        <el-input v-model.trim="formData.password" type="password" show-password name="password"></el-input>
      </el-form-item>
      <el-button type="primary" class="w-100" :loading="loading" @click="handleSubmit">{{ $t("LOGIN.SIGNIN") }}</el-button>
    </el-form>
  </div>
</template>

<script>
import { defineComponent } from "@vue/composition-api";
import useLoginForm from "@/view/pages/auth/useLoginForm";

export default defineComponent({
  name: "LoginForm",
  setup() {

    let {
      loginFormRef,
      formData,
      loading,
      rules,
      errors,
      handleSubmit
    } = useLoginForm();

    return {
      loginFormRef,
      formData,
      loading,
      rules,
      errors,
      handleSubmit,
    }
  }
})
</script>

<style scoped>
/deep/ .el-input__inner{
  color: #fff;
  background-color: rgba(22, 30, 67, 0.5) !important;
  border-color: transparent;
}

/deep/ .el-button i{
  color: #fff;
}
</style>