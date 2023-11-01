<template>
  <v-container class="firmware card card-custom">
    <v-row no-gutters>
      <v-col cols="12" md="3">
        <div class="pb-4 pt-2">
          <CreateDialog></CreateDialog>
          <v-btn class="mx-1" color="indigo" dark>导入产品</v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <v-data-table
          class="v-table-transparent"
          :headers="headers"
          :items="data_list"
          hide-default-footer
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon small class="mr-2" color="white" @click="editItem(item)">
              mdi-pencil
            </v-icon>
            <v-icon small color="white" @click="deleteItem(item)">
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">确认要删除此项吗?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDelete">取消</v-btn>
          <v-btn color="blue darken-1" text @click="deleteItemConfirm"
            >确定</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineComponent, ref } from "@vue/composition-api";
import data from "./data";
import useFirmwareDelete from "./useFirmwareDelete";
import CreateDialog from "./CreateDialog.vue";

export default defineComponent({
  components: {
    CreateDialog,
  },
  setup() {
    // table 表头
    let headers = ref([
      { text: "固件名称", value: "firmware_name", sortable: false },
      { text: "归属产品", value: "product", sortable: false, aligen: "center" },
      {
        text: "固件版本",
        value: "firmware_version",
        sortable: false,
        align: "center",
      },
      {
        text: "创建时间",
        value: "created_at",
        sortable: false,
        align: "center",
      },
      { text: "操作", value: "actions", sortable: false, align: "end" },
    ]);
    // 数据
    let data_list = ref(data);

    // 编辑
    function editItem(item) {
    }

    // 删除操作
    let { dialogDelete, deleteItem, deleteItemConfirm, closeDelete } =
      useFirmwareDelete(data_list);

    return {
      headers,
      data_list,
      editItem,
      deleteItem,
      dialogDelete,
      closeDelete,
      deleteItemConfirm,
    };
  },
});
</script>
