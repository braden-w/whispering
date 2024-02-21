<script lang="ts" context="module">
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import type { FormPath, SuperForm } from 'sveltekit-superforms';
	type T = Record<string, unknown>;
	type U = unknown;
</script>

<script
	lang="ts"
	generics="T extends Record<string, unknown ✂prettier:content✂="
	LCBVIGV4dGVuZHMgRm9ybVBhdGg8VD4iPgoJaW1wb3J0IHR5cGUgeyBIVE1MQXR0cmlidXRlcyB9IGZyb20gInN2ZWx0ZS9lbGVtZW50cyI7CglpbXBvcnQgKiBhcyBGb3JtUHJpbWl0aXZlIGZyb20gImZvcm1zbmFwIjsKCWltcG9ydCB7IGNuIH0gZnJvbSAiLi4vLi4vLi4vdXRpbHMiOwoKCXR5cGUgJCRQcm9wcyA9IEZvcm1QcmltaXRpdmUuRmllbGRQcm9wczxULCBVPiAmIEhUTUxBdHRyaWJ1dGVzPEhUTUxFbGVtZW50PjsKCglleHBvcnQgbGV0IGZvcm06IFN1cGVyRm9ybTxUPjsKCWV4cG9ydCBsZXQgbmFtZTogVTsKCglsZXQgY2xhc3NOYW1lOiAkJFByb3BzWyJjbGFzcyJdID0gdW5kZWZpbmVkOwoJZXhwb3J0IHsgY2xhc3NOYW1lIGFzIGNsYXNzIH07Cg="=""
></script>

<FormPrimitive.Field {form} {name} let:constraints let:errors let:tainted let:value>
	<div class={cn('space-y-2', className)}>
		<slot {constraints} {errors} {tainted} {value} />
	</div>
</FormPrimitive.Field>
