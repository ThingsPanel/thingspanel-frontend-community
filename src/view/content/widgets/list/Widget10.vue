
<template>
  <!--begin::List Widget 9-->
  <div class="card card-custom card-stretch gutter-b mb-4.5">
    <!--begin::Header-->
    <div class="card-header align-items-center border-0 mt-2 px-6">
      <h3 class="card-title align-items-start flex-column">
        <span class="font-weight-bolder text-dark">
          {{ $t("HOME.GETTING_STARTED") }}
        </span>
        <span class="text-muted mt-3 font-weight-bold font-size-sm">{{
          $t("HOME.TEXT1")
        }}</span>
      </h3>

      <div class="width-100 mt-2 mb-5">
        <a target="_blank" href="http://thingspanel.io/docs/quick_start" class="btn mr-3 btn-success active">{{ $t("HOME.QUICK_START") }}</a>
        <a target="_blank" href="http://thingspanel.io" class="btn mr-3 btn-success active">{{ $t("HOME.VIEWHELP") }}</a>
        <a target="_blank" href="https://github.com/ThingsPanel" class="btn mr-3 btn-success active">{{ $t("HOME.FEEDBACKQ") }}</a>
      </div>
    </div>
  </div>
  <!--end: Card-->
  <!--end: List Widget 9-->
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "widget-9",
  data() {
    return {};
  },
  computed: {
    ...mapGetters(["layoutConfig"]),
  },
};
</script>
