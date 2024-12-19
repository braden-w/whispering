<script module lang="ts">
	export const confirmationDialog = createConfirmationDialog();

	function createConfirmationDialog() {
		let isOpen = $state(false);
		let title = $state('');
		let subtitle = $state('');
		let onConfirm = () => {};
		let onCancel = () => {};
		return {
			get isOpen() {
				return isOpen;
			},
			set isOpen(v) {
				isOpen = v;
			},
			get title() {
				return title;
			},
			get subtitle() {
				return subtitle;
			},
			get onConfirm() {
				return onConfirm;
			},
			get onCancel() {
				return onCancel;
			},
			open(dialog: {
				title: string;
				subtitle: string;
				onConfirm: () => void;
				onCancel: () => void;
			}) {
				title = dialog.title;
				subtitle = dialog.subtitle;
				onConfirm = dialog.onConfirm;
				onCancel = dialog.onCancel;
				isOpen = true;
			},
			close() {
				isOpen = false;
			},
		};
	}
</script>

<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
</script>

<AlertDialog.Root bind:open={confirmationDialog.isOpen}>
	<AlertDialog.Content class="sm:max-w-xl">
		<AlertDialog.Header>
			<AlertDialog.Title>{confirmationDialog.title}</AlertDialog.Title>
			<AlertDialog.Description>
				{confirmationDialog.subtitle}
			</AlertDialog.Description>
		</AlertDialog.Header>

		<AlertDialog.Footer>
			<AlertDialog.Cancel
				onclick={() => {
					confirmationDialog.onCancel();
					confirmationDialog.close();
				}}>Cancel</AlertDialog.Cancel
			>
			<AlertDialog.Action
				onclick={() => {
					confirmationDialog.onConfirm();
					confirmationDialog.close();
				}}
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
