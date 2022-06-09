<template>
<div class="rounded card p-4 el-table-transparent">
  新增业务
  <EditBusinessForm></EditBusinessForm>
</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import EditBusinessForm from "@/view/pages/business/EditBusinessForm";

export default defineComponent({
  name: "EditBusinessPage",
  components: {
    EditBusinessForm
  },
  setup(){

  }
})
</script>

<style scoped>

</style>