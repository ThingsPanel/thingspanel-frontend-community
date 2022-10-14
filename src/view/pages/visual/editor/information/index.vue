<template>
  <el-tabs class="el-dark-tabs" v-model="tabValue" @tab-click="handleTabClick">
    <el-tab-pane label="数据" name="data">
      <el-form class="el-dark-input" :model="formData">

        <el-form-item label="名称">
          <el-input class="el-dark-input" v-model="formData.name" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item label="数据源">
          <div v-for="(map, index) in formData.mapping" :key="index">
            <el-input class="el-dark-input" v-model="formData.mapping[index]" :disabled="true"></el-input>
          </div>
        </el-form-item>
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="样式" name="style"></el-tab-pane>
  </el-tabs>
</template>

<script>
import bus from "@/core/plugins/eventBus"

const config = {
  "config": [
    {
      "type": "select",
      "dataKey": "FunctionCode",
      "label": "功能码",
      "options": [
        {"label": "01读线圈状态", "value": 1},
        {"label": "02读线圈状态", "value": 2},
        {"label": "03读线圈状态", "value": 3},
        {"label": "04读线圈状态", "value": 4}
      ],
      "placeholder": "请选择功能码",
      "validate": {"required": true, "message": "功能码不能为空"}
    },
    {
      "type": "input",
      "dataKey": "Interval",
      "label": "读取策略",
      "placeholder": "请输入时间间隔，单位s",
      "validate": {"type": "number", "rules": "/^\\d{1,}$/", "required": true, "message": "读取策略不能为空"}
    },
    {
      "type": "input",
      "dataKey": "DeviceAddress",
      "label": "设备地址",
      "placeholder": "请输入设备地址",
      "validate": {"type": "number", "rules": "/^\\d{1,}$/", "required": true, "message": "设备地址不能为空"}
    },
    {
      "type": "input",
      "dataKey": "StartingAddress",
      "label": "起始地址",
      "placeholder": "请输入起始地址",
      "validate": {"type": "number", "rules": "/^\\d{1,}$/", "required": true, "message": "起始地址不能为空"}
    },
    {
      "type": "input",
      "dataKey": "AddressNum",
      "label": "地址数量",
      "placeholder": "请输入地址数量",
      "validate": {"type": "number", "rules": "/^\\d{1,}$/", "required": true, "message": "地址数量不能为空"}
    },
    {
      "type": "select",
      "dataKey": "DataType",
      "label": "功数据类型",
      "options": {
        "int16": "int16-2",
        "uint16": "uint16-2",
        "int32": "int32-4",
        "uint32": "uint32-4",
        "int64": "int64-8"
      },
      "placeholder": "请选择数据类型",
      "validate": {"required": true, "message": "数据类型不能为空"}
    },
    {
      "type": "input",
      "dataKey": "Key",
      "label": "属性别名",
      "placeholder": "请输入属性别名",
      "validate": {"type": "string", "required": true, "message": "属性别名不能为空"}
    }
  ]
}
export default {
  name: "EditorInformation",
  data() {
    return {
      tabValue: "data",
      component: {},
      formData: {}
    }
  },
  mounted() {
    bus.$on('share', val => {
      this.component = val;
      this.formData = val;
      console.log(this.component)
    })
  },
  methods: {
    handleTabClick() {

    }
  }
}
</script>

<style scoped>

</style>