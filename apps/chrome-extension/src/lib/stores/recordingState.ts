import { createStoreSyncedWithStorage } from './createStore';

type RecordingState = 'idle' | 'recording' | 'transcribing';
const initialRecordingState: RecordingState = 'idle';
export const recordingState = createStoreSyncedWithStorage({
	key: 'recording-state',
	initialValue: initialRecordingState
});
