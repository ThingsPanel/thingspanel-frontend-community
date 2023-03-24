<template>
  <div>
    <el-dialog class="el-dark-dialog" title="导入批次" :visible.sync="dialogVisible" width="400px"
             :before-close="handleClose" :close-on-click-modal="false">
    <el-form :inline="false" label-position="left" label-width="80px" :model="formData" :rules="formRules">

      <el-row>
        <el-form-item label="批次号" prop="batch_number">
          <el-input v-model="formData.batch_number"></el-input>
        </el-form-item>
      </el-row>

      <el-row>
        <el-form-item label="数量" prop="device_number">
          <el-input-number v-model="formData.device_number"></el-input-number>
        </el-form-item>
      </el-row>
      
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button type="save" @click="handleSubmit">创建批次</el-button>
    </span>
  </el-dialog>
  </div>
</template>

<script>
export default {
  components: {},
  props: {},
  data() {
    return {

    }
  },
  methods: {}
}
</script>
<style lang="scss" scoped>
</style>