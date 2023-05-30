<script lang="ts">
	import './style.css';
	import { onMount } from 'svelte';
	import Toaster from 'svelte-french-toast/dist/components/Toaster.svelte';
	import OptionsPage from '~pages/OptionsPage.svelte';

	onMount(() => navigator.mediaDevices.getUserMedia({ audio: true }));
</script>

<div>
	<OptionsPage />
	<Toaster />
</div>
