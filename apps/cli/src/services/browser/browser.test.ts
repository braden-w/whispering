import { describe, test, expect } from 'bun:test';
import { createBrowserService } from './browser';

describe('Browser Service', () => {
	test('should handle URLs with special characters', async () => {
		const service = createBrowserService();

		// URLs with special characters should be handled properly
		const specialUrls = [
			'https://example.com/path?query=value&other=123',
			'https://example.com/path#anchor',
			'https://example.com/path with spaces',
		];

		for (const url of specialUrls) {
			const result = await service.openUrl(url);
			expect(result.error).toBeNull();
			expect(result.data).toBeUndefined();
		}
	});
});
