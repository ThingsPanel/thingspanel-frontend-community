<template>
  <div class="container-fluid">
    <el-row>
      <el-col class="h-100">
        <div class="header">
          <el-button class="el-button--indigo"  @click="back">返回</el-button>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="24" >
        <div>

        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "VisualDisplay",
  mounted() {
    let businessId = this.$route.query.business_id;
    console.log("businessId", businessId)
  },
  methods: {
    back() {
      this.$router.push({ name: "ChartList" })
    }
  }
}
</script>

<style scoped lang="scss">
.container-fluid {
  height: 100%!important;
  padding: 20px 10px 100px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
.header {
  color:  #fff;
  height: 60px;
  padding-bottom: 20px;
}
}
</style>