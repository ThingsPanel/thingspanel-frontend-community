<template>
    <div style="display: flex">
      <el-select style="width: 100px;margin-right:10px" v-model="formData.group.id">
        <el-option v-for="(option, index) in options" :key="index" :label="option.device_group" :value="option.id"></el-option>
      </el-select>
<!--      <DeviceSelector v-if="formData.groupId" :data="formData" :option="option"/>-->
    </div>
</template>

<script>
import DeviceSelector from "./DeviceSelector";
import {device_group_drop} from "@/api/asset";
export default {
  name: "GroupSelector",
  components: {
    DeviceSelector
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
    id: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      value: "",
      options: [],
      formData: {}
    }
  },
  watch: {
    data: {
      handler(newValue) {
        this.formData = JSON.parse(JSON.stringify(this.data));
        this.getGroupList(newValue);
      },
      immediate: true
    },
    "formData.groupId": {
      handler() {
        this.$emit("update:data", this.formData);
      }
    }
  },
  methods: {
    /**
     * 获取设备分组
     * @param id  项目id
     */
    getGroupList(id) {
      device_group_drop({business_id: id})
        .then(({data}) => {
          if (data.code == 200) {
            this.options = data?.data || [];
          }
        })
    }
  }
}
</script>

<style scoped>

</style>