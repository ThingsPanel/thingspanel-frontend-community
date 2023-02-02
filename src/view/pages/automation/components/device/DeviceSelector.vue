<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="value" value-key="device" @change="handleDeviceChange">
      <el-option v-for="(option, index) in options" :key="index" :label="option.device_name" :value="option"></el-option>
    </el-select>

    <StateSelector v-if="value.device" :pluginId="value.type" :option="option"/>
  </div>


</template>

<script>
/*
  条件： 属性/在线状态/设定值

  命令： 属性
 */
import StateSelector from "./StateSelector";
import {getDeviceTree} from "@/api/device";
export default {
  name: "DeviceSelector",
  components: {
    StateSelector
  },
  props: {
    option: {
      type: [Object],
      default: () => { return { }}
    },
    id: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      value: "",
      options: []
    }
  },
  watch: {
    id: {
      handler(newValue) {
        if (newValue) {
          this.getDeviceList(newValue);
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 获取设备列表
     * @param groupId  分组id
     */
    getDeviceList(groupId) {
      const params = {
        current_page: 1,
        per_page: 9999,
        asset_id: groupId
      }
      getDeviceTree(params)
          .then(({data}) => {
            if (data.code == 200) {
              console.log("====", data.data)
              this.options = data.data?.data || [];
            }
          })
    },
    handleDeviceChange(v) {
      console.log("====handleDeviceChange", v)
    }
  }
}
</script>

<style scoped>

</style>