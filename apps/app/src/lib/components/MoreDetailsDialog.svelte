<script module lang="ts">
	export const moreDetailsDialog = (() => {
		let isOpen = $state(false);
		let title = $state<string>('');
		let description = $state<string>('');
		let content = $state<unknown>(null);
		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(value: boolean) {
				isOpen = value;
			},
			get title() {
				return title;
			},
			get description() {
				return description;
			},
			get content() {
				if (typeof content === 'string') {
					return content;
				}
				if (content instanceof Error) {
					return content.message;
				}
				return JSON.stringify(content, null, 2);
			},
			open: ({
				title,
				description,
				content,
			}: {
				title: string;
				description: string;
				content: unknown;
			}) => {
				content = e;
				isOpen = true;
			},
		};
	})();
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<Dialog.Root bind:open={moreDetailsDialog.isOpen}>
	<Dialog.Content class="sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>{moreDetailsDialog.title}</Dialog.Title>
			<Dialog.Description>{moreDetailsDialog.description}</Dialog.Description>
		</Dialog.Header>
		<pre
			class="bg-muted relative whitespace-pre-wrap break-words rounded p-4 pr-12 font-mono text-sm">{moreDetailsDialog.content}</pre>
	</Dialog.Content>
</Dialog.Root>
