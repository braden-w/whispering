<script lang="ts">
	import { Textarea } from '@repo/ui/textarea';
	import { Button } from '@repo/ui/button';

	let {
		value = $bindable(''),
		onSubmit,
		disabled = false,
		placeholder = 'Type your message...',
	}: {
		value?: string;
		onSubmit: () => void;
		disabled?: boolean;
		placeholder?: string;
	} = $props();

	function handleKeyDown(e: KeyboardEvent) {
		// Submit on Enter (without shift)
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (!disabled && value.trim()) {
				onSubmit();
			}
		}
	}

	function handleSubmit() {
		if (!disabled && value.trim()) {
			onSubmit();
		}
	}
</script>

<div class="flex gap-2">
	<Textarea
		bind:value
		{placeholder}
		{disabled}
		onkeydown={handleKeyDown}
		class="min-h-[80px] resize-none"
		rows={3}
	/>
	<Button
		onclick={handleSubmit}
		{disabled}
		size="icon"
		class="h-[80px] w-[80px]"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M22 2L11 13" />
			<path d="M22 2L15 22L11 13L2 9L22 2Z" />
		</svg>
	</Button>
</div>
