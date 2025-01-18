import { ClipboardService } from '$lib/services';
import { toast } from '$lib/services/toast';
import { createMutation } from '@tanstack/svelte-query';

export const useCopyTextToClipboard = () =>
	createMutation(() => ({
		mutationFn: async (text: string) => {
			const result = await ClipboardService.setClipboardText(text);
			return result;
		},
	}));

export const useCopyTextToClipboardWithToast = () =>
	createMutation(() => ({
		mutationFn: async ({
			label,
			text,
		}: {
			label: 'transcribed text' | 'transcribed text (joined)' | 'code';
			text: string;
		}) => {
			const result = await ClipboardService.setClipboardText(text);
			if (!result.ok) {
				toast.error({
					title: `Error copying ${label} to clipboard`,
					description: result.error.description,
					action: { type: 'more-details', error: result.error },
				});
				return result;
			}
			toast.success({
				title: `Copied ${label} to clipboard!`,
				description: text,
				descriptionClass: 'line-clamp-2',
			});
			return result;
		},
	}));

export const useWriteTextToCursor = () =>
	createMutation(() => ({
		mutationFn: async (text: string) => {
			const result = await ClipboardService.writeTextToCursor(text);
			return result;
		},
	}));
