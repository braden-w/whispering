<script lang="ts">
	import { cn } from '../../../utils';
	import type { HTMLAttributes } from 'svelte/elements';

	type $$Props = HTMLAttributes<HTMLDivElement> & {
		pulseSpeed?: string;
	};

	let className: $$Props['class'] = undefined;
	export let pulseSpeed: string = '2s';
	export { className as class };
</script>

<div
	class={cn('bg-muted animate-pulse rounded-md', className)}
	style="--pulse-speed: {pulseSpeed};"
	{...$$restProps}
/>

<style>
	.animate-pulse {
		animation: pulse var(--pulse-speed, 2s) cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
