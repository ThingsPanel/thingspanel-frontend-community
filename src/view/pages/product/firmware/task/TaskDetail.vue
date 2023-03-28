<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 08:54:20
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-28 22:01:49
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\TaskDetail.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="3" v-for="(item, index) in stateList" :key="index">
            <widget :status="item.status" :value="item.count"  @click="handleSelectStatus"/>
        </el-col>
    </el-row>
    <div class="rounded card p-4 el-table-transparent el-dark-input text-white">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="6">
                <el-input placeholder="请输入设备名称" v-model="params.name"></el-input>
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
          <el-table-column :label="'设备编号'" prop="device_code" align="left" :show-overflow-tooltip="true"/>
  
          <!-- 设备名-->
          <el-table-column :label="'设备名'" prop="name" align="left"/>
  
          <!--  当前版本号 -->
          <el-table-column :label="'当前版本号'" prop="current_version" align="left"/>
  
          <!-- 目标版本号 -->
          <el-table-column :label="'目标版本号'" prop="target_version" align="left"/>
  
          <!-- 升级进度 -->
          <el-table-column :label="'升级进度'" prop="upgrade_progress" align="left">
            <template v-slot="scope">
               <el-progress :percentage="getProgress(scope.row.upgrade_progress)"></el-progress>
            </template>
          </el-table-column>
  
          <!-- 状态更新时间-->
          <el-table-column :label="'状态更新时间'" prop="status_update_time" align="left">
            <template v-slot="scope">
              {{ scope.row.status_update_time ? scope.row.status_update_time : "--"}}
            </template>
          </el-table-column>

          <!-- 状态:    0-待推送 1-已推送 2-升级中 3-升级成功 4-升级失败 5-已取消 -->
          <!-- 状态-->
          <el-table-column :label="'状态'" prop="upgrade_status" align="left">
            <template v-slot="scope">
              {{  upgradeState.getText(scope.row.upgrade_status) }}
            </template>
          </el-table-column>

          <!-- 状态详情-->
          <el-table-column :label="'状态详情'" prop="status_detail" align="left"/>
         
  
          <!-- 操作列-->
          <el-table-column align="center" :label="$t('PRODUCT_MANAGEMENT.PRODUCT_LIST.OPERATION')" width="180">
            <template v-slot="scope">
              <div class="text-center">
                
                <div v-if="scope.row.upgrade_status===upgradeState.failed[0] || scope.row.upgrade_status===upgradeState.cancelled[0]">
                  <!-- 升级失败, 重升级 -->
                  <el-popconfirm title="确定要重新升级吗？" @confirm="reUpgrading(scope.row)">
                    <!-- <el-button slot="reference" type="danger" 
                        v-loading="!!scope.row.isLoading" class="mr-1" size="mini">取消</el-button> -->
                        <el-button slot="reference" type="indigo" size="mini" class="mr-3"
                          v-loading="!!scope.row.isLoading">重升级</el-button>
                  </el-popconfirm>
                </div>
                
                
                <!-- 升级中，取消升级 -->
                <el-button type="indigo" size="mini" class="mr-3"
                  v-else-if="scope.row.status!==upgradeState.upgraded[0]"  
                  v-loading="!!scope.row.isLoading"
                  @click="cancelUpgrading(scope.row)">取消升级</el-button>
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
import Widget from './components/Widget.vue';
import OTAAPI from "@/api/ota"
import { UpgradeState } from "./Const"
export default {
  components: {Widget},
  props: {},
  data() {
    return {
        stateList: [],
        loading: false,
        tableData: [],
        params: {
            total: 0,
            current_page: 1,
            per_page: 10
        },
        upgradeState: UpgradeState,
        timer: null
    }
  },
  mounted() {
    this.params.ota_task_id = this.$route.query.taskId;
    this.getList();
    // 计时器
    this.timer = setInterval(() => {
      this.getList();
    }, 5000);
  },
  destroyed() {
    clearInterval(this.timer);
  },
  methods: {
    handleSelectStatus(status) {
      this.params.upgrade_status = status === "-1" ? "" : status;
      this.getList();
    },
    /**
     * @description: 获取列表
     * @return {*}
     */    
    getList() {
      this.loading = true;
      OTAAPI.taskDetailList(this.params)
        .then(({ data: result }) => {
          if (result.code === 200) {
            this.tableData = result.data?.data?.list || [];
            this.params.total = result.data.total;
            const arr = result.data?.data?.statuscount || [];
            this.computeStateList(arr);
          }
        }).finally(() => {
          this.loading = false;
        })
    },
    /**
     * @description: 获取进度
     * @param {*} value
     * @return {*}
     */    
    getProgress(value) {
      let progress = Number(value || 0);
      if (progress > 100) progress = 100;
      if (progress < 0) progress = 0;
      return progress;
    },
    /**
     * @description: 计算stateList的值
     * @return {*}
     */    
    computeStateList(arr) {
      this.stateList = [];
      // 所有状态
      const total = arr.reduce((total, item) => total += item.count, 0) || 0;

      // 遍历UpgradeState
      Object.keys(UpgradeState).forEach(item => {
        if (typeof UpgradeState[item] !== "function") {
          // 状态
          const status = UpgradeState[item][0];
          const index = arr.findIndex(item => item.upgrade_status === String(status));
          // 数量
          let count = (index >= 0 ? arr[index].count : 0)
          // 所有状态
          if (status === UpgradeState.all[0]) count = total;

          this.stateList.push({ status, count });
        }
      })
    },
    /**
     * @description: 重升级
     * @param {*} row
     * @return {*}
     */    
    reUpgrading(row) {
        this.modifyUpgradeStatus(row, UpgradeState.unpushed[0]);
    },
    /**
     * @description: 取消升级
     * @param {*} row
     * @return {*}
     */    
    cancelUpgrading(row) {
      this.modifyUpgradeStatus(row, UpgradeState.cancelled[0]);
    },
    // 状态:    0-待推送 1-已推送 2-升级中 3-升级成功 4-升级失败 5-已取消
    /**
     * @description: 
     * @param {*} row
     * @param {*} upgrade_status
     * @return {*}
     */    
    modifyUpgradeStatus(row, upgrade_status) {
      const data = {
        id: row.id,
        ota_task_id: row.ota_task_id,
        upgrade_status
      }
      row.isLoading = true;
      OTAAPI.modifyUpgradeStatus(data)
        .then(({ data: result }) => {
          this.getList();
        })
    }
  
  }
}
</script>
<style lang="scss" scoped>
</style>