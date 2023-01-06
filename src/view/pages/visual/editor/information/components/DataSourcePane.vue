<!-- 数据源面板 -->
<template>
  <div style="text-align: center;padding-left: 14px;">
      <div v-for="(form, index) in formsData" :key="index" style="text-align: center">
        <div style="display: inline-flex">
          <div style="display: block">
            <el-cascader :ref="'cascaderRef_' + index" class="el-cascader" size="mini"
                         :options="casOptions"  v-model="form.casValue"
                         filterable @change="v => handleChangeOptions({...form, index}, v)" placeholder="请选择设备">
              <template slot-scope="{ node, data }">
                <span>{{ data.label }}</span>
                <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                <span v-if="data.device_id">({{ data.plugin_id ? "已绑定" : "未绑定" }})</span>
              </template>
            </el-cascader>
            <el-select size="mini" placeholder="请选择数据源" v-model="form.property" value-key="name" @change="handleChangeMap">
              <el-option v-for="(item, index) in form.dataSrcOptions"  :key="'option_' + index"
                         :value="item" :label="item.title">
              </el-option>
            </el-select>
          </div>

          <el-button type="border" size="mini" icon="el-icon-delete" @click="handleDelete(index)"></el-button>
        </div>

        <el-divider></el-divider>
      </div>

    <el-button class="add-button" type="blue" size="small" @click="handleAdd">添加数据源</el-button>
  </div>

</template>

<script>
import Call from "../call";
import {message_error} from "@/utils/helpers";
export default {
  name: "DataSourcePane",
  props: {
    casOptions: {
      type: [Object, Array],
      default: () => []
    },
    dataSrc: {
      type: [Array],
      default: () => []
    },
    mapping: {
      type: [Array, String],
      default: () => [""]
    },
    limit: {
      type: [Number],
      default: 0
    }
  },
  data() {
    return {
      formsData: [],
    }
  },
  watch: {
    dataSrc: {
      handler(newValue) {
        this.formsData = JSON.parse(JSON.stringify(newValue));
        console.log("====DataSourcePane.dataSrc", this.formsData)
        this.formsData.forEach((form, index) => {
          console.log("====DataSourcePane.dataSrc", form, index)
          this.handleChangeOptions({ ...form, index }, form.casValue)
        })
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 添加数据源
     */
    handleAdd() {
      if (this.limit === 0) {
        this.formsData.push({ casValue: "", property: {} })
      } else if (this.formsData.length  == 0) {
        this.formsData.push({ casValue: "", property: {} })
      } else {
        message_error("该组件只能添加一个数据源！")
      }
    },
    /**
     * 删除数据源
     * @param form
     */
    handleDelete(index) {
      this.formsData.splice(index, 1)
      this.handleChangeMap();
    },
    /**
     * 选择数据源后触发
     */
    handleChangeMap() {
      console.log("====handleChangeMap.formsData", this.formsData)
      let mapping = this.formsData.map(form => form.property.name);
      this.$emit("update:mapping", mapping);

      let data = this.formsData.map(form => {
        let { casValue, deviceId, property } = form;
        return { casValue, deviceId, property }
      })
      this.$emit("select", data, mapping);
    },
    /**
     * 级联菜单改变时的回调
     * @param v
     * @returns {Promise<void>}
     */
    async handleChangeOptions(form, v) {

      let checkedNodes = this.$refs["cascaderRef_" + form.index][0].getCheckedNodes();
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
      let tmp = JSON.parse(JSON.stringify(form));
      tmp.dataSrcOptions = tslProperties;
      tmp.deviceId = deviceId;
      delete tmp.index;
      this.formsData.splice(form.index, 1, tmp);
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
.add-button {
  margin-top: 10px;
  width: 193px;
}

.el-divider.el-divider--horizontal {
  margin-top: 10px!important;
  width: 190px!important;
  background-color: #464E5F;;
}
button.el-button.el-button--border.el-button--mini {
  height: 28px;
  line-height: 28px;
  padding: 0 7px;
  margin-left: 4px;
}
</style>