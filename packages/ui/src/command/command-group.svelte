<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { Command as CommandPrimitive, useId } from 'bits-ui';

	let {
		children,
		class: className,
		heading,
		ref = $bindable(null),
		value,
		...restProps
	}: CommandPrimitive.GroupProps & {
		heading?: string;
	} = $props();
</script>

<CommandPrimitive.Group
	bind:ref
	data-slot="command-group"
	class={cn('text-foreground overflow-hidden p-1', className)}
	value={value ?? heading ?? `----${useId()}`}
	{...restProps}
>
	{#if heading}
		<CommandPrimitive.GroupHeading
			class="text-muted-foreground px-2 py-1.5 text-xs font-medium"
		>
			{heading}
		</CommandPrimitive.GroupHeading>
	{/if}
	<CommandPrimitive.GroupItems {children} />
</CommandPrimitive.Group>
