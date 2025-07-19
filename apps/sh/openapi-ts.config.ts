import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: 'http://localhost:4096/doc',
	output: './src/lib/client',
	plugins: ['@hey-api/typescript', '@hey-api/schemas', '@hey-api/sdk'],
});
