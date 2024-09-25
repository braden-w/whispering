<script lang="ts">
import type { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

type $$Props = DropdownMenuPrimitive.RadioGroupProps;

export const value: $$Props['value'] = undefined;
</script>

<DropdownMenuPrimitive.RadioGroup {...$$restProps} bind:value>
	<slot />
</DropdownMenuPrimitive.RadioGroup>
