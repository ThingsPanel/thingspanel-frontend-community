<template>
  <!--begin::Mixed Widget 2-->
  <div class="card card-custom card-stretch gutter-b">
    <!--begin::Header-->
    <div class="card-header border-0 py-5">
      <h3 class="card-title font-weight-bolder">
        {{ $t("COMMON.STATE") }}
      </h3>
    </div>
    <!--end::Header-->
    <!--begin::Body-->
    <div class="card-body p-0 position-relative overflow-hidden">
      <!--begin::Stats-->
      <div class="card-spacer">
        <!--begin::Row-->
        <div class="row">
          <div class="col-md-4">
            <div class=" bg-dblue px-6 py-8 rounded-xl mb-5">
              <router-link to="/list">
                <div class="float-right">
                  <a
                    href="#"
                    class="text-white font-weight-bold font-size-h1 d-block mb-7"
                  >
                    {{business}}
                  </a>
                  <a
                    href="#"
                    class="text-white font-weight-bold font-size-h6 mt-2"
                  >
                    {{ $t("COMMON.BUSINESS") }}
                  </a>
                </div>
                <span class="svg-icon svg-icon-6x svg-icon-primary d-block my-2">
                  <inline-svg src="media/svg/icons/General/Duplicate.svg" />
                </span>
              </router-link>
            </div>
          </div>
          <div class="col-md-4">
            <div class="bg-dblue px-6 py-8 rounded-xl mb-5">
              <router-link to="/strategy/list">
                <div class="float-right">
                  <a
                    href="#"
                    class="text-white font-weight-bold font-size-h1 d-block mb-7"
                  >
                    {{conditions}}
                  </a>
                  <a
                    href="#"
                    class="text-white font-weight-bold font-size-h6 mt-2"
                  >
                    {{ $t("COMMON.STRATEGY") }}
                  </a>
                </div>
                <span class="svg-icon svg-icon-6x svg-icon-danger d-block my-2">
                  <inline-svg src="media/svg/icons/Shopping/Money.svg" />
                </span>
              </router-link>
            </div>
          </div>
          <div class="col-md-4">
            <div class="bg-dblue px-6 py-8 rounded-xl mb-5">
              <router-link to="/chart/list">
                <div class="float-right">
                  <a
                    href="#"
                    class="text-white font-weight-bold font-size-h1 d-block mb-7"
                  >
                    {{dashboard}}
                  </a>
                  <a
                    href="#"
                    class="text-white font-weight-bold font-size-h6 mt-2"
                  >
                    {{ $t("COMMON.VISUALIZATION") }}
                  </a>
                </div>
                <span class="svg-icon svg-icon-6x svg-icon-warning d-block my-2">
                  <inline-svg src="media/svg/icons/Design/Layers.svg" />
                </span>
              </router-link>
            </div>
          </div>
        </div>
        <!--end::Row-->
      </div>
      <!--end::Stats-->
      <!--end::Body-->
    </div>
    <!--end::Mixed Widget 2-->
  </div>
</template>

<script>
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import { REFRESH} from "@/core/services/store/auth.module";
export default {
  name: "widget-2",
  components: {},
  data() {
    return {
      business:'', //业务
      assets:'', //资产
      equipment:'', //设备
      conditions:'',
      dashboard:'',
    };
  },
  created() {
    this.ajaxdata();
  },
  methods:{
    ajaxdata() {
      ApiService.post(AUTH.local_url+"/index/device")
        .then(({ data }) => {
          console.log('首页');
          console.log(data);
          if (data.code == 200) {
            this.business = data.data.business;
            this.assets = data.data.assets;
            this.equipment = data.data.equipment;
            this.conditions = data.data.conditions;
            this.dashboard = data.data.dashboard;
          }else if(data.code == 401){
            this.$store
            .dispatch(REFRESH)
            .then(() => {});
          }else{

          }
        });
    }
  }
};
</script>
