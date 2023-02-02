<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="value">
      <el-option-group v-for="group in options" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value"></el-option>
      </el-option-group>
<!--      <el-option v-for="(option, index) in options" :key="index" :label="option.label" :value="option.value"></el-option>-->
    </el-select>

    <!-- 在线持续时间 -->
    <OnlineDuration v-if="value=='onlineDuration'"/>
    <!-- 操作符 -->
    <OperatorSelector v-else-if="value!=''" :option="option" :property="property"/>

  </div>
</template>

<script>
import OperatorSelector from "./OperatorSelector";
import OnlineDuration from "./OnlineDuration";
import PluginAPI from "@/api/plugin"
export default {
  name: "StateSelector",
  components: {
    OperatorSelector, OnlineDuration
  },
  props: {
    option: {
      type: [Object],
      default: () => { return { }}
    },
    pluginId: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      value: "",
      options: [],
      property: {}
    }
  },
  watch: {
    pluginId: {
      handler(newValue) {
        if (newValue) {
          this.getProperties(newValue);
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 查询插件物模型属性
     * @param id
     */
    getProperties(id) {
      let params = {current_page: 1, per_page: 10, id };
      PluginAPI.page(params)
        .then(({data}) => {
          if (data.code == 200) {
            const jsonStr = data.data?.data[0].chart_data || "{}";
            let jsonObj = JSON.parse(jsonStr);
            // 物模型属性
            let properties = jsonObj.tsl?.properties || [];
            let arr = properties.map(item => {
              return { label: item.title, value: item.name };
            });
            this.options = [];
            if (this.option.operator) {
              this.options.push({label: "状态", options: [{ label: "在线状态", value:"onlineDuration" }]});
            }
            this.options.push({label: "属性", options: arr});
            console.log("====getProperties", this.options)

          }
        })
    }
  }
}
</script>

<style scoped>

</style>