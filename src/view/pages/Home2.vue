<template>
  <div class="homes rounded">
    <el-row>
      <el-col :span="18">

        <div class="overview-container">
          <overview class="overview" icon="el-icon-menu" :value="38">设备总数</overview>
          <overview class="overview" icon="el-icon-chat-dot-square" :value="74">消息总数</overview>
          <overview class="overview" icon="el-icon-cpu" :value="20.8">CPU占用率</overview>
          <overview class="overview" icon="el-icon-postcard" :value="45">内存占用率</overview>
        </div>

        <div class="curve-container">
          <CurveWidget></CurveWidget>
        </div>

      </el-col>
      <el-col :span="6">

        <!-- 快捷指南 -->
        <div class="quick-guide">
          <ListWidget10></ListWidget10>
        </div>


      </el-col>
    </el-row>
  </div>
</template>
<style>
.clear {
  clear: both;
}
</style>
<style scoped>
.overview-container {
  display: flex;
}
.overview {
  margin:10px;
}
.quick-guide {
  margin-top: 10px;
}
.guidbtn {
  /*background: #5B92FF;padding: 15px 15px;*/
  color: #fff;
  border-radius: 4px; /*font-size: 15px;font-weight: bolder;*/
}
.font-des {
  font-size: 12px;
  font-weight: 100;
  color: #a8c5ff;
}
.arrowicon {
  margin-left: 20px;
  color: #2a45c5;
  font-size: 25px;
  position: relative;
  bottom: 3px;
}
</style>
<script>
import Overview from "@/view/content/widgets/home/Overview.vue"
import CurveWidget from "@/view/content/widgets/home/CurveWidget.vue"

// import MixedWidget2 from "@/view/content/widgets/mixed/Widget2.vue";
// import MixedWidget3 from "@/view/content/widgets/mixed/Widget3.vue";
// import MixedWidget4 from "@/view/content/widgets/mixed/Widget4.vue";
// import ListWidget3 from "@/view/content/widgets/list/Widget3.vue";
import ListWidget10 from "@/view/content/widgets/list/Widget10.vue";
// import ListWidget9 from "@/view/content/widgets/list/Widget9.vue";

import { REFRESH } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";

import ApiService from "@/core/services/api.service";
export default {
  name: "home",
  data: () => ({
    isshowguide: false,
    guidlist: [],
  }),
  components: {
    Overview,CurveWidget,
    // MixedWidget2,
    ListWidget10,
    // ListWidget9,
    // ListWidget3,
    // MixedWidget3,
    // MixedWidget4,
  },
  created() {
    this.ajaxdata();
  },
  methods: {
    ajaxdata() {
      ApiService.post(AUTH.local_url + "/asset/work_index", {
        work_name: "",
        page: 1,
      }).then(({ data }) => {
        console.log("获取业务数据");
        console.log(data);
        if (data.code == 200) {
          if (data.data.data.length > 0) {
            this.isshowguide = true;
            this.getguidlist();
          }
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },

    getguidlist() {
      ApiService.post(AUTH.local_url + "/navigation/list", {
        work_name: "",
      }).then(({ data }) => {
        console.log("指南列表");
        console.log(data);
        if (data.code == 200) {
          this.guidlist = data.data;
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
        }
      });
    },
  },
};
</script>
