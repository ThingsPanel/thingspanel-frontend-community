<template>
  <!--begin::List Widget 9-->
  <div class="card card-custom card-stretch gutter-b">
    <!--begin::Header-->
    <div class="card-header align-items-center border-0 mt-3 px-6">
      <h3 class="card-title align-items-start flex-column">
        <span class="font-weight-bolder text-dark">
          {{ $t("COMMON.QUICKGUIDE") }}
        </span>
        <span class="text-muted mt-3 font-weight-bold font-size-sm">{{
          $t("COMMON.TXT1")
        }}</span>
      </h3>

      <div class="width-100 mt-2 mb-5">
        <!-- <router-link
                to="/list"
                v-slot="{ href, navigate, isActive, isExactActive }"
        >
          <a :href="href" class="btn mr-3 btn-primary active" @click="navigate">
            {{ $t("COMMON.BUT1") }}
          </a>
        </router-link> -->
        <a
          href="http://wiki.thingspanel.cn/"
          target="_blank"
          class="btn mr-3 btn-success active"
          >{{ $t("COMMON.VIEWHELP") }}</a
        >
        <a
          href="http://forum.thingspanel.cn/"
          target="_blank"
          class="btn mr-3 btn-success active"
          >{{ $t("COMMON.FEEDBACKQ") }}</a
        >
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
    ...mapGetters(["layoutConfig"])
  }
};
</script>
