<script lang="ts">
import type { Select as SelectPrimitive } from 'bits-ui';

type $$Props = SelectPrimitive.TriggerProps;
type $$Events = SelectPrimitive.TriggerEvents;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<SelectPrimitive.Trigger
	class={cn(
		'border-input bg-background ring-offset-background focus-visible:ring-ring aria-[invalid]:border-destructive data-[placeholder]:[&>span]:text-muted-foreground flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
		className,
	)}
	{...$$restProps}
	let:builder
	on:click
	on:keydown
>
	<slot {builder} />
	<div>
		<ChevronDown class="h-4 w-4 opacity-50" />
	</div>
</SelectPrimitive.Trigger>
