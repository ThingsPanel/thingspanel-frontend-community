<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 13:36:48
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 16:04:01
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\alarm\AlarmPanel.vue
 * @Description: 
-->
<template>
    <div>
  <!--    <el-form label-position="right" label-width="85px">-->
        <el-form-item label="告警级别" required>
            <el-select ref="warningLevelRef" style="width: 100px;" v-model="formData.warningLevel" @change="handleChange">
                <el-option label="低" :value="'1'"></el-option>
                <el-option label="中" :value="'2'"></el-option>
                <el-option label="高" :value="'3'"></el-option>
              </el-select>
        </el-form-item>

        <el-form-item label="通知用户">
          <div style="display: flex;margin-bottom: 10px" v-for="(group, index) in formData.groups" :key="index">
  
            <el-select style="width: 100px;margin-right:10px" v-model="group.role" @change="handleRoleChange">
              <el-option v-for="(role, index) in roleList" :key="index" :label="role.role_name" :value="role.id"></el-option>
            </el-select>

            <el-select style="width: auto;margin-left: 10px;margin-right:10px" multiple v-model="group.users" @change="handleChange">
              <el-option label="所有用户" :value="'all'"></el-option>

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

        <el-form-item label="重复次数">
          <el-input ref="repeatTimesRef" v-model="formData.repeatTimes" placeholder="告警达到重复次数才触发" @change="handleChange"></el-input>
        </el-form-item>

        <el-form-item label="通知方式" required>
          <el-checkbox-group v-model="formData.notification" @change="handleChange">
            <el-checkbox label="wechat">微信通知</el-checkbox>
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="phone">电话通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="告警描述">
          <el-input v-model="formData.warning_description" placeholder="告警描述" @change="handleChange"></el-input>
        </el-form-item>
  
  <!--    </el-form>-->
    </div>
  </template>
  
  <script>
  import { user_find_all_roles } from "@/api/user"
import { message_error } from '@/utils/helpers'
  export default {
    name: "AlarmPanel",
    components: {  },
    props: {
      data: {
        type: [Object],
        default: () => { return {} }
      }
    },
    data() {
      return {
        formData: {
            groups: [
                {}
            ],
            notification: []
        },
        roleList: []
      }
    },
    created() {
      this.getRoleList();
    },
    watch: {
      data: {
        handler(newValue) {
          if (newValue && JSON.stringify(newValue) !== "{}") {
            this.formData = JSON.parse(JSON.stringify(newValue));
            console.log("alarm.formData", this.formData)
            if (!this.formData.groups || this.formData.groups.length === 0) {
              this.formData.groups = [{}];
            }
          }
        }, immediate: true
      },
    },
    methods: {
      /**
       * @description: 新增用户组
       * @return {*}
       */      
      handleAddGroup() {
        this.formData.groups.push({});
      },
      /**
       * @description: 删除用户组
       * @param {*} group
       * @return {*}
       */
      handleDeleteGrouop(group) {
        let index = this.formData.groups.findIndex(item => item == group);
        this.formData.groups.splice(index, 1);
      },
      handleChange() {
        this.$emit("change", this.formData);
      },
      /**
       * @description: 根据角色id查询用户
       * @param {*} v
       * @return {*}
       */      
      handleRoleChange(v) {
        // 缺接口
        this.handleChange();
      },
      /**
       * @description: 获取角色列表
       * @return {*}
       */
      getRoleList() {
        user_find_all_roles({ current_page: 1, per_page: 36 })
        .then(({data}) => {
          if (data.code == 200) {
            this.roleList = data.data?.data || [];
          }
        })
      },
      validate() {
        if (!this.formData.warningLevel || this.formData.warningLevel === "") {
          this.$refs.warningLevelRef.focus();
          message_error("请选择告警级别！");
          return false;
        }
        // if (!this.formData.repeatTimes || this.formData.repeatTimes === "") {
        //   this.$refs.repeatTimesRef.focus();
        //   message_error("请输入重复次数！");
        //   return false;
        // }
        
        if (!this.formData.notification || this.formData.notification.length ===0) {
          message_error("请至少选择一个通知方式！");
          return false;
        }
        return true;
      }
    }
  }
  </script>
  
  <style scoped>
  
  </style>