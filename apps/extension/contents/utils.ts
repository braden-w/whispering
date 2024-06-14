import { sendToBackground } from '@plasmohq/messaging';
import { Effect } from 'effect';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';
import type * as ToggleRecording from '../background/messages/toggleRecording';
import { cva } from 'class-variance-authority';

export const toggleRecordingFromContentScript = () =>
	Effect.tryPromise({
		try: () =>
			sendToBackground<ToggleRecording.RequestBody, ToggleRecording.ResponseBody>({
				name: 'toggleRecording',
			}),
		catch: (error) =>
			new WhisperingError({
				title: `Unable to toggle recording via background service worker`,
				description:
					error instanceof Error
						? error.message
						: 'There was likely an issue sending the message to the background service worker from the contentscript.',
				error,
			}),
	}).pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise);

export const buttonVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
	{
		variants: {
			variant: {
				default:
					'bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90',
				destructive:
					'bg-red-500 text-slate-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90',
				outline:
					'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50',
				secondary:
					'bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
				ghost:
					'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
				link: 'text-slate-900 underline-offset-4 hover:underline dark:text-slate-50',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);
