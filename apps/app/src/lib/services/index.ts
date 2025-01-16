import { browser } from '$app/environment';
import type { Result } from '@epicenterhq/result';
import type { MaybePromise, WhisperingSoundNames } from '@repo/shared';
import {
	type CreateMutationOptions,
	type CreateQueryOptions,
	type DefaultError,
	type FunctionedParams,
	type QueryKey,
	createMutation,
	createQuery,
} from '@tanstack/svelte-query';
import { QueryClient } from '@tanstack/query-core';
import { settings } from '../stores/settings.svelte';
import {
	createSetTrayIconDesktopService,
	createSetTrayIconWebService,
} from './SetTrayIconService';
import { createClipboardServiceDesktop } from './clipboard/ClipboardService.desktop';
import { createClipboardServiceWeb } from './clipboard/ClipboardService.web';
import {
	createDbRecordingsServiceDexie,
	createDbTransformationsServiceDexie,
} from './db/DbService.dexie';
import { createDownloadServiceDesktop } from './download/DownloadService.desktop';
import { createDownloadServiceWeb } from './download/DownloadService.web';
import { createHttpServiceDesktop } from './http/HttpService.desktop';
import { createHttpServiceWeb } from './http/HttpService.web';
import { createNotificationServiceDesktop } from './notifications/NotificationService.desktop';
import { createNotificationServiceWeb } from './notifications/NotificationService.web';
import { createRecorderServiceTauri } from './recorder/RecorderService.tauri';
import { createRecorderServiceWeb } from './recorder/RecorderService.web';
import { createRunTransformationService } from './runTransformation';
import { createPlaySoundServiceDesktop } from './sound/PlaySoundService.desktop';
import { createPlaySoundServiceWeb } from './sound/PlaySoundService.web';
import { createFasterWhisperServerTranscriptionService } from './transcription/TranscriptionService.fasterWhisperServer';
import { createGroqTranscriptionService } from './transcription/TranscriptionService.groq';
import { createOpenaiTranscriptionService } from './transcription/TranscriptionService.openai';

type QueryResultFunction<TData, TError> = () => MaybePromise<
	Result<TData, TError>
>;

type CreateResultQueryOptions<
	TQueryFnData,
	TError,
	TData,
	TQueryKey extends QueryKey,
> = Omit<
	CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
	'queryFn'
> & {
	queryFn: QueryResultFunction<TQueryFnData, TError>;
};

export function createResultQuery<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey,
>(
	options: FunctionedParams<
		CreateResultQueryOptions<TQueryFnData, TError, TData, TQueryKey>
	>,
) {
	return createQuery<TQueryFnData, TError, TData, TQueryKey>(() => {
		const { queryFn, ...optionValues } = options();
		return {
			...optionValues,

			queryFn: async () => {
				const result = await queryFn();
				if (!result.ok) throw result.error;
				return result.data;
			},
		};
	});
}

type MutationResultFunction<
	TData = unknown,
	TError = unknown,
	TVariables = unknown,
> = (variables: TVariables) => MaybePromise<Result<TData, TError>>;

type CreateResultMutationOptions<
	TData = unknown,
	TError = unknown,
	TVariables = unknown,
	TContext = unknown,
> = Omit<
	CreateMutationOptions<TData, TError, TVariables, TContext>,
	'mutationFn'
> & {
	mutationFn: MutationResultFunction<TData, TError, TVariables>;
};

export function createResultMutation<
	TData = unknown,
	TError = DefaultError,
	TVariables = void,
	TContext = unknown,
>(
	options: FunctionedParams<
		CreateResultMutationOptions<TData, TError, TVariables, TContext>
	>,
) {
	return createMutation<TData, TError, TVariables, TContext>(() => {
		const { mutationFn, ...optionValues } = options();
		return {
			...optionValues,
			mutationFn: async (args) => {
				const result = await mutationFn(args);
				if (!result.ok) throw result.error;
				return result.data;
			},
		};
	});
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});

export const DownloadService = window.__TAURI_INTERNALS__
	? createDownloadServiceDesktop()
	: createDownloadServiceWeb();

export const NotificationService = window.__TAURI_INTERNALS__
	? createNotificationServiceDesktop()
	: createNotificationServiceWeb();

export const ClipboardService = window.__TAURI_INTERNALS__
	? createClipboardServiceDesktop()
	: createClipboardServiceWeb();

export const SetTrayIconService = window.__TAURI_INTERNALS__
	? createSetTrayIconDesktopService()
	: createSetTrayIconWebService();

export const DbRecordingsService = createDbRecordingsServiceDexie();
export const DbTransformationsService = createDbTransformationsServiceDexie();

const HttpService = window.__TAURI_INTERNALS__
	? createHttpServiceDesktop()
	: createHttpServiceWeb();

const PlaySoundService = window.__TAURI_INTERNALS__
	? createPlaySoundServiceDesktop()
	: createPlaySoundServiceWeb();

export const RunTransformationService = createRunTransformationService({
	HttpService,
	DbTransformationsService,
});

/**
 * Services that are determined by the user's settings.
 */
export const userConfiguredServices = (() => {
	const RecorderServiceTauri = createRecorderServiceTauri();
	const RecorderServiceWeb = createRecorderServiceWeb();

	return {
		get transcription() {
			switch (settings.value['transcription.selectedTranscriptionService']) {
				case 'OpenAI': {
					return createOpenaiTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.openai'],
					});
				}
				case 'Groq': {
					return createGroqTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.groq'],
						modelName: settings.value['transcription.groq.model'],
					});
				}
				case 'faster-whisper-server': {
					return createFasterWhisperServerTranscriptionService({
						HttpService,
						serverModel:
							settings.value['transcription.fasterWhisperServer.serverModel'],
						serverUrl:
							settings.value['transcription.fasterWhisperServer.serverUrl'],
					});
				}
				default: {
					return createOpenaiTranscriptionService({
						HttpService,
						apiKey: settings.value['apiKeys.openai'],
					});
				}
			}
		},
		get recorder() {
			if (settings.value['recorder.selectedRecorderService'] === 'Tauri') {
				return RecorderServiceTauri;
			}
			return RecorderServiceWeb;
		},
	};
})();

export const playSoundIfEnabled = (soundName: WhisperingSoundNames) => {
	if (settings.value[`sound.playOn.${soundName}`]) {
		void PlaySoundService.playSound(soundName);
	}
};
