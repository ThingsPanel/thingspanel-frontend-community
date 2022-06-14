<template>
  <div class="card card-custom">
    <div class="pt-5 pl-3 pb-2">
      <div class="pt-2"></div>
      <TableTitle class="pl-4">设备日志</TableTitle>
    </div>

    <v-container class="equipment v-application">
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
  </div>
</template>

<script>
import { defineComponent, ref } from "@vue/composition-api";
import data from "./data";
import TableTitle from "@/components/common/TableTitle.vue"

export default defineComponent({
  name: "EquipmentIndex",
  components: {
    TableTitle
  },
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
