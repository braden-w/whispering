declare global {
	interface Window {
		toggleRecording: () => void;
		cancelRecording: () => void;
		goto: (url: string) => Promise<void>;
	}
}

export {};
