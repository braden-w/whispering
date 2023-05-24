<script lang="ts">
  import "./style.css"

  import Toaster from "svelte-french-toast/dist/components/Toaster.svelte"

  import IndexPage from "~pages/IndexPage.svelte"
  import SetupPage from "~pages/SetupPage.svelte"

  import { currentRoute } from "./lib/stores/currentRoute"
</script>

<div>
  {#if $currentRoute === "/"}
    <IndexPage />
  {:else if $currentRoute === "/setup"}
    <SetupPage />
  {/if}
  <Toaster />
</div>
