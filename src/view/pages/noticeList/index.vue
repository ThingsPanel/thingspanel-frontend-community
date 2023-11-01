<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t("SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.NOTICERECORD") }}</TableTitle>
      </el-col>
    </el-row>

    <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
      <!--  日期筛选  -->
      <el-col :span="6">
        <el-date-picker class="w-100" v-model="params.dateTimeRange" :picker-options="DatePickerOptions"
          value-format="timestamp" @change="handleSearch()" @clear="handleSearch()" type="datetimerange"
          :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')" :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
          :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')">
        </el-date-picker>
      </el-col>

      <el-col :span="4">
        <el-select style="margin-right:10px" v-model="params.notification_type" :placeholder="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.PLACEHOLDER.RECORD_TYPE')" clearable @change="handleSearch">
          <el-option :value="0" :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.AII')"></el-option>
          <el-option :value="1" :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.SMS')"></el-option>
          <el-option :value="2" :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.EMAIL')"></el-option>
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-input
          v-model="params.receive_target"
          :placeholder="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.PLACEHOLDER.PLACEHOLDER')"
   
          clearable
          @keydown.enter.native="handleSearch()"
          @clear="handleSearch()">
      </el-input>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.SENDTIME')" prop="send_time" width="230px">
        <template v-slot="scope">
          {{ formatDate(scope.row.send_time) }}
        </template>
      </el-table-column>
        <el-table-column :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.SENDCONTENT')" prop="send_content" ></el-table-column>
        <el-table-column :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.RECIPIENT')" prop="send_target"  >

      </el-table-column>
      <el-table-column :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.SENDRESUIT')" prop="send_result" width="130px">
        <template v-slot="scope">
          <p class="table-describe mad" v-if="scope.row.send_result === 1">{{ $t('COMMON.SUCCESS') }}</p>
          <p class="table-describe mad" v-if="scope.row.send_result === 2">{{ $t('COMMON.FAILED') }}</p>
        </template>
      </el-table-column>
      <el-table-column :label="$t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.TYPE')" prop="notification_type" width="130px">
        <template v-slot="scope">
          <p v-if="scope.row.notification_type == 1">{{ $t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.SMS') }}</p>
          <p v-if="scope.row.notification_type == 2">{{ $t('SYSTEM_MANAGEMENT.NOTICERECORD_MANAGEMENT.EMAIL') }}</p>
        </template>
      </el-table-column>
      
      <template #empty>
        <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
      </template>
    </el-table>
    <!-- 表 end -->
    <div class="text-right py-3">
      <el-pagination background layout="prev, pager, next" 
        :total="total" 
        :current-page.sync="params.current_page"
        :page-size="params.per_page" 
        @current-change="getRecordList">
      </el-pagination>
    </div>

  </div>
</template>

<script>
const ProcessingState = {
  all: "all",
  unprocessed: "0",
  processed: "1",
  ignored: "2"
}
import TableTitle from "@/components/common/TableTitle.vue"

import {getList} from "@/api/noticelist";
import "@/core/mixins/common"
import { message_success } from "@/utils/helpers";
export default {
  name: "NoticeListIndex",
  components: { TableTitle, },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,

      params: {
        dateTimeRange: [],
        receive_target: "",
        notification_type: 0,
        start_time:0,
        end_time:0,
        current_page: 1,
        per_page: 10
      },
      DatePickerOptions: [],
      ProcessingState,
      detailDialogVisible: false,
      processDialogVisible: false,
      currentItem: {}
    }
  },
  created() {
    this.getRecordList();
  },
  methods: {
    /**
     * @description: 查询
     * @return {*}
     */    
    handleSearch() {
      if (this.params.dateTimeRange && this.params.dateTimeRange.length > 0 &&
        this.params.dateTimeRange[0] !== "" && this.params.dateTimeRange[1] !== "") {
        this.params.start_time = this.params.dateTimeRange[0].toString().substring(0, 10);
        this.params.end_time = this.params.dateTimeRange[1].toString().substring(0, 10);
        this.params.start_time = Number(this.params.start_time)
        this.params.end_time = Number(this.params.end_time)
      } else {
        delete this.params.start_time;
        delete this.params.end_time;
      }
      this.getRecordList();
    },
    /**
     * @description: 获取通知记录
     * @return {*}
     */ 
    getRecordList() {
      this.loading = true;
      getList(this.params)
        .then(({ data: result }) => {
          if (result.code === 200) {
            this.tableData = result.data?.data || [];
            this.total = result.data.total;
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
   
  }
}
</script>