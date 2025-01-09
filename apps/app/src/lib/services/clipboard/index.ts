import { toast } from '$lib/services/toast';
import { wrapServiceWithMutation } from '..';
import type { ClipboardService } from './ClipboardService';

export const createClipboardFns = (ClipboardService: ClipboardService) =>
	wrapServiceWithMutation({
		...ClipboardService,
		copyTextToClipboardWithToast: async ({
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

		writeTextToCursorWithToast: async ({ text }: { text: string }) => {
			const result = await ClipboardService.writeTextToCursor(text);
			if (!result.ok) {
				toast.error({
					title: 'Unable to paste text from clipboard',
					description: result.error.description,
					action: { type: 'more-details', error: result.error },
				});
				return result;
			}
			toast.success({
				title: 'Pasted text from clipboard!',
				description: text,
				descriptionClass: 'line-clamp-2',
			});
			return result;
		},
	});
