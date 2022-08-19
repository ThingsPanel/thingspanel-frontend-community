<template>
    <div class="content-form">
      <el-form :inline="true">
        <el-form-item style="width: 200px">
          <el-input style="width: 200px" clearable v-model="searchValue" placeholder="请输入插件名称"></el-input>
        </el-form-item>
      </el-form>

      <div class="width-20" v-for="item in listArr">
        <PluginCard :data="item" :isInstalled="true"></PluginCard>
      </div>
    </div>
</template>

<script>
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
import PluginCard from "./PluginCard";


export default {
  name: "Installed",
  components: {PluginCard},
  data() {
    return {
      list: [],
      listArr: [],
      searchValue: '',
      imgArr: [
        "media/logos/wsd.png",
        "media/logos/gps.png",
        "media/logos/switch.png",
        "media/logos/temperature.png",
        "media/logos/en.png",
        "media/logos/qxz.png",
        "media/logos/qxz.png",
        "media/logos/yy.png",
        "media/logos/switch.png",
      ]
    }
  },
  created() {
    this.loadInstalled();
  },
  watch: {
    searchValue(newVal) {
      this.debounce(this.searchPlugin, 500, newVal)
    }
  },
  methods: {
    loadInstalled() {
      ApiService.post(AUTH.local_url + "/markets/list").then(({data}) => {
        if (data.code == 200) {
          for (var i = 0; i < data.data.length; i++) {
            data.data[i]["img"] = this.imgArr[i];
          }
          this.list = data.data;
          this.listArr = data.data;
          console.log(this.listArr)
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {
          });
        } else {
        }
      });
    },
    searchPlugin(value) {
      if (value == "") {
        this.listArr = this.list;
      } else {
        this.listArr = this.list.filter(item => item.name.indexOf(this.searchValue) > -1);
      }
    },
    /**
     * 防抖
     * @param callback
     * @param delay
     * @param value
     */
    debounce: function (callback, delay, value) {
      if (timer == 1) return;
      setTimeout(() => timer = null, delay)
      timer = 1;
      callback(value);
    }
  }
}
let timer = null;
</script>

<style scoped>
.width-20 {
  width: 20%;
  display: inline-block;
  padding: 10px;
}
</style>