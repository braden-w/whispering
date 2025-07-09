<script lang="ts">
import svelteLogo from '../../assets/svelte.svg';
import Counter from '../../lib/Counter.svelte';
</script>

<main class="min-w-md">
  <div>
    <a href="https://wxt.dev" target="_blank" rel="noreferrer">
      <img src="/wxt.svg" class="logo" alt="WXT Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>WXT + Svelte</h1>

  <div class="card">
    <Counter />
  </div>

  <p class="read-the-docs">Click on the WXT and Svelte logos to learn more</p>
</main>
