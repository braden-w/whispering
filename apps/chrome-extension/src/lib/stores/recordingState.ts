import { createStore } from './createStore';

type RecordingState = 'idle' | 'recording' | 'transcribing';
const initialRecordingState: RecordingState = 'idle';
export const recordingState = createStore('recording-state', initialRecordingState);
