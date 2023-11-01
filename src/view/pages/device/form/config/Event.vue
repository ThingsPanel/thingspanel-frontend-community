
<template>
  <div>
    <div style="display: flex;float: left;margin-bottom: 10px">
      <span v-if="eventSubject!==''">设备上报事件主题: {{eventSubject}}</span>
    </div>
    <div style="display: flex;float: right;margin-bottom: 10px">
      <el-button type="border" size="medium" @click="getList">刷新</el-button>
    </div>
    <el-table :data="tableData" v-loading="loading">
      <el-table-column label="事件标识符" prop="event_identify" width="240"></el-table-column>
      <!-- <el-table-column label="事件名称" prop="event_name" width="auto"></el-table-column> -->

      <el-table-column label="事件上报时间" prop="report_time" width="160">
        <templace slot-scope="scope">
          {{ dateFormat(scope.row.report_time) }}
        </templace>
      </el-table-column>

      <el-table-column label="事件参数" prop="data" width="auto"></el-table-column>

    </el-table>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
        :page-size="params.per_page" @current-change="getList"></el-pagination>
    </div>
  </div>
</template>

<script>
import { getDeviceEventHistoryList } from '@/api/device';
import { dateFormat } from '@/utils/tool.js'  

export default {
  components: {},
  props: {
    device: {
      type: [Object],
      default: () => ({})
    }
  },
  data() {
    return {
      dateFormat: dateFormat,
      loading: false,
      tableData: [],
      total: 0,
      params: {
        current_page: 1,
        per_page: 10
      },
      eventSubject: 'device/event'
    }
  },
  mounted() {
    if (this.device.device_type === '1') {
      // 设备
      this.eventSubject = 'device/event';
    } else if (this.device.device_type === '2' && this.device.protocol === 'MQTT') {
      // 网关
      this.eventSubject = 'gateway/event';
    } else {
      this.eventSubject = '';
    }
    this.getList();
  },
  methods: {
    getList() {
      getDeviceEventHistoryList({ device_id: this.device.device, ...this.params })
        .then(({ data }) => {
          if (data.code === 200) {
            this.tableData = data.data.data;
            this.total = data.data.total;
          }
        })
        .catch(err => {
          console.log(err);
        })
    }
  }
}
</script>
<style lang="scss" scoped></style>