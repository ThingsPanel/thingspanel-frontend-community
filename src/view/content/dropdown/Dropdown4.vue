<template>
  <b-dropdown
    size="sm"
    variant="link"
    toggle-class="custom-v-dropdown btn btn-sm font-weight-bolder px-5 py-3"
    v-bind:class="btnClass ? btnClass : 'btn-light'"
    no-caret
    right
    no-flip
    text="Create"
  >
    <!--begin::Navigation-->
    <div class="navi navi-hover" style="width: 250px;">
      <b-dropdown-text tag="div" class="navi-header pb-1">
        <span class="text-primary text-uppercase font-weight-bold"
          >Add new:</span
        >
      </b-dropdown-text>
      <b-dropdown-text tag="div" class="navi-item">
        <a href="#" class="navi-link">
          <span class="navi-icon">
            <i class="flaticon2-graph-1"></i>
          </span>
          <span class="navi-text">Order</span>
        </a>
      </b-dropdown-text>
      <b-dropdown-text tag="div" class="navi-item">
        <a href="#" class="navi-link">
          <span class="navi-icon">
            <i class="flaticon2-calendar-4"></i>
          </span>
          <span class="navi-text">Event</span>
        </a>
      </b-dropdown-text>
      <b-dropdown-text tag="div" class="navi-item">
        <a href="#" class="navi-link">
          <span class="navi-icon">
            <i class="flaticon2-layers-1"></i>
          </span>
          <span class="navi-text">Report</span>
        </a>
      </b-dropdown-text>
      <b-dropdown-text tag="div" class="navi-item">
        <a href="#" class="navi-link">
          <span class="navi-icon">
            <i class="flaticon2-calendar-4"></i>
          </span>
          <span class="navi-text">Post</span>
        </a>
      </b-dropdown-text>
      <b-dropdown-text tag="div" class="navi-item">
        <a href="#" class="navi-link">
          <span class="navi-icon">
            <i class="flaticon2-file-1"></i>
          </span>
          <span class="navi-text">File</span>
        </a>
      </b-dropdown-text>
    </div>
    <!--end::Navigation-->
  </b-dropdown>
</template>

<style lang="scss">
.custom-v-dropdown {
  &.dropdown-toggle {
    padding: 0;
    &:hover {
      text-decoration: none;
    }

    &.dropdown-toggle-no-caret {
      &:after {
        content: none;
      }
    }
  }

  &.dropdown-menu {
    margin: 0;
    padding: 0;
    outline: none;
    .b-dropdown-text {
      padding: 0;
    }
  }
}
</style>

<script>
export default {
  name: "dropdown-4",
  props: {
    btnClass: String
  },
  components: {},
  mounted() {}
};
</script>
