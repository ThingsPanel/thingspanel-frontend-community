<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="formData.state" value-key="value" @change="handleStateChange">
      <el-option-group v-for="group in options" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item"></el-option>
      </el-option-group>
<!--      <el-option v-for="(option, index) in options" :key="index" :label="option.label" :value="option.value"></el-option>-->
    </el-select>

    <template v-if="formData.state">
      <!-- 在线持续时间 -->
      <OnlineDuration v-if="formData.state.mode=='onlineDuration'"/>
      <!-- 操作符 -->
      <OperatorSelector v-else-if="formData.state.mode == 'property'"
                        :data.sync="formData"
                        :option="option"
                        :property="formData.state"/>
    </template>
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
    data: {
      type: [Object],
      default: () => { return { }}
    },
    option: {
      type: [Object],
      default: () => { return { }}
    }
  },
  data() {
    return {
      options: [],
      formData: {
        state: {}
      },
      properties: {}
    }
  },
  watch: {
    data: {
      handler(newValue) {
        console.log("====state", newValue)
        if (newValue) {
          this.formData = JSON.parse(JSON.stringify(newValue));
          this.getProperties(newValue.device.pluginId);
        }
      },
      immediate: true,
      deep: true
    },
    formData: {
      handler(newValue) {
        console.log("====state.formData", newValue)
        if (newValue) {
          this.$emit("update:data", newValue);
        }
      }
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
              return { label: item.title, value: item.name, unit: item.unit, mode: "property" };
            });
            this.options = [];
            if (this.option.operator) {
              this.options.push({label: "状态", options: [{ mode: "onlineDuration", label: "在线状态", value: "onlineDuration" }]});
            }
            this.options.push({label: "属性", options: arr});
            console.log("====getProperties", this.options);
          }
        })
    },
    handleStateChange(v) {
      console.log("====handleStateChange", v)
      console.log("====handleStateChange", this.formData.state)
    }
  }
}
</script>

<style scoped>

</style>