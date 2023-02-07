<template>
  <!-- begin::Page loader -->
  <div class="page-loader page-loader-logo">
     <img alt="Logo" :src="logo" width="110" />
      <!-- <div class="spinner" v-bind:class="spinnerClass || 'spinner-primary'">正在加载中...</div> -->
	   <div class="spinner1">{{ $t('LOGIN.LOADING') }}</div>
  </div>
  <!-- end::Page Loader -->
</template>

<script>
export default {
  name: "Loader",
  props: {
    logo: String,
    spinnerClass: String
  }
};
</script>
