<!-- 文本配置面板 -->
<template>
  <div>
    <el-row style="margin: 20px 0 20px 0">
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">名称</el-col>
      <el-col :span="18"><el-input size="mini" v-model="form.name"></el-input></el-col>
    </el-row>
<!--    <el-row>-->
<!--      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">尺寸</el-col>-->
<!--      <el-col :span="18" style="display: block">-->
<!--        <el-input size="mini" >-->
<!--          <template slot="prepend">宽</template>-->
<!--        </el-input>-->
<!--        <el-input size="mini">-->
<!--          <template slot="prepend">高</template>-->
<!--        </el-input>-->
<!--      </el-col>-->
<!--    </el-row>-->

    <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">

      <el-collapse-item title="信息" name="info">
        <el-row>
          <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">文本</el-col>
          <el-col :span="18"><el-input size="mini" v-model="form.text"></el-input></el-col>
        </el-row>
      </el-collapse-item>


      <el-collapse-item title="数据源" name="source">
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
      </el-collapse-item>



    </el-collapse>

<!--    <el-collapse class="el-dark-collapse" style="padding:10px;" v-model="activeNames">-->

<!--      &lt;!&ndash; 名称 &ndash;&gt;-->
<!--      <el-collapse-item title="图表" name="chart">-->
<!--        <div class="component-item" v-for="(component, index) in chartList" :key="index">-->
<!--          <vue-drag :option="component" :type="component.type" @click="handleComponentClicked" :index="'chart' + component.name">-->
<!--            <el-image  :style="defaultStyle" :src="component.image_src"></el-image>-->
<!--          </vue-drag>-->
<!--        </div>-->
<!--      </el-collapse-item>-->

<!--    </el-collapse>-->
  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"
import PluginAPI from "@/api/plugin"

export default {
  name: "TextConfig",
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
        console.log("====TextConfig", newValue);
        this.form = JSON.parse(JSON.stringify(newValue));
        if (this.form.casValue) {
          this.handleChangeOptions(this.form.casValue);
        }
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
    async handleChangeOptions(v) {
      let checkedNodes = this.$refs.cascaderRef.getCheckedNodes();
      let node = checkedNodes ? checkedNodes[0] : null;

      let deviceId = null;
      let pluginId = null;
      if (!node && v) {
        // 如果不是手动选择节点
        pluginId = await getPluginIdFromCasOptions(this.casOptions, v);
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
      let tslProperties = await getPluginTSLByPluginId(pluginId);
      if (!tslProperties) return;
      this.dataSrcOptions = tslProperties;
      this.form.deviceId = deviceId;
      this.form.mapping = "";
    }
  }
}

/**
 * 通过 项目/分组/设备 获得设备的插件id
 * @param casOptions
 * @param v
 * @returns {Promise<unknown>}
 */
const getPluginIdFromCasOptions = (casOptions, v) => {
  return new Promise((resolve, reject) => {
    if (v.length < 3) return null;
    casOptions.forEach(business => {
      // 从项目里找级联菜单的一级节点
      if (business.business_id == v[0]) {
        if (!business.children) reject(null);
        business.children.forEach(group => {
          // 从分组里找二级节点
          if (group.group_id == v[1]) {
            if (!group.children) resolve(null);
            group.children.forEach(device => {
              if (device.device_id == v[2]) {
                console.log("找到3级节点", device.plugin_id)
                resolve(device.plugin_id)
              } else {
                resolve(null);
              }
            })
          } else {
            resolve(null);
          }
        })
      }
    })
  })

}

/**
 * 通过 插件Id 获得插件的物模型
 * @param pluginId
 * @returns {Promise<unknown>|null}
 */
const getPluginTSLByPluginId = (pluginId) => {
  if (!pluginId) return null;
  return new Promise((resolve, reject) => {
    PluginAPI.page({ id: pluginId, current_page: 1, per_page: 10 })
        .then(({ data }) => {
          if (data.code == 200 || data.code == "200") {
            let jsonData = data.data.data.length > 0 ? data.data.data[0] : "{}"
            let jsonObj = JSON.parse(jsonData.chart_data);
            let { tsl } = jsonObj;
            resolve(tsl.properties);
          } else {
            resolve(null)
          }
        })
        .catch(() => reject(null))
  })

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