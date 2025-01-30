import type { Recorder } from '../app/src/lib/query/recorder/mutations';
declare global {
	interface Window {
		recorder: Recorder;
		goto: (url: string) => Promise<void>;
	}
}
