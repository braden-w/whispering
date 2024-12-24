import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import { NotificationService } from '$lib/services/NotificationService';
import type { Recording, Recordings } from '$lib/services/db/';
import { createRecordingsLiveIndexedDb } from '$lib/services/IndexedDbLive.svelte';
import { toast } from '$lib/services/ToastService';
import { TranscriptionServiceFasterWhisperServerLive } from '$lib/services/TranscriptionServiceFasterWhisperServerLive';
import { TranscriptionServiceGroqLive } from '$lib/services/TranscriptionServiceGroqLive';
import { TranscriptionServiceWhisperLive } from '$lib/services/TranscriptionServiceWhisperLive';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import {
	Ok,
	type ServiceFn,
	createMutation,
} from '@repo/shared/epicenter-result';
import { type ToastAndNotifyOptions, WhisperingErr } from '@repo/shared';
import { RecordingsService } from '../services/recordings/RecordingsDbService.svelte';
import { settings } from './settings.svelte';

const updateRecording = createMutation({
	mutationFn: RecordingsService.updateRecording,
});
