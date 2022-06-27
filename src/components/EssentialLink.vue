<template>
  <q-drawer :value="drawerIsOpen" @input="drawerToggled">
    Some Content
  </q-drawer>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "EssentialLink",
  props: {
    title: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
      default: "",
    },

    link: {
      type: String,
      default: "#",
    },

    icon: {
      type: String,
      default: "",
    },
  },
  methods: {
    drawerToggled() {
      this.$q.bex
        .send("wb.drawer.toggle", {
          open: this.drawerIsOpen, // So it knows to make it bigger / smaller
        })
        .then((r) => {
          // Only set this once the promise has resolved so we can see the entire slide animation.
          this.drawerIsOpen = !this.drawerIsOpen;
        });
    },
  },
});
</script>
