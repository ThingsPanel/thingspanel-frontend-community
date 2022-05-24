<template>
  <v-container class="equipment card card-custom">
    <v-row no-gutters>
      <!-- 设备输入筛选 -->
      <v-col cols="12" md="3">
        <v-text-field
          class="pt-0 mx-2 my-v-input"
          v-model="search"
          label="设备名"
        ></v-text-field>
      </v-col>
      <!-- 日期选择器 -->
      <v-col cols="12" md="3">
        <v-menu
          v-model="datepicker"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              class="pt-0 mx-2 my-v-input"
              v-model="date_filter"
              label="日期范围"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="date_filter"
            no-title
            scrollable
            range
          ></v-date-picker>
        </v-menu>
      </v-col>
      <v-spacer></v-spacer>
      <!-- 查询按钮 -->
      <v-col cols="12" md="3">
        <div class="text-right mt-1">
          <v-btn class="mx-1">重置</v-btn>
          <v-btn class="mx-1" dark color="indigo">查询</v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12" sm="12">
        <!-- 表格 -->
        <v-data-table
          class="v-table-transparent"
          :headers="headers"
          :items="data_list"
          :search="search"
          hide-default-footer
        >
          <!-- 指令栏 -->
          <template v-slot:[`item.command`]="{ item }">
            <v-chip
              :color="item.command == '开' ? 'green' : 'orange'"
              small
              outlined
              >{{ item.device_status }}</v-chip
            >
          </template>

          <!-- 执行结果 -->
          <template v-slot:[`item.result`]="{ item }">
            <v-chip
              :color="item.result == '成功' ? 'green' : 'orange'"
              small
              outlined
              >{{ item.result }}</v-chip
            >
          </template>

          <!-- 设备返回状态 -->
          <template v-slot:[`item.device_status`]="{ item }">
            <v-chip
              :color="item.device_status == '开' ? 'green' : 'orange'"
              small
              outlined
              >{{ item.device_status }}</v-chip
            >
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent, ref } from "@vue/composition-api";
import data from "./data";

export default defineComponent({
  setup() {
    let headers = ref([
      { text: "时间", value: "time", sortable: false, align: "start" },
      { text: "业务名", value: "business", sortable: false, align: "center" },
      {
        text: "设备名",
        value: "device_name",
        sortable: false,
        align: "center",
      },
      { text: "设备id", value: "device_id", sortable: false, align: "center" },
      { text: "指令", value: "command", sortable: false, align: "center" },
      {
        text: "操作类型",
        value: "action_type",
        sortable: false,
        align: "center",
      },
      {
        text: "操作人/触发器",
        value: "operator",
        sortable: false,
        align: "center",
      },
      { text: "执行结果", value: "result", sortable: false, align: "center" },
      {
        text: "设备返回状态",
        value: "device_status",
        sortable: false,
        align: "center",
      },
    ]);

    let data_list = ref(data);
    let search = ref("");
    let datepicker = ref(false);
    let date_filter = ref([]);

    return {
      headers,
      data_list,
      search,
      datepicker,
      date_filter,
    };
  },
});
</script>

<style lang="scss">

</style>
