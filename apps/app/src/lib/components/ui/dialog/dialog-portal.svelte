<script lang="ts">
import type { Dialog as DialogPrimitive } from 'bits-ui';
type $$Props = DialogPrimitive.PortalProps;
</script>

<DialogPrimitive.Portal {...$$restProps}>
	<slot />
</DialogPrimitive.Portal>
