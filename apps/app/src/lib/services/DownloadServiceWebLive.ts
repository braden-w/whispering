import { DownloadService } from '$lib/services/DownloadService';
import { Effect, Layer } from 'effect';

export const DownloadServiceWebLive = Layer.succeed(
	DownloadService,
	DownloadService.of({
		downloadBlob: ({ name, blob }) =>
			Effect.gen(function* () {
				const file = new File([blob], name, { type: blob.type });
				const url = URL.createObjectURL(file);
				const a = document.createElement('a');
				a.href = url;
				a.download = name;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}),
	}),
);
