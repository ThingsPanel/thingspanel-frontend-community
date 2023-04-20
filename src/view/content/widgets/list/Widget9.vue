<template>
  <!--begin::List Widget 9-->
  <div class="card card-custom card-stretch gutter-b">
    <!--begin::Header-->
    <div class="card-header border-0">
      <h3 class="card-title font-weight-bolder text-dark">{{ $t("COMMON.OPERATIONLOG") }}</h3>
    </div>
    <!--end::Header-->

    <!--begin::Body-->
    <div class="card-body max-height">
      <div class="timeline timeline-5">
        <template v-for="(item, i) in list">
          <!--begin::Item-->
          <div class="timeline-item align-items-start" v-bind:key="i">
            <!--begin::Label-->
            <div
              class="timeline-label font-weight-bolder text-dark-75 font-size-lg pr-3 text-date"
            >
              {{ item.created_at }}
            </div>
            <!--end::Label-->

            <!--begin::Badge-->
            <div class="timeline-badge">
              <i class="icon-xxl fa fa-genderless text-success" ></i>
            </div>
            <!--end::Badge-->

            <!--begin::Text-->
            <div class="timeline-content text-dark-50 d-flex">
              <span class="text-white"
                v-html="item.describe"
              ></span>
            </div>
            <!--end::Text-->
          </div>
          <!--end::Item-->
        </template>
      </div>
      <!--end: Items-->
    </div>
    <!--end: Card Body-->
  </div>
  <!--end: Card-->
  <!--end: List Widget 9-->
</template>
<style scoped>
  .max-height{
    max-height: 260px;
    overflow-y: auto;
    margin-bottom: 20px;
  }
</style>
<script>
import Dropdown2 from "@/view/content/dropdown/Dropdown2.vue";
import { mapGetters } from "vuex";
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";
import {local_url} from "../../../../api/LocalUrl";

export default {
  name: "widget-9",
  data() {
    return {
      list: []
    };
  },
  components: {
    Dropdown2
  },
  created(){
    this.operation();
  },
  methods:{
      operation() {
          ApiService.post(local_url+"api/operation/index")
              .then(({ data }) => {
                  console.log('操作日志');
                  console.log(data);
                  if (data.code == 200) {
                      this.list = data.data;
                  }else if(data.code == 401){
                      this.$store
                          .dispatch(REFRESH)
                          .then(() => {});
                  }else{

                  }
              });
      }
  },
  computed: {
    ...mapGetters(["layoutConfig"])
  }
};
</script>
