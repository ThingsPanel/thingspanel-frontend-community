<template>
  <v-list-item :to="item.path" :key="item.path">
    <v-list-item-icon>
      <v-icon v-text="'menu-icon ' + item.icon"></v-icon>
    </v-list-item-icon>
    <v-list-item-title>
      <v-list-item-title v-text="$t(item.title) ? $t(item.title) : item.title"></v-list-item-title>
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