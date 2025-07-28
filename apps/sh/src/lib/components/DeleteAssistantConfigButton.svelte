<script lang="ts">
	import type { AssistantConfig } from '$lib/stores/assistant-configs.svelte';

	import { assistantConfigs } from '$lib/stores/assistant-configs.svelte';
	import * as AlertDialog from '@repo/ui/alert-dialog';
	import { Button } from '@repo/ui/button';
	import { Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { assistantConfig }: { assistantConfig: AssistantConfig } = $props();
	let open = $state(false);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Trigger>
		{#snippet child({ props })}
			<Button size="icon" variant="ghost" {...props}>
				<Trash2 class="h-4 w-4" />
			</Button>
		{/snippet}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete the assistant "{assistantConfig.name}".
				This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => {
					assistantConfigs.delete(assistantConfig.id);
					open = false;
					toast.success('Deleted assistant');
				}}>Delete</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
