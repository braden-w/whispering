<script lang="ts">
  import { type Route, goto } from "~lib/stores/currentRoute"

  export let href: Route
  let className: string = ""
  export { className as class }
</script>

<button on:click={() => goto(href)} class={className}>
  <slot />
</button>
