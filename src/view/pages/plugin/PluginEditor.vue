<template>
  <div class="editor-container">
<!--    <div class="card-container">-->
<!--      <el-row :gutter="20">-->
<!--        <el-col :span="12">-->
<!--          <a>-->
<!--            <el-card class="box-card" @click.native="customPlugin">-->
<!--              <div class="text-item">-->
<!--                <p>自定义插件</p>-->
<!--                <el-alert :closable="false"-->
<!--                          title="提示信息"-->
<!--                          type="info">-->
<!--                </el-alert>-->
<!--              </div>-->
<!--            </el-card>-->
<!--          </a>-->
<!--        </el-col>-->
<!--        <el-col :span="12">-->
<!--          <a>-->
<!--            <el-card class="box-card">-->
<!--              <div class="text-item">-->
<!--                <p>导入JSON</p>-->
<!--                <el-alert :closable="false"-->
<!--                          title="提示信息"-->
<!--                          type="info">-->
<!--                </el-alert>-->
<!--              </div>-->
<!--            </el-card>-->
<!--          </a>-->
<!--        </el-col>-->
<!--      </el-row>-->
<!--    </div>-->
    开发中...
  </div>
</template>

<script>
export default {
  name: "PluginEditor",
  data() {
    return {
      activeName: "",
      showDialog: false
    }
  },
  methods: {
    customPlugin() {
      this.showDialog = true
      console.log("configuration")
      // return false
    }
  }
}
</script>

<style scoped lang="scss">
.editor-container {
  display: flex;
  display: -webkit-flex;
  justify-content: center;
  -webkit-justify-content: center;
  align-items: center;
  -webkit-align-items: center;
  margin: 200px auto;
}
.card-container {
  width: 800px;
  height: 400px;

}
.box-card {
  height: 200px
}
.text-item {
  width: 100%;
  height: 200px;
  text-align: center;
  p {
    font-size: 30px;
  }
}
</style>