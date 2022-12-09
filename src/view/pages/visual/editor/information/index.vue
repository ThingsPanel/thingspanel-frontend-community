<template>
  <div class="information-container">
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue" @tab-click="handleTabClick">
      <el-tab-pane label="数据" name="data">
<!--        <el-form class="el-dark-input" :model="formData">-->

<!--          <el-divider content-position="left">名称</el-divider>-->
<!--          <el-input class="el-dark-input" v-model="formData.name" :disabled="true"></el-input>-->

<!--          <el-divider content-position="left" v-if="formData.text != undefined">文字</el-divider>-->
<!--          <el-input class="el-dark-input" v-if="formData.text != undefined" v-model="formData.text" ></el-input>-->

<!--          <el-divider content-position="left">数据源</el-divider>-->
<!--          <el-cascader ref="cascaderRef" class="el-cascader"-->
<!--                       :options="casOptions" :props="{ emitPath: false }"-->
<!--                       filterable @change="handleChangeOptions" placeholder="请选择设备">-->
<!--            <template slot-scope="{ node, data }">-->
<!--              <span>{{ data.label }}</span>-->
<!--              <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>-->
<!--              <span v-if="data.device_id">({{ data.plugin_id ? "已绑定" : "未绑定" }})</span>-->
<!--            </template>-->
<!--          </el-cascader>-->

<!--          <el-select placeholder="请选择数据源" v-model="formData.mapping" v-if="dataSrcOptions.length > 0" @change="handleChangeMap">-->
<!--            <el-option v-for="(item, index) in dataSrcOptions"  :key="index"-->
<!--                       :value="item.name" :label="item.title">-->
<!--            </el-option>-->
<!--          </el-select>-->

<!--&lt;!&ndash;          <el-select placeholder="请选择数据源" v-model="formData.mapping" v-if="formData.type == 'text'" @change="handleChangeMap">&ndash;&gt;-->
<!--&lt;!&ndash;            <el-option v-for="(item, index) in formData.dataSrc" :value="item" :key="index">{{ item }}</el-option>&ndash;&gt;-->
<!--&lt;!&ndash;          </el-select>&ndash;&gt;-->

<!--          <div v-else v-for="(map, index) in formData.mapping" :key="index">-->
<!--            <el-input class="el-dark-input" v-model="formData.mapping[index]" :disabled="true"></el-input>-->
<!--          </div>-->
<!--        </el-form>-->
        <text-config v-if="formData.type == 'text'" :form-data="formData" :cas-options="casOptions"></text-config>

        <configure-config v-if="formData.type == 'configure'" :form-data="formData" :cas-options="casOptions"></configure-config>

      </el-tab-pane>
      <el-tab-pane label="样式" name="style">
        <style-panel></style-panel>
      </el-tab-pane>
    </el-tabs>
  </div>

</template>

<script>
import bus from "@/core/plugins/eventBus"
import StylePanel from "./style"
import PluginAPI from "@/api/plugin"
import TextConfig from "./TextConfig"
import ConfigureConfig from "./ConfigureConfig"

export default {
  name: "EditorInformation",
  components: { StylePanel, TextConfig, ConfigureConfig },
  data() {
    return {
      tabValue: "data",
      formData: {
        name: "",
        text: "",
        mapping: ""
      },
      casOptions: [],
      dataSrcOptions: []
    }
  },
  mounted() {
    // 监听share事件
    bus.$on('share', val => {
      console.log("====share", val)
      this.formData = val;
      if (!this.formData.mapping) this.formData.mapping = "";
      // if (val.type == "text" && !val.text) this.formData.text = this.formData.name;
    });

    // 获取项目/分组/设备的级联菜单
    bus.$on('getCasOptions', val => {
      this.casOptions = val;
    });
  },
  methods: {
    handleTabClick() {

    },
    handleChangeMap(val) {
      console.log("handleChangeMap", val)
    },
    /**
     * 级联菜单选中节点时的回调
     */
    handleChangeOptions(v) {
      let node = this.$refs.cascaderRef.getCheckedNodes()[0];
      if (!node) return;
      if (node.data.business_id) {
        // 项目
      } else if (node.data.group_id) {
        // 分组
      } else if (node.data.device_id) {
        // 设备
        let pluginId = node.data.plugin_id;
        if (pluginId) {
          PluginAPI.page({ id: pluginId, current_page: 1, per_page: 10 })
              .then(({ data }) => {
                if (data.code == 200 || data.code == "200") {
                  let jsonData = data.data.data.length > 0 ? data.data.data[0] : "{}"
                  let jsonObj = JSON.parse(jsonData.chart_data);
                  let { tsl } = jsonObj;
                  this.dataSrcOptions = tsl.properties;
                  this.formData.mapping = "";
                }
              })
        }
      }
    },
  }
}
</script>

<style scoped>
.information-container {
  width: 100%;
  height: 100%;
  padding: 20px
}
::v-deep .el-divider--horizontal {
 margin-top: 44px!important;
}
.el-cascader {
  margin-bottom: 10px!important;
}
</style>