<!-- 组态配置面板 -->
<template>
  <div>
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue">
      <el-tab-pane label="数据" name="data">
        <el-row style="margin: 20px 0 20px 0">
          <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">名称</el-col>
          <el-col :span="18"><el-input size="mini" v-model="form.name"></el-input></el-col>
        </el-row>
        <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">
    <!--      <el-collapse-item title="信息" name="info">-->

    <!--      </el-collapse-item>-->

          <el-collapse-item title="数据源" name="source">
            <el-cascader ref="cascaderRef" class="el-cascader" size="mini"
                         :options="casOptions" :props="{ emitPath: false }"
                         filterable @change="handleChangeOptions" placeholder="请选择设备">
              <template slot-scope="{ node, data }">
                <span>{{ data.label }}</span>
                <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                <span v-if="data.device_id">({{ data.plugin_id ? "已绑定" : "未绑定" }})</span>
              </template>
            </el-cascader>

          </el-collapse-item>

        </el-collapse>

      </el-tab-pane>
      <el-tab-pane label="样式" name="style">
        <style-panel></style-panel>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: "ConfigureConfig",
  props: {
    formData: {
      type: [Object],
      default: () => { return {} }
    },
    casOptions: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      tabValue: "data",
      activeNames: ["info", "source"],
      form: {
        name: "",
        text: "",
        mapping: ""
      }
    }
  },
  created() {
    console.log("====configure.created")
  },
  methods: {
    handleChangeOptions() {

    }
  }
}
</script>

<style scoped>

</style>