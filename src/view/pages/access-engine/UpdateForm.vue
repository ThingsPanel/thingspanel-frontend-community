<template>
<div class="transpond-create">
  <el-form
      ref="updateForm"
      :rules="rules"
      label-position="left"
      :model="form"
      :hide-required-asterisk="true"
      label-width="80px">
    <el-form-item label="频率" prop="frequency">
      <el-select v-model="form.frequency" :no-data-text="$t('COMMON.SELECT_NO_DATA')">
        <el-option label="实时" value="实时"></el-option>
        <el-option label="每分钟" value="每分钟"></el-option>
        <el-option label="每十分钟" value="每十分钟"></el-option>
        <el-option label="每半小时" value="每半小时"></el-option>
        <el-option label="每小时" value="每小时"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="状态" prop="status">
      <el-select v-model="form.status" :no-data-text="$t('COMMON.SELECT_NO_DATA')">
        <el-option label="启用" value="工作中"></el-option>
        <el-option label="停用" value="已停用"></el-option>
      </el-select>
    </el-form-item>

    <el-button class="w-100" type="primary" @click="onSubmit">提交更新</el-button>
  </el-form>
</div>
</template>

<script>
export default {
  name: "UpdateForm",
  props:{
    init_data:{
      required: true
    }
  },
  data: () => ({
    form: {
      frequency: '',
      status: ''
    },
    rules: {
      frequency: [
        {required: true, message: "请选择频率"}
      ],
      status: [
        {required: true, message: "请选择状态"}
      ]
    }
  }),
  watch: {
    init_data:{
      handler(newVal){
        this.form.frequency = newVal.frequency
        this.form.status = newVal.status
      },
      immediate: true,
      deep: true,
    }
  },
  methods: {
    onSubmit(){
      this.$refs.updateForm.validate((valid) => {
        if(valid){
          this.$emit("update", this.form)
        }
      })
    }
  }
}
</script>

<style>

</style>