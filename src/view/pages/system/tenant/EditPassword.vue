<template>
    <el-dialog
    class="el-dark-dialog el-dark-input"
    :visible.sync="dialogVisible"
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
    <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.PASSWORD')" prop="password">
      <el-input size="medium" v-model="formData.password" show-password></el-input>
    </el-form-item>
    <el-form-item :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CONPASSWORD')" prop="password_confirmation">
      <el-input size="medium" v-model="formData.password_confirmation" show-password></el-input>
    </el-form-item>

    <FormAlert :error_message="error_message"></FormAlert>

    <el-button @click="handleSubmit()" type="save" class="w-100">{{$t('SYSTEM_MANAGEMENT.SAVE')}}</el-button>
  </el-form>
</el-dialog>
</template>

<script>
export default {
  components: {},
  props: {
    visible: {
      type: [Boolean],
      default: false
    },
    data: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {

    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val)
      }
    }
  },
  methods: {}
}
</script>
<style lang="scss" scoped>
</style>