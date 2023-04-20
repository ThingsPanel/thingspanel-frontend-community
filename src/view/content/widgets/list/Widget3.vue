<template>
  <!--begin::List Widget 4-->
  <div class="card card-custom card-stretch gutter-b">
    <!--begin::Header-->
    <div class="card-header border-0">
      <h3 class="card-title font-weight-bolder text-dark">{{ $t("COMMON.WARNINFO") }}</h3>
    </div>
    <!--end::Header-->
    <!--begin::Body-->
    <div class="card-body max-height">
      <template v-for="(item, i) in list">
        <!--begin::Item-->
        <div class="d-flex align-items-center mb-10" v-bind:key="i">
          <!--begin::Symbol-->
          <div class="symbol symbol-40 symbol-light-danger mr-5">
            <span class="symbol-label">
              <inline-svg
                src="media/svg/icons/General/Shield-disabled.svg"
                class="h-100 align-self-end"
              ></inline-svg>
            </span>
          </div>
          <!--end::Symbol-->
          <!--begin::Text-->
          <div class="d-flex flex-column flex-grow-1 font-weight-bold">
            <a href="#" class="text-dark text-hover-primary mb-1 font-size-lg">
              {{ item.describe }}
            </a>
            <span class="text-muted">
              {{ item.created_at }}
            </span>
          </div>
          <!--end::Text-->
        </div>
        <!--end::Item-->
      </template>
    </div>
    <!--end::Body-->
  </div>
  <!--end: List Widget 4-->
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
import Dropdown4 from "@/view/content/dropdown/Dropdown4.vue";
import { mapGetters } from "vuex";
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import { REFRESH } from "@/core/services/store/auth.module";

export default {
  name: "widget-3",
  data() {
    return {
      list: []
    };
  },
  components: {
    Dropdown2,
    Dropdown4
  },
  created(){
      this.warning();
  },
  methods:{
      warning() {
          ApiService.post(AUTH.local_url+"/warning/index")
              .then(({ data }) => {
                  console.log('告警信息');
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
