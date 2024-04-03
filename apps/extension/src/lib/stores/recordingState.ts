import { createStoreSyncedWithStorage } from './createStore';

type RecordingState = 'idle' | 'recording' | 'transcribing';
const initialRecordingState: RecordingState = 'idle';

export const recordingState = createStoreSyncedWithStorage<RecordingState>({
	key: 'recording-state',
	initialValue: initialRecordingState
});

export const outputText = createStoreSyncedWithStorage({ key: 'output-text', initialValue: '' });
export const audioSrc = createStoreSyncedWithStorage({ key: 'audio-src', initialValue: '' });
