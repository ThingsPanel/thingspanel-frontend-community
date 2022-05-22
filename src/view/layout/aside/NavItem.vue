<template>
  <v-list-item :to="item.link" :key="item.link">
    <v-list-item-icon>
      <v-icon v-text="item.icon"></v-icon>
    </v-list-item-icon>
    <v-list-item-title>
      <v-list-item-title v-text="$t(item.name)"></v-list-item-title>
    </v-list-item-title>
  </v-list-item>
</template>

<script>
export default {
  name: "NavItem",
  props:{
    item: {
      required: true
    }
  }
}
</script>

<style scoped>

</style>