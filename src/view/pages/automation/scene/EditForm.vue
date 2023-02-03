<template>
  <el-dialog
      :title="formData.id ? '编辑' : '新增'"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      width="60%"
      height="60%"
      top="10vh"
  >
    <el-form label-position="left" label-width="85px">
      <el-form-item label="场景标题">
        <el-input v-model="formData.name"></el-input>
      </el-form-item>

      <el-form-item label="场景描述">
        <el-input v-model="formData.describe"></el-input>
      </el-form-item>

      <el-form-item label="添加设备">
        <div style="" v-for="(item, index) in formData.commands" :key="index">
          <DeviceTypeSelector :data="item.data" :option="{operator: false}"/>
          <!-- 新增一行 -->
          <el-button type="indigo" size="small" style="margin-left: auto"
                     v-if="index == 0" @click="handleAddCommand">新增一行</el-button>
        </div>
      </el-form-item>


      <div class="text-right">
        <el-button size="medium" type="cancel" @click="handleSubmit">保存</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script>
import data from "./data"
import DeviceTypeSelector from "../components/device/DeviceTypeSelector.vue";
export default {
  name: "EditForm",
  components: { DeviceTypeSelector },
  props: {
    id: {
      type: [String],
      default: ""
    },
    visible: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      formData: {
        commands: [
          {}
        ]
      },
      dialogVisible: false
    }
  },
  watch: {
    visible: {
      handler(newValue) {
        if (newValue) {
          this.formData = {commands: [{}]};
          if (this.id) {
            this.formData = JSON.parse(JSON.stringify(data.find(item => item.id = this.id)));
          }
          console.log("====scene", this.formData)

        }
        this.dialogVisible = newValue;
      }
    }
  },
  methods: {
    handleAddCommand() {
      this.formData.commands.push({});
    },
    handleSubmit() {
      // this.dialogVisible = false;
      this.$emit("update:visible", false);
    }
  }
}
</script>

<style scoped>

</style>