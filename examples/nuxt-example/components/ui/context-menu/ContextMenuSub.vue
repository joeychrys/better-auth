<script setup lang="ts">
import {
	type ContextMenuSubEmits,
	type ContextMenuSubProps,
	useForwardPropsEmits,
} from "radix-vue";

const props = defineProps<ContextMenuSubProps>();
const emits = defineEmits<ContextMenuSubEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ContextMenuSub v-bind="forwarded">
    <slot />
  </ContextMenuSub>
</template>
