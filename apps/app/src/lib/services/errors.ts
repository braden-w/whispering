export type WhisperingErrorProperties = {
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	error?: unknown;
};
