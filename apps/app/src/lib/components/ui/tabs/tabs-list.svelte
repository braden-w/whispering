<script lang="ts">
import { cn } from '$lib/utils.js';
import { Tabs as TabsPrimitive } from 'bits-ui';

type $$Props = TabsPrimitive.ListProps;

let className: $$Props['class'] = undefined;
export { className as class };
</script>

<TabsPrimitive.List
	class={cn(
		"bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1",
		className
	)}
	{...$$restProps}
>
	<slot />
</TabsPrimitive.List>
