<!-- 数据源面板 -->
<template>
  <div>
    <el-cascader ref="cascaderRef" class="el-cascader" size="mini"
                 :options="casOptions"  v-model="form.casValue"
                 filterable @change="handleChangeOptions" placeholder="请选择设备">
      <template slot-scope="{ node, data }">
        <span>{{ data.label }}</span>
        <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
        <span v-if="data.device_id">({{ data.plugin_id ? "已绑定" : "未绑定" }})</span>
      </template>
    </el-cascader>

    <el-select size="mini" placeholder="请选择数据源" v-model="form.mapping" v-if="dataSrcOptions.length > 0">
      <el-option v-for="(item, index) in dataSrcOptions"  :key="index"
                 :value="item.name" :label="item.title">
      </el-option>
    </el-select>
  </div>

</template>

<script>
import Call from "../call";

export default {
  name: "DataSourcePane",
  props: {
    casOptions: {
      type: [Object, Array],
      default: () => []
    },
    casValue: {
      type: [Array, String],
      default: () => []
    },
    mapping: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      form: {
        casValue: "",
        mapping: ""
      },
      dataSrcOptions: []
    }
  },
  watch: {
    /**
     * 父组件传递的级联菜单的值
     */
    casValue: {
      handler(newValue) {
        this.form.casValue = newValue;
        this.handleChangeOptions(newValue);
      }
    },
    /**
     * 父组件传递的mapping
     */
    mapping: {
      handler(newValue) {
        console.log("====DashboardPane.mapping", newValue)
        this.form.mapping = newValue;
      }
    },
    /**
     * 级联菜单的值
     */
    "form.casValue": {
      handler(newValue) {
        this.$emit("update:casValue", newValue)
        this.$emit("select", this.form)
      },
      deep: true
    },
    /**
     * 绑定的属性值
     */
    "form.mapping": {
      handler(newValue) {
        this.$emit("update:mapping", newValue)
        this.$emit("select", this.form)
      },
      deep: true
    }
  },
  methods: {
    /**
     * 级联菜单改变时的回调
     * @param v
     * @returns {Promise<void>}
     */
    async handleChangeOptions(v) {
      let checkedNodes = this.$refs.cascaderRef.getCheckedNodes();
      let node = checkedNodes ? checkedNodes[0] : null;

      let deviceId = null;
      let pluginId = null;
      if (!node && v) {
        // 如果不是手动选择节点
        pluginId = await Call.getPluginIdFromCasOptions(this.casOptions, v);
        deviceId = v[2] ? v[2] : null;
      } else {
        if (node.data.business_id) {
          // 项目
        } else if (node.data.group_id) {
          // 分组
        } else if (node.data.device_id) {
          // 设备
          pluginId = node.data.plugin_id;
          deviceId = node.data.device_id;
        }
      }
      if (!pluginId) return;
      let tslProperties = await Call.getPluginTSLByPluginId(pluginId);
      if (!tslProperties) return;
      this.dataSrcOptions = tslProperties;
      this.form.deviceId = deviceId;
    }
  }
}
</script>

<style scoped>
::v-deep .el-collapse-item__content {
  padding: 10px 0 20px 14px;
}
.el-select {
  padding: 10px 0 0 0;
}
</style>