import { browser } from '$app/environment';
import type { Result } from '@epicenterhq/result';
import {
	type CreateMutationOptions,
	type CreateMutationResult,
	type FunctionedParams,
	QueryClient,
	createMutation,
} from '@tanstack/svelte-query';
import { settings } from '../stores/settings.svelte';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './SetTrayIconService';
import { createClipboardFns } from './clipboard';
import { createClipboardServiceDesktop } from './clipboard/ClipboardService.desktop';
import { createClipboardServiceWeb } from './clipboard/ClipboardService.web';
import { createDbDexieService } from './db/DbService.dexie';
import { createDownloadServiceDesktop } from './download/DownloadService.desktop';
import { createDownloadServiceWeb } from './download/DownloadService.web';
import { createHttpServiceDesktop } from './http/HttpService.desktop';
import { createHttpServiceWeb } from './http/HttpService.web';
import { createNotificationServiceDesktop } from './notifications/NotificationService.desktop';
import { createNotificationServiceWeb } from './notifications/NotificationService.web';
import { createRecorderServiceTauri } from './recorder/RecorderService.tauri';
import { createRecorderServiceWeb } from './recorder/RecorderService.web';
import { createPlaySoundServiceDesktop } from './sound/PlaySoundService.desktop';
import { createPlaySoundServiceWeb } from './sound/PlaySoundService.web';
import { toast } from './toast';
import { createTranscriptionServiceFasterWhisperServer } from './transcription/TranscriptionService.fasterWhisperServer';
import { createTranscriptionServiceGroqDistil } from './transcription/TranscriptionService.groq.distil';
import { createTranscriptionServiceGroqLarge } from './transcription/TranscriptionService.groq.large';
import { createTranscriptionServiceGroqTurbo } from './transcription/TranscriptionService.groq.turbo';
import { createTranscriptionServiceOpenAi } from './transcription/TranscriptionService.openai';
import { createTransformationFns } from './transformation/TransformationService';
import type { Recording } from './db';
import type { MaybePromise } from '@repo/shared';

type MutationResultFunction<
	TData = unknown,
	TError = unknown,
	TVariables = unknown,
> = (variables: TVariables) => MaybePromise<Result<TData, TError>>;

export type WrapServiceWithMutation<
	Service extends Record<string, MutationResultFunction>,
> = {
	[K in keyof Service]: Service[K] extends MutationResultFunction<
		infer TData,
		infer TError,
		infer TVariables
	>
		? {
				mutate: Service[K];
				createMutation: <TContext = unknown>(
					options: FunctionedParams<
						Exclude<
							CreateMutationOptions<TData, TError, TVariables, TContext>,
							'mutationFn'
						>
					>,
				) => CreateMutationResult<TData, TError, TVariables>;
			}
		: never;
};

const wrapWithMutation = <
	TData = unknown,
	TError = unknown,
	TVariables = unknown,
>(
	fn: MutationResultFunction<TData, TError, TVariables>,
) => {
	return {
		mutate: fn,
		createMutation: <TContext = unknown>(
			options: FunctionedParams<
				Exclude<
					CreateMutationOptions<TData, TError, TVariables, TContext>,
					'mutationFn'
				>
			>,
		) =>
			createMutation<TData, TError, TVariables, TContext>(() => {
				const optionValues = options();
				return {
					...optionValues,
					mutationFn: async (args) => {
						const result = await fn(args);
						if (!result.ok) throw result.error;
						return result.data;
					},
				};
			}),
	};
};

const wrapServiceWithMutation = <
	Service extends Record<string, MutationResultFunction<any, any, any>>,
>(
	service: Service,
) =>
	Object.fromEntries(
		Object.entries(service).map(([key, serviceFn]) => [
			key,
			wrapWithMutation(serviceFn),
		]),
	) as WrapServiceWithMutation<Service>;

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

// Services that are not determined by the user's settings, but by the platform.

export const DownloadService = wrapServiceWithMutation(
	window.__TAURI_INTERNALS__
		? createDownloadServiceDesktop()
		: createDownloadServiceWeb(),
);

export const NotificationService = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();

const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

const DbService = createDbDexieService({ queryClient });

const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

const PlaySoundService = window.__TAURI_INTERNALS__
	? createPlaySoundServiceDesktop()
	: createPlaySoundServiceWeb();

/**
 * Services that are determined by the user's settings.
 */
export const userConfiguredServices = (() => {
	const RecorderServiceTauri = createRecorderServiceTauri();
	const RecorderServiceWeb = createRecorderServiceWeb();

	return {
		download: {
			downloadRecordingWithToast: async (recording: Recording) => {
				if (!recording.blob) {
					toast.error({
						title: '⚠️ Recording blob not found',
						description: "Your recording doesn't have a blob to download.",
					});
					return;
				}
				const result = await DownloadService.downloadBlob({
					name: `whispering_recording_${recording.id}`,
					blob: recording.blob,
				});
				if (!result.ok) {
					toast.error({
						title: 'Failed to download recording!',
						description: 'Your recording could not be downloaded.',
						action: { type: 'more-details', error: result.error },
					});
					return;
				}
				toast.success({
					title: 'Recording downloading!',
					description: 'Your recording is being downloaded.',
				});
				return result;
			},
		},
		clipboard: createClipboardFns(ClipboardService),
		tray: SetTrayIconService,
		transformations: createTransformationFns({ HttpService, DbService }),
		db: DbService,
		get transcription() {
			switch (settings.value['transcription.selectedTranscriptionService']) {
				case 'OpenAI':
					return createTranscriptionServiceOpenAi({
						HttpService,
						settings: settings.value,
					});
				case 'Groq': {
					switch (settings.value['transcription.groq.model']) {
						case 'whisper-large-v3':
							return createTranscriptionServiceGroqLarge({
								HttpService,
								settings: settings.value,
							});
						case 'whisper-large-v3-turbo':
							return createTranscriptionServiceGroqTurbo({
								HttpService,
								settings: settings.value,
							});
						case 'distil-whisper-large-v3-en':
							return createTranscriptionServiceGroqDistil({
								HttpService,
								settings: settings.value,
							});
						default:
							return createTranscriptionServiceGroqLarge({
								HttpService,
								settings: settings.value,
							});
					}
				}
				case 'faster-whisper-server':
					return createTranscriptionServiceFasterWhisperServer({
						HttpService,
						settings: settings.value,
					});
				default:
					return createTranscriptionServiceOpenAi({
						HttpService,
						settings: settings.value,
					});
			}
		},
		get recorder() {
			if (settings.value['recorder.selectedRecorderService'] === 'Tauri') {
				return RecorderServiceTauri;
			}
			return RecorderServiceWeb;
		},
		sound: {
			playStartSoundIfEnabled: () => {
				if (settings.value['sound.playOnStartSuccess']) {
					void PlaySoundService.playSound('start');
				}
			},
			playStopSoundIfEnabled: () => {
				if (settings.value['sound.playOnStopSuccess']) {
					void PlaySoundService.playSound('stop');
				}
			},
			playCancelSoundIfEnabled: () => {
				if (settings.value['sound.playOnCancelSuccess']) {
					void PlaySoundService.playSound('cancel');
				}
			},
			playTranscriptionCompleteSoundIfEnabled: () => {
				if (settings.value['sound.playOnTranscriptionSuccess']) {
					void PlaySoundService.playSound('transcription-complete');
				}
			},
		},
	};
})();
