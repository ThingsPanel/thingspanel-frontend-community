<template>
  <div>
    <el-form label-position="right" label-width="85px">
      <el-row :gutter="20">
        <!-- 自动化名称-->
        <el-col :span="8">
          <el-form-item label="自动化名称">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>
        </el-col>

        <!-- 描述-->
        <el-col :span="8">
          <el-form-item label="描述">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>
        </el-col>

        <!-- 优先级-->
        <el-col :span="8">
          <el-form-item label="优先级">
            <el-input v-model="formData.name"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="如果">
        <el-row :gutter="20" v-for="(condition, index) in formData.conditions" :key="index">

          <!-- 条件-->
          <el-col :span="3">
            <el-select v-model="condition.type">
              <!-- 设备条件-->
              <el-option label="设备条件" :value="'device'"></el-option>
              <!-- 时间条件-->
              <el-option label="时间条件" :value="'time'"></el-option>
            </el-select>
          </el-col>

          <!-- 条件-->
          <el-col :span="21">
            <ProjectSelector/>
          </el-col>


        </el-row>
      </el-form-item>

    </el-form>
  </div>
</template>

<script>
import ProjectSelector from "./selector/ProjectSelector";

export default {
  name: "ConditionForm",
  components: { ProjectSelector },
  data() {
    return {
      formData: {
        conditions: [
          {
            type: "device"
          },
          {
            type: "time"
          }
        ]
      }
    }
  }
}
</script>

<style scoped>

</style>