interface Window {
	__TAURI__: Record<string, unknown>;
	toggleRecording: () => void;
	cancelRecording: () => void;
	goto: (url: string) => Promise<void>;
}
