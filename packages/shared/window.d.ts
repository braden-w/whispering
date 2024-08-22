interface Window {
	__TAURI_INTERNALS__: Record<string, unknown>;
	toggleRecording: () => void;
	cancelRecording: () => void;
	goto: (url: string) => Promise<void>;
}
