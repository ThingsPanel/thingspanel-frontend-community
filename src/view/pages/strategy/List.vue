<template>
  <div class="rounded p-4 card no-border v-application my-v-input" data-app="true">
    <v-data-table
      :headers="headers"
      :hide-default-header="hideheader"
      :items="desserts"
      sort-by="calories"
      class="no-bg text-white"
      hide-default-footer
    >
      <template v-slot:header="{ props: { headers } }">
        <thead>
          <tr>
            <th
              v-for="(header, h) in headers"
              class="text-white"
              :class="h == 3 ? 'text-center width-300' : ''"
            >
              {{ $t(header.text) }}
            </th>
          </tr>
        </thead>
      </template>
      <template v-slot:item.name="{ item }">
        <router-link
          :to="{ path: 'strlist', query: { id: item.id } }"
          class="text-white"
          >{{ item.name }}</router-link
        >
      </template>
      <template v-slot:top>
        <v-toolbar flat color="" class="no-bg text-white">
          <v-toolbar-title class="font-size-h3 font-weight-bolder">{{
            $t("COMMON.LIST")
          }}</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <div style="display: flex; flex-direction: row">
          <v-btn
            color="primary"
            class="mr-4"
            small
            @click="hitsclick(3, item.name, item.id, 'alarmlist')"
            >{{ $t("COMMON.ALARMSTRATEGY") }}</v-btn
          >
          <v-btn
            color="primary"
            class="mr-4"
            small
            @click="hitsclick(2, item.name, item.id, 'strlist')"
            >{{ $t("COMMON.CONTROLSTRATRGY") }}</v-btn
          >
        </div>
      </template>
    </v-data-table>
    <v-pagination
      v-if="length > 1"
      class="float-right pt-2"
      v-model="page"
      :length="length"
      :page="page"
      :total-visible="10"
      @input="pageChange"
    ></v-pagination>
    <div style="clear: both"></div>
  </div>
</template>
<style scoped>
.v-application .text-start {
  text-align: center !important;
}
table td {
  vertical-align: middle;
}
.v-application {
  display: block;
}
.v-middle-80 {
  line-height: 80px;
}
.v-pagination .primary {
  background-color: #1867c0 !important;
  border-color: #1867c0 !important;
}
</style>

<script>
import { mapState } from "vuex";
import { REGISTER } from "@/core/services/store/auth.module";
import { UPDATE_USER } from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
import Hits from "@/assets/js/components/com.js";
import { dateFormat } from "../../../utils/tool.js";
export default {
  data: () => ({
    hideheader: true,
    seen: true,
    length: 3,
    circle: false,
    disabled: false,
    /*nextIcon: "navigate_next",
            nextIcons: ["mdi-chevron-right", "mdi-arrow-right", "mdi-menu-right"],
            prevIcon: "navigate_before",
            prevIcons: ["mdi-chevron-left", "mdi-arrow-left", "mdi-menu-left"],*/
    limit: 10,
    page: 1,
    valid: true,
    dialog: false,
    passdialog: false,
    headers: [
      {
        text: "COMMON.NO",
        class: "text-white",
        align: "start",
        sortable: false,
        value: "no",
      },
      { text: "COMMON.NAMES", class: "text-white", value: "name" },
      { text: "COMMON.TIMES", class: "text-white", value: "datetime" },
      {
        text: "COMMON.OPERATION",
        class: "text-white",
        align: "right",
        value: "actions",
        sortable: false,
      },
    ],
    desserts: [],
    editedIndex: -1,
    editedItem: {
      name: "",
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
    },
    defaultItem: {
      name: "",
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
    },
  }),

  computed: {
    ...mapState({
      errors: (state) => state.auth.errors,
    }),
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
    passdialog(val) {
      val || this.close();
    },
  },

  created() {
    // this.initialize();
    this.ajaxdata();
  },

  methods: {
    /*initialize () {
              this.desserts = [{no:1,name:"东升大厦",datetime:'2020-02-12'},{no:2,name:"东升大厦",datetime:'2020-02-12'}];
            },*/
    ajaxdata() {
      ApiService.post(AUTH.local_url + "/asset/work_index", {
        work_name: "",
        page: this.page,
        limit: this.limit,
      }).then(({ data }) => {
        console.log("业务列表");
        console.log(data);
        if (data.code == 200) {
          var arr = [];
          for (var i = 0; i < data.data.data.length; i++) {
            var obg = {};
            obg.no = i + 1;
            obg.id = data.data.data[i]["id"];
            obg.name = data.data.data[i]["name"];
            obg.datetime = dateFormat(data.data.data[i]["created_at"]);
            obg.is_device = data.data.data[i]["is_device"];
            console.log(obg);
            arr.push(obg);
          }
          // this.length = data.data.last_page;
          this.length = Math.ceil(data.data.total / data.data.per_page);
          this.page = data.data.current_page;

          this.desserts = arr;
          console.log(arr);
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },

    editItem(item) {
      this.seen = false;
      this.editedIndex = this.desserts.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
    },

    deleteItem(item) {
      this.editedItem = Object.assign({}, item);
      const id = this.editedItem.id;
      var con = confirm(this.$t("COMMON.TITLE4"));
      if (con == true) {
        ApiService.post(AUTH.local_url + "/asset/work_delete", { id: id }).then(
          ({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.ajaxdata();
            }
          }
        );
      }
    },

    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },

    pageChange() {
      this.ajaxdata();
    },

    onSubmit() {
      if (this.editedIndex > -1) {
        // 编辑
        Object.assign(this.desserts[this.editedIndex], this.editedItem);
        const id = this.editedItem.id;
        const name = this.editedItem.name;
        console.log(id);
        var val = this.$refs.form.validate();
        if (val == true) {
          ApiService.post(AUTH.local_url + "/asset/work_edit", {
            work_name: name,
            id: id,
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.ajaxdata();
            }
          });
          this.close();
        }
      } else {
        // 新增
        const name = this.editedItem.name;
        console.log(name);
        var val = this.$refs.form.validate();
        if (val == true) {
          ApiService.post(AUTH.local_url + "/asset/work_add", {
            work_name: name,
          }).then(({ data }) => {
            console.log(data);
            if (data.code == 200) {
              this.ajaxdata();
            }
          });
          this.close();

          // this.desserts.push(this.editedItem)
        }
      }
    },

    hitsclick(type, name, id, url) {
      console.log("点击事件");
      var obj = {};
      obj.id = id;
      console.log(Hits);
      Hits.clicknum(type, name, obj);
      this.$router.push({ path: url, query: { id: id } });
    },
  },
};
</script>
