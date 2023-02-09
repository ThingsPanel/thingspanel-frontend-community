<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-07 11:04:52
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-07 11:07:19
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\alarm\AlramDetail.vue
 * @Description: 告警详情
-->

<template>
    <el-dialog
        :title="'告警详情'"
        class="el-dark-dialog"
        :close-on-click-modal="false"
        :visible.sync="dialogVisible"
        width="60%"
        height="60%"
        top="10vh"
    >
      <el-form label-position="left" label-width="85px">
        <el-form-item label="告警内容">
          <el-input v-model="formData.content"></el-input>
        </el-form-item>
  

  
        <div class="text-right">
          <el-button size="medium" type="cancel" @click="handleCancel">取消</el-button>
        </div>
      </el-form>
    </el-dialog>
  </template>
  
  <script>
  export default {
    name: "AlarmDetail",
    props: {
      data: {
        type: [Object],
        default: ""
      },
      visible: {
        type: [Boolean],
        default: false
      }
    },
    data() {
      return {
        formData: {}
      }
    },
    computed: {
      dialogVisible: {
        get() { 
          return this.visible;
        },
        set(val) {
          this.$emit("update:visible", val);
        }
      }
    },
    watch: {
      visible: {
        handler(newValue) {
          
        }
      }
    },
    methods: {
      handleCancel() {
        
      }
    }
  }
  </script>
  
  <style scoped>
  
  </style>