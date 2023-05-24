<script lang="ts">
  import "./style.css"

  import { onMount } from "svelte"
  import Toaster from "svelte-french-toast/dist/components/Toaster.svelte"

  import IndexPage from "~pages/IndexPage.svelte"
  import SetupPage from "~pages/SetupPage.svelte"

  import { currentRoute } from "./lib/stores/currentRoute"

  onMount(() => navigator.mediaDevices.getUserMedia({ audio: true }))
</script>

<div>
  {#if $currentRoute === "/"}
    <IndexPage />
  {:else if $currentRoute === "/setup"}
    <SetupPage />
  {/if}
  <Toaster />
</div>
