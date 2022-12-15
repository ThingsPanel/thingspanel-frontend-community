<!-- 仪表盘配置面板 -->
<!-- 文本配置面板 -->
<template>
  <div>
    <el-row style="margin: 20px 0 20px 0">
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">名称</el-col>
      <el-col :span="18"><el-input size="mini" v-model="form.name"></el-input></el-col>
    </el-row>

    <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">

      <el-collapse-item title="信息" name="info">
        <el-row>

        </el-row>
      </el-collapse-item>


      <el-collapse-item title="数据源" name="source">
<!--        <el-cascader ref="cascaderRef" class="el-cascader" size="mini"-->
<!--                     :options="casOptions"  v-model="form.casValue"-->
<!--                     filterable @change="handleChangeOptions" placeholder="请选择设备">-->
<!--          <template slot-scope="{ node, data }">-->
<!--            <span>{{ data.label }}</span>-->
<!--            <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>-->
<!--            <span v-if="data.device_id">({{ data.plugin_id ? "已绑定" : "未绑定" }})</span>-->
<!--          </template>-->
<!--        </el-cascader>-->

<!--        <el-select size="mini" placeholder="请选择数据源" v-model="form.mapping" v-if="dataSrcOptions.length > 0">-->
<!--          <el-option v-for="(item, index) in dataSrcOptions"  :key="index"-->
<!--                     :value="item.name" :label="item.title">-->
<!--          </el-option>-->
<!--        </el-select>-->
        <data-source-pane :cas-options="casOptions" :cas-value.sync="form.casValue" :mapping.sync="form.mapping"
                          @select="handleSelect"
        ></data-source-pane>
      </el-collapse-item>



    </el-collapse>
  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"
import DataSourcePane from "./components/DataSourcePane";

export default {
  name: "DashboardConfig",
  components: { DataSourcePane },
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
      activeNames: ["info", "source"],
      form: {
        name: "",
        text: "",
        mapping: "",
        casValue: "",
        deviceId: ""
      },
      dataSrcOptions: []
    }
  },
  watch: {
    formData: {
      handler(newValue){
        console.log("====Dashboard", newValue);
        this.form = JSON.parse(JSON.stringify(newValue));
        // if (this.form.casValue) {
        //   this.handleChangeOptions(this.form.casValue);
        // }
      }
    },
    form: {
      handler(newValue) {
        bus.$emit('changeData', newValue);
      },
      deep: true
    }
  },
  methods: {
    handleSelect(v) {

    }
    // async handleChangeOptions(v) {
    //   let checkedNodes = this.$refs.cascaderRef.getCheckedNodes();
    //   let node = checkedNodes ? checkedNodes[0] : null;
    //
    //   let deviceId = null;
    //   let pluginId = null;
    //
    //   if (!node && v) {
    //     // 如果不是手动选择节点
    //     pluginId = await Call.getPluginIdFromCasOptions(this.casOptions, v);
    //     deviceId = v[2] ? v[2] : null;
    //   } else if (node) {
    //     console.log("====DashboardConfig.node", node)
    //     if (node.data.business_id) {
    //       // 项目
    //     } else if (node.data.group_id) {
    //       // 分组
    //     } else if (node.data.device_id) {
    //       // 设备
    //       pluginId = node.data.plugin_id;
    //       deviceId = node.data.device_id;
    //     }
    //   }
    //   if (!pluginId) return;
    //   let tslProperties = await Call.getPluginTSLByPluginId(pluginId);
    //   if (!tslProperties) return;
    //   this.dataSrcOptions = tslProperties;
    //   this.form.deviceId = deviceId;
    // }
  }
}
</script>

<style scoped>
.el-collapse-item {
  border-top: 1px solid #FFFFFF17;
}
.information-collapse {
  padding: 0!important;
}
::v-deep .el-collapse-item__content {
  padding: 10px 0 20px 14px;
}
.el-select {
  padding: 10px 0 0 0;
}
</style>