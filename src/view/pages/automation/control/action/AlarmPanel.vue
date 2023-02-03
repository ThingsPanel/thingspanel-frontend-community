<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 13:36:48
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-03 13:54:47
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\alarm\AlarmPanel.vue
 * @Description: 
-->
<template>
    <div>
  <!--    <el-form label-position="right" label-width="85px">-->
        <el-form-item label="告警级别">
            <el-select style="width: 100px;" v-model="formData.priority">
                <el-option label="低" :value="'low'"></el-option>
                <el-option label="中" :value="'medium'"></el-option>
                <el-option label="高" :value="'hight'"></el-option>
              </el-select>
        </el-form-item>

        <el-form-item label="通知用户">
          <div style="display: flex;margin-bottom: 10px" v-for="(group, index) in formData.groups" :key="index">
  
            <el-select style="width: 100px;margin-right:10px" v-model="group.role">
              <el-option label="角色" :value="'role1'"></el-option>
            </el-select>

            <el-select style="width: auto;margin-left: 10px;margin-right:10px" multiple v-model="group.users">
                <el-option label="用户1" :value="'user1'"></el-option>
              </el-select>
  
            <!-- 新增一行 -->
            <el-button type="indigo" size="small" style="margin-left: auto"
                       v-if="index == 0"
                       @click="handleAddGroup">新增一行</el-button>
  
            <!-- 删除 -->
            <el-button type="danger" size="small" style="margin-left: auto"
                       v-if="index > 0"
                       @click="handleDeleteGrouop(group)">删除</el-button>
  
          </div>
        </el-form-item>
  
  <!--    </el-form>-->
    </div>
  </template>
  
  <script>
  export default {
    name: "AlarmPanel",
    components: {  },
    data() {
      return {
        formData: {
            groups: [
                {}
            ]
        }
      }
    },
    methods: {
    
    }
  }
  </script>
  
  <style scoped>
  
  </style>