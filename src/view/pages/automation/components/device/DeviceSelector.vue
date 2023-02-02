<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="formData.device" value-key="device" @change="handleDeviceChange">
      <el-option v-for="(option, index) in options" :key="index" :label="option.label" :value="option"></el-option>
    </el-select>

    <StateSelector v-if="formData.device" :data.sync="formData" :option="option"/>
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
    data: {
      type: [Object],
      default: () => { return { }}
    },
    option: {
      type: [Object],
      default: () => { return { }}
    },
  },
  data() {
    return {
      formData: {},
      options: [],
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          this.formData = JSON.parse(JSON.stringify(newValue));
          this.getDeviceList(newValue.groupId);
        }
      },
      immediate: true,
      deep: true
    },
    formData: {
      handler(newValue) {
        console.log("====device.formData", newValue)
        if (newValue) {
          this.$emit("update:data", newValue);
        }
      }
    }
  },
  methods: {
    /**
     * 获取设备列表
     * @param groupId  分组id
     */
    getDeviceList(groupId) {
      const params = {current_page: 1, per_page: 9999, asset_id: groupId}
      getDeviceTree(params)
          .then(({data}) => {
            if (data.code == 200) {
              let arr = data.data?.data || [];

              this.options = arr.map(item => {
                return {
                  label: item.device_name, value: item.device, pluginId: item.type
                }
              });

              console.log("====getDeviceList", this.options)

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