import { Storage } from '@plasmohq/storage';
import { Effect, Layer } from 'effect';
import { SyncService } from './SyncService';
import {
	AppStorageService,
	APP_STORAGE_KEYS,
} from '../../../../packages/services/src/services/app-storage';

const APP_STORAGE_KEYS_ARRAY = Object.values(APP_STORAGE_KEYS);

export const SyncServicePopupLive = Layer.effect(
	SyncService,
	Effect.gen(function* (_) {
		const appStorageService = yield* AppStorageService;
		const extensionStorageService = yield* ExtensionStorageService;
		return {
			syncWhisperingLocalStorageToExtensionLocalStorage: () =>
				Effect.gen(function* (_) {
					for (const key of APP_STORAGE_KEYS_ARRAY) {
						const value = appStorageService.get({
							key,
							schema: 
							defaultValue: '',
						});
					}
						appStorageService.set({ key, value });
					});
				}),
		};
	}),
);
