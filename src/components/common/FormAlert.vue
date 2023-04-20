<template>
  <el-alert
      v-if="error_message"
      title="提交的数据有误"
      type="error"
      :description="error_message"
      class="mb-4"
      show-icon>
  </el-alert>
</template>

<script>
export default {
  name: "FormAlert",
  props: {
    error_message: {
      require: true,
      default: '',
    }
  }
}
</script>

<style scoped>

</style>