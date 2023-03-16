<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 08:54:20
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-15 17:53:46
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\TaskDetail.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="3" v-for="(item, index) in stateList" :key="index">
            <widget :title="item.title" :value="item.value"/>
        </el-col>
    </el-row>
    <div class="rounded card p-4 el-table-transparent el-dark-input text-white">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="6">
                <el-input placeholder="请输入设备名称"></el-input>
            </el-col>
            <el-col :span="4">
                <el-button type="border" @click="getList">搜索</el-button>
            </el-col>
            <el-col :span="14" class="px-2 text-right">
                <el-button size="medium" type="border" @click="getList">刷新</el-button>
              </el-col>
        </el-row>

        <!-- 表 start -->
    <el-form class="inline-edit">
        <el-table :data="tableData" v-loading="loading">
  
          <!-- 设备编号-->
          <el-table-column :label="'设备编号'" prop="device_number" align="left"/>
  
          <!-- 设备名-->
          <el-table-column :label="'设备名'" prop="device_name" align="left"/>
  
          <!--  当前版本号 -->
          <el-table-column :label="'当前版本号'" prop="current_version" align="left"/>
  
          <!-- 目标版本号 -->
          <el-table-column :label="'目标版本号'" prop="target_version" align="left"/>
  
          <!-- 升级进度 -->
          <el-table-column :label="'升级进度'" prop="progress" align="left">
            <template v-slot="scope">
               <el-progress :percentage="scope.row.progress"></el-progress>
            </template>
          </el-table-column>
  
          <!-- 状态更新时间-->
          <el-table-column :label="'状态更新时间'" prop="status_updated" align="left">
            <template v-slot="scope">
              {{ scope.row.status_updated ? scope.row.status_updated : "--"}}
            </template>
          </el-table-column>

          <!-- 状态-->
          <el-table-column :label="'状态'" prop="status" align="left">
            <template v-slot="scope">
                <p v-if="scope.row.status===upgradeState.unupgraded">待升级</p>
                <p v-else-if="scope.row.status===upgradeState.upgrading">升级中</p>
                <p v-else-if="scope.row.status===upgradeState.upgraded">升级成功</p>
                <p v-else-if="scope.row.status===upgradeState.failed">升级失败</p>
            </template>
          </el-table-column>

          <!-- 状态详情-->
          <el-table-column :label="'状态详情'" prop="statusDetail" align="left"/>
         
  
          <!-- 操作列-->
          <el-table-column align="left" :label="$t('PRODUCT_MANAGEMENT.PRODUCT_LIST.OPERATION')" width="230">
            <template v-slot="scope">
              <div style="text-align: left">
                <!-- 待升级, 开始升级 -->
                <el-button v-if="scope.row.status===upgradeState.unupgraded" type="indigo" size="mini" class="mr-3" @click="startUpgrading(scope.row)">开始升级</el-button>
                <!-- 升级失败, 重升级 -->
                <el-button v-else-if="scope.row.status===upgradeState.failed" type="indigo" size="mini" class="mr-3" @click="reUpgrading(scope.row)">重升级</el-button>
                <!-- 升级中，取消升级 -->
                <el-button v-else-if="scope.row.status===upgradeState.upgrading" type="indigo" size="mini" class="mr-3" @click="cancelUpgrading(scope.row)">取消升级</el-button>
                
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <!-- 表 end -->
  
      <div class="text-right py-3">
        <el-pagination
            background
            layout="prev, pager, next"
            :total="params.total"
            :current-page.sync="params.current_page"
            :page-size="params.per_page"
            @current-change="getList"></el-pagination>
      </div>
    </div>


  </div>
</template>

<script>
/**
 * @description: 升级状态
 * @return {*}
 */
const UpgradeState = {
    // 待升级
    unupgraded: 0,
    // 升级中
    upgrading: 1,
    // 升级成功
    upgraded: 2,
    // 升级失败
    failed: 3,
    // 通过value获取key
    getKey: value => Object.keys(UpgradeState).find(key => UpgradeState[key] === value)
}
import Widget from './components/Widget.vue';
import { taskDetailData } from "./data"
export default {
  components: {Widget},
  props: {},
  data() {
    return {
        stateList: [
            { key: "all", title: "所有状态", value: 20 },
            { key: "", title: "待推送", value: 10 },
            { key: "", title: "已推送", value: 0 },
            { key: "unupgraded", title: "待升级", value: 0 },
            { key: "upgrading", title: "升级中", value: 5 },
            { key: "upgraded", title: "升级成功", value: 3 },
            { key: "failed", title: "升级失败", value: 2 }
        ],
        loading: false,
        tableData: [],
        params: {
            total: 0,
            current_page: 1,
            per_page: 10
        },
        upgradeState: UpgradeState
    }
  },
  watch: {
    tableData: {
        handler(newValue) {
            this.updateStateList();
        },
        deep: true
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    /**
     * @description: 获取列表
     * @return {*}
     */    
    getList() {
        this.tableData = JSON.parse(JSON.stringify(taskDetailData));
    },
    /**
     * @description: 开始升级
     * @param {*} row
     * @return {*}
     */    
    startUpgrading(row) {
        const fun = () => {
            if(row.progress >= 100) {
                clearInterval(timer);
                row.status = UpgradeState.upgraded;
                return;
            }
            row.status = UpgradeState.upgrading;
            row.progress++;
        }
        let timer = setInterval(fun, 100);
    },
    /**
     * @description: 取消升级
     * @param {*} row
     * @return {*}
     */    
    cancelUpgrading(row) {
        
    },
    updateStateList() {
        const arr = this.tableData;
        const stateList = this.stateList;
        const setStateList = state => {
            if (typeof state === "function") return;
            const count = arr.filter(item => item.status===state)?.length || 0;
            const key = UpgradeState.getKey(state);
            stateList.filter(item => item.key === key).forEach(item => item.value = count);
        };
        // 所有
        const total = this.tableData.length;
        // 待推送
        // this.tableData.filter
        // 已推送
        // arr.filter(item => item.status)
       
        Object.values(UpgradeState).forEach(value => setStateList(value));
    }
  }
}
</script>
<style lang="scss" scoped>
</style>